// node --test src/lib/project-provenance.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { provenanceFor, studioFirst, PROJECT_PROVENANCE } from "./project-provenance.ts";

test("nhận slug, href, URL đầy đủ", () => {
  assert.equal(provenanceFor("summoner-era")?.company, "Zitga");
  assert.equal(provenanceFor("/portfolio/axie-infinity-origins")?.company, "Sky Mavis");
  assert.equal(provenanceFor("https://tdgamestudio.com/portfolio/heroes-fire/?x=1")?.company, "Zitga");
  assert.equal(provenanceFor("animation-contest-sky-mavis")?.kind, "founder-personal");
});

test("dự án studio và slug chưa rõ không có nhãn", () => {
  for (const s of ["monster-legends", "yomi-2", "epic-card", "battle-of-the-gods-mytheria", "constructor", "", undefined]) {
    assert.equal(provenanceFor(s), undefined, String(s));
  }
});

test("3Q, Puzzle Wonderland, Reaper & Lady: công ty cũ không nêu tên", () => {
  for (const s of ["game-animation-vfx-3q", "puzzle-wonderland", "reaper-lady-project-overdrive"]) {
    const p = provenanceFor(s);
    assert.equal(p?.kind, "founder-previous", s);
    assert.equal(p?.label, "Founder's previous work", s);
    assert.ok(!/zitga|sky mavis/i.test(p?.note ?? ""), s);
  }
});

test("đúng 11 trang đã được sếp xác nhận", () => {
  assert.equal(Object.keys(PROJECT_PROVENANCE).length, 11);
});

test("studioFirst đẩy dự án founder xuống cuối, giữ thứ tự ổn định", () => {
  const order = studioFirst(["summoner-era", "yomi-2", "axie-infinity-origins", "epic-card"], (s) => s);
  assert.deepEqual(order, ["yomi-2", "epic-card", "summoner-era", "axie-infinity-origins"]);
});
