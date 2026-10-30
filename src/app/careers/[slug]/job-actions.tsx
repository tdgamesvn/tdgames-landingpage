"use client";

import { useState } from "react";

/** Gắn ?ref= (mã người giới thiệu) của URL hiện tại vào path. Chỉ gọi ở client (lúc click). */
function withRef(path: string): string {
  const ref = new URLSearchParams(window.location.search).get("ref");
  return ref ? `${path}?ref=${encodeURIComponent(ref)}` : path;
}

/**
 * Nút "Ứng tuyển ngay" + "Sao chép link". ?ref= đọc lúc click (không đọc searchParams ở
 * server) để trang chi tiết vẫn cache được. href trần /apply/{slug} vẫn đúng khi chưa hydrate.
 */
export default function JobActions({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const url = window.location.origin + withRef(`/careers/${slug}`);
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${compact ? "" : "mt-6"}`}>
      <a
        href={`/apply/${slug}`}
        onClick={(e) => {
          e.currentTarget.href = withRef(`/apply/${slug}`);
        }}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f59e0b] px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-black transition-colors hover:bg-[#ffb366]"
      >
        Ứng tuyển ngay
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </a>
      {!compact && (
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-3 text-xs font-semibold text-white/75 transition-colors hover:border-[#f59e0b]/60 hover:text-[#f59e0b]"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {copied ? "Đã sao chép!" : "Sao chép link"}
        </button>
      )}
    </div>
  );
}
