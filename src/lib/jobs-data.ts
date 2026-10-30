import type { Job } from "@/app/admin/_lib/types";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/** Slug job hợp lệ — chặn chuỗi rác trước khi chạm DB / làm key cache. */
export function isJobSlug(slug: unknown): slug is string {
  return typeof slug === "string" && /^[a-z0-9-]{1,120}$/i.test(slug);
}

/** 1 job đang tuyển theo slug. Không có / đã đóng / slug rác → null. */
export async function getActiveJob(slug: string): Promise<Job | null> {
  if (!isJobSlug(slug)) return null;
  const { data } = await getSupabaseAdmin()
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data as Job | null) ?? null;
}

/** Mọi job đang tuyển, mới nhất trước. Lỗi DB → throw (caller tự quyết bỏ qua hay báo lỗi). */
export async function listActiveJobs(): Promise<Job[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Job[];
}
