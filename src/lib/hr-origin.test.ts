// node --test src/lib/hr-origin.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { isSameOriginRequest } from "./hr-origin.ts";

const ALLOWED = ["https://tdgamestudio.com"];
const h = (o: Record<string, string>) => new Headers(o);

test("GET/HEAD luôn qua, kể cả Origin lạ", () => {
  assert.equal(isSameOriginRequest("GET", h({ origin: "https://cdn.tdgamestudio.com" }), ALLOWED), true);
  assert.equal(isSameOriginRequest("head", h({ "sec-fetch-site": "cross-site" }), ALLOWED), true);
});

test("POST với Origin đúng → qua", () => {
  assert.equal(isSameOriginRequest("POST", h({ origin: "https://tdgamestudio.com" }), ALLOWED), true);
});

test("POST với Origin là subdomain cùng site (CDN) → chặn", () => {
  assert.equal(isSameOriginRequest("POST", h({ origin: "https://cdn.tdgamestudio.com" }), ALLOWED), false);
});

test("Origin 'null' hoặc khác cổng/giao thức → chặn", () => {
  assert.equal(isSameOriginRequest("PATCH", h({ origin: "null" }), ALLOWED), false);
  assert.equal(isSameOriginRequest("DELETE", h({ origin: "http://tdgamestudio.com" }), ALLOWED), false);
  assert.equal(isSameOriginRequest("PUT", h({ origin: "https://tdgamestudio.com:8443" }), ALLOWED), false);
});

test("Origin có dấu / cuối hoặc khác hoa thường vẫn khớp", () => {
  assert.equal(isSameOriginRequest("POST", h({ origin: "HTTPS://TDGAMESTUDIO.COM" }), ALLOWED), true);
  assert.equal(isSameOriginRequest("POST", h({ origin: "https://tdgamestudio.com" }), ["https://tdgamestudio.com/"]), true);
});

test("Origin đúng thì thắng Sec-Fetch-Site", () => {
  assert.equal(
    isSameOriginRequest("POST", h({ origin: "https://tdgamestudio.com", "sec-fetch-site": "same-origin" }), ALLOWED),
    true,
  );
  assert.equal(
    isSameOriginRequest("POST", h({ origin: "https://cdn.tdgamestudio.com", "sec-fetch-site": "same-origin" }), ALLOWED),
    false,
  );
});

test("không có Origin: dựa Sec-Fetch-Site", () => {
  assert.equal(isSameOriginRequest("POST", h({ "sec-fetch-site": "cross-site" }), ALLOWED), false);
  assert.equal(isSameOriginRequest("POST", h({ "sec-fetch-site": "same-site" }), ALLOWED), false);
  assert.equal(isSameOriginRequest("POST", h({ "sec-fetch-site": "same-origin" }), ALLOWED), true);
  assert.equal(isSameOriginRequest("POST", h({ "sec-fetch-site": "none" }), ALLOWED), true);
});

test("không có Origin lẫn Sec-Fetch-Site (cron, curl) → qua", () => {
  assert.equal(isSameOriginRequest("POST", h({ "x-hr-cron-key": "abc" }), ALLOWED), true);
});

test("nhiều origin cho phép (dev localhost)", () => {
  const allowed = ["https://tdgamestudio.com", "http://localhost:3000"];
  assert.equal(isSameOriginRequest("POST", h({ origin: "http://localhost:3000" }), allowed), true);
  assert.equal(isSameOriginRequest("POST", h({ origin: "http://localhost:3000" }), ALLOWED), false);
});
