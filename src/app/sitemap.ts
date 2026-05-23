import type { MetadataRoute } from "next";

const BASE_URL = "https://www.tdgamestudio.com";

const portfolioSlugs = [
  "animation-contest-sky-mavis",
  "art-study",
  "axie-infinity-origins",
  "battle-of-the-gods-mytheria",
  "boss-animation",
  "game-animation-vfx-3q",
  "heroes-fire",
  "horse-racing",
  "kayn-snow-moon",
  "lore-axie-origin",
  "mid-autumn-summoner-era",
  "puzzle-wonderland",
  "reaper-lady-project-overdrive",
  "summoner-era",
  "summoner-era-2020",
  "summoner-era-arena-of-heroes",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/services/2d-art`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/services/2d-animation`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/services/2d-vfx`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/portfolio`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/careers`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const portfolioRoutes: MetadataRoute.Sitemap = portfolioSlugs.map((slug) => ({
    url: `${BASE_URL}/portfolio/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...portfolioRoutes];
}
