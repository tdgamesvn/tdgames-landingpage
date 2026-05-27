// src/app/api/page-slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { resolveSlot, resolveSlots } from "@/lib/page-slots";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page");
  const slot = searchParams.get("slot");

  if (!page || !slot) {
    return NextResponse.json({ error: "Missing page or slot" }, { status: 400 });
  }

  const single = searchParams.get("single");
  if (single === "1") {
    const url = await resolveSlot(page, slot);
    return NextResponse.json({ url });
  }

  const items = await resolveSlots(page, slot);
  return NextResponse.json({ items });
}
