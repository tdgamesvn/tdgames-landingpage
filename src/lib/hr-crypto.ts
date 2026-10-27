// Băm mật khẩu & token cho tài khoản /hr. Thuần (chỉ dùng node:crypto), dùng được trong test.
import { randomBytes, scrypt, createHash, timingSafeEqual } from "node:crypto";

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

function scryptAsync(pw: string, salt: Buffer, n: number, r: number, p: number, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(pw, salt, keylen, { N: n, r, p }, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

/** Định dạng: scrypt$N$r$p$saltB64$hashB64 */
export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(pw, salt, N, R, P, KEYLEN);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (![n, r, p].every((v) => Number.isInteger(v) && v > 0)) return false;
  try {
    const salt = Buffer.from(parts[4], "base64");
    const expected = Buffer.from(parts[5], "base64");
    if (expected.length === 0) return false;
    const actual = await scryptAsync(pw, salt, n, r, p, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function hashToken(t: string): string {
  return createHash("sha256").update(t).digest("hex");
}

/** Token ngẫu nhiên 32 byte (base64url); DB chỉ lưu `hash` (sha256 hex). */
export function newToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function isTokenUsable(row: { expires_at: string; used_at: string | null }, now: Date): boolean {
  if (row.used_at) return false;
  return new Date(row.expires_at).getTime() > now.getTime();
}

export function sessionUserIsActive(u: { disabled: boolean } | null): boolean {
  return !!u && !u.disabled;
}

/** Đọc 1 cookie theo tên chính xác từ header Cookie. */
export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() !== name) continue;
    const v = part.slice(i + 1).trim();
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  }
  return null;
}
