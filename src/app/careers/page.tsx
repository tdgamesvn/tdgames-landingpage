import { resolveSlot } from "@/lib/page-slots";
import CareersClient from "./careers-client";

export const dynamic = "force-dynamic";

export default async function CareersPage() {
  const heroUrl = await resolveSlot(
    "careers",
    "hero",
    "https://cdn.tdgamestudio.com/landing/images/f0d05f71-5089-4b3f-b453-7a8d19afc013.png",
  );
  return <CareersClient heroUrl={heroUrl} />;
}
