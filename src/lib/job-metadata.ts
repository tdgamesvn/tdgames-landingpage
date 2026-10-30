import type { Metadata } from "next";
import { getActiveJob } from "@/lib/jobs-data";
import { ogImages } from "@/lib/seo";

/**
 * Metadata cho link chia sẻ 1 job (Zalo/Messenger/LinkedIn preview):
 * tên job + lương/tóm tắt + ảnh banner. Job không tồn tại/đã đóng → null.
 */
export async function jobMetadata(slug: string, url: string): Promise<Metadata | null> {
  const job = await getActiveJob(slug);
  if (!job) return null;

  const title = `${job.title} — Careers at TD Games`;
  const raw = [job.salary, job.summary || job.description].filter(Boolean).join(" · ");
  const description = raw.length > 200 ? raw.slice(0, 197) + "..." : raw;
  const images = ogImages(job.image_url ? { url: job.image_url, alt: job.title } : null);

  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, url, siteName: "TD Games", type: "website", images },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
  };
}
