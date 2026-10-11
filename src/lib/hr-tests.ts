import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { deleteFromR2, uploadToR2 } from "@/lib/r2";

/** Đề test + bài làm: tối đa 50 MB/file (nginx cho 100M nên lọt). */
export const TEST_MAX_FILE_SIZE = 50 * 1024 * 1024;
/** Ứng viên nộp 1 lần duy nhất, gồm nhiều file + link. */
export const MAX_SUBMISSION_ITEMS = 10;
/** Tổng dung lượng 1 lần nộp — nginx client_max_body_size 100M. */
export const MAX_SUBMISSION_TOTAL = 95 * 1024 * 1024;

const ALLOWED_EXT =
  /\.(pdf|zip|rar|7z|tar|gz|docx?|xlsx?|pptx?|txt|md|csv|json|psd|psb|ai|fig|sketch|xd|blend|fbx|obj|glb|gltf|unitypackage|atlas|skel|spine|png|jpe?g|webp|gif|svg|mp4|mov|webm|mp3|wav)$/i;

const MAX_TEXT = 2000;

export type TestFileInput = {
  kind: "file" | "link";
  url: string;
  r2_key: string | null;
  file_name: string | null;
  file_size: number | null;
  title: string;
  note: string | null;
};

function clean(v: unknown, max = MAX_TEXT): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export function newTestToken() {
  return randomBytes(18).toString("base64url");
}

function parseHttpUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Đọc request tạo đề test / bài làm. Nhận 2 dạng:
 * - multipart: `file` (+ `title`, `note`) → upload R2 dưới `prefix/`
 * - JSON: `{ url, title?, note? }` → link ngoài
 * Trả `{ error }` (NextResponse) nếu input sai.
 */
export async function readTestInput(
  request: Request,
  prefix: string,
): Promise<{ input: TestFileInput } | { error: NextResponse }> {
  const bad = (msg: string) => ({ error: NextResponse.json({ error: msg }, { status: 400 }) });
  const ctype = request.headers.get("content-type") ?? "";

  if (ctype.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return bad("Invalid form data");
    }
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return bad("file is required");
    if (file.size > TEST_MAX_FILE_SIZE) return bad("File too large (max 50 MB)");
    const original = file.name || "upload";
    if (!ALLOWED_EXT.test(original)) return bad("File type not supported");

    const key = `${prefix}/${randomUUID()}-${sanitizeFileName(original)}`;
    const uploaded = await uploadToR2({
      key,
      body: Buffer.from(await file.arrayBuffer()),
      contentType: file.type || "application/octet-stream",
      skipCompress: true, // giữ nguyên file đề/bài làm
    });
    return {
      input: {
        kind: "file",
        url: uploaded.url,
        r2_key: uploaded.key,
        file_name: original.slice(0, 255),
        file_size: file.size,
        title: clean(form.get("title"), 200) || original.slice(0, 200),
        note: clean(form.get("note")) || null,
      },
    };
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid JSON");
  }
  const url = parseHttpUrl(clean(body.url, 2000));
  if (!url) return bad("Invalid link (must start with http/https)");
  return {
    input: {
      kind: "link",
      url,
      r2_key: null,
      file_name: null,
      file_size: null,
      title: clean(body.title, 200) || url,
      note: clean(body.note) || null,
    },
  };
}

/**
 * Bài làm ứng viên — 1 request multipart: nhiều `file`, nhiều `link`, 1 `note`.
 * Kiểm tra hết trước rồi mới upload R2; upload lỗi giữa chừng → xoá các file đã lên.
 */
export async function readSubmissionBatch(
  request: Request,
  prefix: string,
): Promise<{ items: TestFileInput[]; note: string | null } | { error: NextResponse }> {
  const bad = (msg: string) => ({ error: NextResponse.json({ error: msg }, { status: 400 }) });
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Invalid form data");
  }

  const files = form.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);
  const links: string[] = [];
  for (const raw of form.getAll("link")) {
    const s = clean(raw, 2000);
    if (!s) continue;
    const url = parseHttpUrl(s);
    if (!url) return bad(`Invalid link: ${s.slice(0, 80)} (must start with http/https)`);
    links.push(url);
  }
  if (files.length + links.length === 0) return bad("Please add at least one file or link");
  if (files.length + links.length > MAX_SUBMISSION_ITEMS)
    return bad(`Too many items (max ${MAX_SUBMISSION_ITEMS})`);
  let total = 0;
  for (const f of files) {
    if (f.size > TEST_MAX_FILE_SIZE) return bad(`${f.name}: file too large (max 50 MB)`);
    if (!ALLOWED_EXT.test(f.name || "")) return bad(`${f.name}: file type not supported`);
    total += f.size;
  }
  if (total > MAX_SUBMISSION_TOTAL) return bad("Files too large in total (max 95 MB) — please use a link instead");

  const items: TestFileInput[] = [];
  try {
    for (const f of files) {
      const original = f.name || "upload";
      const uploaded = await uploadToR2({
        key: `${prefix}/${randomUUID()}-${sanitizeFileName(original)}`,
        body: Buffer.from(await f.arrayBuffer()),
        contentType: f.type || "application/octet-stream",
        skipCompress: true,
      });
      items.push({
        kind: "file",
        url: uploaded.url,
        r2_key: uploaded.key,
        file_name: original.slice(0, 255),
        file_size: f.size,
        title: original.slice(0, 200),
        note: null,
      });
    }
  } catch {
    await Promise.all(items.map((i) => deleteFromR2(i.r2_key)));
    return { error: NextResponse.json({ error: "Upload failed — please try again" }, { status: 502 }) };
  }
  for (const url of links)
    items.push({ kind: "link", url, r2_key: null, file_name: null, file_size: null, title: url, note: null });

  return { items, note: clean(form.get("note")) || null };
}

