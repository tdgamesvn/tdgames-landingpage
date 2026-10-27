import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireHrUser } from "@/lib/hr-session";
import { uploadToR2 } from "@/lib/r2";
import { audioFileError } from "@/lib/interview-audio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Upload ghi âm PV. Tách khỏi /api/hr/upload vì route kia cố tình chỉ nhận
 * image và cap 10MB — ghi âm 45 phút cỡ 40MB, quy tắc khác hẳn.
 */
// Trần dung lượng + định dạng: src/lib/interview-audio.ts (client cũng kiểm trước khi tải).

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export async function POST(request: Request) {
  const auth = await requireHrUser(request, "interviews.manage");
  if ("response" in auth) return auth.response;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  const invalid = audioFileError(file);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

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
