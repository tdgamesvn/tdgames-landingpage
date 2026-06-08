# Apply Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated `/apply/[slug]` page where candidates can fill out their application and upload a CV file, replacing the inline `ApplyForm` panel in `/careers`.

**Architecture:** Server component fetches the job by slug and passes it to a client form component. A new public upload route accepts PDF/DOCX files and stores them in Cloudflare R2, returning a URL that is then submitted with the rest of the application payload. The existing `POST /api/applications` route is reused unchanged.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind v4 (CSS vars, no config file), Cloudflare R2 (`uploadToR2` from `@/lib/r2`), Supabase (`getSupabaseAdmin` from `@/lib/supabase-admin`), `Job` / `Application` types from `@/app/admin/_lib/types`.

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/app/api/applications/upload-cv/route.ts` | Public endpoint — accept PDF/DOCX, upload to R2, return `{ url }` |
| Create | `src/app/apply/[slug]/page.tsx` | Server component — fetch job by slug, call `notFound()` if missing |
| Create | `src/app/apply/[slug]/_client.tsx` | Client form — CV upload + application submit |
| Modify | `src/app/careers/careers-client.tsx` | Replace `setShowApply(true)` with `router.push('/apply/${role.slug}')`, remove `ApplyForm` component |

---

## Task 1: CV Upload API Route

**Files:**
- Create: `src/app/api/applications/upload-cv/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
// src/app/api/applications/upload-cv/route.ts
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

function sanitize(s: string) {
  return s.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!ALLOWED[file.type]) {
    return NextResponse.json(
      { error: "Only PDF or Word documents are accepted" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 10 MB)" },
      { status: 400 },
    );
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safeName = sanitize(file.name || "cv");
  const key = `applications/cv/${year}/${month}/${randomUUID()}-${safeName}`;

  const bytes = await file.arrayBuffer();
  const body = Buffer.from(bytes);
  const uploaded = await uploadToR2({ key, body, contentType: file.type });

  return NextResponse.json({ url: uploaded.url });
}
```

- [ ] **Step 2: Verify the file builds without errors**

```bash
cd /Users/tdgames_mac01/Work/apps/tdgames-landingpage && npm run build 2>&1 | tail -20
```

Expected: build succeeds (or only pre-existing warnings, no new errors).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/applications/upload-cv/route.ts
git commit -m "feat: add public CV upload route to R2"
```

---

## Task 2: Apply Page — Server Component

**Files:**
- Create: `src/app/apply/[slug]/page.tsx`

- [ ] **Step 1: Create the server page**

```typescript
// src/app/apply/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { Job } from "@/app/admin/_lib/types";
import ApplyPageClient from "./_client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ApplyPage({ params }: Props) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    notFound();
  }

  return <ApplyPageClient job={data as Job} />;
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/tdgames_mac01/Work/apps/tdgames-landingpage && npm run build 2>&1 | tail -20
```

Expected: build succeeds (TypeScript will complain that `_client.tsx` doesn't exist yet — that's fine at this step, or create a stub if the build fails).

If build fails due to missing `_client.tsx`, create a temporary stub:

```typescript
// src/app/apply/[slug]/_client.tsx
"use client";
import type { Job } from "@/app/admin/_lib/types";
export default function ApplyPageClient({ job }: { job: Job }) {
  return <div>{job.title}</div>;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/apply/[slug]/page.tsx src/app/apply/[slug]/_client.tsx
git commit -m "feat: add apply/[slug] server page"
```

---

## Task 3: Apply Page — Client Form

**Files:**
- Create (replace stub): `src/app/apply/[slug]/_client.tsx`

This is the main deliverable. It covers:
- CV file upload (progress state)
- All form fields matching `Application` type
- Submit to `POST /api/applications`
- Success screen
- 2-column desktop / stacked mobile layout
- Site dark theme (`#0a0a10` bg, amber `#f59e0b` accent, Tailwind v4)

- [ ] **Step 1: Write the full client component**

```typescript
// src/app/apply/[slug]/_client.tsx
"use client";

import { useState, useRef } from "react";
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
          Thanks for applying for <span className="text-white">{job.title}</span>.
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
          {/* Cover image */}
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

          {job.requirements.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">
                Requirements
              </h2>
              <ul className="space-y-1">
                {job.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f59e0b]" />
                    {r}
                  </li>
                ))}
              </ul>
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

            {/* CV Upload */}
            <Field label="CV / Resume (PDF or Word, max 10 MB)">
              <div
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-3 transition-colors hover:border-white/40"
                onClick={() => fileRef.current?.click()}
              >
                <svg
                  className="h-5 w-5 shrink-0 text-white/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                <span className="text-sm text-white/60">
                  {upload.status === "idle" && "Click to attach your CV"}
                  {upload.status === "uploading" && "Uploading…"}
                  {upload.status === "done" && (
                    <span className="text-green-400">✓ {upload.name}</span>
                  )}
                  {upload.status === "error" && (
                    <span className="text-red-400">{upload.message}</span>
                  )}
                </span>
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
              <Field label="Portfolio URL">
                <input
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
```

- [ ] **Step 2: Build to verify TypeScript**

```bash
cd /Users/tdgames_mac01/Work/apps/tdgames-landingpage && npm run build 2>&1 | tail -30
```

Expected: build succeeds with no new type errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/apply/[slug]/_client.tsx
git commit -m "feat: add apply page client form with CV upload"
```

---

## Task 4: Update careers-client.tsx — Wire "Apply Now" to new page

**Files:**
- Modify: `src/app/careers/careers-client.tsx`

Changes:
1. Add `useRouter` to imports
2. In `RoleDetailPanel`: replace `showApply` state with `router.push`
3. Remove the `ApplyForm` component entirely (lines ~933–1100)

- [ ] **Step 1: Add `useRouter` to imports**

Find the existing import line (line 5):
```typescript
import { useState, useMemo, useEffect } from "react";
```
Replace with:
```typescript
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
```

- [ ] **Step 2: Add router in `RoleDetailPanel`**

In `RoleDetailPanel` function body (line ~727), after `const isOpen = role !== null;`:

Before:
```typescript
  const isOpen = role !== null;
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    if (!role) setShowApply(false);
  }, [role]);
```

After:
```typescript
  const isOpen = role !== null;
  const router = useRouter();
```

- [ ] **Step 3: Update the panel header back-button**

Before:
```typescript
                onClick={showApply ? () => setShowApply(false) : onClose}
```
After:
```typescript
                onClick={onClose}
```

Before (label):
```typescript
                {showApply ? "Back to Job" : "Back"}
```
After:
```typescript
                Back
```

- [ ] **Step 4: Replace the panel body conditional with just the job detail view**

Before:
```typescript
            {showApply ? (
              <ApplyForm job={role} onDone={onClose} />
            ) : (
              <>
                {/* Scrollable content */}
```
After (remove the `showApply` ternary — keep only the job detail block):
```typescript
            <>
              {/* Scrollable content */}
```

And close the matching `</>` that was wrapping the job detail block — remove the outer `</>` closing the ternary and the extra `</>` at the end of the `{role && (...)}` section. The panel body should just be the scrollable content + sticky footer without any conditional.

- [ ] **Step 5: Update "Apply Now" button**

Before:
```typescript
                      onClick={() => setShowApply(true)}
```
After:
```typescript
                      onClick={() => router.push(`/apply/${role.slug}`)}
```

- [ ] **Step 6: Delete the `ApplyForm` component**

Remove the entire `ApplyForm` section (from `// ── ApplyForm` comment through the closing `}` of the function). This is approximately lines 933–1100 in the current file.

- [ ] **Step 7: Build to verify no TypeScript errors**

```bash
cd /Users/tdgames_mac01/Work/apps/tdgames-landingpage && npm run build 2>&1 | tail -30
```

Expected: clean build.

- [ ] **Step 8: Commit**

```bash
git add src/app/careers/careers-client.tsx
git commit -m "feat: wire Apply Now to /apply/[slug] page, remove inline form"
```

---

## Final Verification

- [ ] **Manual smoke test**

```bash
cd /Users/tdgames_mac01/Work/apps/tdgames-landingpage && npm run dev
```

1. Open http://localhost:3000/careers
2. Click a job card → detail panel opens
3. Click "Apply Now" → navigates to `/apply/<slug>`
4. Verify 2-col layout on desktop, stacked on mobile (resize browser)
5. Attach a PDF → verify it uploads (upload state shows ✓ filename)
6. Fill required fields → submit → success screen appears
7. Click "Back to Careers" → returns to `/careers`
8. Try `/apply/nonexistent-slug` → verify 404 page

- [ ] **Update TASKS.md and LOG.md**

Move task to Done in `TASKS.md`. Append dated entry to `LOG.md`.
