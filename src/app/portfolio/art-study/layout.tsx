import { caseStudyMetadata } from "@/lib/seo";

import { projectMeta } from "./project-data";

export const metadata = caseStudyMetadata("art-study", projectMeta);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
