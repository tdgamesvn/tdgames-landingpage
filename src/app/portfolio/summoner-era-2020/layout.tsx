import { caseStudyMetadata } from "@/lib/seo";

import { projectMeta } from "./project-data";

export const metadata = caseStudyMetadata("summoner-era-2020", projectMeta);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
