// node --test src/lib/hr-discord-mentions.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { buildMentions } from "./hr-discord-mentions.ts";

const staff = [
  { id: "b", role: "boss" as const, disabled: false, discord_user_id: "100000000000000001" },
  { id: "h1", role: "hr" as const, disabled: false, discord_user_id: "100000000000000002" },
  { id: "h2", role: "hr" as const, disabled: true, discord_user_id: "100000000000000003" },
  { id: "l1", role: "leader" as const, disabled: false, discord_user_id: "100000000000000004" },
  { id: "l2", role: "leader" as const, disabled: false, discord_user_id: "100000000000000005" },
  { id: "a1", role: "accountant" as const, disabled: false, discord_user_id: "100000000000000006" },
  { id: "h3", role: "hr" as const, disabled: false, discord_user_id: null },
];

test("HR + Leader của job: chỉ leader được gán, bỏ tài khoản khoá / chưa có ID", () => {
  assert.equal(buildMentions(staff, ["hr", "leader"], "l1"), "<@100000000000000002> <@100000000000000004>");
});

test("Offer: thêm Kế toán", () => {
  assert.equal(
    buildMentions(staff, ["hr", "leader", "accountant"], "l2"),
    "<@100000000000000002> <@100000000000000005> <@100000000000000006>",
  );
});

test("Leader chưa gán → không tag leader nào", () => {
  assert.equal(buildMentions(staff, ["leader"], null), "@everyone");
});

test("Không ai có ID → @everyone; trùng ID chỉ tag 1 lần", () => {
  assert.equal(buildMentions([], ["hr"], null), "@everyone");
  const dup = [...staff, { id: "x", role: "hr" as const, disabled: false, discord_user_id: "100000000000000002" }];
  assert.equal(buildMentions(dup, ["hr"], null), "<@100000000000000002>");
});
