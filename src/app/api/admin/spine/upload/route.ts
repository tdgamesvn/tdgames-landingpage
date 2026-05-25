import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 50 * 1024 * 1024;

const ALLOWED_EXTENSIONS: Record<string, string> = {
  ".json": "application/json",
  ".skel": "application/octet-stream",
  ".atlas": "text/plain",
  ".png":  "image/png",
  ".webp": "image/webp",
};

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

function sanitize(s: string) {
  return s.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
}

function getExtension(filename: string): string {
  const m = filename.match(/(\.[^.]+)$/);
  return m ? m[1].toLowerCase() : "";
}

export async function POST(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const slug = formData.get("slug");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (typeof slug !== "string" || !slug.trim()) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const ext = getExtension(file.name);
  const contentType = ALLOWED_EXTENSIONS[ext];
  if (!contentType) {
    return NextResponse.json(
      { error: `Unsupported file type: ${ext}. Allowed: ${Object.keys(ALLOWED_EXTENSIONS).join(", ")}` },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
  }

  const safeSlug = sanitize(slug.trim());
  const safeFilename = sanitize(file.name);
  const key = `landing/spine/${safeSlug}/${safeFilename}`;

  const bytes = await file.arrayBuffer();
  const body = Buffer.from(bytes);
  const uploaded = await uploadToR2({ key, body, contentType });

  return NextResponse.json({ key: uploaded.key, url: uploaded.url, size: file.size });
}
