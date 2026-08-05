"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";

/**
 * Cân bằng quang học logo client.
 *
 * Bệnh cũ: mọi logo nhét vào khung cố định + object-contain → logo wordmark dài
 * (Mocreative) ăn hết chiều rộng, logo icon vuông (Kabam) chỉ cao bằng khung ⇒
 * cái dài trông to gấp 3–4 lần dù "cùng size".
 *
 * Cách chữa: chuẩn hoá theo DIỆN TÍCH, không theo chiều cao —
 *   height = base / sqrt(w/h)   ⇒ mọi logo chiếm cùng khối lượng thị giác.
 *   (vuông 1:1 → 46px; wordmark 4:1 → 23px cao × 92px rộng; cùng ~2100px²)
 *
 * ponytail: đo naturalWidth/Height lúc ảnh load thay vì khai tỉ lệ tay cho từng
 * logo — sếp thêm logo mới qua /admin là tự cân, không phải sửa code. Logo nào
 * có viền trong suốt thừa trong file PNG sẽ hơi nhỏ hơn thật: crop lại file ảnh,
 * đừng thêm bảng scale thủ công.
 */
export default function ClientLogo({
  src,
  alt = "Client logo",
  base = 46,
  maxH,
  className = "",
}: {
  src: string;
  alt?: string;
  /** cạnh của logo vuông chuẩn (px) — các logo khác quy về cùng diện tích */
  base?: number;
  /** trần chiều cao, cho logo dọc khỏi phá khung */
  maxH?: number;
  className?: string;
}) {
  const fit = useCallback(
    (img: HTMLImageElement) => {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (!ratio || !Number.isFinite(ratio)) return;
      const h = base / Math.sqrt(ratio);
      img.style.height = `${maxH ? Math.min(h, maxH) : h}px`;
      img.style.width = "auto";
    },
    [base, maxH],
  );

  // Ảnh load xong TRƯỚC khi hydrate thì onLoad không bao giờ bắn — effect sau
  // mount bắt nốt trường hợp đó (ref callback lúc mount thì complete vẫn false).
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (img?.complete) fit(img);
  }, [fit]);

  return (
    <Image
      ref={ref}
      src={src}
      alt={alt}
      width={260}
      height={80}
      onLoad={(e) => fit(e.currentTarget)}
      className={`max-h-full w-auto max-w-full object-contain ${className}`}
    />
  );
}
