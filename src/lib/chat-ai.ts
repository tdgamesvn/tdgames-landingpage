import "server-only";

// AI trả lời chat — Phase A: soạn NHÁP cho staff duyệt (khách không thấy). Luật thuần ở chat-ai-core.ts.
// Spec: docs/superpowers/specs/2026-11-05-chat-ai-design.md
import { getSupabaseAdmin } from "./supabase-admin";
import {
  buildPrompt,
  callChatModel,
  estimateCostUsd,
  FALLBACK_MODEL,
  guardDraft,
  parseAiReply,
  PRIMARY_MODEL,
  worthDrafting,
  type AiDraft,
  type JobCard,
  type KbCard,
} from "./chat-ai-core";
import { listMessages, pushRecipientsWith, threadById } from "./chat-server";
import { discordNotify } from "./discord-notify";
import { sendHrPush } from "./hr-push";

export type ChatAiMode = "off" | "draft";

/** Chờ khách gõ xong (gửi 2–3 tin liền) rồi mới soạn 1 nháp cho tin cuối. */
const DEBOUNCE_MS = 6_000;
const THREAD_DAILY_CAP = 15;
const GLOBAL_DAILY_CAP = 300;
const ALERT_GAP_MS = 30 * 60_000;
/** Chi phí dự kiến 1 nháp (~$0.009 thực tế) — giữ chỗ trong ngân sách khi đang gọi model. */
const RESERVE_USD = 0.02;

const db = () => getSupabaseAdmin();

async function setting(key: string): Promise<string | null> {
  const { data } = await db().from("app_settings").select("value").eq("key", key).maybeSingle();
  return data?.value == null ? null : String(data.value);
}

export async function chatAiSettings(): Promise<{ mode: ChatAiMode; budgetUsd: number }> {
  const [mode, budget] = await Promise.all([setting("chat_ai_mode"), setting("chat_ai_budget_usd")]);
  const b = Number(budget);
  return { mode: mode === "draft" ? "draft" : "off", budgetUsd: Number.isFinite(b) && b >= 0 ? b : 100 };
}

/** Đầu tháng theo giờ VN (UTC+7, không đổi giờ mùa hè). */
export function monthStartVN(now = new Date()): Date {
  const vn = new Date(now.getTime() + 7 * 3_600_000);
  return new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), 1) - 7 * 3_600_000);
}

export async function monthSpendUsd(now = new Date()): Promise<number> {
  const { data } = await db().from("chat_ai_drafts").select("cost_usd").gte("created_at", monthStartVN(now).toISOString()).limit(100_000);
  return (data ?? []).reduce((s, r) => s + Number(r.cost_usd || 0), 0);
}

async function countSince(since: Date, threadId?: string): Promise<number> {
  let q = db().from("chat_ai_drafts").select("id", { count: "exact", head: true }).gte("created_at", since.toISOString());
  if (threadId) q = q.eq("thread_id", threadId);
  const { count } = await q;
  return count ?? 0;
}

/**
 * Báo admin (người có chat.manage: chuông + Discord), gộp: tối đa 1 lần / 30 phút / loại lỗi.
 * Giành suất bằng update có điều kiện trên app_settings để 2 request cùng lúc chỉ báo 1 lần.
 */
export async function alertAdmin(kind: string, text: string): Promise<void> {
  const key = `chat_ai_alert_${kind}`;
  const now = Date.now();
  try {
    const last = Number(await setting(key));
    if (last && now - last < ALERT_GAP_MS) return;
    if (last) {
      const { data: won } = await db().from("app_settings").update({ value: String(now), updated_at: new Date().toISOString() }).eq("key", key).eq("value", String(last)).select("key");
      if (!won?.length) return;
    } else {
      const { error } = await db().from("app_settings").insert({ key, value: String(now), updated_at: new Date().toISOString() });
      if (error) return; // request khác vừa chèn
    }
    console.error(`[chat-ai] ${kind}: ${text}`);
    const ids = await pushRecipientsWith("chat.manage");
    await Promise.allSettled([
      ids.length ? sendHrPush({ title: "⚠️ AI chat lỗi", body: text.slice(0, 160), url: "/hr?view=chat", tag: `chat-ai-${kind}` }, { userIds: ids }) : null,
      discordNotify("sales", { content: `⚠️ **AI chat (website)** — ${text.slice(0, 1500)}` }),
    ]);
  } catch (e) {
    console.error("[chat-ai] alertAdmin lỗi:", e);
  }
}

async function loadKnowledge(audience: "client" | "candidate"): Promise<{ kb: KbCard[]; jobs: JobCard[] }> {
  const [kb, jobs] = await Promise.all([
    db().from("chat_kb").select("id, title, content").eq("active", true).in("audience", [audience, "any"]).order("sort_order"),
    db().from("jobs").select("title, slug, type, location, level, summary").eq("is_active", true).order("created_at", { ascending: false }).limit(30),
  ]);
  return {
    kb: (kb.data ?? []) as KbCard[],
    // Khách hỏi tuyển dụng cũng có — job list nhỏ, đưa cho cả 2 loại luồng.
    jobs: ((jobs.data ?? []) as JobCard[]).map((j) => ({ ...j, summary: j.summary ? String(j.summary).slice(0, 300) : null })),
  };
}

type ModelResult = { draft: AiDraft; model: string; inputTokens: number; outputTokens: number };

async function runModel(model: string, system: string, user: string): Promise<ModelResult> {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("AI_BASE_URL / AI_API_KEY chưa cấu hình");
  const r = await callChatModel({ baseUrl, apiKey }, model, system, user);
  const draft = parseAiReply(r.text);
  if (!draft) throw new Error(`${model}: trả về sai khuôn JSON`);
  return { draft, model: r.model, inputTokens: r.inputTokens, outputTokens: r.outputTokens };
}

/**
 * Soạn nháp cho tin khách `triggerId` (gọi trong after() của /api/chat/message).
 * Mọi lỗi đều nuốt + log/báo admin — không bao giờ ảnh hưởng luồng chat của khách.
 */
export async function draftReplyFor(threadId: string, triggerId: string): Promise<void> {
  try {
    const { mode, budgetUsd } = await chatAiSettings();
    if (mode === "off") return;
    await new Promise((r) => setTimeout(r, DEBOUNCE_MS));

    const thread = await threadById(threadId);
    if (!thread || thread.status === "closed") return;
    const history = await listMessages(threadId);
    const lastVisitor = [...history].reverse().find((m) => m.sender === "visitor" && m.kind === "text");
    if (!lastVisitor || lastVisitor.id !== triggerId) return; // có tin mới hơn → lần gọi sau lo
    const lastIdx = history.findIndex((m) => m.id === triggerId);
    if (history.slice(lastIdx + 1).some((m) => m.sender === "staff")) return; // staff đã trả lời
    // Gộp các tin khách liền nhau cuối cùng để xét "rác".
    const tail: string[] = [];
    for (let i = history.length - 1; i >= 0 && history[i].sender === "visitor"; i--) tail.unshift(history[i].body);
    if (!worthDrafting(tail.join(" "))) return;

    // Giữ chỗ TRƯỚC rồi mới đếm (dòng giữ chỗ tính luôn chi phí dự kiến) → nhiều request cùng lúc không vượt trần
    // / ngân sách quá vài nháp. Vượt → dòng giữ chỗ thành "skipped" (cost 0).
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86_400_000);
    const { data: slot, error: slotErr } = await db()
      .from("chat_ai_drafts")
      .insert({ thread_id: threadId, trigger_message_id: triggerId, status: "skipped", cost_usd: RESERVE_USD })
      .select("id")
      .single();
    if (slotErr || !slot) throw new Error(`giữ chỗ nháp lỗi: ${slotErr?.message}`);
    const release = () => db().from("chat_ai_drafts").update({ cost_usd: 0 }).eq("id", slot.id);
    if ((await countSince(dayAgo, threadId)) > THREAD_DAILY_CAP) return void (await release());
    if ((await countSince(dayAgo)) > GLOBAL_DAILY_CAP) {
      await release();
      await alertAdmin("daily_cap", `Đã chạm trần ${GLOBAL_DAILY_CAP} nháp AI / 24h — tạm dừng soạn nháp (nghi spam).`);
      return;
    }
    const spent = await monthSpendUsd(now);
    if (spent > budgetUsd) {
      await release();
      await alertAdmin("budget", `Hết ngân sách AI chat tháng này ($${(spent - RESERVE_USD).toFixed(2)} / $${budgetUsd}). Tạm dừng soạn nháp.`);
      return;
    }

    const { kb, jobs } = await loadKnowledge(thread.audience);
    const { system, user, refs } = buildPrompt({ audience: thread.audience, kb, jobs, history });

    let result: ModelResult | null = null;
    const errors: string[] = [];
    for (const model of [process.env.CHAT_AI_MODEL || PRIMARY_MODEL, process.env.CHAT_AI_FALLBACK_MODEL || FALLBACK_MODEL]) {
      try {
        result = await runModel(model, system, user);
        break;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
    if (errors.length) {
      await alertAdmin(
        result ? "primary_failed" : "all_failed",
        result ? `Model chính lỗi, đã dùng dự phòng ${result.model}. ${errors[0]}` : `Cả 2 model đều lỗi, không soạn được nháp. ${errors.join(" | ")}`,
      );
    }

    // Nháp cũ đang chờ của luồng → hết hiệu lực (chỉ giữ nháp cho tin mới nhất).
    await db().from("chat_ai_drafts").update({ status: "superseded" }).eq("thread_id", threadId).in("status", ["pending", "failed"]);
    if (!result) {
      await db().from("chat_ai_drafts").update({ status: "failed", cost_usd: 0, error: errors.join(" | ").slice(0, 1000) }).eq("id", slot.id);
      return;
    }
    const { draft } = result;
    const warnings = guardDraft(draft, refs, tail.join("\n"));
    const sources = draft.sources.filter((s) => refs.has(s)).map((ref) => ({ ref, title: refs.get(ref)!.split("\n")[0].slice(0, 80) }));
    await db().from("chat_ai_drafts").update({
      status: "pending",
      answer: draft.answer,
      needs_human: draft.needsHuman || warnings.length > 0,
      confidence: draft.confidence,
      sources,
      warnings,
      model: result.model,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      cost_usd: estimateCostUsd(result.inputTokens, result.outputTokens),
    }).eq("id", slot.id);
  } catch (e) {
    console.error("[chat-ai] draftReplyFor lỗi:", e);
    await alertAdmin("internal", `Lỗi nội bộ khi soạn nháp: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export type DraftRow = {
  id: string;
  status: string;
  answer: string | null;
  needs_human: boolean;
  confidence: string | null;
  sources: { ref: string; title: string }[];
  warnings: string[];
  model: string | null;
  error: string | null;
  rating: number | null;
  created_at: string;
};

/** Nháp mới nhất còn hiệu lực của luồng (đang chờ / lỗi) cho màn /hr. */
export async function latestDraft(threadId: string): Promise<DraftRow | null> {
  const { data } = await db()
    .from("chat_ai_drafts")
    .select("id, status, answer, needs_human, confidence, sources, warnings, model, error, rating, created_at")
    .eq("thread_id", threadId)
    .in("status", ["pending", "failed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as DraftRow | null) ?? null;
}
