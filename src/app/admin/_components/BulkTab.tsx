"use client";

import { useState } from "react";
import { runBulkReplace } from "../_lib/api";

type Props = {
  adminKey: string;
};

export function BulkTab({ adminKey }: Props) {
  const [busy, setBusy] = useState<"dry-run" | "apply" | "rollback" | null>(null);
  const [result, setResult] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);

  async function run(mode: "dry-run" | "apply" | "rollback") {
    setBusy(mode);
    setStatusMsg(`Running ${mode}…`);
    setErrorMsg("");
    setResult("");
    try {
      const data = await runBulkReplace({ adminKey, mode });
      setResult(JSON.stringify(data, null, 2));
      setStatusMsg(`${mode} thành công`);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : `${mode} failed`);
      setStatusMsg("");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <h2 className="text-xl font-semibold">Bulk replace media URLs</h2>
      <p className="text-sm text-white/60">
        Chạy script <span className="font-mono text-xs">scripts/replace-media-urls.mjs</span>{" "}
        từ UI. Luôn dry-run trước, sau đó apply nếu output đúng. Có rollback từ backup nếu cần.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => run("dry-run")}
          disabled={busy !== null}
          className="rounded-md bg-slate-700 px-4 py-2 text-sm disabled:opacity-40"
        >
          {busy === "dry-run" ? "Running…" : "Dry run"}
        </button>
        <button
          onClick={() => setShowApplyConfirm(true)}
          disabled={busy !== null}
          className="rounded-md bg-amber-600 px-4 py-2 text-sm disabled:opacity-40"
        >
          {busy === "apply" ? "Applying…" : "Apply"}
        </button>
        <button
          onClick={() => run("rollback")}
          disabled={busy !== null}
          className="rounded-md bg-rose-600 px-4 py-2 text-sm disabled:opacity-40"
        >
          {busy === "rollback" ? "Rolling back…" : "Rollback"}
        </button>
      </div>

      {showApplyConfirm ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm">
          <span>Confirm apply bulk replace? Source code sẽ bị sửa.</span>
          <button
            onClick={() => {
              setShowApplyConfirm(false);
              void run("apply");
            }}
            className="rounded-md bg-amber-600 px-2 py-1 text-xs"
          >
            Confirm
          </button>
          <button
            onClick={() => setShowApplyConfirm(false)}
            className="rounded-md border border-white/20 px-2 py-1 text-xs"
          >
            Cancel
          </button>
        </div>
      ) : null}

      {statusMsg ? <p className="text-xs text-emerald-300">{statusMsg}</p> : null}
      {errorMsg ? <p className="text-xs text-rose-300">{errorMsg}</p> : null}
      {result ? (
        <pre className="rounded-md border border-white/10 bg-black/40 p-3 text-[11px] overflow-auto max-h-[60vh]">
          {result}
        </pre>
      ) : null}
    </div>
  );
}
