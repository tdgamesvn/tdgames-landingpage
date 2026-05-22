"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  poster: string;
  videoEmbed: string;
  title: string;
};

export default function HeroCover({ poster, videoEmbed, title }: Props) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[26px] border border-white/10 bg-black shadow-[0_30px_80px_-30px_rgba(255,120,40,0.35)]">
      {playing ? (
        <iframe
          src={videoEmbed}
          title={`${title} — boss animation reel`}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 block cursor-pointer overflow-hidden"
          aria-label={`Play ${title}`}
        >
          <Image
            src={poster}
            alt={title}
            fill
            priority
            sizes="(max-width: 1280px) 55vw, 640px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 bg-linear-to-t from-black/65 via-black/15 to-transparent" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white shadow-[0_18px_40px_-10px_rgba(0,0,0,0.55)] backdrop-blur-md transition-all duration-300 ease-out group-hover:scale-110 group-hover:border-white/70 group-hover:bg-white/25 md:h-20 md:w-20">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
              className="h-6 w-6 translate-x-[2px] md:h-8 md:w-8"
            >
              <path d="M8 5.5v13l11-6.5-11-6.5Z" />
            </svg>
          </span>
          <span className="absolute bottom-4 left-5 right-5 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-white/85">
            Play boss reel
          </span>
        </button>
      )}
    </div>
  );
}
