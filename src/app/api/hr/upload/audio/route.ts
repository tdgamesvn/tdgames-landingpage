import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireHR } from "@/lib/hr-auth";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Upload ghi âm PV. Tách khỏi /api/hr/upload vì route kia cố tình chỉ nhận
 * image và cap 10MB — ghi âm 45 phút cỡ 40MB, quy tắc khác hẳn.
 */
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB ~ 3 tiếng mp3 64kbps

const ALLOWED = /^(audio\/|video\/(mp4|webm)$)/; // m4a/mp3/wav/ogg + ghi màn hình Meet/Zoom

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export async function POST(request: Request) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File ${(file.size / 1024 / 1024).toFixed(1)}MB vượt trần 100MB` },
      { status: 400 },
    );
  }
  if (!ALLOWED.test(file.type)) {
    return NextResponse.json(
      { error: `Chỉ nhận file audio (mp3/m4a/wav/ogg) — nhận được "${file.type || "không rõ"}"` },
      { status: 400 },
    );
  }

  const now = new Date();
  const key = `interviews/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}-${sanitize(file.name || "interview.mp3")}`;

  const body = Buffer.from(await file.arrayBuffer());
  // skipCompress: bot nén chỉ biết ảnh/video — đừng để nó đụng vào audio.
  const uploaded = await uploadToR2({
    key,
    body,
    contentType: file.type,
    skipCompress: true,
  });

  return NextResponse.json({ url: uploaded.url, key: uploaded.key, bytes: uploaded.size });
}
