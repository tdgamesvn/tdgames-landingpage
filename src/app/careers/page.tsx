import { resolveSlot, resolveSlots } from "@/lib/page-slots";
import type { Metadata } from "next";
import { jobMetadata } from "@/lib/job-metadata";
import CareersClient from "./careers-client";

export const revalidate = 60;

type Props = { searchParams: Promise<{ job?: string | string[] }> };

// /careers?job=<slug> → preview link hiện đúng job; không có job → metadata của layout.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { job } = await searchParams;
  if (typeof job !== "string") return {};
  return (await jobMetadata(job, `https://tdgamestudio.com/careers?job=${encodeURIComponent(job)}`)) ?? {};
}

export default async function CareersPage() {
  const [heroUrl, gallery] = await Promise.all([
    resolveSlot(
      "careers",
      "hero",
      "https://cdn.tdgamestudio.com/landing/images/f0d05f71-5089-4b3f-b453-7a8d19afc013.png",
    ),
    resolveSlots("careers", "gallery"),
  ]);
  return <CareersClient heroUrl={heroUrl} lifePhotos={gallery.map((g) => g.url)} />;
}
