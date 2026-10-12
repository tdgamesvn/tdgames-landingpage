import { caseStudyMetadata } from "@/lib/seo";
import CaseStudyLayout from "@/components/portfolio/case-study-layout";
import {
  projectMeta,
  relatedProjects,
  showcaseModules,
} from "./project-data";

export const metadata = caseStudyMetadata("yomi-2", projectMeta);

export default function Yomi2DetailPage() {
  return (
    <CaseStudyLayout
      meta={projectMeta}
      modules={showcaseModules}
      related={relatedProjects}
    />
  );
}
