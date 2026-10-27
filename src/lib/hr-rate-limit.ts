// Giới hạn tần suất trong bộ nhớ (PM2 chạy 1 process). Thuần, không I/O.

export type Limiter = {
  /** Số lần đã ghi nhận trong cửa sổ hiện tại. */
  count(key: string): number;
  /** Nguyên tử: ghi nhận 1 lần; trả false (và không ghi nhận) nếu đã đạt hạn mức. Gọi TRƯỚC việc tốn thời gian. */
  tryHit(key: string): boolean;
  /** Hoàn lại lần ghi nhận gần nhất (dùng khi thao tác thành công không nên bị tính). */
  undo(key: string): void;
  reset(key: string): void;
  /** Số key đang giữ (để test chặn phình bộ nhớ). */
  size(): number;
};

export const LIMITER_MAX_KEYS = 10_000;

export function createLimiter(
  max: number,
  windowMs: number,
  now: () => number = Date.now,
  maxKeys: number = LIMITER_MAX_KEYS,
): Limiter {
  const hits = new Map<string, number[]>();

  function live(key: string): number[] {
    const t = now();
    const arr = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
    if (arr.length) hits.set(key, arr);
    else hits.delete(key);
    return arr;
  }

  function enforceCap() {
    if (hits.size <= maxKeys) return;
    // Bỏ key hết hạn trước, còn vượt thì xoá key chèn sớm nhất (thứ tự chèn của Map).
    for (const k of [...hits.keys()]) live(k);
    for (const k of hits.keys()) {
      if (hits.size <= maxKeys) break;
      hits.delete(k);
    }
  }

  return {
    count: (key) => live(key).length,
    tryHit(key) {
      const arr = live(key);
      if (arr.length >= max) return false;
      arr.push(now());
      hits.set(key, arr);
      enforceCap();
      return true;
    },
    undo(key) {
      const arr = live(key);
      arr.pop();
      if (arr.length) hits.set(key, arr);
      else hits.delete(key);
    },
    reset: (key) => void hits.delete(key),
    size: () => hits.size,
  };
}

/**
 * IP client. Prod: Cloudflare → nginx nên tin cf-connecting-ip, rồi x-real-ip,
 * rồi phần tử CUỐI của x-forwarded-for (phần đầu do client tự đặt được). Không có thì "unknown".
 */
export function clientIp(headers: Headers): string {
  const cf = headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const parts = headers.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return parts?.length ? parts[parts.length - 1] : "unknown";
}
