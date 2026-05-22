import { randomUUID } from "node:crypto";
import { uploadToR2 } from "@/lib/r2";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getAdminKey(req: Request) {
  return req.headers.get("x-admin-key");
}

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return Response.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  }

  if (getAdminKey(req) !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const file = formData.get("file");
  const mediaId = formData.get("mediaId");

  if (!(file instanceof File)) {
    return Response.json({ error: "file is required" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "File too large" }, { status: 400 });
  }

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return Response.json({ error: "Only image/video files are supported" }, { status: 400 });
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const fileName = sanitizeFileName(file.name || "upload");
  const key = `projects/${year}/${month}/${randomUUID()}-${fileName}`;

  const bytes = await file.arrayBuffer();
  const body = Buffer.from(bytes);
  const uploaded = await uploadToR2({ key, body, contentType: file.type });

  if (typeof mediaId === "string" && mediaId) {
    const supabase = getSupabaseAdmin();
    await supabase
      .from("media_assets")
      .update({ current_url: uploaded.url, r2_url: uploaded.url, r2_key: uploaded.key })
      .eq("id", mediaId);
  }

  return Response.json({
    key: uploaded.key,
    url: uploaded.url,
    size: file.size,
    contentType: file.type,
  });
}
