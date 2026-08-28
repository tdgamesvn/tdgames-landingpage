import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms and conditions that govern your use of tdgamestudio.com and the mobile games and applications published by TD Games.",
};

const INTRO = [
  "Please read these Terms of Use carefully before using the TD Games website or any mobile game or application we publish (together, the “Service”).",
  "These Terms apply to all visitors and users of our website and to everyone who downloads or plays a TD Games title on the Google Play Store or the Apple App Store.",
  "Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access the Service.",
];

const SECTIONS: LegalSection[] = [
  {
    title: "Use of the Service",
    paragraphs: [
      "This website is an informational and portfolio site for TD Games, a 2D art, animation and VFX outsourcing studio. It is provided free of charge; no product or subscription is sold through it. Our games are distributed through the Google Play Store and the Apple App Store and are governed by the additional terms set out below.",
    ],
    bullets: [
      "You agree not to use the Service in any way that is unlawful, or that could damage, disable, overburden or impair it.",
      "You agree not to attempt to gain unauthorised access to any part of the Service, its servers, or any system connected to it.",
      "You agree not to scrape, harvest or systematically download material from the Service by automated means without our prior written consent.",
    ],
  },
  {
    title: "Eligibility",
    paragraphs: [
      "Our games are intended for players aged 13 and over. By downloading or playing a TD Games title you confirm that you are at least 13 years old. If you are under the age of majority where you live, you may use our games only with the involvement of a parent or guardian, who is responsible for any purchases made on the device.",
    ],
  },
  {
    title: "Licence to Play Our Games",
    paragraphs: [
      "Subject to these Terms, we grant you a personal, limited, non-exclusive, non-transferable and revocable licence to download and play our games on a device you own or control, for your own private, non-commercial entertainment. We do not sell you the game; all rights not expressly granted here are reserved by TD Games.",
    ],
    bullets: [
      "You may not modify, decompile, reverse-engineer, disassemble or create derivative works from any part of our games, except where such restriction is prohibited by applicable law.",
      "You may not use cheats, bots, automation, memory editors, modified clients or any other software that gives an unfair advantage or alters intended gameplay.",
      "You may not distribute, sell, rent, sublicense or make our games available on any store, site or service other than the official app stores.",
      "You may not extract, rip or reuse artwork, audio, animation or other assets from our games, including for the training of machine-learning or generative models.",
      "You may create and monetise gameplay videos, streams and screenshots of our games on established video and streaming platforms, provided you do not present the content as an official TD Games release.",
    ],
  },
  {
    title: "In-App Purchases and Virtual Items",
    paragraphs: [
      "Some of our games offer optional in-app purchases, including consumable items, virtual currency and one-off unlocks such as ad removal. All purchases are processed by Apple or Google through their own billing systems, under their terms and using their payment methods. TD Games does not process payments and never receives your card details.",
      "Virtual currency and virtual items are licensed to you for use inside the relevant game only. They have no monetary value, cannot be exchanged for cash or anything of real-world value, and may not be sold, transferred or traded outside the game. Your licence to use them ends when your licence to use the game ends.",
      "We may change the price, availability or in-game effect of any item, and may adjust game balance, at any time. Purchases are final once delivered. Requests for a refund must be made to Apple or Google under the refund policy of the store you purchased from; we have no ability to issue refunds ourselves, although we will help where we can if a purchase failed to deliver.",
    ],
  },
  {
    title: "Advertising in Free Games",
    paragraphs: [
      "Games we offer free of charge are funded by advertising, which may include banner, interstitial and opt-in rewarded video ads. Ads are supplied by third-party networks and their content is not created or endorsed by TD Games. Where a game offers an ad-removal purchase, buying it disables advertising in that game on the account and device used for the purchase.",
    ],
  },
  {
    title: "App Store Terms",
    paragraphs: [
      "Your use of our games is also subject to the terms of the store you downloaded them from. Where a conflict arises between these Terms and the store's terms in relation to the download and payment mechanics, the store's terms prevail.",
      "You acknowledge that these Terms are between you and TD Games, not with Apple or Google. Apple and Google are not responsible for our games or their content, and have no obligation to provide any maintenance or support for them. Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce them against you.",
    ],
  },
  {
    title: "Updates, Changes and Discontinuation",
    paragraphs: [
      "We may release updates, patches and new versions of our games, and your device may install them automatically. We may also modify, suspend or discontinue a game, or any feature or item within it, at any time and without liability to you. If we withdraw a game from sale, previously purchased content may become unavailable, and you will not be entitled to a refund except as required by applicable law or by the app store's policy.",
    ],
  },
  {
    title: "Intellectual Property",
    paragraphs: [
      "The Service and its original content, features and functionality are and will remain the exclusive property of TD Games and its licensors. All artwork, animation, showreels, case studies and other creative material displayed on this website is owned by TD Games or by the clients who commissioned it, and is shown here for portfolio and demonstration purposes only. All artwork, characters, animation, music, sound, code and other assets contained in our games are likewise owned by TD Games or its licensors.",
      "You may not copy, reproduce, redistribute, modify, resell or use any of that material — including for the training of machine-learning or generative models — without our prior written permission. Our trade marks and trade dress may not be used in connection with any product or service without our prior written consent.",
    ],
  },
  {
    title: "Client Work and Engagements",
    paragraphs: [
      "Nothing on this website constitutes a binding offer, quotation or contract. Pricing, scope, delivery schedules, revision rounds, ownership of deliverables and confidentiality are agreed separately in a written services agreement, statement of work or purchase order between TD Games and the client.",
      "If any term of such a signed agreement conflicts with these Terms of Use, the signed agreement prevails in respect of that engagement.",
    ],
  },
  {
    title: "Recruitment Submissions",
    paragraphs: [
      "When you apply for a position through our careers pages, you confirm that the information you provide is true and complete, and that you have the right to share any portfolio material you submit. We evaluate applications at our sole discretion and are under no obligation to respond to, retain, or return any submission. Application materials are handled as described in our Privacy Policy.",
    ],
  },
  {
    title: "Availability, Errors and Inaccuracies",
    paragraphs: [
      "We are constantly updating the content, case studies and service descriptions on the Service. Information published here may be incomplete, out of date or inaccurate, and we may experience delays in updating it.",
      "We cannot and do not guarantee the accuracy or completeness of any information on the Service. We reserve the right to change or update information and to correct errors, inaccuracies or omissions at any time without prior notice.",
    ],
  },
  {
    title: "Links to Other Websites",
    paragraphs: [
      "Our Service may contain links to third-party websites or services that are not owned or controlled by TD Games.",
      "TD Games has no control over, and assumes no responsibility for, the content, privacy policies or practices of any third-party websites or services. You further acknowledge and agree that TD Games shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such websites or services.",
      "We strongly advise you to read the terms and conditions and privacy policies of any third-party websites or services that you visit.",
    ],
  },
  {
    title: "Limitation of Liability",
    paragraphs: [
      "In no event shall TD Games be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation loss of profits, data, use, goodwill or other intangible losses, resulting from (i) your access to or use of, or inability to access or use, the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; or (iv) unauthorised access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.",
    ],
  },
  {
    title: "Disclaimer",
    paragraphs: [
      "Your use of the Service is at your sole risk. The Service is provided on an “AS IS” and “AS AVAILABLE” basis, without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.",
      "TD Games does not warrant that (a) the Service will function uninterrupted, secure or available at any particular time or location; (b) any errors or defects will be corrected; (c) the Service is free of viruses or other harmful components; or (d) the results of using the Service will meet your requirements.",
    ],
  },
  {
    title: "Termination",
    paragraphs: [
      "We may suspend or terminate your licence to use our games immediately, without notice, if you breach these Terms — in particular the restrictions on cheating, modification and redistribution. On termination your right to use the game and any virtual items within it ends at once. You may end this agreement at any time by uninstalling our games and ceasing to use the Service.",
    ],
  },
  {
    title: "Governing Law",
    paragraphs: [
      "These Terms shall be governed and construed in accordance with the laws of Vietnam, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.",
    ],
  },
  {
    title: "Changes to These Terms",
    paragraphs: [
      "We reserve the right, at our sole discretion, to modify or replace these Terms at any time. The revised Terms take effect when posted on this page, and the “Last updated” date above will change accordingly. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised Terms.",
    ],
  },
  {
    title: "Contact Us",
    paragraphs: [
      "If you have any questions about these Terms, please contact us at tdgames.vn@gmail.com.",
      "TD GAMES COMPANY LIMITED — Xom Ngoai, Dong Anh Commune, Hanoi City, Vietnam.",
    ],
  },
];

export default function TermsOfUsePage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="29 August 2026"
      intro={INTRO}
      sections={SECTIONS}
    />
  );
}
