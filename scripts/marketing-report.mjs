#!/usr/bin/env node
// Báo cáo marketing chỉ-đọc: Google Ads + GA4 + Search Console qua 1 service account.
// Không cần thư viện ngoài (ký JWT bằng node:crypto).
//
//   node --env-file=.env.local scripts/marketing-report.mjs [--days 28] [--json]
//
// Env (.env.local): GOOGLE_REPORTING_SA_FILE, GA4_PROPERTY_ID, GOOGLE_ADS_CUSTOMER_ID, GSC_SITE
import { getToken, call } from "./lib/google-sa.mjs";

const args = process.argv.slice(2);
const DAYS = Number(args[args.indexOf("--days") + 1]) || 28;
const AS_JSON = args.includes("--json");
const ADS_API_VERSION = process.env.GOOGLE_ADS_API_VERSION || "v26";

const ymd = (d) => d.toISOString().slice(0, 10);
const end = new Date(Date.now() - 86400000); // hôm qua (dữ liệu hôm nay chưa đủ)
const start = new Date(end.getTime() - (DAYS - 1) * 86400000);
const range = { startDate: ymd(start), endDate: ymd(end) };

// ---------- GA4 ----------
async function ga4() {
  const token = await getToken("https://www.googleapis.com/auth/analytics.readonly");
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`;
  const rows = (r) => (r.rows || []).map((x) => [...x.dimensionValues.map((v) => v.value), ...x.metricValues.map((v) => v.value)]);
  const channels = await call(url, token, {
    dateRanges: [range],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }, { name: "engagedSessions" }, { name: "keyEvents" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
  });
  const ads = await call(url, token, {
    dateRanges: [range],
    dimensions: [{ name: "sessionGoogleAdsCampaignName" }],
    metrics: [{ name: "sessions" }, { name: "engagedSessions" }, { name: "keyEvents" }, { name: "advertiserAdClicks" }, { name: "advertiserAdCost" }],
  }).catch((e) => ({ error: e.message }));
  const leads = await call(url, token, {
    dateRanges: [range],
    dimensions: [{ name: "date" }, { name: "sessionSourceMedium" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { value: "generate_lead" } } },
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });
  return {
    channels: { cols: ["kênh", "phiên", "phiên tương tác", "key events"], rows: rows(channels) },
    adsCampaigns: ads.error ? ads : { cols: ["chiến dịch Ads", "phiên", "tương tác", "key events", "click Ads", "chi phí"], rows: rows(ads) },
    leads: { cols: ["ngày", "nguồn / phương tiện", "generate_lead"], rows: rows(leads) },
  };
}

// ---------- Search Console ----------
async function gsc() {
  const token = await getToken("https://www.googleapis.com/auth/webmasters.readonly");
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GSC_SITE)}/searchAnalytics/query`;
  const fmt = (r) => (r.rows || []).map((x) => [...(x.keys || []), x.clicks, x.impressions, (x.ctr * 100).toFixed(1) + "%", x.position.toFixed(1)]);
  const totals = await call(url, token, { ...range, dataState: "all" });
  const queries = await call(url, token, { ...range, dimensions: ["query"], rowLimit: 25, dataState: "all" });
  const pages = await call(url, token, { ...range, dimensions: ["page"], rowLimit: 15, dataState: "all" });
  const countries = await call(url, token, { ...range, dimensions: ["country"], rowLimit: 10, dataState: "all" });
  return {
    totals: { cols: ["click", "hiển thị", "CTR", "vị trí TB"], rows: fmt(totals) },
    queries: { cols: ["từ khoá", "click", "hiển thị", "CTR", "vị trí"], rows: fmt(queries) },
    pages: { cols: ["trang", "click", "hiển thị", "CTR", "vị trí"], rows: fmt(pages) },
    countries: { cols: ["nước", "click", "hiển thị", "CTR", "vị trí"], rows: fmt(countries) },
  };
}

// ---------- Google Ads ----------
async function ads() {
  const token = await getToken("https://www.googleapis.com/auth/adwords");
  const cid = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const url = `https://googleads.googleapis.com/${ADS_API_VERSION}/customers/${cid}/googleAds:search`;
  const q = (query) => call(url, token, { query });
  const during = `segments.date BETWEEN '${range.startDate}' AND '${range.endDate}'`;
  const money = (micros) => Math.round(Number(micros || 0) / 1e6).toLocaleString("vi-VN");
  const camp = await q(`SELECT campaign.name, campaign.status, campaign_budget.amount_micros,
      metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.average_cpc, metrics.conversions,
      metrics.search_impression_share
    FROM campaign WHERE ${during} AND campaign.status != 'REMOVED'`);
  const terms = await q(`SELECT search_term_view.search_term, campaign.name, metrics.impressions, metrics.clicks,
      metrics.cost_micros, metrics.conversions
    FROM search_term_view WHERE ${during} ORDER BY metrics.impressions DESC LIMIT 60`);
  const kws = await q(`SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, campaign.name,
      metrics.impressions, metrics.clicks, metrics.cost_micros
    FROM keyword_view WHERE ${during} ORDER BY metrics.impressions DESC LIMIT 40`);
  const r = (x) => x.results || [];
  return {
    campaigns: {
      cols: ["chiến dịch", "trạng thái", "ngân sách/ngày", "hiển thị", "click", "chi phí ₫", "CPC TB ₫", "chuyển đổi", "IS"],
      rows: r(camp).map((x) => [x.campaign.name, x.campaign.status, money(x.campaignBudget?.amountMicros), x.metrics.impressions, x.metrics.clicks, money(x.metrics.costMicros), money(x.metrics.averageCpc), x.metrics.conversions ?? 0, x.metrics.searchImpressionShare ?? "-"]),
    },
    searchTerms: {
      cols: ["cụm từ khách tìm", "chiến dịch", "hiển thị", "click", "chi phí ₫", "chuyển đổi"],
      rows: r(terms).map((x) => [x.searchTermView.searchTerm, x.campaign.name, x.metrics.impressions, x.metrics.clicks, money(x.metrics.costMicros), x.metrics.conversions ?? 0]),
    },
    keywords: {
      cols: ["từ khoá", "kiểu", "chiến dịch", "hiển thị", "click", "chi phí ₫"],
      rows: r(kws).map((x) => [x.adGroupCriterion.keyword.text, x.adGroupCriterion.keyword.matchType, x.campaign.name, x.metrics.impressions, x.metrics.clicks, money(x.metrics.costMicros)]),
    },
  };
}

// ---------- Google Ads qua Sheet (Ads Script docs/marketing/google-ads-report-script.gs ghi mỗi ngày) ----------
// Dùng khi Ads API chưa có quyền Explorer. Env ADS_REPORT_SHEET_ID = ID trong link Sheet.
const ADS_TABS = ["meta", "campaign_status", "campaign_daily", "targeting", "keywords_all", "keywords", "search_terms", "ads", "negatives_shared"];
async function adsSheet() {
  const token = await getToken("https://www.googleapis.com/auth/spreadsheets.readonly");
  const id = process.env.ADS_REPORT_SHEET_ID;
  const qs = ADS_TABS.map((t) => `ranges=${encodeURIComponent(t)}`).join("&");
  const data = await call(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values:batchGet?${qs}`, token);
  const out = {};
  for (const vr of data.valueRanges || []) {
    const tab = vr.range.split("!")[0].replace(/'/g, "");
    const [cols = [], ...rows] = vr.values || [];
    out[tab] = { cols, rows };
  }
  return out;
}

const out = { range };
const adsSource = process.env.ADS_REPORT_SHEET_ID ? adsSheet : ads;
for (const [name, fn] of [["ga4", ga4], ["gsc", gsc], ["ads", adsSource]]) {
  try { out[name] = await fn(); } catch (e) { out[name] = { error: e.message }; }
}

if (AS_JSON) {
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log(`Khoảng: ${range.startDate} → ${range.endDate} (${DAYS} ngày)`);
  for (const [src, sections] of Object.entries(out)) {
    if (src === "range") continue;
    console.log(`\n===== ${src.toUpperCase()} =====`);
    if (sections.error) { console.log("LỖI:", sections.error); continue; }
    for (const [name, t] of Object.entries(sections)) {
      console.log(`\n-- ${name}`);
      if (t.error) { console.log("LỖI:", t.error); continue; }
      console.log(t.cols.join(" | "));
      for (const row of t.rows) console.log(row.join(" | "));
      if (!t.rows.length) console.log("(không có dữ liệu)");
    }
  }
}
