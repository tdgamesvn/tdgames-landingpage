import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
};

function sanitize(s: string) {
  return s.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!ALLOWED[file.type]) {
    return NextResponse.json(
      { error: "Only PDF or Word documents are accepted" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 10 MB)" },
      { status: 400 },
    );
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safeName = sanitize(file.name || "cv");
  const key = `applications/cv/${year}/${month}/${randomUUID()}-${safeName}`;

  const bytes = await file.arrayBuffer();
  const body = Buffer.from(bytes);
  const uploaded = await uploadToR2({ key, body, contentType: file.type });

  return NextResponse.json({ url: uploaded.url });
}
