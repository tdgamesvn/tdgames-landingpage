"use client";

import dynamic from "next/dynamic";

// Fix B: lazy-load below-fold section (contains Spine + heavy content).
// ponytail: chỉ tồn tại để giữ ssr:false — page.tsx nay là server component.
const HomePageLower = dynamic(() => import("@/components/home-page-lower"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#0a0a0a]" />,
});

export default HomePageLower;
