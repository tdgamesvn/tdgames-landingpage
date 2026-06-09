import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { readFile } from "node:fs/promises";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { globSync } from "glob";


export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseAdmin();

  // 1. Fetch all assets from DB
  const { data: assets, error: fetchError } = await supabase
    .from("media_assets")
    .select("id,original_url,current_url,r2_url,r2_key");

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!assets?.length) return NextResponse.json({ updated: 0, scannedFiles: 0 });

  // 2. Scan all source files once — build a map: url → Set<filePath>
  const cwd = process.cwd();
  const filePaths = globSync("src/**/*.{ts,tsx,js,jsx,json}", { nodir: true });
  const fileContents: { filePath: string; content: string }[] = [];

  for (const filePath of filePaths) {
    const content = await readFile(path.join(cwd, filePath), "utf8");
    fileContents.push({ filePath, content });
  }

  // 3. For each asset, find which files reference any of its URLs
  let updated = 0;
  const results: { id: string; used_by: string[] }[] = [];

  for (const asset of assets) {
    // Collect all URL variants for this asset (non-empty, unique)
    const urlVariants = Array.from(
      new Set(
        [asset.original_url, asset.current_url, asset.r2_url, asset.r2_key]
          .filter((u): u is string => Boolean(u) && u.length > 10),
      ),
    );

    const usedBySet = new Set<string>();

    for (const { filePath, content } of fileContents) {
      for (const url of urlVariants) {
        if (content.includes(url)) {
          usedBySet.add(filePath);
          break; // No need to check other variants for the same file
        }
      }
    }

    const usedBy = Array.from(usedBySet).sort();
    results.push({ id: asset.id, used_by: usedBy });
  }

  // 4. Run all updates concurrently (parallel instead of sequential)
  const updateResults = await Promise.all(
    results.map(({ id, used_by }) =>
      supabase.from("media_assets").update({ used_by }).eq("id", id),
    ),
  );
  updated = updateResults.filter((r) => !r.error).length;

  return NextResponse.json({
    updated,
    total: assets.length,
    scannedFiles: filePaths.length,
  });
}
