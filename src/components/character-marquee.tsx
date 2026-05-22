"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper/types";
import "swiper/css";

export type CharacterMarqueeProps = {
  images: { src: string; alt: string }[];
  className?: string;
  baseSpeedMs?: number;
  hoverSlowdownPct?: number;
};

export default function CharacterMarquee({
  images,
  className = "",
  baseSpeedMs = 5200,
  hoverSlowdownPct = 0.1,
}: CharacterMarqueeProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [speed, setSpeed] = useState(baseSpeedMs);

  const slides = useMemo(() => {
    const chunk = images.length > 0 ? images : [];
    return [...chunk, ...chunk, ...chunk];
  }, [images]);

  const applySpeed = (nextSpeed: number) => {
    setSpeed(nextSpeed);
    const swiper = swiperRef.current;
    if (!swiper) return;
    swiper.params.speed = nextSpeed;
    swiper.update();
  };

  const hoverSpeedMs = Math.max(
    100,
    Math.round(baseSpeedMs * (1 + hoverSlowdownPct)),
  );

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6 ${className}`}
      onMouseEnter={() => applySpeed(hoverSpeedMs)}
      onMouseLeave={() => applySpeed(baseSpeedMs)}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-linear-to-r from-black/40 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-linear-to-l from-black/40 to-transparent" />

      <Swiper
        modules={[Autoplay]}
        onSwiper={(s) => {
          swiperRef.current = s;
        }}
        slidesPerView="auto"
        spaceBetween={18}
        loop
        grabCursor
        allowTouchMove
        simulateTouch
        autoplay={{
          delay: 0,
          disableOnInteraction: false,
          pauseOnMouseEnter: false,
        }}
        speed={speed}
        className="select-none"
      >
        {slides.map((img, idx) => (
          <SwiperSlide
            key={`${img.src}-${idx}`}
            className="w-[220px]! md:w-[260px]!"
          >
            <div className="relative h-[260px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 220px, 260px"
                draggable={false}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent opacity-90" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
