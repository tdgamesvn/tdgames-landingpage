import { resolveSlot, resolveSlots } from "@/lib/page-slots";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { jobMetadata } from "@/lib/job-metadata";
import CareersClient from "./careers-client";

// ponytail: trang này luôn dynamic (generateMetadata đọc searchParams cho link chia sẻ
// ?job=) nên `revalidate` của segment KHÔNG cache được HTML → TTFB ~0.5s vì mỗi request
// gọi Supabase 2–3 lần. Cache phần DB bằng unstable_cache 300s thay vì bỏ ?job= preview.
// Danh sách job do client tự fetch /api/jobs (no-store) nên job mới vẫn hiện ngay;
// chỉ ảnh hero/gallery và meta preview của 1 job trễ tối đa 5 phút.
const CACHE_SECONDS = 300;
export const revalidate = 300;

const careersMedia = unstable_cache(
  async () => {
    const [heroUrl, gallery] = await Promise.all([
      resolveSlot(
        "careers",
        "hero",
        "https://cdn.tdgamestudio.com/landing/images/f0d05f71-5089-4b3f-b453-7a8d19afc013.png",
      ),
      resolveSlots("careers", "gallery"),
    ]);
    return { heroUrl, lifePhotos: gallery.map((g) => g.url) };
  },
  ["careers-media"],
  { revalidate: CACHE_SECONDS },
);

const cachedJobMetadata = unstable_cache(
  (slug: string) =>
    jobMetadata(slug, `https://tdgamestudio.com/careers?job=${encodeURIComponent(slug)}`),
  ["careers-job-metadata"],
  { revalidate: CACHE_SECONDS },
);

type Props = { searchParams: Promise<{ job?: string | string[] }> };

// /careers?job=<slug> → preview link hiện đúng job; không có job → metadata của layout.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { job } = await searchParams;
  if (typeof job !== "string") return {};
  return (await cachedJobMetadata(job)) ?? {};
}

export default async function CareersPage() {
  const { heroUrl, lifePhotos } = await careersMedia();
  return <CareersClient heroUrl={heroUrl} lifePhotos={lifePhotos} />;
}
