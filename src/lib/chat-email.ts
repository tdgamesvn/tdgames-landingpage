// Mail gửi câu trả lời chat cho khách đã rời trang — thuần (test được).
import type { ChatAudience } from "./chat.ts";
import { fromFor, type HrEmailConfig } from "./hr-email.ts";

export const CHAT_EMAIL_FOOTER =
  "You received this because this address was entered in the chat on tdgamestudio.com";
export const CHAT_CLIENT_FROM_ADDRESS = "info@tdgamestudio.com";

export function buildChatReplyEmail(args: {
  visitorName: string | null;
  staffName: string;
  replies: string[];
  resumeUrl: string;
}): { subject: string; text: string } {
  const hi = args.visitorName?.trim() ? `Hi ${args.visitorName.trim()},` : "Hi there,";
  const sign = `${args.staffName.trim() || "TD Games"} · TD Games`;
  const text = [
    hi,
    "We replied to your message on tdgamestudio.com:",
    ...args.replies.map((r) => r.trim()),
    `Continue the conversation: ${args.resumeUrl}`,
    `Best regards,\n${sign}`,
  ].join("\n\n");
  return { subject: "Re: your message to TD Games", text };
}

/** Khách → info@ tên người trả lời; ứng viên → như mail tuyển dụng (hiring@, sếp chốt 2026-10-28). */
export function chatFrom(cfg: HrEmailConfig, audience: ChatAudience, staffName: string): string {
  if (audience === "candidate") return fromFor(cfg, staffName);
  const name = staffName
    .replace(/[\u0000-\u001f\u007f"<>\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return `"${name ? `${name} · TD Games` : "TD Games"}" <${CHAT_CLIENT_FROM_ADDRESS}>`;
}
