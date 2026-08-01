/**
 * Nén toàn bộ media đang có trên R2 qua bot tdgames-discord.
 *
 * ponytail: GIỮ NGUYÊN key, chỉ thay bytes + content-type. `foo.gif` chứa webp
 * là cố ý — browser đọc Content-Type chứ không đọc đuôi. Đổi tên file sẽ buộc
 * phải sửa URL ở site.json + project-data.ts + 4 bảng DB, sót một chỗ là ảnh vỡ.
 *
 *   node --env-file=.env.local scripts/backfill-compress.mjs              # dry-run
 *   node --env-file=.env.local scripts/backfill-compress.mjs --apply
 *   node --env-file=.env.local scripts/backfill-compress.mjs --apply --limit 5
 *   node --env-file=.env.local scripts/backfill-compress.mjs --rollback   # trả lại bản gốc
 */
import { execFile } from "node:child_process";
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, existsSync } from "node:fs";
import { promisify } from "node:util";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

const APPLY = process.argv.includes("--apply");
const ROLLBACK = process.argv.includes("--rollback");
const LIMIT = Number(process.argv[process.argv.indexOf("--limit") + 1]) || Infinity;

const BACKUP_PREFIX = "backup/pre-compress/";
const MIN_BYTES = 400 * 1024;
const MANIFEST = "scripts/.backfill-manifest.jsonl";

// Không tin content-type lưu trên R2 (nhiều object là application/octet-stream) —
// suy từ đuôi file, đó mới là thứ quyết định bot chọn nhánh nén nào.
const MIME = {
  ".gif": "image/gif",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".tiff": "image/tiff",
  ".bmp": "image/bmp",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".m4v": "video/x-m4v",
};

const bucket = process.env.R2_BUCKET;
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const mb = (n) => (n / 1048576).toFixed(2).padStart(8) + " MB";
const ext = (k) => (k.match(/\.[a-z0-9]+$/i)?.[0] ?? "").toLowerCase();

async function listAll() {
  const out = [];
  let token;
  do {
    const r = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }),
    );
    out.push(...(r.Contents ?? []));
    token = r.NextContinuationToken;
  } while (token);
  return out;
}

const buf = async (key) => {
  const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return Buffer.from(await r.Body.transformToByteArray());
};

async function compress(body, contentType) {
  const base = process.env.COMPRESSOR_URL;
  if (!base) throw new Error("COMPRESSOR_URL chưa cấu hình");
  const resp = await fetch(`${base.replace(/\/+$/, "")}/compress`, {
    method: "POST",
    headers: { "content-type": contentType },
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(600_000),
  });
  if (!resp.ok) throw new Error(`bot HTTP ${resp.status}`);
  return {
    body: Buffer.from(await resp.arrayBuffer()),
    contentType: resp.headers.get("content-type") ?? "",
  };
}

/**
 * Chốt chặn "lỗi bim bim": bytes phải DECODE ĐƯỢC mới cho ghi đè. Bot trả 200 với
 * file cụt vẫn là file cụt — chỉ so sánh kích thước là không đủ.
 */
async function decodable(body, contentType) {
  if (contentType.startsWith("image/")) {
    const m = await sharp(body, { animated: true }).metadata();
    if (!m.width || !m.height) throw new Error("ảnh không đọc được kích thước");
    return `${m.width}x${m.height}${m.pages > 1 ? ` ${m.pages}f` : ""}`;
  }
  const tmp = `${process.env.TMPDIR ?? "/tmp"}/verify-${process.pid}.mp4`;
  writeFileSync(tmp, body);
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height,nb_frames",
    "-of", "csv=p=0",
    tmp,
  ]);
  if (!stdout.trim()) throw new Error("video không có video stream");
  return stdout.trim();
}

async function rollback() {
  if (!existsSync(MANIFEST)) return console.log("Chưa có manifest — không có gì để trả lại.");
  const rows = readFileSync(MANIFEST, "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l))
    .filter((r) => r.applied);
  console.log(`Trả lại ${rows.length} file từ ${BACKUP_PREFIX}...`);
  for (const r of rows) {
    await s3.send(
      new CopyObjectCommand({
        Bucket: bucket,
        Key: r.key,
        CopySource: `${bucket}/${BACKUP_PREFIX}${r.key}`,
        ContentType: r.oldType,
        MetadataDirective: "REPLACE",
      }),
    );
    console.log("  ↩", r.key);
  }
  console.log("Xong. Bản gốc vẫn còn ở", BACKUP_PREFIX, "— tự xoá khi đã yên tâm.");
}

async function main() {
  if (ROLLBACK) return rollback();

  const all = await listAll();
  const targets = all
    .filter((o) => !o.Key.startsWith(BACKUP_PREFIX))
    .filter((o) => o.Size > MIN_BYTES)
    .filter((o) => MIME[ext(o.Key)])
    .sort((a, b) => b.Size - a.Size)
    .slice(0, LIMIT);

  const total = targets.reduce((s, o) => s + o.Size, 0);
  console.log(`${targets.length} file cần nén, tổng ${mb(total)}`);
  if (!APPLY) {
    console.log("(dry-run — thêm --apply để chạy thật)\n");
    targets.slice(0, 20).forEach((o) => console.log(mb(o.Size), o.Key));
    if (targets.length > 20) console.log(`... và ${targets.length - 20} file nữa`);
    return;
  }

  mkdirSync("scripts", { recursive: true });
  let done = 0, saved = 0, skipped = 0, failed = 0;

  for (const [i, o] of targets.entries()) {
    const key = o.Key;
    const oldType = MIME[ext(key)];
    const tag = `[${i + 1}/${targets.length}]`;
    try {
      // Backup TRƯỚC, server-side copy (không tải về). Không backup được thì
      // không đụng tới bản gốc.
      await s3.send(
        new CopyObjectCommand({
          Bucket: bucket,
          Key: BACKUP_PREFIX + key,
          CopySource: `${bucket}/${key}`,
        }),
      );

      const original = await buf(key);
      const out = await compress(original, oldType);

      if (!out.body.length || out.body.length >= original.length) {
        console.log(tag, "⊘ không nhỏ hơn, bỏ qua:", key);
        skipped++;
        continue;
      }
      const dims = await decodable(out.body, out.contentType);

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: out.body,
          ContentType: out.contentType,
        }),
      );

      appendFileSync(
        MANIFEST,
        JSON.stringify({
          key,
          oldType,
          newType: out.contentType,
          oldSize: original.length,
          newSize: out.body.length,
          dims,
          applied: true,
        }) + "\n",
      );
      saved += original.length - out.body.length;
      done++;
      console.log(
        tag,
        "✓",
        mb(original.length),
        "→",
        mb(out.body.length),
        `(${dims})`,
        key,
      );
    } catch (err) {
      failed++;
      console.log(tag, "✗", key, "—", err.message);
    }
  }

  console.log(
    `\nXong: ${done} nén, ${skipped} bỏ qua, ${failed} lỗi. Tiết kiệm ${mb(saved)}.`,
  );
  console.log(`Bản gốc ở ${BACKUP_PREFIX} — rollback: --rollback`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
