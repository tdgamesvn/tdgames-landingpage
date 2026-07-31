import { resolveSlot, resolveSlots } from "@/lib/page-slots";
import CareersClient from "./careers-client";

export const revalidate = 60;

export default async function CareersPage() {
  const [heroUrl, gallery] = await Promise.all([
    resolveSlot(
      "careers",
      "hero",
      "https://cdn.tdgamestudio.com/landing/images/f0d05f71-5089-4b3f-b453-7a8d19afc013.png",
    ),
    resolveSlots("careers", "gallery"),
  ]);
  return <CareersClient heroUrl={heroUrl} lifePhotos={gallery.map((g) => g.url)} />;
}
