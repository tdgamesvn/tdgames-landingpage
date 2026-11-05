import { NextResponse } from "next/server";
import { cleanText, MAX_NAME } from "@/lib/chat";
import { setContact, threadForToken } from "@/lib/chat-server";
import { err, guardEnabled, ipOf, messageLimiter, messageTokenLimiter, readToken } from "@/lib/chat-public";
import { isValidEmail } from "@/lib/hr-email";

export const dynamic = "force-dynamic";

/** Khách để lại tên + email (tên tuỳ chọn). */
export async function POST(req: Request) {
  const off = await guardEnabled();
  if (off) return off;
  if (!messageLimiter.tryHit(ipOf(req))) return err(429, "rate_limited");
  const thread = await threadForToken(readToken(req));
  if (!thread) return err(404, "not_found");
  if (!messageTokenLimiter.tryHit(thread.id)) return err(429, "rate_limited");
  const b = (await req.json().catch(() => ({}))) as { name?: unknown; email?: unknown };
  const email = typeof b.email === "string" ? b.email.trim().slice(0, 200) : "";
  if (!isValidEmail(email)) return err(400, "invalid_email");
  await setContact(thread, cleanText(b.name, MAX_NAME), email);
  return NextResponse.json({ ok: true });
}
