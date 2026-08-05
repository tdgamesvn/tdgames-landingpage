import type { Metadata } from "next";
import { Suspense } from "react";
import ShowreelGallery from "@/components/showreel-gallery";

export const metadata: Metadata = {
  title: "Showreel — TD Games Studio",
  description:
    "2D Art, Animation và VFX showreel của TD Games Studio — concept art, UI, environment, character animation, cinematic VFX.",
};

export default function ShowreelPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Suspense: ShowreelGallery dùng useSearchParams (?tab=) */}
      <Suspense>
        <ShowreelGallery />
      </Suspense>
    </div>
  );
}
