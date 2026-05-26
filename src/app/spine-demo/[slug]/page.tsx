import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SpineDemoClient, type DemoConfig } from "./_client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { slug: string };
type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Rewrite CDN URLs through /api/cdn-proxy to avoid browser CORS errors.
 * SpinePlayer fetches .json/.atlas/textures via XHR — browser blocks
 * cross-origin requests to cdn.tdgamestudio.com without CORS headers.
 * Proxying through Next.js (same origin) sidesteps the issue entirely.
 */
function proxyCdnUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const CDN_PREFIX = "https://cdn.tdgamestudio.com/";
  if (url.startsWith(CDN_PREFIX)) {
    return `/api/cdn-proxy/${url.slice(CDN_PREFIX.length)}`;
  }
  return url;
}

function sp(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

export default async function SpineDemoPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp_ = await searchParams;

  // Fetch character from DB
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("spine_characters")
    .select("json_url, atlas_url, animations, skin, scale, offset_x, offset_y, premultiplied_alpha")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (!data) notFound();

  // URL params override DB values for positioning
  const scale = sp(sp_["scale"]) ? parseFloat(sp(sp_["scale"])) : (data.scale ?? 1);
  const offsetX = sp(sp_["x"]) ? parseInt(sp(sp_["x"])) : (data.offset_x ?? 0);
  const offsetY = sp(sp_["y"]) ? parseInt(sp(sp_["y"])) : (data.offset_y ?? 0);

  // Background params
  const bgType = (sp(sp_["bg"]) as DemoConfig["bgType"]) || "none";
  const bgColor = sp(sp_["c"]) || "0a0a0a";
  const bgImageUrl = sp(sp_["img"]) || "";
  const bgSize = sp(sp_["bgs"]) || "cover";
  const bgPosition = sp(sp_["bgp"]) || "center";

  const config: DemoConfig = {
    jsonUrl: proxyCdnUrl(data.json_url),
    atlasUrl: proxyCdnUrl(data.atlas_url) ?? "",
    animations: data.animations ?? ["idle"],
    skin: data.skin ?? undefined,
    premultipliedAlpha: data.premultiplied_alpha ?? true,
    scale,
    offsetX,
    offsetY,
    bgType,
    bgColor,
    bgImageUrl,
    bgSize,
    bgPosition,
  };

  return <SpineDemoClient config={config} />;
}
