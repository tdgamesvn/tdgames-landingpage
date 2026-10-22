import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Metadata cho link chia sẻ 1 job (Zalo/Messenger/LinkedIn preview):
 * tên job + lương/tóm tắt + ảnh banner. Job không tồn tại/đã đóng → null.
 */
export async function jobMetadata(slug: string, url: string): Promise<Metadata | null> {
  if (!/^[a-z0-9-]{1,120}$/i.test(slug)) return null;
  const { data: job } = await getSupabaseAdmin()
    .from("jobs")
    .select("title, summary, description, salary, location, image_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!job) return null;

  const title = `${job.title} — Careers at TD Games`;
  const raw = [job.salary, job.summary || job.description].filter(Boolean).join(" · ");
  const description = raw.length > 200 ? raw.slice(0, 197) + "..." : raw;
  const images = job.image_url ? [{ url: job.image_url, alt: job.title }] : undefined;

  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, url, siteName: "TD Games", type: "website", images },
    twitter: { card: "summary_large_image", title, description, images: job.image_url ? [job.image_url] : undefined },
  };
}
