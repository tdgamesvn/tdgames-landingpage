import { caseStudyMetadata } from "@/lib/seo";
import CaseStudyLayout from "@/components/portfolio/case-study-layout";
import {
  projectMeta,
  relatedProjects,
  showcaseModules,
} from "./project-data";

export const metadata = caseStudyMetadata("monster-legends-dark", projectMeta);

export default function MonsterLegendsDarkPage() {
  return (
    <CaseStudyLayout
      meta={projectMeta}
      modules={showcaseModules}
      related={relatedProjects}
    />
  );
}
