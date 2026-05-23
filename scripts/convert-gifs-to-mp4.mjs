// Convert all .gif assets currently referenced in landing site (DB + R2) to
// MP4 (H.264, CRF 18 = visually-lossless, preset slow, faststart) and update
// the DB. Source files (.gif on R2) are kept intact as backup.
//
// Pipeline:
//  1. Pull list of media_assets from Supabase where current_url ends in .gif
//  2. For each: download .gif from current_url → ffmpeg → upload .mp4 to R2
//     under same key but `.mp4` extension → update DB row
//  3. Emit a `gif-to-mp4-map.json` mapping for the source-code rewrite step.
//
// Quality-first encode: CRF 18, preset slow, yuv420p, +faststart, audio off.
// Even-pixel pad in case GIF dimensions are odd (H.264 requires even dims).
//
// Usage:
//   node --env-file=.env.local scripts/convert-gifs-to-mp4.mjs              (dry-run)
//   node --env-file=.env.local scripts/convert-gifs-to-mp4.mjs --apply
//   node --env-file=.env.local scripts/convert-gifs-to-mp4.mjs --apply --limit 3
//   node --env-file=.env.local scripts/convert-gifs-to-mp4.mjs --apply --concurrency 4

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
function flagValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  const v = process.argv[idx + 1];
  return v == null ? fallback : v;
}
const LIMIT = Number.parseInt(flagValue("--limit", "0"), 10) || 0;
const CONCURRENCY = Math.max(1, Number.parseInt(flagValue("--concurrency", "2"), 10) || 2);

const env = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_ACCESS_TOKEN,
  R2_ENDPOINT: process.env.R2_ENDPOINT,
  R2_BUCKET: process.env.R2_BUCKET,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
};
const missing = Object.entries(env).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error("Missing env:", missing.join(", "));
  process.exit(1);
}
if (!ffmpegPath) {
  console.error("ffmpeg-static binary not found. Did `npm i -D ffmpeg-static` succeed?");
  process.exit(1);
}

const PUBLIC_BASE = env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
const s3 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

function r2KeyFromUrl(url) {
  const u = new URL(url);
  return decodeURIComponent(u.pathname.replace(/^\/+/, ""));
}

function publicUrl(key) {
  return `${PUBLIC_BASE}/${key.replace(/^\/+/, "")}`;
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url} → ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function runFfmpeg(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      ffmpegPath,
      [
        "-y",
        "-i", inputPath,
        // Quality-first H.264:
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        // GIFs often have odd dimensions; pad to even for H.264.
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        // Move moov atom to front for fast streaming start.
        "-movflags", "+faststart",
        // No audio in GIFs.
        "-an",
        outputPath,
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let stderr = "";
    proc.stderr.on("data", (d) => { stderr += d.toString(); });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exit ${code}\n${stderr.split("\n").slice(-30).join("\n")}`));
    });
  });
}

async function uploadToR2(key, buffer, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

async function processOne(row, tmpDir) {
  const gifUrl = row.current_url;
  const gifKey = r2KeyFromUrl(gifUrl);
  const mp4Key = gifKey.replace(/\.gif$/i, ".mp4");
  const mp4Url = publicUrl(mp4Key);

  // Skip if already converted (mp4 alongside).
  try {
    const head = await fetch(mp4Url, { method: "HEAD" });
    if (head.ok) {
      return { row, gifUrl, mp4Url, gifBytes: 0, mp4Bytes: 0, status: "already-mp4" };
    }
  } catch {
    // ignore — proceed
  }

  const inPath = path.join(tmpDir, `${row.id}.gif`);
  const outPath = path.join(tmpDir, `${row.id}.mp4`);

  const gifBuf = await downloadBuffer(gifUrl);
  await fs.writeFile(inPath, gifBuf);

  await runFfmpeg(inPath, outPath);
  const mp4Buf = await fs.readFile(outPath);

  if (APPLY) {
    await uploadToR2(mp4Key, mp4Buf, "video/mp4");
    const { error: updErr } = await supabase
      .from("media_assets")
      .update({
        current_url: mp4Url,
        r2_key: mp4Key,
        r2_url: mp4Url,
        kind: "video",
      })
      .eq("id", row.id);
    if (updErr) throw new Error(`db update: ${updErr.message}`);
  }

  await fs.rm(inPath, { force: true });
  await fs.rm(outPath, { force: true });

  return {
    row,
    gifUrl,
    mp4Url,
    gifBytes: gifBuf.length,
    mp4Bytes: mp4Buf.length,
    status: APPLY ? "converted" : "dry-run",
  };
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "dry-run"}  | concurrency=${CONCURRENCY}  | limit=${LIMIT || "all"}`);
  console.log(`ffmpeg: ${ffmpegPath}\n`);

  const { data: rows, error } = await supabase
    .from("media_assets")
    .select("id, kind, current_url, r2_key, r2_url, original_url, status")
    .ilike("current_url", "%.gif")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to query media_assets:", error.message);
    process.exit(1);
  }

  const queue = LIMIT > 0 ? rows.slice(0, LIMIT) : rows;
  console.log(`Found ${rows.length} .gif row(s); processing ${queue.length}.`);
  if (!queue.length) return;

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "gif2mp4-"));

  const mapping = {};
  let totalGif = 0;
  let totalMp4 = 0;
  let ok = 0;
  let skip = 0;
  let fail = 0;

  let cursor = 0;
  async function worker(id) {
    while (cursor < queue.length) {
      const i = cursor++;
      const row = queue[i];
      const tag = `[${String(i + 1).padStart(3, "0")}/${queue.length}] (${id})`;
      try {
        const r = await processOne(row, tmpDir);
        mapping[r.gifUrl] = r.mp4Url;
        if (r.status === "already-mp4") {
          skip++;
          console.log(`${tag} ↻ already mp4: ${r.mp4Url}`);
        } else {
          ok++;
          totalGif += r.gifBytes;
          totalMp4 += r.mp4Bytes;
          const ratio = r.gifBytes
            ? `${((1 - r.mp4Bytes / r.gifBytes) * 100).toFixed(0)}%`
            : "—";
          console.log(
            `${tag} ✓ ${(r.gifBytes / 1024).toFixed(0)} KB → ${(r.mp4Bytes / 1024).toFixed(0)} KB  (-${ratio})  ${r.mp4Url}`,
          );
        }
      } catch (e) {
        fail++;
        console.log(`${tag} ✗ ${row.current_url}\n          ${e.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1)));

  await fs.rm(tmpDir, { recursive: true, force: true });

  const mapPath = path.join(ROOT, "scripts", ".gif-to-mp4-map.json");
  await fs.writeFile(mapPath, JSON.stringify(mapping, null, 2), "utf8");

  console.log("\n────────────────────────────────────────");
  console.log(`Converted : ${ok}`);
  console.log(`Skipped   : ${skip}  (already mp4)`);
  console.log(`Failed    : ${fail}`);
  if (ok > 0) {
    console.log(
      `Total GIF : ${(totalGif / 1024 / 1024).toFixed(1)} MB → MP4: ${(totalMp4 / 1024 / 1024).toFixed(1)} MB  (saved ${(((totalGif - totalMp4) / totalGif) * 100).toFixed(0)}%)`,
    );
  }
  console.log(`Mapping   : ${path.relative(ROOT, mapPath)}`);
  if (!APPLY) console.log("\n(dry-run) pass --apply to upload + write DB.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
