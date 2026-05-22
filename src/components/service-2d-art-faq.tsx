import ServiceFaqSection from "@/components/service-faq-section";
import { service2DArtFaqItems } from "@/components/service-faq-presets";

export default function Service2DArtFaq() {
  return (
    <ServiceFaqSection
      id="faq-2d-art"
      sectionStep="// 04"
      intro="Straight answers on how we approach 2D art—aligned with the workflow and showcase sections above."
      items={service2DArtFaqItems}
    />
  );
}
