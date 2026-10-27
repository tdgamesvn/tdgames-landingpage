// Giới hạn tần suất trong bộ nhớ (PM2 chạy 1 process). Thuần, không I/O.

export type Limiter = {
  /** Số lần đã ghi nhận trong cửa sổ hiện tại. */
  count(key: string): number;
  /** Ghi nhận 1 lần; trả true nếu vẫn trong hạn mức (sau khi tính lần này). */
  hit(key: string): boolean;
  /** Đã đạt hạn mức chưa (không ghi nhận thêm). */
  blocked(key: string): boolean;
  reset(key: string): void;
};

export function createLimiter(max: number, windowMs: number, now: () => number = Date.now): Limiter {
  const hits = new Map<string, number[]>();

  function live(key: string): number[] {
    const t = now();
    const arr = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
    if (arr.length) hits.set(key, arr);
    else hits.delete(key);
    return arr;
  }

  return {
    count: (key) => live(key).length,
    blocked: (key) => live(key).length >= max,
    hit(key) {
      const arr = live(key);
      arr.push(now());
      hits.set(key, arr);
      // Dọn lẻ tẻ để Map không phình mãi.
      if (hits.size > 5000) for (const k of hits.keys()) live(k);
      return arr.length <= max;
    },
    reset: (key) => void hits.delete(key),
  };
}

/** IP client: phần tử đầu của x-forwarded-for, không có thì "unknown". */
export function clientIp(forwardedFor: string | null): string {
  const first = forwardedFor?.split(",")[0]?.trim();
  return first || "unknown";
}
