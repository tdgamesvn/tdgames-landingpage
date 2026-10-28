/**
 * Giới hạn số bản PDF render cùng lúc (thuần, không I/O — dùng ở offer-letter-pdf.tsx).
 * - `tryAcquire`: xem trước — hết slot hoặc người đó đang có 1 bản → null ngay (route trả 429).
 * - `acquire`: gửi mail / tải lại file đã gửi — không xét khoá xem trước theo người, xếp hàng chờ slot.
 *   Có trần cứng (trả null → route 429):
 *     · mỗi người tối đa `maxWaitPerUser` việc chờ (đang chờ + đang chạy);
 *     · hàng chờ toàn cục tối đa `maxQueue`;
 *     · chờ quá `timeoutMs`: chỉ chạy nếu `running < max + maxOverrun`, nếu không → null.
 * Hàm nhả (release) gọi nhiều lần cũng chỉ tính 1.
 */

export type Release = () => void;

export type RenderSlotsOptions = {
  max: number;
  maxQueue?: number;
  maxWaitPerUser?: number;
  maxOverrun?: number;
};

type Waiter = { userKey: string; grant: (r: Release) => void };

export class RenderSlots {
  running = 0;
  readonly max: number;
  readonly maxQueue: number;
  readonly maxWaitPerUser: number;
  readonly maxOverrun: number;
  /** Đang chạy theo người (cả xem trước lẫn việc chờ) — khoá xem trước 1 bản/người. */
  private users = new Map<string, number>();
  /** Việc chờ theo người (đang chờ + đang chạy) — trần maxWaitPerUser. */
  private waitJobs = new Map<string, number>();
  private queue: Waiter[] = [];

  constructor(opts: RenderSlotsOptions) {
    this.max = opts.max;
    this.maxQueue = opts.maxQueue ?? 10;
    this.maxWaitPerUser = opts.maxWaitPerUser ?? 2;
    this.maxOverrun = opts.maxOverrun ?? 2;
  }

  get waiting() {
    return this.queue.length;
  }

  private static inc(m: Map<string, number>, k: string, d: number) {
    const n = (m.get(k) ?? 0) + d;
    if (n > 0) m.set(k, n);
    else m.delete(k);
  }

  private take(userKey: string, waitJob: boolean): Release {
    this.running++;
    RenderSlots.inc(this.users, userKey, 1);
    let done = false;
    return () => {
      if (done) return;
      done = true;
      this.running--;
      RenderSlots.inc(this.users, userKey, -1);
      if (waitJob) RenderSlots.inc(this.waitJobs, userKey, -1);
      this.next();
    };
  }

  private next() {
    while (this.running < this.max && this.queue.length) {
      const w = this.queue.shift()!;
      w.grant(this.take(w.userKey, true));
    }
  }

  tryAcquire(userKey: string): Release | null {
    if (this.running >= this.max || this.users.has(userKey)) return null;
    return this.take(userKey, false);
  }

  /** null = vượt trần (route trả 429). */
  acquire(userKey: string, timeoutMs: number): Promise<Release | null> {
    if ((this.waitJobs.get(userKey) ?? 0) >= this.maxWaitPerUser) return Promise.resolve(null);
    if (this.running < this.max) {
      RenderSlots.inc(this.waitJobs, userKey, 1);
      return Promise.resolve(this.take(userKey, true));
    }
    if (this.queue.length >= this.maxQueue) return Promise.resolve(null);
    RenderSlots.inc(this.waitJobs, userKey, 1);
    return new Promise((resolve) => {
      const waiter: Waiter = {
        userKey,
        grant: (r) => {
          clearTimeout(timer);
          resolve(r);
        },
      };
      const timer = setTimeout(() => {
        const i = this.queue.indexOf(waiter);
        if (i >= 0) this.queue.splice(i, 1);
        if (this.running < this.max + this.maxOverrun) {
          resolve(this.take(userKey, true));
        } else {
          RenderSlots.inc(this.waitJobs, userKey, -1);
          resolve(null);
        }
      }, timeoutMs);
      this.queue.push(waiter);
    });
  }
}
