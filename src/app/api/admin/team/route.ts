import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_JSON = path.join(process.cwd(), "src", "content", "site.json");

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

// GET /api/admin/team — returns current team array
export async function GET(req: Request) {
  const err = requireAdmin(req);
  if (err) return err;
  const raw = await fs.readFile(SITE_JSON, "utf8");
  const data = JSON.parse(raw);
  return NextResponse.json({ team: data.team ?? [] });
}

// PUT /api/admin/team — replaces entire team array
export async function PUT(req: Request) {
  const err = requireAdmin(req);
  if (err) return err;

  const body = await req.json();
  if (!Array.isArray(body.team))
    return NextResponse.json({ error: "body.team must be an array" }, { status: 400 });

  const raw = await fs.readFile(SITE_JSON, "utf8");
  const data = JSON.parse(raw);
  data.team = body.team;

  await fs.writeFile(SITE_JSON, JSON.stringify(data, null, 2) + "\n", "utf8");
  return NextResponse.json({ ok: true, count: body.team.length });
}
