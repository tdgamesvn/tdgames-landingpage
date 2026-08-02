import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { generateAiImage } from "@/lib/ai-image";

export const maxDuration = 300;

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  const result = await generateAiImage(prompt, body.size);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
