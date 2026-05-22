import ServiceFaqSection from "@/components/service-faq-section";
import { service2DVfxFaqItems } from "@/components/service-faq-presets";

export default function Service2DVfxFaq() {
  return (
    <ServiceFaqSection
      id="faq-2d-vfx"
      sectionStep="// 04"
      intro="How we scope, optimize, and ship 2D VFX that stays readable in real gameplay."
      items={service2DVfxFaqItems}
    />
  );
}
