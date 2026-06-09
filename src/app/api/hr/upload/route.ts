import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireHR } from "@/lib/hr-auth";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are supported" }, { status: 400 });
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const fileName = sanitize(file.name || "upload");
  const key = `jobs/${year}/${month}/${randomUUID()}-${fileName}`;

  const bytes = await file.arrayBuffer();
  const body = Buffer.from(bytes);
  const uploaded = await uploadToR2({ key, body, contentType: file.type });

  return NextResponse.json({ url: uploaded.url, key: uploaded.key });
}
