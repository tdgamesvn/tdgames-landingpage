import type { MetadataRoute } from "next";

const BASE_URL = "https://tdgamestudio.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/hr", "/crm"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
