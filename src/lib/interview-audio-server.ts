import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Key R2 đã gắn cho vòng PV khác chưa — cả file tay (audio_key) lẫn mảnh ghi trong app
 * (audio_pieces). Chặn gắn ghi âm của ứng viên khác vào hồ sơ này.
 */
export async function audioKeyUsedElsewhere(supabase: SupabaseClient, key: string, exceptId: string): Promise<boolean> {
  const [legacy, pieces] = await Promise.all([
    supabase.from("interview_sessions").select("id").eq("audio_key", key).neq("id", exceptId).limit(1),
    supabase.from("interview_sessions").select("id").contains("audio_pieces", JSON.stringify([{ key }])).neq("id", exceptId).limit(1),
  ]);
  const err = legacy.error ?? pieces.error;
  if (err) throw new Error(err.message);
  return (legacy.data?.length ?? 0) > 0 || (pieces.data?.length ?? 0) > 0;
}
