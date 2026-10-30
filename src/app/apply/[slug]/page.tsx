import { Suspense } from "react";
import type { Metadata } from "next";
import { jobMetadata } from "@/lib/job-metadata";
import { notFound } from "next/navigation";
import { getActiveJob } from "@/lib/jobs-data";
import ApplyPageClient from "./_client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

// Trang form ứng tuyển: noindex (nội dung job nằm ở /careers/[slug], trang đó mới index),
// follow để bot vẫn đi tiếp link. Preview chia sẻ (OG) giữ nguyên.
const APPLY_ROBOTS: Metadata["robots"] = { index: false, follow: true };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let meta: Metadata | null = null;
  try {
    meta = await jobMetadata(slug, `https://tdgamestudio.com/apply/${slug}`);
  } catch (err) {
    console.error("[apply] job metadata", err);
  }
  return { ...(meta ?? {}), robots: APPLY_ROBOTS };
}

export default async function ApplyPage({ params }: Props) {
  const { slug } = await params;
  const job = await getActiveJob(slug);
  if (!job) notFound();

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a10]" />}>
      <ApplyPageClient job={job} />
    </Suspense>
  );
}
