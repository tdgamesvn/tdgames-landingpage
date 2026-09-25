import { caseStudyMetadata } from "@/lib/seo";
import CaseStudyLayout from "@/components/portfolio/case-study-layout";
import {
  projectMeta,
  relatedProjects,
  showcaseModules,
  showcaseUiInit,
} from "./project-data";

export const metadata = caseStudyMetadata("reaper-lady-project-overdrive", projectMeta);

export default function ReaperLadyProjectOverdrivePage() {
  return (
    <CaseStudyLayout
      meta={projectMeta}
      modules={showcaseModules}
      related={relatedProjects}
      showcaseUiInit={showcaseUiInit}
    />
  );
}
