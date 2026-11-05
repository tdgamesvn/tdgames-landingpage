import { NextResponse } from "next/server";
import { flushPendingEmails, purgeOld } from "@/lib/chat-server";
import { cronKeyMatches } from "@/lib/hr-session";

export const dynamic = "force-dynamic";

/** Cron 10 phút (.github/workflows/chat-cron.yml): mail câu trả lời cho khách đã rời + xoá chat quá 24 tháng. */
export async function GET(req: Request) {
  if (!cronKeyMatches(req.headers.get("x-hr-cron-key"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [emailed, purged] = await Promise.all([flushPendingEmails(), purgeOld()]);
  return NextResponse.json({ emailed, purged });
}
