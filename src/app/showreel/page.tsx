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
    <div className="relative min-h-screen bg-[#08080b] text-white">
      {/* Nền: fixed nên không trôi theo scroll, pointer-events-none để không
          nuốt click của lưới. Amber rất nhạt ở trên (nối màu brand từ header),
          indigo lạnh dưới đáy cho có chiều sâu — cả hai đều dưới 8% alpha,
          đủ để hết bệt mà không đánh nhau với thumbnail. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage: [
            "radial-gradient(120% 70% at 50% -10%, rgba(245,158,11,0.10), transparent 60%)",
            "radial-gradient(90% 60% at 15% 110%, rgba(99,102,241,0.07), transparent 65%)",
            "radial-gradient(70% 50% at 95% 40%, rgba(245,158,11,0.04), transparent 70%)",
          ].join(","),
        }}
      />
      {/* Vignette nhẹ ép mắt vào giữa lưới */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(100% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.55))",
        }}
      />
      {/* Suspense: ShowreelGallery dùng useSearchParams (?tab=) */}
      <Suspense>
        <ShowreelGallery />
      </Suspense>
    </div>
  );
}
