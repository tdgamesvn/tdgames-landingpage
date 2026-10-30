import { serializeJsonLd } from "@/lib/json-ld";

/** Thẻ <script type="application/ld+json"> an toàn (escape `<`). Dùng được ở server component. */
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
