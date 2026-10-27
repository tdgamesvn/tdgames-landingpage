import { NextResponse } from "next/server";
import { requireHrUser } from "@/lib/hr-session";
import { ROLE_LABEL } from "@/lib/hr-permissions";

export async function GET(req: Request) {
  const auth = await requireHrUser(req);
  if ("response" in auth) return auth.response;
  const { ctx } = auth;
  return NextResponse.json({
    user: ctx.user,
    role: ctx.role,
    roleLabel: ROLE_LABEL[ctx.role],
    perms: [...ctx.perms],
    legacy: ctx.legacy,
  });
}
