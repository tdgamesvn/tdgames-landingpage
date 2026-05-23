/**
 * debug-supabase.mjs — diagnose why JS SDK returns 0 results
 * Usage: node --env-file=.env.local scripts/debug-supabase.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const token = process.env.SUPABASE_ACCESS_TOKEN;

console.log("SUPABASE_URL:", url ? url.slice(0, 50) + "..." : "MISSING");
console.log("Token prefix:", token ? token.slice(0, 20) + "..." : "MISSING");
console.log("Token is JWT (eyJ...):", token?.startsWith("eyJ"));

// 1. Raw REST fetch
const rest = await fetch(
  `${url}/rest/v1/media_assets?select=original_url,r2_url&source_type=eq.local_public&original_url=like.*mir-s3-cdn-cf*&limit=3`,
  {
    headers: {
      apikey: token,
      Authorization: `Bearer ${token}`,
    },
  }
);
console.log("\nREST status:", rest.status);
const restData = await rest.json();
console.log("REST result count:", Array.isArray(restData) ? restData.length : "not array");
if (!Array.isArray(restData)) console.log("REST error:", JSON.stringify(restData));
else if (restData.length > 0) console.log("Sample:", restData[0].original_url);

// 2. JS SDK
const supabase = createClient(url, token);
const { data, error } = await supabase
  .from("media_assets")
  .select("original_url, r2_url")
  .eq("source_type", "local_public")
  .like("original_url", "%mir-s3-cdn-cf%")
  .limit(3);

console.log("\nSDK error:", error);
console.log("SDK data count:", data?.length ?? "null");
if (data?.length > 0) console.log("SDK sample:", data[0].original_url);

// 3. Count without filters
const { count } = await supabase
  .from("media_assets")
  .select("*", { count: "exact", head: true });
console.log("\nSDK total count (no filter):", count);
