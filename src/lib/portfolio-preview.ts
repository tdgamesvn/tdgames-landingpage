import "server-only";

/**
 * Xem SƠ BỘ portfolio cho AI chấm hồ sơ: lấy tối đa MAX_IMAGES ảnh tiêu biểu
 * (thu nhỏ 768px) + tiêu đề/mô tả trang, đếm video chứ không xem.
 * Sếp chốt 2026-10-20: chỉ check sơ bộ — xem hết vừa lâu vừa tốn token.
 *
 * Hỗ trợ: Behance, Google Drive folder public (ảnh nằm ngay trong thư mục),
 * site cá nhân (og:image + <img>). LinkedIn chặn bot (999) → không mở.
 */

const MAX_IMAGES = 4;
const MAX_LINKS = 2;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";

export type PortfolioLink = {
  url: string;
  status: "ok" | "no_images" | "blocked" | "unreadable" | "not_checked";
  title?: string;
  description?: string;
  images_seen: number;
  videos_found: number;
  reason?: string;
};

export type PortfolioPreview = {
  links: PortfolioLink[];
  /** data:image/jpeg;base64,… — gửi thẳng cho model vision. */
  images: string[];
};

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function meta(html: string, name: string) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`,
    "i",
  );
  const m = html.match(re);
  return m ? decode(m[1] ?? m[2] ?? "").trim() : "";
}

function countVideos(html: string) {
  const hits = html.match(
    /\.mp4\b|\.webm\b|youtube\.com\/embed|youtu\.be\/|player\.vimeo\.com|"video_url"|<video\b/gi,
  );
  return hits ? Math.min(hits.length, 50) : 0;
}

/** Ứng viên đôi khi dán nhiều link cách nhau bằng dấu cách / xuống dòng — lấy link đầu. */
function firstUrl(raw: string | null | undefined) {
  const m = (raw ?? "").match(/https?:\/\/\S+/);
  return m ? m[0].replace(/[),.;]+$/, "") : null;
}

/** Danh sách ảnh ứng viên cho từng loại trang — chỉ lấy vài cái đầu. */
function pickImageUrls(url: string, html: string): string[] {
  const host = new URL(url).hostname;
  const out: string[] = [];
  const push = (u: string) => {
    if (u && !out.includes(u)) out.push(u);
  };

  if (host.endsWith("behance.net")) {
    // Ảnh bìa các project — đủ để thấy tay nghề + phong cách. Cùng 1 project có
    // nhiều cỡ (404, max_808…) → khử trùng theo mã project, mỗi project 1 ảnh.
    const seen = new Set<string>();
    for (const m of html.matchAll(
      /https:\/\/mir-s3-cdn-cf\.behance\.net\/projects\/(?:404|max_808)[^/"'\s\\]*\/([0-9a-f]+)[^"'\s\\]*\.(?:jpe?g|png|webp)/gi,
    )) {
      if (seen.has(m[1])) continue;
      seen.add(m[1]);
      push(m[0]);
    }
    return out;
  }

  if (host === "drive.google.com") {
    const folder = url.match(/folders\/([A-Za-z0-9_-]+)/)?.[1];
    if (folder) {
      const re = new RegExp(`\\\\x22([A-Za-z0-9_-]{25,60})\\\\x22,\\\\x5b\\\\x22${folder}`, "g");
      for (const m of html.matchAll(re)) push(`https://drive.google.com/thumbnail?id=${m[1]}&sz=w800`);
    } else {
      const id = url.match(/\/d\/([A-Za-z0-9_-]+)/)?.[1] ?? new URL(url).searchParams.get("id");
      if (id) push(`https://drive.google.com/thumbnail?id=${id}&sz=w800`);
    }
    return out;
  }

  // Site cá nhân: og:image trước, rồi <img> không phải logo/icon.
  const og = meta(html, "og:image");
  if (og) push(new URL(og, url).href);
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    const src = decode(m[1]);
    if (src.startsWith("data:") || /logo|icon|favicon|avatar|sprite|pixel|badge/i.test(src)) continue;
    try {
      push(new URL(src, url).href);
    } catch {
      // src hỏng — bỏ
    }
  }
  return out;
}

/** Tải 1 ảnh, bỏ ảnh quá nhỏ (icon), thu về JPEG 768px. null nếu không phải ảnh dùng được. */
async function toDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok || !(res.headers.get("content-type") ?? "").startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 15 * 1024 * 1024) return null;
    const sharp = (await import("sharp")).default;
    const img = sharp(buf, { animated: false });
    const { width = 0, height = 0 } = await img.metadata();
    if (width < 200 || height < 150) return null;
    const out = await img
      .resize({ width: 768, height: 768, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch {
    return null;
  }
}

async function previewOne(url: string, budget: number): Promise<{ link: PortfolioLink; images: string[] }> {
  const link: PortfolioLink = { url, status: "unreadable", images_seen: 0, videos_found: 0 };
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    return { link: { ...link, reason: "link hỏng" }, images: [] };
  }
  if (/linkedin\.com$/.test(host)) {
    return { link: { ...link, status: "blocked", reason: "LinkedIn chặn truy cập tự động" }, images: [] };
  }

  let html: string;
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(15_000) });
    if (res.status === 403 || res.status === 429) {
      // Behance chặn trang project (/gallery/…) với máy chủ; trang profile thì vẫn mở được.
      const reason = /behance\.net$/.test(host)
        ? "Behance chặn trang project tự động (gửi link profile Behance thì xem được)"
        : "trang chặn truy cập tự động";
      return { link: { ...link, status: "blocked", reason }, images: [] };
    }
    if (!res.ok) return { link: { ...link, reason: `HTTP ${res.status}` }, images: [] };
    html = (await res.text()).slice(0, 3_000_000);
  } catch {
    return { link: { ...link, reason: "không tải được trang" }, images: [] };
  }

  link.title = (meta(html, "og:title") || decode(html.match(/<title[^>]*>([^<]*)/i)?.[1] ?? "")).trim().slice(0, 150);
  link.description = meta(html, "og:description").slice(0, 300) || undefined;
  link.videos_found = countVideos(html);
  if (/password protected/i.test(link.title)) {
    return { link: { ...link, status: "blocked", reason: "trang có mật khẩu" }, images: [] };
  }

  // Thử lần lượt, dừng khi đủ budget — không tải thừa.
  const images: string[] = [];
  for (const src of pickImageUrls(url, html).slice(0, budget * 3)) {
    if (images.length >= budget) break;
    const d = await toDataUrl(src);
    if (d) images.push(d);
  }
  link.images_seen = images.length;
  link.status = images.length ? "ok" : "no_images";
  if (!images.length) link.reason = "không lấy được ảnh (trang dựng bằng JS / file không phải ảnh)";
  return { link, images };
}

export async function portfolioPreview(a: Record<string, unknown>): Promise<PortfolioPreview> {
  const urls = [a.portfolio_url, a.website_url]
    .map((u) => firstUrl(u as string | null))
    .filter((u, i, arr): u is string => !!u && arr.indexOf(u) === i)
    .slice(0, MAX_LINKS);

  const links: PortfolioLink[] = [];
  const images: string[] = [];
  for (const url of urls) {
    const r = await previewOne(url, MAX_IMAGES - images.length);
    links.push(r.link);
    images.push(...r.images);
  }

  const li = firstUrl(a.linkedin_url as string | null);
  if (li) links.push({ url: li, status: "not_checked", reason: "LinkedIn chặn truy cập tự động", images_seen: 0, videos_found: 0 });

  return { links, images };
}

export const PORTFOLIO_RULES = `Về "portfolio_check" và các ảnh đính kèm:
- Ảnh đính kèm là MẪU SƠ BỘ (tối đa ${MAX_IMAGES} ảnh) lấy từ link portfolio, không phải toàn bộ portfolio. Nhận xét tay nghề/phong cách ở mức sơ bộ, không kết luận tuyệt đối.
- Video chỉ được đếm, không được xem — đừng nhận xét nội dung video.
- Link có status khác "ok" là CHƯA XEM được: không được trừ điểm vì thế, chỉ ghi chú.
- Điền "portfolio_note": 1-2 câu tiếng Việt về ấn tượng sơ bộ từ ảnh (hoặc lý do chưa xem được).`;
