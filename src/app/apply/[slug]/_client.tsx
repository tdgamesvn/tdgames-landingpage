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
  source: string;
  available_from: string;
  available_hours_per_week: string;
  message: string;
};

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "done"; url: string; name: string }
  | { status: "error"; message: string };

const WORK_TYPES = [
  { value: "fulltime", label: "Full-time / Part-time / Remote" },
  { value: "freelancer", label: "Freelancer" },
] as const;

export default function ApplyPageClient({ job }: Props) {
  const searchParams = useSearchParams();
  const referredBy = searchParams.get("ref") ?? undefined;

  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    phone: "",
    work_type: job.type === "freelancer" ? "freelancer" : "fulltime",
    years_experience: "",
    portfolio_url: "",
    linkedin_url: "",
    expected_salary: "",
    rate_per_hour: "",
    source: "",
    available_from: "",
    available_hours_per_week: "",
    message: "",
  });
  const [upload, setUpload] = useState<UploadState>({ status: "idle" });
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isFreelancer = form.work_type === "freelancer";

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

    // CV required for non-freelancer only
    if (!isFreelancer && !cvUrl) {
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
        years_experience: !isFreelancer && form.years_experience
          ? parseInt(form.years_experience)
          : null,
        cv_url: cvUrl,
        portfolio_url: form.portfolio_url || null,
        linkedin_url: !isFreelancer ? form.linkedin_url || null : null,
        expected_salary: !isFreelancer ? form.expected_salary || null : null,
        rate_per_hour: isFreelancer ? form.rate_per_hour || null : null,
        available_hours_per_week: isFreelancer ? form.available_hours_per_week || null : null,
        source: !isFreelancer ? form.source || null : null,
        available_from: !isFreelancer ? form.available_from || null : null,
        message: form.message || null,
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
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#1a1510] to-[#0a0a10]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#f59e0b]/20 via-transparent to-transparent" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-8 text-center">
          <Image
            src="https://cdn.tdgamestudio.com/landing/logoCompany/logo_td.png"
            alt="TD Games"
            width={120}
            height={120}
            className="mx-auto mb-4 drop-shadow-[0_0_25px_rgba(245,158,11,0.35)]"
          />
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider text-[#f59e0b]">
            Join Our Team
          </h1>
          <p className="mt-2 text-sm text-white/60">
            We&apos;re looking for talented people
          </p>
          <p className="mt-1 text-xs text-white/35">
            Fill out the form below to apply
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 lg:grid lg:grid-cols-[1fr_1.4fr] lg:gap-12">
        {/* ── Left: About + Job summary ─────────────────────────────── */}
        <aside className="mb-8 lg:mb-0">
          {/* About Us */}
          <div className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-black text-[#f59e0b]">TD Games Studio</h2>
            <div className="mt-1 mb-3 h-0.5 w-10 bg-[#f59e0b]" />
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">About Us</h3>
            <p className="text-xs leading-relaxed text-white/55">
              TD Games Studio is a professional team specializing in Art, Animation &amp; VFX services for mobile games. With experience across many game genres and an optimized production pipeline, we deliver vivid visuals, smooth animations, and impressive effects that make our partners&apos; products stand out.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
              <svg className="h-3.5 w-3.5 shrink-0 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <a href="https://www.tdgamestudio.com" target="_blank" rel="noopener noreferrer" className="text-[#f59e0b]/70 hover:text-[#f59e0b] transition-colors">
                tdgamestudio.com
              </a>
            </div>
          </div>

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
            {/* ── Employment Type Toggle ─────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/5 p-1.5">
              {WORK_TYPES.map((wt) => (
                <button
                  key={wt.value}
                  type="button"
                  onClick={() => set("work_type", wt.value)}
                  className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                    form.work_type === wt.value
                      ? "bg-[#f59e0b] text-black shadow-lg"
                      : "text-white/50 hover:bg-white/5 hover:text-white/70"
                  }`}
                >
                  {wt.value === "fulltime" ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {wt.label}
                </button>
              ))}
            </div>

            {/* ── Personal Information ───────────────────────────────── */}
            <div className="border-t border-white/10 pt-5">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#f59e0b]">
                Personal Information
              </h3>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Full Name *">
                    <input
                      required
                      value={form.full_name}
                      onChange={(e) => set("full_name", e.target.value)}
                      placeholder="Enter your full name"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Email *">
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="your.email@example.com"
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field label="Phone Number *">
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+84 123 456 789"
                    className={inputCls}
                  />
                </Field>

                <Field label="Portfolio URL *">
                  <input
                    required
                    type="url"
                    value={form.portfolio_url}
                    onChange={(e) => set("portfolio_url", e.target.value)}
                    placeholder="https://behance.net/yourname, ArtStation, or Google Drive link"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>

            {/* ── Fulltime-specific fields ───────────────────────────── */}
            {!isFreelancer && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Years of Experience *">
                    <input
                      required
                      type="number"
                      min="0"
                      max="50"
                      value={form.years_experience}
                      onChange={(e) => set("years_experience", e.target.value)}
                      placeholder="e.g. 3"
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

                {/* CV Upload — drag & drop zone */}
                <Field label="Resume / CV * (PDF or Word, max 10 MB)">
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
                          Drag &amp; drop your resume here, or{" "}
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

                {/* ── Additional Information (fulltime) ─────────────── */}
                <div className="border-t border-white/10 pt-5">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#f59e0b]">
                    Additional Information
                  </h3>

                  <div className="flex flex-col gap-4">
                    <Field label="How did you hear about us?">
                      <select
                        value={form.source}
                        onChange={(e) => set("source", e.target.value)}
                        className={`${inputCls} appearance-none`}
                      >
                        <option value="">Select an option</option>
                        <option value="Facebook">Facebook</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Behance">Behance</option>
                        <option value="ArtStation">ArtStation</option>
                        <option value="Friend / Referral">Friend / Referral</option>
                        <option value="Job Board">Job Board (TopCV, VietnamWorks...)</option>
                        <option value="Google Search">Google Search</option>
                        <option value="Other">Other</option>
                      </select>
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Available Start Date">
                        <input
                          type="date"
                          value={form.available_from}
                          onChange={(e) => set("available_from", e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Expected Salary (VND/month)">
                        <input
                          value={form.expected_salary}
                          onChange={(e) => set("expected_salary", e.target.value)}
                          placeholder="Enter expected salary"
                          className={inputCls}
                        />
                      </Field>
                    </div>

                    <Field label="Additional Message">
                      <textarea
                        value={form.message}
                        onChange={(e) => {
                          if (e.target.value.length <= 1000) set("message", e.target.value);
                        }}
                        placeholder="Tell us why you'd be a great fit for TD GAMES..."
                        rows={4}
                        className={`${inputCls} resize-none`}
                      />
                      <p className="mt-1 text-right text-[11px] text-white/30">
                        {form.message.length}/1000
                      </p>
                    </Field>
                  </div>
                </div>
              </>
            )}

            {/* ── Freelancer-specific fields ─────────────────────────── */}
            {isFreelancer && (
              <div className="border-t border-white/10 pt-5">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#f59e0b]">
                  Freelance Information
                </h3>

                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Hourly Rate (VND/hour) *">
                      <input
                        required
                        value={form.rate_per_hour}
                        onChange={(e) => set("rate_per_hour", e.target.value)}
                        placeholder="Enter your hourly rate"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Available Hours per Week *">
                      <select
                        required
                        value={form.available_hours_per_week}
                        onChange={(e) => set("available_hours_per_week", e.target.value)}
                        className={`${inputCls} appearance-none`}
                      >
                        <option value="">Select available hours</option>
                        <option value="< 10 hours">{"< 10 hours"}</option>
                        <option value="10 - 20 hours">10 - 20 hours</option>
                        <option value="20 - 30 hours">20 - 30 hours</option>
                        <option value="30 - 40 hours">30 - 40 hours</option>
                        <option value="40+ hours (full-time)">40+ hours (full-time)</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Additional Message">
                    <textarea
                      value={form.message}
                      onChange={(e) => {
                        if (e.target.value.length <= 1000) set("message", e.target.value);
                      }}
                      placeholder="Tell us about your experience, availability, and why you'd like to work with TD GAMES..."
                      rows={4}
                      className={`${inputCls} resize-none`}
                    />
                    <p className="mt-1 text-right text-[11px] text-white/30">
                      {form.message.length}/1000
                    </p>
                  </Field>

                  {/* Optional CV for freelancers */}
                  <Field label="Resume / CV (optional, PDF or Word, max 10 MB)">
                    <div
                      className={`group mt-1 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-4 text-center transition-all ${
                        dragging
                          ? "border-[#f59e0b] bg-[#f59e0b]/10"
                          : upload.status === "done"
                            ? "border-green-500/40 bg-green-500/5"
                            : "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/5"
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
                        <p className="text-sm text-white/40">
                          Drag &amp; drop or{" "}
                          <span className="text-[#f59e0b]/70 underline underline-offset-2">browse</span>
                        </p>
                      )}
                      {upload.status === "uploading" && (
                        <span className="text-sm text-white/60">Uploading...</span>
                      )}
                      {upload.status === "done" && (
                        <div className="flex items-center gap-2">
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
                            className="ml-1 rounded-full p-0.5 text-white/40 hover:text-white"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                      {upload.status === "error" && (
                        <p className="text-sm text-red-400">{upload.message}</p>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <p className="mt-1 text-[11px] text-white/25">
                      You can also share a link to your CV in the Additional Message
                    </p>
                  </Field>
                </div>
              </div>
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
              {submitting ? "Submitting..." : "Submit Application"}
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

      {/* Follow Us footer */}
      <footer className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-white/40">
            Follow Us
          </h3>
          <div className="flex flex-wrap gap-3">
            {[
              { name: "Behance", href: "https://www.behance.net/tdgamesstudio", color: "bg-[#1769ff]" },
              { name: "ArtStation", href: "https://www.artstation.com/td_games", color: "bg-[#13aff0]" },
              { name: "Facebook", href: "https://www.facebook.com/tdgamesstudio", color: "bg-[#1877f2]" },
              { name: "LinkedIn", href: "https://www.linkedin.com/company/td-games-company-limited", color: "bg-[#0a66c2]" },
            ].map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/60 transition-colors hover:border-white/20 hover:text-white"
              >
                <span className={`h-5 w-5 rounded-md ${s.color} flex items-center justify-center text-[10px] font-bold text-white`}>
                  {s.name[0]}
                </span>
                {s.name}
              </a>
            ))}
          </div>
          <p className="mt-6 text-[11px] text-white/25">
            &copy; {new Date().getFullYear()} TD Games Company Limited &middot;{" "}
            <a href="https://www.tdgamestudio.com" className="hover:text-white/40 transition-colors">
              tdgamestudio.com
            </a>
          </p>
        </div>
      </footer>
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
