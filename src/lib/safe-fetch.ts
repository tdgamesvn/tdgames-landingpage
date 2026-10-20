import "server-only";
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";
import zlib from "node:zlib";

/**
 * fetch cho URL do NGƯỜI NGOÀI nhập (link portfolio, cv_url từ form công khai…):
 * chặn SSRF vào mạng nội bộ — VPS nằm trong Tailscale (100.64.0.0/10, có
 * cliproxyapi), có localhost:3000, metadata 169.254.169.254.
 *
 * - Kiểm IP ngay trong `lookup` của socket → IP được kiểm chính là IP được kết
 *   nối (chống DNS rebinding / TOCTOU).
 * - Host là IP literal (không qua lookup) thì kiểm riêng.
 * - IPv6 bọc IPv4 (::ffff:…, NAT64, 6to4, IPv4-compatible) chặn cả dải.
 * - Redirect theo tay, mỗi hop đi qua cùng cơ chế. Body đọc theo stream, cắt ở
 *   maxBytes (đếm SAU giải nén → chặn cả bom gzip).
 */

const blocked = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // CGNAT — Tailscale
  ["127.0.0.0", 8],
  ["169.254.0.0", 16], // link-local + metadata
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 3], // multicast + reserved + broadcast
] as const)
  blocked.addSubnet(net, prefix, "ipv4");
for (const [net, prefix] of [
  ["::", 96], // unspecified, loopback, IPv4-compatible
  // IPv4-mapped (::ffff:a.b.c.d): BlockList tự đối chiếu với luật IPv4 ở trên —
  // KHÔNG thêm ::ffff:0:0/96, nó khớp mọi địa chỉ IPv4 (đã dính 2026-10-20).
  ["64:ff9b::", 96], // NAT64
  ["64:ff9b:1::", 48],
  ["100::", 64], // discard
  ["2001::", 32], // Teredo
  ["2002::", 16], // 6to4
  ["fc00::", 7], // ULA
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
] as const)
  blocked.addSubnet(net, prefix, "ipv6");

export function isBlockedIp(ip: string) {
  const fam = isIP(ip);
  if (!fam) return true;
  return blocked.check(ip, fam === 4 ? "ipv4" : "ipv6");
}

/** lookup cho socket: có 1 địa chỉ nội bộ là từ chối cả host. */
const safeLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const list = addresses as LookupAddress[];
    if (!list.length || list.some((a) => isBlockedIp(a.address))) {
      return callback(Object.assign(new Error("private address"), { code: "EPRIVATE" }), "", 0);
    }
    if (options.all) return (callback as unknown as (e: null, a: LookupAddress[]) => void)(null, list);
    callback(null, list[0].address, list[0].family);
  });
};

function checkUrl(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("protocol");
  if (url.port && url.port !== "80" && url.port !== "443") throw new Error("port");
  if (url.username || url.password) throw new Error("credentials in url");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && isBlockedIp(host)) throw new Error("private address");
  if (/^(localhost|.*\.(local|internal|localhost|ts\.net))$/i.test(host)) throw new Error("internal host");
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

type Opts = { maxBytes: number; timeoutMs: number; headers?: Record<string, string>; maxRedirects?: number };

function requestOnce(url: URL, opts: Opts, deadline: number) {
  return new Promise<{ res: http.IncomingMessage; req: http.ClientRequest }>((resolve, reject) => {
    const mod = url.protocol === "https:" ? https : http;
    const req = mod.request(
      url,
      {
        method: "GET",
        headers: { "accept-encoding": "gzip, deflate, br", ...opts.headers },
        lookup: safeLookup,
        timeout: Math.max(1, deadline - Date.now()),
      },
      (res) => resolve({ res, req }),
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}

export async function safeFetch(rawUrl: string, opts: Opts): Promise<SafeResponse> {
  const deadline = Date.now() + opts.timeoutMs;
  let url = new URL(rawUrl);

  for (let hop = 0; ; hop++) {
    checkUrl(url);
    const { res, req } = await requestOnce(url, opts, deadline);
    const status = res.statusCode ?? 0;

    if (status >= 300 && status < 400 && res.headers.location) {
      req.destroy();
      if (hop >= (opts.maxRedirects ?? 4)) throw new Error("too many redirects");
      url = new URL(res.headers.location, url);
      continue;
    }

    const contentType = String(res.headers["content-type"] ?? "");
    const enc = String(res.headers["content-encoding"] ?? "").toLowerCase();
    const stream: NodeJS.ReadableStream =
      enc === "gzip" ? res.pipe(zlib.createGunzip())
      : enc === "deflate" ? res.pipe(zlib.createInflate())
      : enc === "br" ? res.pipe(zlib.createBrotliDecompress())
      : res;

    const chunks: Buffer[] = [];
    let size = 0;
    let truncated = false;
    try {
      for await (const chunk of stream as AsyncIterable<Buffer>) {
        if (Date.now() > deadline) throw new Error("timeout");
        size += chunk.length;
        if (size > opts.maxBytes) {
          chunks.push(chunk.subarray(0, chunk.length - (size - opts.maxBytes)));
          truncated = true;
          break;
        }
        chunks.push(chunk);
      }
    } finally {
      req.destroy();
    }
    return { status, ok: status >= 200 && status < 300, contentType, body: Buffer.concat(chunks), url: url.href, truncated };
  }
}
