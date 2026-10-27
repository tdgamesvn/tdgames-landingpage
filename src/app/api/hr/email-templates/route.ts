import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";
import { CANDIDATE_EMAIL_KINDS, KIND_LABEL, isCandidateEmailKind } from "@/lib/hr-email";
import { DEFAULT_TEMPLATES, KIND_VARS, VAR_HELP, validateTemplate } from "@/lib/hr-email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = { kind: string; subject: string; body: string; updated_by: string | null; updated_at: string | null };

/** Danh sách 6 mẫu (đã sửa hoặc mặc định) + mặc định + biến cho UI. */
export async function GET(req: Request) {
  const auth = await requireHrUser(req, "emails.templates");
  if ("response" in auth) return auth.response;
  const { data, error } = await getSupabaseAdmin()
    .from("hr_email_templates")
    .select("kind, subject, body, updated_by, updated_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = new Map(((data ?? []) as Row[]).map((r) => [r.kind, r]));
  const templates = CANDIDATE_EMAIL_KINDS.map((kind) => {
    const r = rows.get(kind);
    return {
      kind,
      label: KIND_LABEL[kind],
      subject: r ? r.subject : DEFAULT_TEMPLATES[kind].subject,
      body: r ? r.body : DEFAULT_TEMPLATES[kind].body,
      isDefault: !r,
      updated_by: r?.updated_by ?? null,
      updated_at: r?.updated_at ?? null,
    };
  });
  return NextResponse.json({ templates, defaults: DEFAULT_TEMPLATES, vars: KIND_VARS, varHelp: VAR_HELP });
}

export async function PUT(req: Request) {
  const auth = await requireHrUser(req, "emails.templates");
  if ("response" in auth) return auth.response;
  const input = await req.json().catch(() => null);
  const kind = input?.kind;
  const subject = input?.subject;
  const body = input?.body;
  if (!isCandidateEmailKind(kind)) return NextResponse.json({ error: "Loại mẫu không hợp lệ" }, { status: 400 });
  if (typeof subject !== "string" || typeof body !== "string") {
    return NextResponse.json({ error: "Thiếu tiêu đề hoặc nội dung" }, { status: 400 });
  }
  const invalid = validateTemplate(kind, subject, body);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const { error } = await getSupabaseAdmin()
    .from("hr_email_templates")
    .upsert({
      kind,
      subject,
      body,
      updated_by: auth.ctx.user.displayName,
      updated_by_user_id: auth.ctx.user.id,
      updated_at: new Date().toISOString(),
    });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Về mặc định = xoá dòng. */
export async function DELETE(req: Request) {
  const auth = await requireHrUser(req, "emails.templates");
  if ("response" in auth) return auth.response;
  const kind = new URL(req.url).searchParams.get("kind");
  if (!isCandidateEmailKind(kind)) return NextResponse.json({ error: "Loại mẫu không hợp lệ" }, { status: 400 });
  const { error } = await getSupabaseAdmin().from("hr_email_templates").delete().eq("kind", kind);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
