import CaseStudyLayout from "@/components/portfolio/case-study-layout";
import {
  projectMeta,
  relatedProjects,
  showcaseModules,
  showcaseUiInit,
} from "./project-data";

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
