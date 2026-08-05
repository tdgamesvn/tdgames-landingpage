"use client";

import { useEffect, useRef } from "react";

// Mobile: gập nội dung phụ lại — bản đầy đủ cao ~29.000px trên iPhone (≈34 màn
// hình cuộn), khách mở hồ sơ trên điện thoại bỏ giữa chừng. Desktop (≥1024px)
// mở sẵn và ẩn luôn nút, hồ sơ vẫn liền mạch như cũ.
// ponytail: <details> thuần, không thư viện accordion. Render kèm `open` để SSR
// và trình duyệt không JS vẫn thấy đủ nội dung; chỉ gập lại sau khi hydrate.
export default function MobileFold({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (ref.current) ref.current.open = mq.matches;
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <details ref={ref} open className="group">
      <summary className="mb-6 flex min-h-11 cursor-pointer list-none items-center justify-center gap-3 rounded-full border border-white/12 bg-white/[0.04] px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.25em] text-white/70 transition hover:border-[#ff8c3a]/45 hover:text-white lg:hidden [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">{label}</span>
        <span className="hidden group-open:inline">Hide</span>
        <span className="text-[#ff8c3a] transition group-open:rotate-180">▾</span>
      </summary>
      {children}
    </details>
  );
}
