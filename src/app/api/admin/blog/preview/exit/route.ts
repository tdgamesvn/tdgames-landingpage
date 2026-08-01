import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/** Tắt Draft Mode — không cần secret, thoát preview thì ai bấm cũng được. */
export async function GET() {
  (await draftMode()).disable();
  redirect("/blog");
}
