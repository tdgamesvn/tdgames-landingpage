import { caseStudyMetadata } from "@/lib/seo";
import CaseStudyLayout from "@/components/portfolio/case-study-layout";
import {
  projectMeta,
  relatedProjects,
  showcaseModules,
} from "./project-data";

export const metadata = caseStudyMetadata("lore-axie-origin", projectMeta);

export default function LoreAxieOriginDetailPage() {
  return (
    <CaseStudyLayout
      meta={projectMeta}
      modules={showcaseModules}
      related={relatedProjects}
    />
  );
}
