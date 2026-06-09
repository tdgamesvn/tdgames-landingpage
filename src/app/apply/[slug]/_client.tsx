"use client";

import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Job } from "@/app/admin/_lib/types";

type Props = { job: Job };

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  work_type: string;
  years_experience: string;
  portfolio_url: string;
  linkedin_url: string;
  expected_salary: string;
  rate_per_hour: string;
};

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "done"; url: string; name: string }
  | { status: "error"; message: string };

export default function ApplyPageClient({ job }: Props) {
  const isFreelancer = job.type === "freelancer";
  const searchParams = useSearchParams();
  const referredBy = searchParams.get("ref") ?? undefined;

  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    phone: "",
    work_type: job.type,
    years_experience: "",
    portfolio_url: "",
    linkedin_url: "",
    expected_salary: "",
    rate_per_hour: "",
  });
  const [upload, setUpload] = useState<UploadState>({ status: "idle" });
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUpload({ status: "uploading", progress: 0 });

    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/applications/upload-cv", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setUpload({ status: "done", url: json.url, name: file.name });
    } catch (e) {
      setUpload({
        status: "error",
        message: e instanceof Error ? e.message : "Upload failed",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const cvUrl = upload.status === "done" ? upload.url : null;

    if (!cvUrl) {
      setError("Please upload your CV before submitting.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        job_id: job.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        work_type: form.work_type,
        years_experience: form.years_experience
          ? parseInt(form.years_experience)
          : null,
        cv_url: cvUrl,
        portfolio_url: form.portfolio_url || null,
        linkedin_url: form.linkedin_url || null,
        expected_salary: isFreelancer ? null : form.expected_salary || null,
        rate_per_hour: isFreelancer ? form.rate_per_hour || null : null,
        referred_by: referredBy || null,
      };

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Submit failed");
      }

      setSubmitted(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Submission failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0a10] px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f59e0b]/15">
          <svg
            className="h-10 w-10 text-[#f59e0b]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-white">Application Sent!</h1>
        <p className="max-w-sm text-sm text-white/60">
          Thanks for applying for{" "}
          <span className="text-white">{job.title}</span>.{" "}
          We&apos;ll review your application and get back to you soon.
        </p>
        <Link
          href="/careers"
          className="mt-2 rounded-lg border border-white/20 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white/80 transition-colors hover:border-white/40"
        >
          Back to Careers
        </Link>
      </div>
    );
  }

  // ── Page layout ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a10]">
      {/* Top nav */}
      <div className="border-b border-white/10 bg-[#0a0a10] px-4 py-4 sm:px-8">
        <Link
          href="/careers"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Careers
        </Link>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 lg:grid lg:grid-cols-[1fr_1.4fr] lg:gap-12">
        {/* ── Left: Job summary ───────────────────────────────────────── */}
        <aside className="mb-8 lg:mb-0">
          {job.image_url && (
            <div className="relative mb-6 h-48 w-full overflow-hidden rounded-xl">
              <Image
                src={job.image_url}
                alt={job.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 480px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a10]/80 to-transparent" />
            </div>
          )}

          <h1 className="text-3xl font-black tracking-tight text-white">
            {job.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#f59e0b]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#f59e0b]">
              {job.type}
            </span>
            {job.location && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/60">
                {job.location}
              </span>
            )}
            {job.level && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/60">
                {job.level}
              </span>
            )}
          </div>

          {job.salary && (
            <p className="mt-4 text-sm text-white/70">
              <span className="font-bold text-white">Salary: </span>
              {job.salary}
            </p>
          )}

          {job.summary && (
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              {job.summary}
            </p>
          )}

          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">
                Responsibilities
              </h2>
              <ul className="space-y-1">
                {job.responsibilities.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-white/70"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f59e0b]" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.requirements.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">
                Requirements
              </h2>
              <ul className="space-y-1">
                {job.requirements.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-white/70"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f59e0b]" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.nice_to_have && job.nice_to_have.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">
                Nice to Have
              </h2>
              <ul className="space-y-1">
                {job.nice_to_have.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-white/70"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.skills && job.skills.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">
                Skills
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── Right: Form ─────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-6 text-xl font-black text-white">
            Your Application
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Personal info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name *">
                <input
                  required
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  placeholder="Your full name"
                  className={inputCls}
                />
              </Field>
              <Field label="Email *">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+84 ..."
                  className={inputCls}
                />
              </Field>
              <Field label="Years of Experience">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={form.years_experience}
                  onChange={(e) => set("years_experience", e.target.value)}
                  placeholder="e.g. 3"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* CV Upload — drag & drop zone */}
            <Field label="CV / Resume * (PDF or Word, max 10 MB)">
              <div
                className={`group mt-1 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-6 text-center transition-all ${
                  dragging
                    ? "border-[#f59e0b] bg-[#f59e0b]/10"
                    : upload.status === "done"
                      ? "border-green-500/40 bg-green-500/5"
                      : "border-white/20 bg-white/[0.03] hover:border-[#f59e0b]/50 hover:bg-white/5"
                }`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    if (fileRef.current) {
                      fileRef.current.files = dt.files;
                      fileRef.current.dispatchEvent(
                        new Event("change", { bubbles: true }),
                      );
                    }
                  }
                }}
              >
                {upload.status === "idle" && (
                  <>
                    <svg
                      className="h-8 w-8 text-white/30 transition-colors group-hover:text-[#f59e0b]/60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm font-medium text-white/50">
                      Drag &amp; drop your CV here, or{" "}
                      <span className="text-[#f59e0b] underline underline-offset-2">
                        browse
                      </span>
                    </p>
                    <p className="text-[11px] text-white/30">
                      PDF, DOC, DOCX &middot; Max 10 MB
                    </p>
                  </>
                )}
                {upload.status === "uploading" && (
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 animate-spin text-[#f59e0b]"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span className="text-sm text-white/60">Uploading...</span>
                  </div>
                )}
                {upload.status === "done" && (
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-6 w-6 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-green-400">
                      {upload.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUpload({ status: "idle" });
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="ml-1 rounded-full p-0.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {upload.status === "error" && (
                  <p className="text-sm text-red-400">{upload.message} — click to retry</p>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleFileChange}
              />
            </Field>

            {/* Portfolio & links */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Portfolio URL *">
                <input
                  required
                  type="url"
                  value={form.portfolio_url}
                  onChange={(e) => set("portfolio_url", e.target.value)}
                  placeholder="https://behance.net/..."
                  className={inputCls}
                />
              </Field>
              <Field label="LinkedIn URL">
                <input
                  type="url"
                  value={form.linkedin_url}
                  onChange={(e) => set("linkedin_url", e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Compensation */}
            {isFreelancer ? (
              <Field label="Rate Per Hour (USD)">
                <input
                  value={form.rate_per_hour}
                  onChange={(e) => set("rate_per_hour", e.target.value)}
                  placeholder="e.g. $15/hr"
                  className={inputCls}
                />
              </Field>
            ) : (
              <Field label="Expected Salary">
                <input
                  value={form.expected_salary}
                  onChange={(e) => set("expected_salary", e.target.value)}
                  placeholder="e.g. $800/month"
                  className={inputCls}
                />
              </Field>
            )}

            {error && (
              <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || upload.status === "uploading"}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f59e0b] px-8 py-3 text-xs font-black uppercase tracking-[0.15em] text-black transition-colors hover:bg-[#ffb366] disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Application"}
              {!submitting && (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

const inputCls =
  "mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#f59e0b]/50 focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">
        {label}
      </label>
      {children}
    </div>
  );
}
