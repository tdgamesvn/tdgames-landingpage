/**
 * Dự án KHÔNG phải của studio: founder Dang The Toan làm khi còn ở công ty trước (Zitga,
 * Sky Mavis, hoặc một công ty khác sếp không nêu tên) hoặc bài dự thi cá nhân. Sếp xác nhận
 * 2026-10-31 — giữ trên site để tham khảo nhưng phải ghi rõ nguồn gốc ở trang case study,
 * mọi thẻ liệt kê và metadata.
 * Là việc thật của studio (không nhãn, không nằm ở đây): Monster Legends (Social Point),
 * battle-of-the-gods-mytheria (outsource của TD Games).
 */
export type ProjectProvenance = {
  /** founder-previous: làm khi là nhân viên công ty khác; founder-personal: bài cá nhân. */
  kind: "founder-previous" | "founder-personal";
  company: string;
  /** Nhãn ngắn cho badge. */
  label: string;
  /** Một câu giải thích ở hero case study. */
  note: string;
};

export const FOUNDER_NAME = "Dang The Toan";

const zitga: ProjectProvenance = {
  kind: "founder-previous",
  company: "Zitga",
  label: "Founder's previous work · Zitga",
  note: `Created by our founder ${FOUNDER_NAME} while working at Zitga, before TD Games was founded. Shown with credit as a reference for his experience — not a TD Games client project.`,
};

const skyMavis: ProjectProvenance = {
  kind: "founder-previous",
  company: "Sky Mavis",
  label: "Founder's previous work · Sky Mavis",
  note: `Created by our founder ${FOUNDER_NAME} while working at Sky Mavis, before TD Games was founded. Shown with credit as a reference for his experience — not a TD Games client project.`,
};

/** Công ty cũ không được nêu tên (sếp xác nhận 2026-10-31). */
export const PREVIOUS_EMPLOYER_COMPANY = "a previous employer";

const previousEmployer: ProjectProvenance = {
  kind: "founder-previous",
  company: PREVIOUS_EMPLOYER_COMPANY,
  label: "Founder's previous work",
  note: `Created by our founder ${FOUNDER_NAME} for a previous employer, before TD Games was founded. Shown with credit as a reference for his experience — not a TD Games client project.`,
};

export const PROJECT_PROVENANCE: Readonly<Record<string, ProjectProvenance>> = {
  "summoner-era": zitga,
  "summoner-era-2020": zitga,
  "summoner-era-arena-of-heroes": zitga,
  "mid-autumn-summoner-era": zitga,
  "heroes-fire": zitga,
  "axie-infinity-origins": skyMavis,
  "lore-axie-origin": skyMavis,
  "game-animation-vfx-3q": previousEmployer,
  "puzzle-wonderland": previousEmployer,
  "reaper-lady-project-overdrive": previousEmployer,
  "animation-contest-sky-mavis": {
    kind: "founder-personal",
    company: "Sky Mavis Animation Contest",
    label: "Founder's personal work — Sky Mavis Animation Contest",
    note: `A personal entry by our founder ${FOUNDER_NAME} for the Sky Mavis animation contest — not a TD Games client project.`,
  },
};

/** Nhãn ngắn cho thẻ trong lưới (đủ gọn để nằm trên ảnh). */
export function provenanceCardLabel(p: ProjectProvenance): string {
  return p.kind === "founder-personal" ? "Founder's personal work" : "Founder's previous work";
}

/** Nhận slug ("summoner-era") hoặc href ("/portfolio/summoner-era", URL đầy đủ). */
export function provenanceFor(slugOrHref: string | undefined | null): ProjectProvenance | undefined {
  if (!slugOrHref) return undefined;
  const slug = slugOrHref.split(/[?#]/)[0].replace(/\/+$/, "").split("/").pop() ?? "";
  return Object.prototype.hasOwnProperty.call(PROJECT_PROVENANCE, slug)
    ? PROJECT_PROVENANCE[slug]
    : undefined;
}

/** Sắp dự án của studio lên trước, dự án của founder ở công ty cũ xuống cuối (ổn định). */
export function studioFirst<T>(items: readonly T[], slugOf: (item: T) => string | undefined): T[] {
  return items
    .map((item, i) => ({ item, i, f: provenanceFor(slugOf(item)) ? 1 : 0 }))
    .sort((a, b) => a.f - b.f || a.i - b.i)
    .map((x) => x.item);
}
