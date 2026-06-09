import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { Job } from "@/app/admin/_lib/types";
import ApplyPageClient from "./_client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ApplyPage({ params }: Props) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a10]" />}>
      <ApplyPageClient job={data as Job} />
    </Suspense>
  );
}
