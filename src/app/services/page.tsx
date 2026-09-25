import { permanentRedirect } from "next/navigation";

/** Services overview removed; navigation uses dropdown only. 308 để Google bỏ URL này. */
export default function ServicesPage() {
  permanentRedirect("/");
}
