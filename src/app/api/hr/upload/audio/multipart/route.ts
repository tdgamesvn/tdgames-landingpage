import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireHR } from "@/lib/hr-auth";
import { abortR2Multipart, completeR2Multipart, createR2Multipart, uploadR2Part } from "@/lib/r2";
import { AUDIO_PART_BYTES, audioFileError, isInterviewAudioKey } from "@/lib/interview-audio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Upload ghi âm PV chia phần 5MB. Gửi cả file 40–100MB trong 1 request hay kẹt giữa
 * chừng trên mạng chập chờn (2026-10-26: đứng ở 37% · 17/47MB, nginx 499) — chia phần
 * thì phần nào kẹt client gửi lại đúng phần đó.
 *
 * - POST `{ action: "init", name, type, size }` → `{ key, uploadId }`
 * - PUT  `?key=&uploadId=&part=N` (body = bytes của phần) → `{ etag }`
 * - POST `{ action: "complete", key, uploadId, size, parts: [{ partNumber, etag }] }` → `{ url, key, bytes }`
 * - POST `{ action: "abort", key, uploadId }`
 */

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase().slice(0, 80) || "interview.m4a";
}

function validUploadId(v: unknown): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= 1024;
}

export async function POST(request: Request) {
  const authError = await requireHR(request);
  if (authError) return authError;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });

  if (body.action === "init") {
    const size = Number(body.size);
    const type = typeof body.type === "string" ? body.type : "";
    const invalid = audioFileError({ size, type });
    if (!Number.isFinite(size) || size <= 0 || invalid) {
      return NextResponse.json({ error: invalid ?? "Dung lượng không hợp lệ" }, { status: 400 });
    }
    const now = new Date();
    const key = `interviews/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}-${sanitize(String(body.name ?? ""))}`;
    const uploadId = await createR2Multipart(key, type);
    return NextResponse.json({ key, uploadId });
  }

  const key = typeof body.key === "string" ? body.key : "";
  if (!isInterviewAudioKey(key) || !validUploadId(body.uploadId)) {
    return NextResponse.json({ error: "key/uploadId không hợp lệ" }, { status: 400 });
  }

  if (body.action === "abort") {
    await abortR2Multipart(key, body.uploadId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "complete") {
    const parts = Array.isArray(body.parts) ? body.parts : [];
    const clean = parts
      .map((p) => p as { partNumber?: unknown; etag?: unknown })
      .filter((p) => Number.isInteger(p.partNumber) && typeof p.etag === "string")
      .map((p) => ({ PartNumber: p.partNumber as number, ETag: p.etag as string }));
    if (!clean.length || clean.length !== parts.length) {
      return NextResponse.json({ error: "Danh sách phần không hợp lệ" }, { status: 400 });
    }
    try {
      const done = await completeR2Multipart(key, body.uploadId, clean);
      return NextResponse.json({ ...done, bytes: Number(body.size) || null });
    } catch (e) {
      await abortR2Multipart(key, body.uploadId);
      return NextResponse.json({ error: `Ghép file thất bại: ${e instanceof Error ? e.message : e}` }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "action không hợp lệ" }, { status: 400 });
}

export async function PUT(request: Request) {
  const authError = await requireHR(request);
  if (authError) return authError;
  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? "";
  const uploadId = url.searchParams.get("uploadId");
  const part = Number(url.searchParams.get("part"));
  if (!isInterviewAudioKey(key) || !validUploadId(uploadId) || !Number.isInteger(part) || part < 1 || part > 1000) {
    return NextResponse.json({ error: "Tham số không hợp lệ" }, { status: 400 });
  }
  const bytes = Buffer.from(await request.arrayBuffer());
  if (!bytes.length || bytes.length > AUDIO_PART_BYTES) {
    return NextResponse.json({ error: "Phần upload sai dung lượng" }, { status: 400 });
  }
  try {
    const etag = await uploadR2Part(key, uploadId, part, bytes);
    return NextResponse.json({ etag });
  } catch (e) {
    return NextResponse.json({ error: `Lưu phần ${part} thất bại: ${e instanceof Error ? e.message : e}` }, { status: 502 });
  }
}
