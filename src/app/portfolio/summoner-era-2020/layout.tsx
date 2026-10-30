import JsonLd from "@/components/json-ld";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import { caseStudyMetadata } from "@/lib/seo";

import { projectMeta } from "./project-data";

export const metadata = caseStudyMetadata("summoner-era-2020", projectMeta);

export default function Layout({ children }: { children: React.ReactNode }) {
  // Trang này không dùng CaseStudyLayout → tự render breadcrumb.
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Portfolio", path: "/portfolio" },
          { name: projectMeta.title.replace(/\s+/g, " ").trim(), path: "/portfolio/summoner-era-2020" },
        ])}
      />
      {children}
    </>
  );
}
