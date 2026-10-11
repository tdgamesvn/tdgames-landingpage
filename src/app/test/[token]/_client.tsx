"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TestItem = {
  id: string;
  kind: "file" | "link";
  title: string;
  url: string;
  file_name: string | null;
  file_size: number | null;
  note: string | null;
};

type Submission = {
  id: string;
  kind: "file" | "link";
  url: string;
  file_name: string | null;
  file_size: number | null;
  note: string | null;
  created_at: string;
};

type Data = {
  candidate: string;
  job: string;
  tests: TestItem[];
  submissions: Submission[];
  maxItems: number;
};

type Entry = { id: number; kind: "file"; file: File | null } | { id: number; kind: "link"; url: string };

let entrySeq = 0;
const newEntry = (kind: "file" | "link"): Entry =>
  kind === "file" ? { id: ++entrySeq, kind, file: null } : { id: ++entrySeq, kind, url: "" };

const MAX_SIZE = 50 * 1024 * 1024;
const MAX_TOTAL = 95 * 1024 * 1024;

function fmtSize(n: number | null) {
  if (!n) return "";
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function TestPageClient({ token }: { token: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [entries, setEntries] = useState<Entry[]>(() => [newEntry("file")]);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/test/${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (res) => {
        if (!alive) return;
        if (!res.ok) setNotFound(true);
        else setData(await res.json());
      })
      .catch(() => alive && setNotFound(true));
    return () => {
      alive = false;
    };
  }, [token]);

  function update(id: number, patch: Partial<{ file: File | null; url: string }>) {
    setEntries((es) => es.map((e) => (e.id === id ? ({ ...e, ...patch } as Entry) : e)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const files = entries.flatMap((x) => (x.kind === "file" && x.file ? [x.file] : []));
    const links = entries.flatMap((x) => (x.kind === "link" && x.url.trim() ? [x.url.trim()] : []));
    if (files.length + links.length === 0) return setError("Please add at least one file or link.");
    const big = files.find((f) => f.size > MAX_SIZE);
    if (big) return setError(`${big.name} is too large (max 50 MB per file).`);
    if (files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL)
      return setError("Files are too large in total (max 95 MB) — please share a link for big files.");
    if (!confirm("Submit your work now? You can only submit once.")) return;

    const fd = new FormData();
    files.forEach((f) => fd.append("file", f));
    links.forEach((l) => fd.append("link", l));
    fd.append("note", note);
    setSending(true);
    try {
      const res = await fetch(`/api/test/${encodeURIComponent(token)}`, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      setData((d) => (d ? { ...d, submissions: json.submissions } : d));
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSending(false);
    }
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a10] px-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-bold">Link not found</h1>
          <p className="mt-2 text-sm text-white/50">This test link is invalid or has been removed. Please contact our HR team.</p>
          <Link href="/" className="mt-6 inline-block text-sm text-amber-400 hover:underline">← tdgamestudio.com</Link>
        </div>
      </main>
    );
  }

  if (!data) return <main className="min-h-screen bg-[#0a0a10]" />;

  const submitted = data.submissions.length > 0;

  const input =
    "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none";

  return (
    <main className="min-h-screen bg-[#0a0a10] px-4 py-12 text-white">
      <div className="mx-auto max-w-2xl space-y-8">
        <header>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400">TD Games Studio · Test assignment</p>
          <h1 className="mt-2 text-3xl font-bold">{data.job || "Test assignment"}</h1>
          <p className="mt-2 text-sm text-white/60">Hi {data.candidate}, thank you for applying. Please find the test below and submit your work when ready.</p>
        </header>

        {/* Đề test */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50">Test materials</h2>
          {data.tests.length === 0 && (
            <p className="text-sm text-white/40">No test materials yet — HR will send instructions separately.</p>
          )}
          {data.tests.map((t) => (
            <a
              key={t.id}
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-amber-500/40"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">{t.kind === "file" ? "📎" : "🔗"} {t.title}</span>
                <span className="shrink-0 text-xs text-amber-400">
                  {t.kind === "file" ? `Download ${fmtSize(t.file_size)}` : "Open ↗"}
                </span>
              </div>
              {t.note && <p className="mt-2 whitespace-pre-wrap text-sm text-white/60">{t.note}</p>}
            </a>
          ))}
        </section>

        {/* Nộp bài */}
        <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50">Submit your work</h2>
          {!submitted && (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-xs text-white/50">
              Add all your files and links, then submit once. Up to {data.maxItems} items, 50 MB per file
              (95 MB total) — use a Drive/Dropbox link for anything bigger.
            </p>
            {entries.map((x) => (
              <div key={x.id} className="flex items-center gap-2">
                {x.kind === "file" ? (
                  <input
                    type="file"
                    onChange={(e) => update(x.id, { file: e.target.files?.[0] ?? null })}
                    className="block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white"
                  />
                ) : (
                  <input
                    type="url"
                    value={x.url}
                    onChange={(e) => update(x.id, { url: e.target.value })}
                    placeholder="https://drive.google.com/… (make sure it is shared)"
                    className={input}
                  />
                )}
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setEntries((es) => es.filter((e) => e.id !== x.id))}
                    className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/50 hover:border-red-400/50 hover:text-red-300"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {entries.length < data.maxItems && (
              <div className="flex gap-2">
                {(["file", "link"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setEntries((es) => [...es, newEntry(k)])}
                    className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-white/60 hover:border-amber-500/50 hover:text-amber-300"
                  >
                    + Add {k}
                  </button>
                ))}
              </div>
            )}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Notes for the reviewer (optional)"
              className={input}
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-black hover:bg-amber-400 disabled:opacity-50"
            >
              {sending ? "Uploading…" : "Submit"}
            </button>
          </form>
          )}
          {submitted && (
            <p className="text-sm text-green-400">
              ✓ {done ? "Submitted. Thank you — we will get back to you soon." : "You have already submitted. Need to change something? Please contact our HR team."}
            </p>
          )}

          {data.submissions.length > 0 && (
            <div className="space-y-1 border-t border-white/10 pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-white/40">
                Your submission · {new Date(data.submissions[0].created_at).toLocaleString()}
              </p>
              {data.submissions.map((s) => (
                <p key={s.id} className="truncate text-sm text-white/70">
                  {s.kind === "file" ? "📎" : "🔗"}{" "}
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
                    {s.file_name ?? s.url}
                  </a>
                </p>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
