import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * fetch cho URL do NGƯỜI NGOÀI nhập (link portfolio ứng viên…): chặn SSRF vào
 * mạng nội bộ — VPS nằm trong Tailscale (100.64.0.0/10, có cliproxyapi), có
 * localhost:3000, metadata 169.254.169.254. Theo redirect thủ công, kiểm từng hop,
 * đọc body theo stream và cắt ở maxBytes.
 *
 * Còn hở: DNS rebinding giữa lúc lookup và lúc fetch (không pin IP). Chấp nhận
 * được vì kết quả chỉ đi vào prompt AI, không trả nguyên văn cho người nhập link.
 */

function privateV4(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT — Tailscale
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function privateIp(ip: string) {
  if (isIP(ip) === 4) return privateV4(ip);
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return privateV4(v6.slice(7));
  return (
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe80") ||
    v6.startsWith("ff")
  );
}

async function assertPublic(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("protocol");
  if (url.port && url.port !== "80" && url.port !== "443") throw new Error("port");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".ts.net")) {
    throw new Error("internal host");
  }
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new Error("private address");
}

export type SafeResponse = {
  status: number;
  ok: boolean;
  contentType: string;
  body: Buffer;
  url: string;
  /** Body bị cắt ở maxBytes (ảnh thì coi như hỏng, HTML thì dùng phần đầu). */
  truncated?: boolean;
};

export async function safeFetch(
  rawUrl: string,
  opts: { maxBytes: number; timeoutMs: number; headers?: Record<string, string>; maxRedirects?: number },
): Promise<SafeResponse> {
  const signal = AbortSignal.timeout(opts.timeoutMs);
  let url = new URL(rawUrl);

  for (let hop = 0; ; hop++) {
    await assertPublic(url);
    const res = await fetch(url, { headers: opts.headers, redirect: "manual", signal });

    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      if (hop >= (opts.maxRedirects ?? 4)) throw new Error("too many redirects");
      await res.body?.cancel();
      url = new URL(res.headers.get("location")!, url);
      continue;
    }

    const contentType = res.headers.get("content-type") ?? "";

    const chunks: Buffer[] = [];
    let size = 0;
    if (res.body) {
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > opts.maxBytes) {
          // Trang HTML quá dài thì giữ phần đầu là đủ; ảnh quá nặng thì caller tự bỏ.
          await reader.cancel();
          chunks.push(Buffer.from(value.subarray(0, value.byteLength - (size - opts.maxBytes))));
          return { status: res.status, ok: res.ok, contentType, body: Buffer.concat(chunks), url: url.href, truncated: true };
        }
        chunks.push(Buffer.from(value));
      }
    }
    return { status: res.status, ok: res.ok, contentType, body: Buffer.concat(chunks), url: url.href };
  }
}
