#!/usr/bin/env node
// Ghi lệnh cho Google Ads Script (tab `lenh` trong Sheet báo cáo) + xem trạng thái.
// Script Ads (docs/marketing/google-ads-report-script.gs) chạy hằng giờ, thực hiện lệnh rồi ghi kết quả.
//
//   node --env-file=.env.local scripts/ads-command.mjs list [--all]
//   node --env-file=.env.local scripts/ads-command.mjs add ACTION "target" "keyword" [MATCH] [ad_group] [--note "..."]
//   node --env-file=.env.local scripts/ads-command.mjs batch file.json   # [{action,target,keyword,match_type,ad_group,note}]
//
// ACTION: ADD_NEGATIVE | REMOVE_NEGATIVE | ADD_KEYWORD | PAUSE_KEYWORD | ENABLE_KEYWORD
// target: tên chiến dịch, hoặc tên danh sách phủ định (với *_NEGATIVE). MATCH: BROAD | PHRASE | EXACT.
// Giới hạn an toàn nằm ở script Ads (lệnh khác → REJECTED). Đổi ngân sách/giá thầu/chiến dịch: KHÔNG có ở đây.
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { getToken, call } from "./lib/google-sa.mjs";

const SHEET = process.env.ADS_REPORT_SHEET_ID;
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const ACTIONS = ["ADD_NEGATIVE", "REMOVE_NEGATIVE", "ADD_KEYWORD", "PAUSE_KEYWORD", "ENABLE_KEYWORD"];
const MATCHES = ["BROAD", "PHRASE", "EXACT"];
const HEADER = ["id", "created_at", "action", "target", "ad_group", "keyword", "match_type", "note", "status", "result", "done_at"];
const base = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET}`;

function validate(c) {
  const action = String(c.action || "").toUpperCase();
  const match = String(c.match_type || "BROAD").toUpperCase();
  const keyword = String(c.keyword || "").trim();
  if (!ACTIONS.includes(action)) throw new Error(`action không hợp lệ: ${c.action}`);
  if (!MATCHES.includes(match)) throw new Error(`match_type không hợp lệ: ${c.match_type}`);
  if (!keyword || /["[\]]/.test(keyword)) throw new Error(`keyword trống hoặc có " [ ]: ${c.keyword}`);
  if (!String(c.target || "").trim()) throw new Error("thiếu target");
  return [randomUUID().slice(0, 8), new Date().toISOString(), action, String(c.target).trim(),
    String(c.ad_group || "").trim(), keyword, match, String(c.note || ""), "PENDING", "", ""];
}

async function ensureHeader(token) {
  const r = await call(`${base}/values/lenh!A1:K1`, token).catch(() => null);
  if (!r) throw new Error("Chưa có tab `lenh` — chạy script Ads v2 ít nhất 1 lần để nó tự tạo");
  if (!r.values?.[0]?.length) {
    await call(`${base}/values/lenh!A1:K1?valueInputOption=RAW`, token, { values: [HEADER] }, {}, "PUT");
  }
}

async function append(rows) {
  const token = await getToken(SCOPE);
  await ensureHeader(token);
  await call(`${base}/values/lenh!A:K:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, token, { values: rows });
  console.log(`Đã ghi ${rows.length} lệnh (PENDING). Script Ads sẽ thực hiện ở lần chạy hằng giờ tiếp theo.`);
  for (const r of rows) console.log(`  ${r[0]} ${r[2]} ${r[5]} [${r[6]}] → ${r[3]}`);
}

async function list(all) {
  const token = await getToken(SCOPE);
  const r = await call(`${base}/values/lenh!A:K`, token).catch((e) => {
    if (/Unable to parse range/.test(e.message)) {
      console.log("Chưa có tab `lenh` — script Ads v2 chưa chạy lần nào.");
      process.exit(1);
    }
    throw e;
  });
  const [, ...rows] = r.values || [];
  const shown = all ? rows : rows.slice(-40);
  for (const x of shown) console.log(`${x[0]} | ${x[8] || ""} | ${x[2]} ${x[5]} [${x[6]}] → ${x[3]} | ${x[9] || ""} | ${x[10] || ""}`);
  const pending = rows.filter((x) => !x[8] || x[8] === "PENDING").length;
  console.log(`Tổng ${rows.length} lệnh, còn ${pending} chờ chạy.`);
}

const [cmd, ...rest] = process.argv.slice(2);
if (!SHEET) throw new Error("Thiếu ADS_REPORT_SHEET_ID trong .env.local");
if (cmd === "list") await list(rest.includes("--all"));
else if (cmd === "add") {
  const noteIdx = rest.indexOf("--note");
  const note = noteIdx >= 0 ? rest.splice(noteIdx, 2)[1] : "";
  const [action, target, keyword, match_type, ad_group] = rest;
  await append([validate({ action, target, keyword, match_type, ad_group, note })]);
} else if (cmd === "batch") {
  const items = JSON.parse(readFileSync(rest[0], "utf8"));
  await append(items.map(validate));
} else {
  console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 11).join("\n"));
}
