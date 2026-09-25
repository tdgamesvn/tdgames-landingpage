import { caseStudyMetadata } from "@/lib/seo";
import CaseStudyLayout from "@/components/portfolio/case-study-layout";
import {
  projectMeta,
  relatedProjects,
  showcaseModules,
} from "./project-data";

export const metadata = caseStudyMetadata("boss-animation", projectMeta);

export default function BossAnimationDetailPage() {
  return (
    <CaseStudyLayout
      meta={projectMeta}
      modules={showcaseModules}
      related={relatedProjects}
    />
  );
}
