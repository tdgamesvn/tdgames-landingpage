import type { MetadataRoute } from "next";

const BASE_URL = "https://tdgamestudio.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /crm KHÔNG chặn ở đây: trang đó dùng meta noindex, mà bot bị chặn crawl thì
        // không đọc được noindex → URL vẫn có thể lọt index (dạng "no information").
        disallow: ["/admin", "/api/", "/hr"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
