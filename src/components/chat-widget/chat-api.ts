// Client cho API /api/chat/* — mã khách lưu localStorage (+ cookie dự phòng), gửi qua header x-chat-token.

export type ChatQuickReply = {
  id: string;
  label: string;
  audience: "client" | "candidate" | "any";
  answer: string;
  linkLabel: string | null;
  linkUrl: string | null;
};
export type ChatConfig = { enabled: boolean; online: boolean; quickReplies: ChatQuickReply[] };
export type ChatThread = {
  status: "open" | "answered" | "closed";
  audience: "client" | "candidate";
  hasEmail: boolean;
  name: string | null;
  needsHuman: boolean;
};
export type ChatMessage = {
  id: string;
  sender: "visitor" | "staff" | "system" | "ai";
  kind: "text" | "quick_reply" | "canned_answer" | "contact_form";
  body: string;
  staffName: string | null;
  linkLabel: string | null;
  linkUrl: string | null;
  createdAt: string;
};
type ThreadResponse = { token?: string; thread: ChatThread; messages: ChatMessage[]; online: boolean };

const KEY = "tdg_chat_token";
const COOKIE_DAYS = 365;

export function getToken(): string | null {
  try {
    const v = localStorage.getItem(KEY);
    if (v) return v;
  } catch {
    /* localStorage bị chặn */
  }
  const m = document.cookie.match(/(?:^|;\s*)tdg_chat_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function setToken(t: string) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* bỏ qua */
  }
  document.cookie = `${KEY}=${encodeURIComponent(t)}; Max-Age=${COOKIE_DAYS * 86400}; Path=/; SameSite=Lax; Secure`;
}

export class ChatError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api/chat${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(token ? { "x-chat-token": token } : {}), ...init?.headers },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ChatError(data.error ?? "error", res.status);
  return data as T;
}

const page = () => window.location.pathname;

export const getConfig = () => call<ChatConfig>("");

export async function openThread(): Promise<ThreadResponse> {
  const r = await call<ThreadResponse>("/thread", { method: "POST", body: JSON.stringify({ page: page() }) });
  if (r.token) setToken(r.token);
  return r;
}

// Link email chỉ dùng 1 lần → mỗi mã chỉ gọi /resume 1 lần dù effect chạy lại (React dev StrictMode).
const resumed = new Map<string, Promise<ThreadResponse>>();
export function resumeThread(t: string): Promise<ThreadResponse> {
  let p = resumed.get(t);
  if (!p) {
    p = call<ThreadResponse>("/resume", { method: "POST", body: JSON.stringify({ t }) }).then((r) => {
      if (r.token) setToken(r.token);
      return r;
    });
    resumed.set(t, p);
  }
  return p;
}

/** `seen` = khung chat đang mở và tab đang xem (server mới tính khách đã thấy tin). */
export const pollThread = (after: string | null, seen = false) => {
  const q = new URLSearchParams();
  if (after) q.set("after", after);
  if (seen) q.set("seen", "1");
  const qs = q.toString();
  return call<ThreadResponse>(`/thread${qs ? `?${qs}` : ""}`);
};

export const sendMessage = (kind: "text" | "talk_to_person", body: string) =>
  call<{ messages: ChatMessage[]; thread: ChatThread }>("/message", {
    method: "POST",
    body: JSON.stringify({ kind, body, page: page() }),
  });

export const sendQuickReply = (quickReplyId: string) =>
  call<{ messages: ChatMessage[]; thread: ChatThread }>("/message", {
    method: "POST",
    body: JSON.stringify({ kind: "quick_reply", quickReplyId, page: page() }),
  });

export const sendContact = (name: string, email: string) =>
  call<{ ok: true }>("/contact", { method: "POST", body: JSON.stringify({ name, email }) });
