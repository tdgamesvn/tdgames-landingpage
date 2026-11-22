/**
 * TD Games — Google Ads Script v2: báo cáo + thực hiện lệnh (có giới hạn) + báo cáo hằng ngày.
 *
 * Dán vào Google Ads → Công cụ → Hành động hàng loạt → Tập lệnh. Đặt tần suất: HẰNG GIỜ.
 *
 * 1) Báo cáo: đọc số liệu 30 ngày (AdsApp.search) → ghi đè các tab trong Sheet
 *    "TD Games – Ads report (auto)" (tự tạo nếu chưa có, tự cấp quyền SỬA cho service account của Claude).
 * 2) Lệnh: đọc tab `lenh` (Claude ghi vào), chỉ thực hiện các hành động trong ALLOWED_ACTIONS:
 *    thêm/xoá từ khoá phủ định, thêm từ khoá, tạm dừng/bật từ khoá. KHÔNG BAO GIỜ đổi ngân sách,
 *    giá thầu, chiến dịch, quảng cáo hay thanh toán — lệnh khác bị ghi REJECTED.
 * 3) Báo cáo hằng ngày: lần chạy đầu tiên từ DAILY_HOUR giờ (múi giờ tài khoản) mỗi ngày → gửi tóm tắt
 *    hôm qua + cảnh báo qua Telegram (nếu điền TELEGRAM_BOT_TOKEN) và/hoặc Discord (nếu điền webhook).
 *
 * Nguồn: docs/marketing/google-ads-report-script.gs (repo tdgames-landingpage)
 */

var SHEET_NAME = 'TD Games – Ads report (auto)';
var CLAUDE_SA = 'tdgames-reporting@gen-lang-client-0156221369.iam.gserviceaccount.com';
var RANGE = 'LAST_30_DAYS';

// ----- Cấu hình thông báo hằng ngày (để trống = không gửi kênh đó) -----
var TELEGRAM_BOT_TOKEN = '';
var TELEGRAM_CHAT_ID = '1131287322';
var DISCORD_WEBHOOK_URL = '';
var DAILY_HOUR = 8;

// ----- Giới hạn an toàn cho lệnh -----
var ALLOWED_ACTIONS = ['ADD_NEGATIVE', 'REMOVE_NEGATIVE', 'ADD_KEYWORD', 'PAUSE_KEYWORD', 'ENABLE_KEYWORD'];
var MAX_COMMANDS_PER_RUN = 80;
var CMD_HEADER = ['id', 'created_at', 'action', 'target', 'ad_group', 'keyword', 'match_type', 'note',
  'status', 'result', 'done_at'];

function main() {
  var ss = getOrCreateSpreadsheet();
  var cmdLog = [];
  try { cmdLog = processCommands(ss); } catch (e) { Logger.log('LỖI xử lý lệnh: ' + e); }

  writeTab(ss, 'campaign_status', [
    'campaign', 'status', 'primary_status', 'primary_status_reasons', 'serving_status',
    'bidding', 'cpc_ceiling', 'budget_per_day', 'geo_target_type', 'search', 'search_partners', 'display'
  ], q(
    'SELECT campaign.name, campaign.status, campaign.primary_status, campaign.primary_status_reasons, ' +
    'campaign.serving_status, campaign.bidding_strategy_type, campaign.target_spend.cpc_bid_ceiling_micros, ' +
    'campaign_budget.amount_micros, campaign.geo_target_type_setting.positive_geo_target_type, ' +
    'campaign.network_settings.target_google_search, campaign.network_settings.target_search_network, ' +
    'campaign.network_settings.target_content_network ' +
    'FROM campaign WHERE campaign.status != "REMOVED"'
  ), function (r) {
    var c = r.campaign;
    return [c.name, c.status, c.primaryStatus, join(c.primaryStatusReasons), c.servingStatus,
      c.biddingStrategyType, money(c.targetSpend && c.targetSpend.cpcBidCeilingMicros),
      money(r.campaignBudget && r.campaignBudget.amountMicros),
      c.geoTargetTypeSetting && c.geoTargetTypeSetting.positiveGeoTargetType,
      c.networkSettings && c.networkSettings.targetGoogleSearch,
      c.networkSettings && c.networkSettings.targetSearchNetwork,
      c.networkSettings && c.networkSettings.targetContentNetwork];
  });

  writeTab(ss, 'campaign_daily', [
    'date', 'campaign', 'impressions', 'clicks', 'cost', 'avg_cpc', 'conversions',
    'search_impr_share', 'lost_is_budget', 'lost_is_rank'
  ], q(
    'SELECT segments.date, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, ' +
    'metrics.average_cpc, metrics.conversions, metrics.search_impression_share, ' +
    'metrics.search_budget_lost_impression_share, metrics.search_rank_lost_impression_share ' +
    'FROM campaign WHERE segments.date DURING ' + RANGE + ' AND campaign.status != "REMOVED" ' +
    'ORDER BY segments.date'
  ), function (r) {
    var m = r.metrics;
    return [r.segments.date, r.campaign.name, m.impressions, m.clicks, money(m.costMicros), money(m.averageCpc),
      m.conversions, m.searchImpressionShare, m.searchBudgetLostImpressionShare, m.searchRankLostImpressionShare];
  });

  writeTab(ss, 'targeting', [
    'campaign', 'type', 'negative', 'location', 'language', 'keyword', 'match_type'
  ], q(
    'SELECT campaign.name, campaign_criterion.type, campaign_criterion.negative, ' +
    'campaign_criterion.location.geo_target_constant, campaign_criterion.language.language_constant, ' +
    'campaign_criterion.keyword.text, campaign_criterion.keyword.match_type ' +
    'FROM campaign_criterion WHERE campaign.status != "REMOVED" ' +
    'AND campaign_criterion.type IN ("LOCATION", "LANGUAGE", "KEYWORD")'
  ), function (r) {
    var cc = r.campaignCriterion;
    return [r.campaign.name, cc.type, cc.negative,
      cc.location && cc.location.geoTargetConstant, cc.language && cc.language.languageConstant,
      cc.keyword && cc.keyword.text, cc.keyword && cc.keyword.matchType];
  });

  writeTab(ss, 'keywords', [
    'campaign', 'ad_group', 'keyword', 'match_type', 'status', 'primary_status', 'primary_status_reasons',
    'system_serving_status', 'approval_status', 'quality_score', 'first_page_cpc', 'top_of_page_cpc',
    'impressions', 'clicks', 'cost', 'conversions'
  ], q(
    'SELECT campaign.name, ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ' +
    'ad_group_criterion.status, ad_group_criterion.primary_status, ad_group_criterion.primary_status_reasons, ' +
    'ad_group_criterion.system_serving_status, ad_group_criterion.approval_status, ' +
    'ad_group_criterion.quality_info.quality_score, ad_group_criterion.position_estimates.first_page_cpc_micros, ' +
    'ad_group_criterion.position_estimates.top_of_page_cpc_micros, ' +
    'metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions ' +
    'FROM keyword_view WHERE segments.date DURING ' + RANGE + ' AND campaign.status != "REMOVED"'
  ), function (r) {
    var k = r.adGroupCriterion, m = r.metrics;
    return [r.campaign.name, r.adGroup.name, k.keyword.text, k.keyword.matchType, k.status, k.primaryStatus,
      join(k.primaryStatusReasons), k.systemServingStatus, k.approvalStatus,
      k.qualityInfo && k.qualityInfo.qualityScore,
      money(k.positionEstimates && k.positionEstimates.firstPageCpcMicros),
      money(k.positionEstimates && k.positionEstimates.topOfPageCpcMicros),
      m.impressions, m.clicks, money(m.costMicros), m.conversions];
  });

  // keyword_view chỉ trả từ khoá CÓ số liệu trong khoảng ngày → lấy thêm danh sách đầy đủ (kể cả 0 hiển thị).
  writeTab(ss, 'keywords_all', [
    'campaign', 'ad_group', 'keyword', 'match_type', 'negative', 'status', 'primary_status',
    'primary_status_reasons', 'system_serving_status', 'approval_status', 'quality_score', 'first_page_cpc'
  ], q(
    'SELECT campaign.name, ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ' +
    'ad_group_criterion.negative, ad_group_criterion.status, ad_group_criterion.primary_status, ' +
    'ad_group_criterion.primary_status_reasons, ad_group_criterion.system_serving_status, ' +
    'ad_group_criterion.approval_status, ad_group_criterion.quality_info.quality_score, ' +
    'ad_group_criterion.position_estimates.first_page_cpc_micros ' +
    'FROM ad_group_criterion WHERE ad_group_criterion.type = "KEYWORD" AND campaign.status != "REMOVED" ' +
    'AND ad_group_criterion.status != "REMOVED"'
  ), function (r) {
    var k = r.adGroupCriterion;
    return [r.campaign.name, r.adGroup.name, k.keyword.text, k.keyword.matchType, k.negative, k.status,
      k.primaryStatus, join(k.primaryStatusReasons), k.systemServingStatus, k.approvalStatus,
      k.qualityInfo && k.qualityInfo.qualityScore,
      money(k.positionEstimates && k.positionEstimates.firstPageCpcMicros)];
  });

  writeTab(ss, 'search_terms', [
    'search_term', 'status', 'campaign', 'ad_group', 'impressions', 'clicks', 'cost', 'conversions'
  ], q(
    'SELECT search_term_view.search_term, search_term_view.status, campaign.name, ad_group.name, ' +
    'metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions ' +
    'FROM search_term_view WHERE segments.date DURING ' + RANGE + ' ORDER BY metrics.impressions DESC LIMIT 500'
  ), function (r) {
    var m = r.metrics;
    return [r.searchTermView.searchTerm, r.searchTermView.status, r.campaign.name, r.adGroup.name,
      m.impressions, m.clicks, money(m.costMicros), m.conversions];
  });

  writeTab(ss, 'ads', [
    'campaign', 'ad_group', 'ad_id', 'type', 'status', 'primary_status', 'primary_status_reasons',
    'approval_status', 'review_status', 'policy_topics', 'ad_strength', 'final_urls', 'path1', 'path2'
  ], q(
    'SELECT campaign.name, ad_group.name, ad_group_ad.ad.id, ad_group_ad.ad.type, ad_group_ad.status, ' +
    'ad_group_ad.primary_status, ad_group_ad.primary_status_reasons, ' +
    'ad_group_ad.policy_summary.approval_status, ad_group_ad.policy_summary.review_status, ' +
    'ad_group_ad.policy_summary.policy_topic_entries, ad_group_ad.ad_strength, ad_group_ad.ad.final_urls, ' +
    'ad_group_ad.ad.responsive_search_ad.path1, ad_group_ad.ad.responsive_search_ad.path2 ' +
    'FROM ad_group_ad WHERE campaign.status != "REMOVED" AND ad_group_ad.status != "REMOVED"'
  ), function (r) {
    var a = r.adGroupAd, p = a.policySummary || {}, rsa = a.ad.responsiveSearchAd || {};
    var topics = (p.policyTopicEntries || []).map(function (t) { return t.topic + ':' + t.type; });
    return [r.campaign.name, r.adGroup.name, a.ad.id, a.ad.type, a.status, a.primaryStatus,
      join(a.primaryStatusReasons), p.approvalStatus, p.reviewStatus, join(topics), a.adStrength,
      join(a.ad.finalUrls), rsa.path1, rsa.path2];
  });

  writeTab(ss, 'negatives_shared', ['list', 'keyword', 'match_type'], q(
    'SELECT shared_set.name, shared_criterion.keyword.text, shared_criterion.keyword.match_type ' +
    'FROM shared_criterion WHERE shared_set.type = "NEGATIVE_KEYWORDS" AND shared_set.status = "ENABLED"'
  ), function (r) {
    var k = r.sharedCriterion.keyword || {};
    return [r.sharedSet.name, k.text, k.matchType];
  });

  writeTab(ss, 'meta', ['key', 'value'], [
    ['updated_at', new Date().toISOString()],
    ['account', AdsApp.currentAccount().getCustomerId() + ' ' + AdsApp.currentAccount().getName()],
    ['currency', AdsApp.currentAccount().getCurrencyCode()],
    ['range', RANGE]
  ], function (row) { return row; });

  try { dailySummary(ss, cmdLog); } catch (e) { Logger.log('LỖI báo cáo hằng ngày: ' + e); }

  Logger.log('XONG. Link Sheet (gửi cho Claude): ' + ss.getUrl());
}

// ---------- lệnh từ tab `lenh` ----------

function processCommands(ss) {
  var sheet = ss.getSheetByName('lenh');
  if (!sheet) {
    sheet = ss.insertSheet('lenh');
    sheet.getRange(1, 1, 1, CMD_HEADER.length).setValues([CMD_HEADER]);
    return [];
  }
  var preview = AdsApp.getExecutionInfo().isPreview();
  var values = sheet.getDataRange().getValues();
  var col = {};
  CMD_HEADER.forEach(function (h) { col[h] = values[0].indexOf(h); });
  var done = [];
  var count = 0;
  for (var i = 1; i < values.length && count < MAX_COMMANDS_PER_RUN; i++) {
    var row = values[i];
    var status = String(row[col.status] || '').toUpperCase();
    if (status !== '' && status !== 'PENDING') continue;
    count++;
    var cmd = {
      action: String(row[col.action] || '').trim().toUpperCase(),
      target: String(row[col.target] || '').trim(),
      adGroup: String(row[col.ad_group] || '').trim(),
      keyword: String(row[col.keyword] || '').trim(),
      matchType: String(row[col.match_type] || 'BROAD').trim().toUpperCase()
    };
    var res;
    if (preview) {
      res = ['PENDING', 'PREVIEW: chưa thực hiện (đang chạy Xem trước)'];
    } else {
      try { res = runCommand(cmd); } catch (e) { res = ['ERROR', String(e)]; }
    }
    sheet.getRange(i + 1, col.status + 1).setValue(res[0]);
    sheet.getRange(i + 1, col.result + 1).setValue(res[1]);
    if (!preview) sheet.getRange(i + 1, col.done_at + 1).setValue(new Date().toISOString());
    done.push(res[0] + ' ' + cmd.action + ' ' + kwText(cmd.keyword, cmd.matchType) + ' → ' + cmd.target);
    Logger.log('Lệnh dòng ' + (i + 1) + ': ' + done[done.length - 1] + ' — ' + res[1]);
  }
  return done;
}

function runCommand(cmd) {
  if (ALLOWED_ACTIONS.indexOf(cmd.action) === -1) return ['REJECTED', 'Hành động không được phép: ' + cmd.action];
  if (['BROAD', 'PHRASE', 'EXACT'].indexOf(cmd.matchType) === -1) return ['ERROR', 'match_type sai: ' + cmd.matchType];
  if (!cmd.keyword || /["\[\]]/.test(cmd.keyword) || cmd.keyword.length > 80) {
    return ['ERROR', 'keyword trống/có ký tự " [ ] hoặc quá dài (ghi kiểu khớp ở cột match_type)'];
  }
  if (!cmd.target) return ['ERROR', 'Thiếu target (tên chiến dịch hoặc danh sách phủ định)'];
  var text = kwText(cmd.keyword, cmd.matchType);

  if (cmd.action === 'ADD_NEGATIVE' || cmd.action === 'REMOVE_NEGATIVE') {
    var list = findByName(AdsApp.negativeKeywordLists().get(), cmd.target);
    var owner = list || findByName(AdsApp.campaigns().get(), cmd.target);
    if (!owner) return ['ERROR', 'Không thấy chiến dịch / danh sách phủ định: ' + cmd.target];
    var existing = findKeyword(owner.negativeKeywords().get(), cmd.keyword, cmd.matchType);
    if (cmd.action === 'ADD_NEGATIVE') {
      if (existing) return ['SKIPPED', 'Đã có sẵn ' + text];
      if (list) list.addNegativeKeyword(text); else owner.createNegativeKeyword(text);
      return ['DONE', 'Đã thêm phủ định ' + text + ' vào ' + (list ? 'danh sách ' : 'chiến dịch ') + cmd.target];
    }
    if (!existing) return ['SKIPPED', 'Không có phủ định ' + text];
    existing.remove();
    return ['DONE', 'Đã xoá phủ định ' + text];
  }

  var campaign = findByName(AdsApp.campaigns().get(), cmd.target);
  if (!campaign) return ['ERROR', 'Không thấy chiến dịch: ' + cmd.target];
  var groups = [];
  var it = campaign.adGroups().get();
  while (it.hasNext()) {
    var g = it.next();
    if (!cmd.adGroup || g.getName() === cmd.adGroup) groups.push(g);
  }
  if (!groups.length) return ['ERROR', 'Không thấy nhóm quảng cáo: ' + (cmd.adGroup || '(trống)')];

  if (cmd.action === 'ADD_KEYWORD') {
    if (groups.length > 1) return ['ERROR', 'Chiến dịch có nhiều nhóm — ghi rõ ad_group'];
    if (findKeyword(groups[0].keywords().get(), cmd.keyword, cmd.matchType)) return ['SKIPPED', 'Đã có sẵn ' + text];
    var op = groups[0].newKeywordBuilder().withText(text).build();
    if (!op.isSuccessful()) return ['ERROR', 'Google từ chối: ' + op.getErrors().join('; ')];
    return ['DONE', 'Đã thêm từ khoá ' + text + ' vào ' + groups[0].getName()];
  }

  // PAUSE_KEYWORD / ENABLE_KEYWORD
  var changed = 0;
  for (var j = 0; j < groups.length; j++) {
    var kw = findKeyword(groups[j].keywords().get(), cmd.keyword, cmd.matchType);
    if (!kw) continue;
    if (cmd.action === 'PAUSE_KEYWORD') kw.pause(); else kw.enable();
    changed++;
  }
  if (!changed) return ['SKIPPED', 'Không thấy từ khoá ' + text];
  return ['DONE', (cmd.action === 'PAUSE_KEYWORD' ? 'Đã tạm dừng ' : 'Đã bật ') + text + ' (' + changed + ' nhóm)'];
}

function kwText(keyword, matchType) {
  if (matchType === 'PHRASE') return '"' + keyword + '"';
  if (matchType === 'EXACT') return '[' + keyword + ']';
  return keyword;
}

function normKw(s) {
  return String(s).replace(/^[\["+]+|[\]"]+$/g, '').trim().toLowerCase();
}

function findByName(iterator, name) {
  while (iterator.hasNext()) {
    var x = iterator.next();
    if (x.getName() === name) return x;
  }
  return null;
}

function findKeyword(iterator, keyword, matchType) {
  var want = normKw(keyword);
  while (iterator.hasNext()) {
    var k = iterator.next();
    if (normKw(k.getText()) === want && String(k.getMatchType()).toUpperCase() === matchType) return k;
  }
  return null;
}

// ---------- báo cáo hằng ngày ----------

function dailySummary(ss, cmdLog) {
  if (!TELEGRAM_BOT_TOKEN && !DISCORD_WEBHOOK_URL) return;
  if (AdsApp.getExecutionInfo().isPreview()) return;
  var tz = AdsApp.currentAccount().getTimeZone();
  var now = new Date();
  var today = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  if (Number(Utilities.formatDate(now, tz, 'H')) < DAILY_HOUR) return;
  var state = ss.getSheetByName('state') || ss.insertSheet('state');
  if (String(state.getRange('B1').getValue()) === today) return;

  var lines = ['📊 Google Ads — hôm qua'];
  var alerts = [];
  var camps = q('SELECT campaign.name, campaign.status, campaign.primary_status, campaign_budget.amount_micros, ' +
    'metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions ' +
    'FROM campaign WHERE segments.date DURING YESTERDAY AND campaign.status = "ENABLED"');
  var seen = {};
  camps.forEach(function (r) {
    var m = r.metrics, c = r.campaign;
    seen[c.name] = true;
    var cost = Number(m.costMicros || 0) / 1e6, budget = Number(r.campaignBudget.amountMicros || 0) / 1e6;
    lines.push('• ' + c.name + ': ' + m.impressions + ' hiển thị, ' + m.clicks + ' click, ' +
      vnd(cost) + ', ' + (m.conversions || 0) + ' chuyển đổi');
    if (Number(m.impressions) === 0) alerts.push('⚠️ ' + c.name + ' KHÔNG hiển thị hôm qua — kiểm số dư tài khoản / trạng thái');
    if (budget && cost > budget * 1.5) alerts.push('⚠️ ' + c.name + ' tiêu ' + vnd(cost) + ' > 1,5× ngân sách ngày');
    if (c.primaryStatus && ['ELIGIBLE', 'LIMITED'].indexOf(c.primaryStatus) === -1) {
      alerts.push('⚠️ ' + c.name + ' trạng thái ' + c.primaryStatus);
    }
  });
  var all = q('SELECT campaign.name FROM campaign WHERE campaign.status = "ENABLED"');
  all.forEach(function (r) {
    if (!seen[r.campaign.name]) {
      lines.push('• ' + r.campaign.name + ': 0 hiển thị');
      alerts.push('⚠️ ' + r.campaign.name + ' KHÔNG hiển thị hôm qua — kiểm số dư tài khoản / trạng thái');
    }
  });
  var mtd = q('SELECT metrics.cost_micros FROM customer WHERE segments.date DURING THIS_MONTH');
  if (mtd.length) lines.push('Tháng này đã tiêu: ' + vnd(Number(mtd[0].metrics.costMicros || 0) / 1e6) + ' (chưa VAT)');

  var terms = q('SELECT search_term_view.search_term, metrics.impressions, metrics.clicks, metrics.cost_micros ' +
    'FROM search_term_view WHERE segments.date DURING YESTERDAY ORDER BY metrics.impressions DESC LIMIT 10');
  if (terms.length) {
    lines.push('', '🔎 Cụm từ khách tìm:');
    terms.forEach(function (r) {
      lines.push('• ' + r.searchTermView.searchTerm + ' — ' + r.metrics.impressions + ' hiển thị, ' +
        r.metrics.clicks + ' click' + (Number(r.metrics.costMicros) ? ', ' + vnd(Number(r.metrics.costMicros) / 1e6) : ''));
    });
  }
  if (alerts.length) lines.push('', alerts.join('\n'));
  if (cmdLog.length) lines.push('', '🛠 Lệnh vừa chạy:', cmdLog.join('\n'));
  lines.push('', 'Sheet: ' + ss.getUrl());
  var text = lines.join('\n');

  if (TELEGRAM_BOT_TOKEN) {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text.slice(0, 4000), disable_web_page_preview: true })
    });
  }
  if (DISCORD_WEBHOOK_URL) {
    UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({ content: text.slice(0, 1900) })
    });
  }
  state.getRange('A1:B1').setValues([['daily_sent', today]]);
}

function vnd(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}

// ---------- helpers ----------

function getOrCreateSpreadsheet() {
  var files = DriveApp.getFilesByName(SHEET_NAME);
  var ss = files.hasNext() ? SpreadsheetApp.open(files.next()) : SpreadsheetApp.create(SHEET_NAME);
  var editors = ss.getEditors().map(function (u) { return u.getEmail(); });
  if (editors.indexOf(CLAUDE_SA) === -1) ss.addEditor(CLAUDE_SA);
  return ss;
}

function q(query) {
  var rows = [];
  try {
    var it = AdsApp.search(query);
    while (it.hasNext()) rows.push(it.next());
  } catch (e) {
    rows.error = String(e);
    Logger.log('LỖI truy vấn: ' + e + '\n' + query);
  }
  return rows;
}

function writeTab(ss, name, header, rows, mapRow) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  sheet.clearContents();
  var data = [header];
  if (rows.error) {
    data.push([('LỖI: ' + rows.error)].concat(blank(header.length - 1)));
  } else {
    for (var i = 0; i < rows.length; i++) {
      var out = mapRow(rows[i]).map(function (v) { return v === undefined || v === null ? '' : v; });
      data.push(out);
    }
  }
  sheet.getRange(1, 1, data.length, header.length).setValues(data);
  var sheet1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('Trang tính1');
  if (sheet1 && ss.getSheets().length > 1) ss.deleteSheet(sheet1);
}

function money(micros) {
  if (micros === undefined || micros === null || micros === '') return '';
  return Math.round(Number(micros) / 1e6);
}

function join(arr) {
  return arr && arr.length ? arr.join(', ') : '';
}

function blank(n) {
  var a = [];
  for (var i = 0; i < n; i++) a.push('');
  return a;
}
