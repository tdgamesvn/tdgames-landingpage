/**
 * Giới hạn số bản PDF render cùng lúc (thuần, không I/O — dùng ở offer-letter-pdf.tsx).
 * - `tryAcquire`: xem trước — hết slot hoặc người đó đang có 1 bản → null ngay (route trả 429).
 * - `acquire`: gửi mail / tải lại file đã gửi — không xét khoá theo người, xếp hàng chờ slot;
 *   chờ quá `timeoutMs` thì vẫn chạy (vượt giới hạn tạm thời) — không bao giờ từ chối.
 * Hàm nhả (release) gọi nhiều lần cũng chỉ tính 1.
 */

export type Release = () => void;

export class RenderSlots {
  running = 0;
  private users = new Map<string, number>();
  private queue: { userKey: string; grant: (r: Release) => void }[] = [];

  readonly max: number;

  constructor(max: number) {
    this.max = max;
  }

  get waiting() {
    return this.queue.length;
  }

  private take(userKey: string): Release {
    this.running++;
    this.users.set(userKey, (this.users.get(userKey) ?? 0) + 1);
    let done = false;
    return () => {
      if (done) return;
      done = true;
      this.running--;
      const n = (this.users.get(userKey) ?? 1) - 1;
      if (n > 0) this.users.set(userKey, n);
      else this.users.delete(userKey);
      this.next();
    };
  }

  private next() {
    while (this.running < this.max && this.queue.length) {
      const w = this.queue.shift()!;
      w.grant(this.take(w.userKey));
    }
  }

  tryAcquire(userKey: string): Release | null {
    if (this.running >= this.max || this.users.has(userKey)) return null;
    return this.take(userKey);
  }

  acquire(userKey: string, timeoutMs: number): Promise<Release> {
    if (this.running < this.max) return Promise.resolve(this.take(userKey));
    return new Promise((resolve) => {
      const waiter = {
        userKey,
        grant: (r: Release) => {
          clearTimeout(timer);
          resolve(r);
        },
      };
      const timer = setTimeout(() => {
        const i = this.queue.indexOf(waiter);
        if (i >= 0) this.queue.splice(i, 1);
        resolve(this.take(userKey));
      }, timeoutMs);
      this.queue.push(waiter);
    });
  }
}
