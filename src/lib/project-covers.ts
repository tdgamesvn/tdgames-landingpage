import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Ảnh bìa dự án theo slug, đọc từ bảng projects (cùng nguồn lưới /portfolio) → đổi ảnh bìa
 * ở /admin là trang chủ + company-profile khớp theo. Lỗi DB → {} (nơi gọi tự dùng ảnh dự phòng).
 */
export async function projectCovers(slugs: readonly string[]): Promise<Record<string, string>> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("projects")
      .select("slug,image")
      .in("slug", [...slugs]);
    if (error || !data) return {};
    return Object.fromEntries(
      data.filter((r) => r.slug && r.image).map((r) => [r.slug as string, r.image as string]),
    );
  } catch {
    return {};
  }
}
