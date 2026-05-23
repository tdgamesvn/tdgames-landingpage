/**
 * do-migrate-behance.mjs — Phase 1: download Behance → upload R2
 *
 * Usage:
 *   node --env-file=.env.local scripts/do-migrate-behance.mjs
 *
 * Output:
 *   - Prints progress to stderr
 *   - Writes $TMPDIR/behance-migrate-results.json with {id, r2_key, r2_url, ok, error}
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";

// ── Asset list (from Supabase query) ────────────────────────────────────────
const ASSETS = [
  { id: "616dbca4-12b1-4540-ab68-4ab8d2087a65", url: "https://mir-s3-cdn-cf.behance.net/projects/404/5ad036149524063.Y3JvcCwxOTgxLDE1NTAsMCww.png" },
  { id: "14c8088a-662f-419d-9624-1561cf01a944", url: "https://mir-s3-cdn-cf.behance.net/projects/404/cad425183792791.Y3JvcCwyMzkyLDE4NzAsMCww.jpg" },
  { id: "390dd913-a615-4e2d-904e-c2cbcbd0528f", url: "https://mir-s3-cdn-cf.behance.net/projects/404/501fca163362313.Y3JvcCwxOTgxLDE1NTAsOSww.png" },
  { id: "4768d6fa-0dad-442f-9a8e-b4e07ea2b41c", url: "https://mir-s3-cdn-cf.behance.net/projects/404/924075153491527.Y3JvcCwxOTgxLDE1NTAsOSww.png" },
  { id: "0841abd0-c487-4b5e-b891-21181e0ffe13", url: "https://mir-s3-cdn-cf.behance.net/projects/404/9e2264152981257.Y3JvcCwxOTgxLDE1NTAsOSww.png" },
  { id: "5792f855-8b65-4aae-84d3-6a7bba6bbeda", url: "https://mir-s3-cdn-cf.behance.net/projects/404/d50de7152527397.Y3JvcCwxOTgxLDE1NTAsOSww.png" },
  { id: "9e131d23-8501-4f90-88bc-48ffbddcb029", url: "https://mir-s3-cdn-cf.behance.net/projects/404/1efef4144430837.Y3JvcCwxOTgxLDE1NTAsOSww.jpg" },
  { id: "a400d041-f9ee-4b40-aae3-4f8d9c5fb2d6", url: "https://mir-s3-cdn-cf.behance.net/projects/404/c4e25d143388227.Y3JvcCwxOTgxLDE1NTAsOSww.png" },
  { id: "2e4b96ed-1d5a-4ee2-bc82-4b3c15fa63b8", url: "https://mir-s3-cdn-cf.behance.net/projects/404/d5b456134047127.Y3JvcCwyMzkyLDE4NzAsMCww.png" },
  { id: "ca058e34-1749-481d-a501-280c1a76608e", url: "https://mir-s3-cdn-cf.behance.net/projects/404/33e83e130561969.Y3JvcCwxOTgxLDE1NTAsOSww.png" },
  { id: "d940d851-48ec-4469-85eb-e57165fb95c5", url: "https://mir-s3-cdn-cf.behance.net/projects/404/4cd319112053013.Y3JvcCwxOTgxLDE1NTAsOSww.jpg" },
  { id: "424c7240-20da-4f71-b2b1-20aef4a920c6", url: "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/d4a408104755019.5f9b97c0a0f8a.png" },
  { id: "abe47e28-05f1-41db-b518-a964898f3c89", url: "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/c93a5b67614633.5fbd2e1664ce9.png" },
  { id: "628dfeba-981f-434c-be7b-13fad655fea1", url: "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/2bd1c365344203.5f702ed1b2566.png" },
  { id: "3597113f-c106-46b5-a1fd-c4cf85171708", url: "https://mir-s3-cdn-cf.behance.net/projects/max_808/924075153491527.Y3JvcCwxOTgxLDE1NTAsOSww.png" },
  { id: "6f5c55ed-d192-4787-9602-8f6e0df87e27", url: "https://mir-s3-cdn-cf.behance.net/projects/max_808/d5b456134047127.Y3JvcCwyMzkyLDE4NzAsMCww.png" },
  { id: "f1cc5be2-b1aa-40bf-b04a-5a9921fb9be9", url: "https://mir-s3-cdn-cf.behance.net/projects/max_808/33e83e130561969.Y3JvcCwxOTgxLDE1NTAsOSww.png" },
  { id: "d762e12b-2e53-40d7-9260-41ce5c0df967", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/2bd1c365344203.5f702ed1b2566.png" },
  { id: "94c7edcc-4cc5-4647-a94f-4b1c335d5fa8", url: "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/3a9c4e56034977.599d9bd554857.jpg" },
  { id: "5e9f25f4-71ca-4625-bc28-425365f422cd", url: "https://mir-s3-cdn-cf.behance.net/project_modules/fs_webp/9d5c36163362313.63e48c008691b.png" },
  { id: "4426f89b-0129-449c-9152-d8cf91012fa4", url: "https://mir-s3-cdn-cf.behance.net/projects/max_808/d50de7152527397.Y3JvcCwxOTgxLDE1NTAsOSww.png" },
  { id: "c501b71a-933f-46a6-8720-82ff388ac96b", url: "https://mir-s3-cdn-cf.behance.net/projects/max_808/1efef4144430837.Y3JvcCwxOTgxLDE1NTAsOSww.jpg" },
  { id: "85c3161e-ce0b-429e-beb7-ea55a94edf98", url: "https://mir-s3-cdn-cf.behance.net/projects/max_808/c4e25d143388227.Y3JvcCwxOTgxLDE1NTAsOSww.png" },
  { id: "f154cf3a-0ce0-4577-8651-9b4d33783b5f", url: "https://mir-s3-cdn-cf.behance.net/projects/max_808/4cd319112053013.Y3JvcCwxOTgxLDE1NTAsOSww.jpg" },
  { id: "e2e02370-147b-4e47-9bf9-cc61cf8e67f5", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/d4a408104755019.5f9b97c0a0f8a.png" },
  { id: "597a9cf6-a77a-41f7-a697-2bbfbb68778f", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/c93a5b67614633.5fbd2e1664ce9.png" },
  { id: "5628ea05-4d58-4e98-9c5a-b012e465855b", url: "https://mir-s3-cdn-cf.behance.net/projects/404/a8f476199358443.Y3JvcCwxOTgxLDE1NTAsOSww.jpg" },
  { id: "c712e220-82ca-4433-9009-d63de819e091", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_632_webp/fb46e9199358443.664fff555a498.png" },
  { id: "117b919b-4cf6-4c33-a8e3-8e2630552612", url: "https://mir-s3-cdn-cf.behance.net/project_modules/fs_webp/3a4660163362313.63e48c0087f51.png" },
  { id: "42e06089-a738-4790-9c60-b0a26564028b", url: "https://mir-s3-cdn-cf.behance.net/project_modules/1400/3a475f163362313.63e48bff7a44c.png" },
  { id: "752ca578-48c0-4d7b-990d-8223f5707f53", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/3d5e46149524063.62ef4fd758b93.png" },
  { id: "ef120041-d3c5-48bf-ba69-e7da5b87f45d", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/7b9dcd152981257.632887fbcdc1a.png" },
  { id: "9a9f8177-3642-4728-b359-74e9072942cc", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/50f7cb149524063.62ef3da956ee8.png" },
  { id: "e0ec0885-797a-4ecc-9cb3-f85a76f57e5a", url: "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/5389e156034977.599d9bd555aab.jpg" },
  { id: "339de73d-6263-4554-a213-966487786569", url: "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/88ac8656034977.599d9bd5556ff.jpg" },
  { id: "91ae6647-c8eb-4aba-8cd9-ff3ebeaaa9fa", url: "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/26f08a56034977.599d9bd554d6f.jpg" },
  { id: "1d31cb15-17bf-48ba-9d3e-cf7ea826ca4d", url: "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/9f38a956034977.599d9bd555db6.jpg" },
  { id: "bd9a1ce0-2214-4b0e-9112-67c596e7be6e", url: "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/760af856034977.599d9bd5551fb.jpg" },
  // GIFs
  { id: "fd1dd71d-26d9-4690-a0e7-e31cba581630", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/11aa30199358443.664fff555d264.gif" },
  { id: "8fdec4e9-8e3b-49f0-8487-d344799e189a", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/b27aab199358443.664fff555b93e.gif" },
  { id: "ced1b8c3-d622-4436-8fad-ad8df8630fb7", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/17e3e6199358443.664fff555b566.gif" },
  { id: "b91171f3-c825-4dbb-86eb-f098cde7a242", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/7ce534199358443.664fff555d6e1.gif" },
  { id: "32bae72d-028b-40b1-b118-ec7762351e1e", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/c3f555199358443.664fff555c6a2.gif" },
  { id: "42047c59-7348-42bd-886f-04ddf41f03f1", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/7d9dc4199358443.664fff555ddd5.gif" },
  { id: "c188dc15-effc-492c-a817-ad2ea7208106", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/805413199358443.664fff555c049.gif" },
  { id: "9571b8bf-93b2-469c-a542-6d45d2acdb99", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/9902e5199358443.664fff55600b7.gif" },
  { id: "a9b92e41-a6b5-4040-becf-480d3bf0d316", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/35e010199358443.664fff555e4c2.gif" },
  { id: "afe1f2d9-20fd-4390-acd9-5b53b1c29cc2", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/c3329a199358443.664fff5561257.gif" },
  { id: "8e6c3afc-a7f7-405b-90a3-2903940b6064", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/91988f199358443.664fff555a99b.gif" },
  { id: "805a2687-32da-4b0e-a5ac-e061d6e67493", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/a5e9d9199358443.664fff556052e.gif" },
  { id: "e6c8c235-82bb-4d80-92dc-aef416855314", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/cae9ac199358443.664fff555ae40.gif" },
  { id: "e8d35c74-e9d7-4fb6-b73f-ffdd0ce2679d", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/0eaaa9199358443.664fff5561a86.gif" },
  { id: "d3d99938-7d2c-48ca-9089-155b81ad8394", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/ca0b08199358443.664fff5560df1.gif" },
  { id: "a6ada1ff-1829-49f1-8987-f6c0b8d7bdd2", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/6f446d199358443.664fff555cdde.gif" },
  { id: "1fc1a50f-0e89-462b-a307-6fe3020da372", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/bb59c6199358443.664fff555ec38.gif" },
  { id: "f73701fb-5dd9-4970-9ec2-65fa1a64d2e0", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/b20697199358443.664fff555f47e.gif" },
  { id: "5d8fcbdc-bc12-4bc3-a812-fa7da3641957", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/1d8da3199358443.664fff556099c.gif" },
  { id: "218b8ee1-e92d-46fc-a648-164e166c622c", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/75bc57199358443.664fff555f87a.gif" },
  { id: "aacd36a5-db58-4833-8475-f50834dad131", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/a8f9c1199358443.664fff55616cb.gif" },
  { id: "c024fc51-78f6-45bb-ad3b-4ce415377b2a", url: "https://mir-s3-cdn-cf.behance.net/project_modules/source/7e5e9e199358443.664fff555fcef.gif" },
  { id: "b5854a33-9419-4336-a846-2a94a3a47261", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/d5e804163362313.63e48bfb14d39.gif" },
  { id: "371e15ce-9d3b-4b34-8ffd-0fdab2cefbf1", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/98fb7a163362313.63e48bfb15ba4.gif" },
  { id: "7452afe2-f8f9-4c2f-a5fa-14ff1f585731", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/1e45f2163362313.63e48bfbc3e82.gif" },
  { id: "473366b2-35de-43b8-8b8d-819e3e199542", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/c6f720163362313.63e48bfbc4df2.gif" },
  { id: "c3382186-668f-4dc2-847b-178deb975dc7", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/4c8ad3163362313.63e48bfc90be9.gif" },
  { id: "772fd2ea-0dff-4053-a823-653c6f2e12eb", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/1e7d63163362313.63e48bfc92564.gif" },
  { id: "7e031125-58ca-4843-aaaf-4ffcda7d99ba", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/f0a1e0163362313.63e48bfd57f81.gif" },
  { id: "5aa85470-179c-4e7a-868a-4bb2a1901b88", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/8e3963163362313.63e48bfd58f38.gif" },
  { id: "7656bb61-a153-47bd-9e4e-32ef8c996003", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/191a20163362313.63e48bfdd7132.gif" },
  { id: "cebef79d-95cb-459c-bcc4-1f984648babc", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/49f25a163362313.63e48bfdd8595.gif" },
  { id: "5426b3bd-0e30-486b-a884-db37e5a2e219", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/6aa7a5163362313.63e48bfee5c18.gif" },
  { id: "047e8354-1915-439d-89e0-b55484bb058b", url: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/ee3318163362313.63e48bfee527e.gif" },
  { id: "146c4b42-480a-499f-b9be-7efbedcda297", url: "https://mir-s3-cdn-cf.behance.net/project_modules/1400/fb059d163362313.63e48bffe60e7.gif" },
  { id: "58b31f4c-24a3-4ea6-b400-4d7b0508abe5", url: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/c92d94149524063.62e955516a522.gif" },
  { id: "ee806d1a-1645-4f60-b43d-5c6d906e1ab8", url: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/180960149524063.62e955516ae60.gif" },
  { id: "b0efd98d-2bdf-44de-9744-ea71d3be8ade", url: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/c09468149524063.62e955516a9d5.gif" },
  { id: "73929888-33a0-4cbf-aadc-72447a80b10e", url: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/2880f0149524063.62ee3d17d69b3.gif" },
  { id: "d4d9dd3f-72f8-45b8-839b-776d5256e2bb", url: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/cceb6d149524063.62ef4f3d05d7b.gif" },
];

// ── R2 setup ─────────────────────────────────────────────────────────────────
const R2 = {
  endpoint: process.env.R2_ENDPOINT,
  bucket: process.env.R2_BUCKET,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  accountId: process.env.R2_ACCOUNT_ID,
};

const missing = Object.entries(R2).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) { console.error("Missing R2 env:", missing.join(", ")); process.exit(1); }

const r2 = new S3Client({
  region: "auto",
  endpoint: R2.endpoint,
  credentials: { accessKeyId: R2.accessKeyId, secretAccessKey: R2.secretAccessKey },
});

const r2PublicUrl = (key) => {
  const baseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error("R2_PUBLIC_BASE_URL is required");
  }
  return `${baseUrl.replace(/\/+$/, "")}/${key}`;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function extFromUrl(url) {
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  return ext || ".jpg";
}
const ctMap = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp" };
const contentType = (ext) => ctMap[ext] ?? "application/octet-stream";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Main ──────────────────────────────────────────────────────────────────────
const results = [];
const outFile = `${process.env.TMPDIR || "/tmp"}/behance-migrate-results.json`;

process.stderr.write(`\n🚀 Migrating ${ASSETS.length} Behance assets → R2\n\n`);

for (let i = 0; i < ASSETS.length; i++) {
  const { id, url } = ASSETS[i];
  const ext = extFromUrl(url);
  const hash = crypto.createHash("md5").update(url).digest("hex").slice(0, 16);
  const r2Key = `landing/behance/${hash}${ext}`;
  const r2Url = r2PublicUrl(r2Key);
  const label = `[${i + 1}/${ASSETS.length}]`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "image/*" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (!buffer.length) throw new Error("Empty body");

    await r2.send(new PutObjectCommand({
      Bucket: R2.bucket,
      Key: r2Key,
      Body: buffer,
      ContentType: contentType(ext),
      CacheControl: "public, max-age=31536000, immutable",
    }));

    process.stderr.write(`${label} ✓  ${url.slice(0, 65)}\n`);
    results.push({ id, original_url: url, r2_key: r2Key, r2_url: r2Url, ok: true });
    await sleep(200);
  } catch (err) {
    process.stderr.write(`${label} ✗  ${url.slice(0, 65)} — ${err.message}\n`);
    results.push({ id, original_url: url, r2_key: r2Key, r2_url: r2Url, ok: false, error: err.message });
  }
}

await fs.writeFile(outFile, JSON.stringify(results, null, 2));

const ok = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
process.stderr.write(`\n✅ Done: ${ok} uploaded, ${fail} failed\n`);
process.stderr.write(`📄 Results: ${outFile}\n\n`);

// Print SQL for successful ones
const successful = results.filter((r) => r.ok);
if (successful.length) {
  const ids = successful.map((r) => `'${r.id}'`).join(",\n    ");
  const caseR2Key = successful.map((r) => `    WHEN '${r.id}' THEN '${r.r2_key}'`).join("\n");
  const caseR2Url = successful.map((r) => `    WHEN '${r.id}' THEN '${r.r2_url}'`).join("\n");

  const sql = `-- Auto-generated by do-migrate-behance.mjs (${new Date().toISOString()})
-- ${ok} assets migrated to R2
UPDATE media_assets SET
  r2_key = CASE id
${caseR2Key}
  END,
  r2_url = CASE id
${caseR2Url}
  END,
  current_url = CASE id
${caseR2Url}
  END,
  source_type = 'local_public',
  updated_at = NOW()
WHERE id IN (
    ${ids}
);`;

  const sqlFile = outFile.replace(".json", ".sql");
  await fs.writeFile(sqlFile, sql);
  process.stderr.write(`📄 SQL: ${sqlFile}\n`);
  // Also print to stdout for piping
  console.log(sql);
}
