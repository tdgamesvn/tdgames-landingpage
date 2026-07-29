import type { ServiceFaqItem } from "@/components/service-faq-section";

// ponytail: chỉ 2 câu cuối dùng chung cho cả 3 service (NDA + get started).
// "What files" và "How much" KHÔNG shared — file bàn giao và cấu trúc giá khác nhau thật.
const sharedClosingFaqItems: ServiceFaqItem[] = [
  {
    question: "Do you sign an NDA?",
    answer:
      "Yes—ask and we will have one signed the same day, working from your template or ours. Either way, briefs, references, and unreleased assets stay inside the assigned team, and nothing appears in our portfolio or marketing without your written approval.",
  },
  {
    question: "How do we get started?",
    answer:
      "Send your brief, target style references, and technical constraints, and we reply within 24 hours. Most clients begin with a paid trial batch—a small paid deliverable that calibrates style and pipeline before you commit to full production.",
  },
];

// ponytail: cùng một đoạn "why TD Games" cho cả 3, chỉ khác vế track record.
// Số liệu lấy từ home-page-lower.tsx (50+ projects / 12+ clients / 1200+ assets).
// Đổi số ở đây thì đổi cả home-page-lower.tsx + about/page.tsx.
const timezoneAdvantage =
  "Our team works GMT+7: same-day turnaround with studios across Asia and Australia, an afternoon overlap with Europe, and overnight turnaround for North America—feedback you send at the end of your day is actioned before your next morning.";

export const service2DArtFaqItems: ServiceFaqItem[] = [
  {
    question: "What is 2D art in game production?",
    answer:
      "Illustration, character and prop design, environments, and UI art—the visual layer players read before they read anything else. In games it also carries a production job: every asset has to survive export, resolution targets, and a style guide it did not author.",
  },
  {
    question: "What is a 2D art style?",
    answer:
      "The shared visual language for your product: palette, line weight, shading approach, proportions, and how detail simplifies at small sizes. A locked style keeps heroes, UI, props, and environments reading as one world—and it is what makes approvals fast instead of subjective.",
  },
  {
    question: "What are the stages of a 2D art pipeline?",
    answer:
      "Direction and references, mood boards, rough concepts, line work where the style calls for it, colour and lighting passes, polish, then export-ready delivery. The steps flex with your milestone plan; the review gates do not.",
  },
  {
    question: "Can you match our existing art style?",
    answer:
      "Yes—that is most of our work. We start from your style guide and shipped in-game assets, then lock shape language and palette rules on a small batch before scaling. New assets should be indistinguishable from what your team already made.",
  },
  {
    question: "How do you keep quality consistent across a large batch?",
    answer:
      "An art lead owns the style bible and reviews every asset against it before delivery. Batches ship against a fixed naming convention and export spec, so consistency is enforced by process rather than by hoping each artist remembers.",
  },
  {
    question: "Why outsource 2D art to TD Games?",
    answer: `Two concrete reasons. Track record: 50+ projects delivered, 1200+ assets shipped, and 12+ studios who came back for the next one. Time zone: ${timezoneAdvantage}`,
  },
  {
    question: "How much does 2D art cost?",
    answer:
      "Cost tracks complexity and volume, not a flat per-asset rate—a background prop and a hero splash illustration are different jobs. Send us the brief and target style and you get a scoped quote within 24 hours.",
  },
  {
    question: "How long does a 2D art batch take?",
    answer:
      "A small batch of props or icons is a much shorter cycle than a hero-quality character sheet with variants. We commit to a delivery date with the quote, once references, resolution, and deliverables are locked—so you get a date before you sign, not after.",
  },
  {
    question: "What files do you deliver?",
    answer:
      "Layered sources where agreed, flattened exports at your target resolutions, and usage notes covering any variant or recolour rules. Naming follows the convention agreed at the brief stage, so new assets slot into your existing library.",
  },
  ...sharedClosingFaqItems,
];

export const service2DAnimationFaqItems: ServiceFaqItem[] = [
  {
    question: "What does 2D animation cover for games?",
    answer:
      "Gameplay loops (idle, walk, attack, hit reactions), UI motion, promo cuts, and Spine or frame-based delivery—scoped to your engine, resolution, and performance targets from the first conversation.",
  },
  {
    question: "Spine or frame-by-frame—which do you use?",
    answer:
      "We match the pipeline to the product: Spine for scalable gameplay sets, frame-by-frame when the brief needs drawn smear frames or a specific illustrated look. Many projects mix both.",
  },
  {
    question: "How do you keep motion readable on small screens?",
    answer:
      "We bias silhouette, contrast, and hold frames, test timing against actual UI scale, and drop micro-detail that disappears at target resolution.",
  },
  {
    question: "Can you animate to our existing rigs and style?",
    answer:
      "Yes. We work to your rig structure, bone naming, and style guide rather than importing ours. If a rig needs changes to support a move, we flag it before animating, not after.",
  },
  {
    question: "How many revision rounds are typical?",
    answer:
      "Reviews are structured around blocking, timing, and polish gates so feedback lands while it can still be acted on cheaply. Exact rounds are agreed per milestone in the statement of work.",
  },
  {
    question: "Why work with TD Games on animation?",
    answer: `Two concrete reasons. Track record: 50+ projects delivered, 1200+ assets shipped, and 12+ studios who came back for the next one. Time zone: ${timezoneAdvantage}`,
  },
  {
    question: "How much does 2D animation cost?",
    answer:
      "Cost depends on the number of animations, their complexity, and the rig they run on—an idle-and-attack pair is a different scope than a full combat chain with transitions and hit reactions. We quote per set after a scoping call, and you get a number within 24 hours.",
  },
  {
    question: "How long does an animation set take?",
    answer:
      "A single gameplay loop is a much shorter cycle than a full combat chain across multiple characters. We commit to a delivery date with the quote, once the rig and brief are locked—so you get a date before you sign, not after.",
  },
  {
    question: "What files do you deliver?",
    answer:
      "Spine project sources where agreed, exported atlases or frame sequences, pivot notes, and a short integration checklist for your engineers. Naming follows the convention agreed at the brief stage.",
  },
  ...sharedClosingFaqItems,
];

export const service2DVfxFaqItems: ServiceFaqItem[] = [
  {
    question: "What counts as 2D VFX in games?",
    answer:
      "Sprite and flipbook bursts, trails, impacts, buffs, screen accents, and UI-adjacent flashes—authored to read in motion and stay inside atlas budgets.",
  },
  {
    question: "How do you balance flash against clarity?",
    answer:
      "We tier intensity (normal, elite, ultimate), cap simultaneous overlays, and tune colour contrast so characters and telegraphs stay legible. An effect that hides the gameplay it is celebrating has failed.",
  },
  {
    question: "Can VFX match our existing art style?",
    answer:
      "Yes. We start from your style guide and in-game references, then lock shape language and palette rules before building any library.",
  },
  {
    question: "How are effects optimised?",
    answer:
      "Atlas packing, frame culling, particle budget targets, and early tests on representative devices or device profiles. We agree the budget before authoring, so optimisation is a constraint we design against rather than a rescue pass at the end.",
  },
  {
    question: "Do you provide variants and reuse?",
    answer:
      "Libraries are built with recolour tiers, scale variants, and modular layers wherever the art allows, so your team can stretch one authored effect across multiple characters and skills.",
  },
  {
    question: "Why outsource VFX to TD Games?",
    answer: `Two concrete reasons. Track record: 70+ combat effects, 40+ ambient VFX sets, and 50+ UI VFX delivered across 50+ shipped projects. Time zone: ${timezoneAdvantage}`,
  },
  {
    question: "How much does 2D VFX cost?",
    answer:
      "Cost tracks effect complexity and set size—a single hit-spark is a smaller scope than a layered elemental skill effect with multiple frames and colour variants. We quote per effect or per set after a scoping call, and you get a number within 24 hours.",
  },
  {
    question: "How long does a VFX set take?",
    answer:
      "A small set of hits and impacts is a much shorter cycle than a skill-effect package with multiple elements and variants. We commit to a delivery date with the quote, once creative direction and the technical budget are locked—so you get a date before you sign, not after.",
  },
  {
    question: "What files do you deliver?",
    answer:
      "Packed atlas sheets, pivot data, and engine-ready hooks for your target, plus usage notes covering how variants and recolours are meant to be applied. Naming follows the convention agreed at the brief stage, so new effects drop into your existing library.",
  },
  ...sharedClosingFaqItems,
];
