import { caseStudyMetadata } from "@/lib/seo";
import CaseStudyLayout from "@/components/portfolio/case-study-layout";
import {
  projectMeta,
  relatedProjects,
  showcaseModules,
} from "./project-data";

export const metadata = caseStudyMetadata("monster-legends-special", projectMeta);

export default function MonsterLegendsSpecialPage() {
  return (
    <CaseStudyLayout
      meta={projectMeta}
      modules={showcaseModules}
      related={relatedProjects}
    />
  );
}
