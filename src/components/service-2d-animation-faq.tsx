import ServiceFaqSection from "@/components/service-faq-section";
import { service2DAnimationFaqItems } from "@/components/service-faq-presets";

export default function Service2DAnimationFaq() {
  return (
    <ServiceFaqSection
      id="faq-2d-animation"
      sectionStep="// 04"
      intro="Practical answers on pipelines, readability, and handoffs for 2D animation on games."
      items={service2DAnimationFaqItems}
    />
  );
}
