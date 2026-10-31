// Redirect 301 cho bài blog đã gộp. Hàm thuần — test: node --test src/lib/blog-redirects.test.ts
// Dữ liệu: src/content/blog-redirects.json. next.config.ts gọi buildBlogRedirects() nên dữ liệu sai → build fail.

export type BlogRedirect = { from: string; to: string };

const SLUG_RE = /^[a-z0-9-]+$/;

/** Trả về danh sách lỗi (rỗng = hợp lệ): slug sai định dạng, from trùng, from === to, chuỗi redirect. */
export function validateBlogRedirects(list: readonly BlogRedirect[]): string[] {
  const errors: string[] = [];
  const froms = new Set<string>();
  const tos = new Set(list.map((r) => r.to));
  for (const { from, to } of list) {
    if (typeof from !== "string" || !SLUG_RE.test(from)) errors.push(`from sai định dạng: ${from}`);
    if (typeof to !== "string" || !SLUG_RE.test(to)) errors.push(`to sai định dạng: ${to}`);
    if (froms.has(from)) errors.push(`from trùng: ${from}`);
    froms.add(from);
    if (from === to) errors.push(`from trùng to: ${from}`);
  }
  for (const f of froms) if (tos.has(f)) errors.push(`chuỗi redirect: ${f} vừa là from vừa là to`);
  return errors;
}

/** Validate rồi map sang rule của next.config (301). Throw nếu dữ liệu sai. */
export function buildBlogRedirects(list: readonly BlogRedirect[]) {
  const errors = validateBlogRedirects(list);
  if (errors.length) throw new Error(`blog-redirects.json không hợp lệ:\n${errors.join("\n")}`);
  return list.map(({ from, to }) => ({
    source: `/blog/${from}`,
    destination: `/blog/${to}`,
    statusCode: 301 as const,
  }));
}
