import type { Metadata } from "next";
import TestPageClient from "./_client";

export const dynamic = "force-dynamic";

// Trang riêng cho từng ứng viên — không cho index.
export const metadata: Metadata = {
  title: "Bài test — TD Games Studio",
  robots: { index: false, follow: false },
};

export default async function TestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <TestPageClient token={token} />;
}
