import { NextResponse } from "next/server";
import { requireHrUser } from "@/lib/hr-session";
import { DEFAULT_ONBOARDING_TEMPLATE, sanitizeOnboardingTemplate, validateOnboardingTemplate } from "@/lib/hr-onboarding";
import { loadOnboardingTemplate, resetOnboardingTemplate, saveOnboardingTemplate } from "@/lib/hr-onboarding-store";
import { readJsonBody } from "@/lib/offer-letter-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mẫu checklist onboard (chưa lưu → mặc định trong code). */
export async function GET(request: Request) {
  const auth = await requireHrUser(request, "onboard.view");
  if ("response" in auth) return auth.response;
  try {
    const { items, saved } = await loadOnboardingTemplate();
    return NextResponse.json({ items, saved, builtin: DEFAULT_ONBOARDING_TEMPLATE });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không đọc được mẫu" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireHrUser(request, "onboard.template");
  if ("response" in auth) return auth.response;
  const body = await readJsonBody(request);
  if ("response" in body) return body.response;
  const input = body.data && typeof body.data === "object" ? (body.data as Record<string, unknown>).items : undefined;
  const items = sanitizeOnboardingTemplate(input);
  const invalid = validateOnboardingTemplate(items);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  try {
    await saveOnboardingTemplate(items);
    return NextResponse.json({ items, saved: true, builtin: DEFAULT_ONBOARDING_TEMPLATE });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không lưu được mẫu" }, { status: 500 });
  }
}

/** Về mẫu mặc định. */
export async function DELETE(request: Request) {
  const auth = await requireHrUser(request, "onboard.template");
  if ("response" in auth) return auth.response;
  try {
    await resetOnboardingTemplate();
    const { items, saved } = await loadOnboardingTemplate();
    return NextResponse.json({ items, saved, builtin: DEFAULT_ONBOARDING_TEMPLATE });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không đặt lại được mẫu" }, { status: 500 });
  }
}
