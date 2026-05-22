import ServiceFaqSection, {
  type ServiceFaqItem,
} from "@/components/service-faq-section";

export const portfolioFaqItems: ServiceFaqItem[] = [
  {
    question: "Does TD Games offer project-based or retainer outsourcing?",
    answer:
      "Both: milestone-based phases (concept → production → polish) or fixed hourly/team packages for long-term projects. We're flexible based on your scope and shipping schedule.",
  },
  {
    question: "What's your typical file delivery pipeline?",
    answer:
      "PSD / PNG / Spine / JSON based on your engine; can adapt to your studio's Confluence, Notion, or Slack. We prioritize clear versioning and consistent naming conventions.",
  },
  {
    question: "What's the average response time for quotes and kick-off?",
    answer:
      "With a complete brief: preliminary quote within 24–48 business hours. After scope confirmation, the team can kick off within the week depending on current production load.",
  },
  {
    question: "Do you sign NDAs and protect asset rights?",
    answer:
      "Yes. Two-way NDAs are standard before viewing confidential art. Final usage rights per contract (work-for-hire or license) — always clearly stated in the proposal.",
  },
  {
    question: "Can you handle 2D art, animation, and VFX in one project?",
    answer:
      "Yes. You can bundle 2D Art, 2D Animation, and 2D VFX in one roadmap to synchronize style, palette, and technical specs — reducing friction during game integration.",
  },
  {
    question: "Want to see more cases or test a sample character?",
    answer:
      "Send a short brief via the Contact form below or email hello@tdgames.com. For larger projects, we can discuss paid/unpaid art tests depending on scope.",
  },
];

export default function PortfolioFaq() {
  return (
    <ServiceFaqSection
      id="portfolio-faq"
      sectionStep="// 03"
      intro="Common questions when working with TD Games — pipeline, contracts, and how to get started quickly."
      items={portfolioFaqItems}
    />
  );
}
