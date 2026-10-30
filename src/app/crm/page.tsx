import type { Metadata } from "next";

import CRMBoard from "./_components/CRMBoard";

// Công cụ nội bộ — không cho Google index.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default function CRMPage() {
  return <CRMBoard />;
}
