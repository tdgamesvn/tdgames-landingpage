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
      <p className="text-[13px] leading-relaxed text-[#f59e0b]/90">
        You&apos;re on the list. We&apos;ll email you the moment this tool opens up.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          aria-label={`Notify me when ${tool} launches`}
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#f59e0b]/50"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="shrink-0 rounded-lg bg-[#f59e0b] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-black transition-all hover:bg-[#f59e0b]/85 disabled:opacity-40"
        >
          {state === "sending" ? "…" : "Notify me"}
        </button>
      </div>
      {state === "error" && (
        <p className="text-[12px] text-red-400">Couldn&apos;t send. Please try again.</p>
      )}
    </form>
  );
}
