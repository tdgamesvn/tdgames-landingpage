"use client";

import { useState } from "react";

// ponytail: chỉ component này là client — phần còn lại của /tools vẫn render sẵn HTML cho SEO.
export default function WaitlistForm({ tool }: { tool: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/tools/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), tool }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="mt-6 text-[13px] leading-relaxed text-amber-300/90">
        Đã ghi nhận. Tool mở là chúng tôi gửi mail cho bạn.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@cua-ban.com"
          aria-label={`Nhận thông báo khi ${tool} mở`}
          className="min-w-0 flex-1 rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-amber-400/50"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="shrink-0 rounded-lg bg-amber-400 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-colors hover:bg-amber-300 disabled:opacity-40"
          style={{ fontFamily: "var(--font-rajdhani)" }}
        >
          {state === "sending" ? "…" : "Báo tôi"}
        </button>
      </div>
      {state === "error" && (
        <p className="text-[12px] text-red-400">Gửi không được. Thử lại giúp mình.</p>
      )}
    </form>
  );
}
