import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_JSON = path.join(process.cwd(), "src", "content", "site.json");

export async function GET() {
  const raw = await fs.readFile(SITE_JSON, "utf8");
  const data = JSON.parse(raw);
  return NextResponse.json({ footer: data.footer ?? {} });
}
