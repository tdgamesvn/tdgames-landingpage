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
    // Gradient vẽ THẲNG trên thẻ này, không dùng div con `-z-10`: con z âm nằm
    // sau background của cha nên bị `bg-[#08080b]` che sạch — đó là lý do lần
    // trước nhìn vẫn đen. `background-attachment: fixed` cho hiệu ứng đứng yên
    // khi cuộn mà không cần lớp phủ nào.
    <div
      className="relative min-h-screen text-white"
      style={{
        backgroundColor: "#08080b",
        backgroundImage: [
          "radial-gradient(100% 100% at 50% 50%, transparent 45%, rgba(0,0,0,0.55))",
          "radial-gradient(120% 70% at 50% -5%, rgba(245,158,11,0.20), transparent 60%)",
          "radial-gradient(90% 60% at 10% 105%, rgba(99,102,241,0.16), transparent 65%)",
          "radial-gradient(70% 55% at 100% 35%, rgba(245,158,11,0.09), transparent 70%)",
        ].join(","),
        backgroundAttachment: "fixed",
      }}
    >
      {/* Suspense: ShowreelGallery dùng useSearchParams (?tab=) */}
      <Suspense>
        <ShowreelGallery />
      </Suspense>
    </div>
  );
}
