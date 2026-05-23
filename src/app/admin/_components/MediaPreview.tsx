"use client";

import { useEffect, useState } from "react";
import { detectKindFromUrl } from "../_lib/api";

type Props = {
  url: string;
  className?: string;
  height?: number;
  emptyLabel?: string;
};

export function MediaPreview({ url, className, height = 144, emptyLabel = "(no preview)" }: Props) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [url]);

  if (!url) {
    return (
      <div
        className={
          "flex items-center justify-center rounded-md border border-dashed border-white/20 bg-white/5 text-xs text-white/40 " +
          (className ?? "")
        }
        style={{ height }}
      >
        {emptyLabel}
      </div>
    );
  }
  const kind = detectKindFromUrl(url);
  const baseCls =
    "block w-full rounded-md border border-white/10 bg-black/40 object-cover " +
    (className ?? "");

  if (errored) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        title={url}
        onClick={(e) => e.stopPropagation()}
        className={
          "flex flex-col items-center justify-center gap-1 rounded-md border border-rose-400/40 bg-rose-500/10 p-2 text-xs text-rose-200 " +
          (className ?? "")
        }
        style={{ height }}
      >
        <span className="font-medium">Không load được</span>
        <span className="text-[10px] truncate max-w-full opacity-80">{url}</span>
      </a>
    );
  }

  if (kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt="media preview"
        loading="lazy"
        onError={() => setErrored(true)}
        style={{ height }}
        className={baseCls}
      />
    );
  }
  if (kind === "video") {
    return (
      <video
        src={url}
        controls
        muted
        playsInline
        preload="metadata"
        onError={() => setErrored(true)}
        style={{ height }}
        className={baseCls}
      />
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={
        "flex items-center justify-center rounded-md border border-white/15 bg-white/5 text-xs underline " +
        (className ?? "")
      }
      style={{ height }}
    >
      Open file
    </a>
  );
}
