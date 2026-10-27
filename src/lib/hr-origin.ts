// Chống CSRF cho /api/hr (thuần, dùng được trong test).
// SameSite=Lax KHÔNG chặn request từ subdomain cùng site (vd. cdn.tdgamestudio.com),
// nên mọi request ghi (không phải GET/HEAD) phải đến từ đúng origin của app.

type HeaderLike = { get(name: string): string | null };

function normOrigin(o: string): string {
  return o.trim().toLowerCase().replace(/\/+$/, "");
}

/**
 * true = cho qua. GET/HEAD luôn qua. Có `Origin` → phải khớp 1 trong `allowedOrigins`.
 * Không có `Origin` → xét `Sec-Fetch-Site`: chặn "cross-site"/"same-site"; cho "same-origin"/"none"/vắng
 * (cron, curl, công cụ server không gửi 2 header này).
 */
export function isSameOriginRequest(method: string, headers: HeaderLike, allowedOrigins: readonly string[]): boolean {
  const m = method.toUpperCase();
  if (m === "GET" || m === "HEAD") return true;
  const origin = headers.get("origin");
  if (origin !== null) {
    const o = normOrigin(origin);
    return allowedOrigins.some((a) => normOrigin(a) === o);
  }
  const site = headers.get("sec-fetch-site")?.trim().toLowerCase();
  return site !== "cross-site" && site !== "same-site";
}
