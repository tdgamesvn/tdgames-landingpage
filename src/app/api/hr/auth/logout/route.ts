import { NextResponse } from "next/server";
import { readCookie } from "@/lib/hr-crypto";
import { clearSessionCookie, destroySession, SESSION_COOKIE } from "@/lib/hr-session";

export async function POST(req: Request) {
  const token = readCookie(req.headers.get("cookie"), SESSION_COOKIE);
  if (token) await destroySession(token);
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", clearSessionCookie());
  return res;
}
