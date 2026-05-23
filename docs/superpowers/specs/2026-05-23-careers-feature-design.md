# Careers Feature — Design Spec

_Date: 2026-05-23 | Project: tdgames-landingpage_

---

## Overview

Replace hardcoded demo data on the `/careers` page with a fully dynamic system:
- Admin can post/edit/delete job listings
- Applicants can submit applications with an inline form
- Admin can view and track applicant status
- Telegram notification on each new application

---

## Architecture

```
Supabase DB
├── jobs          (job postings)
└── applications  (applicant submissions)

Next.js API Routes
├── GET  /api/jobs                        (public — list active jobs)
├── POST /api/applications                (public — submit application + upload CV to R2)
├── GET/POST        /api/admin/jobs       (admin — list + create jobs)
├── PUT/DELETE      /api/admin/jobs/[id]  (admin — update + delete jobs)
├── GET             /api/admin/applications         (admin — list with filters)
└── PATCH           /api/admin/applications/[id]    (admin — update status/notes)

Admin UI (new tab "Careers")
├── Sub-tab: Jobs       (CRUD job postings)
└── Sub-tab: Applicants (view, filter, change status)

Public Careers Page
└── Fetches from /api/jobs (server component, dynamic)
    └── Job Detail Panel → inline Apply Form
```

---

## Database Schema

### Table: `jobs`

```sql
CREATE TABLE jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  slug            text NOT NULL UNIQUE,
  description     text NOT NULL,
  type            text NOT NULL CHECK (type IN ('fulltime','parttime','remote','freelancer')),
  location        text NOT NULL DEFAULT 'Hà Nội',
  level           text,           -- null for freelancer
  salary          text,           -- null for freelancer
  rate_per_hour   text,           -- only for freelancer
  categories      text[] NOT NULL DEFAULT '{}',
  image_url       text,
  summary         text,
  responsibilities text[] NOT NULL DEFAULT '{}',
  requirements    text[] NOT NULL DEFAULT '{}',
  nice_to_have    text[] NOT NULL DEFAULT '{}',
  skills          text[] NOT NULL DEFAULT '{}',
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

### Table: `applications`

```sql
CREATE TABLE applications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  full_name         text NOT NULL,
  email             text NOT NULL,
  phone             text NOT NULL,
  work_type         text NOT NULL,   -- mirrors job.type at time of apply
  -- Non-freelancer fields
  years_experience  int,
  cv_url            text,            -- R2 URL after upload
  expected_salary   text,
  available_from    date,
  -- Freelancer field
  rate_per_hour     text,
  -- Shared optional links (at least 1 required)
  portfolio_url     text,
  linkedin_url      text,
  website_url       text,
  -- Admin management
  status            text NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','reviewing','interview','offer','rejected')),
  admin_notes       text,
  created_at        timestamptz NOT NULL DEFAULT now()
);
```

---

## API Contracts

### Public

#### `GET /api/jobs`
Returns active jobs only.
```json
[{ "id": "...", "title": "...", "slug": "...", "type": "fulltime", ... }]
```

#### `POST /api/applications`
Multipart form (supports CV file upload).

**Body (fulltime/parttime/remote):**
```
full_name, email, phone, work_type, years_experience,
cv_file (File), portfolio_url?, linkedin_url?, website_url?,
expected_salary, available_from, job_id
```

**Body (freelancer):**
```
full_name, email, phone, work_type, portfolio_url?,
website_url?, rate_per_hour, job_id
```

Uploads CV → R2 bucket, stores URL in `applications.cv_url`.
On success → sends Telegram notification.

**Response:** `{ ok: true, id: "..." }`

---

### Admin (require `x-admin-key` header)

| Method | Path | Action |
|--------|------|--------|
| GET | /api/admin/jobs | List all jobs (active + inactive) |
| POST | /api/admin/jobs | Create job |
| PUT | /api/admin/jobs/[id] | Update job |
| DELETE | /api/admin/jobs/[id] | Delete job |
| GET | /api/admin/applications | List applications, filter: `?job_id=&status=` |
| PATCH | /api/admin/applications/[id] | Update status + admin_notes |

---

## Apply Form — Field Logic

### Fulltime / Parttime / Remote
| Field | Required |
|-------|----------|
| Họ và tên | ✅ |
| Email | ✅ |
| Số điện thoại | ✅ |
| Số năm kinh nghiệm | ✅ |
| CV Upload (PDF/DOC) | ✅ |
| Portfolio URL | min 1 trong 3 |
| LinkedIn URL | min 1 trong 3 |
| Website URL | min 1 trong 3 |
| Mức lương mong muốn | ✅ |
| Ngày có thể bắt đầu | ✅ |

### Freelancer (form đơn giản hơn)
| Field | Required |
|-------|----------|
| Họ và tên | ✅ |
| Email | ✅ |
| Số điện thoại | ✅ |
| Portfolio URL | ✅ (bắt buộc ít nhất 1) |
| Website URL | optional |
| Rate / giờ | ✅ |

---

## Admin UI — Tab "Careers"

### Sub-tab: Jobs
- Danh sách jobs (title, type, is_active, created_at)
- Toggle active/inactive
- Create / Edit form (tất cả fields)
- Delete với confirm

### Sub-tab: Applicants
- Filter: by job, by status
- Danh sách: tên, email, job applied, work_type, status, ngày apply
- Click → expand chi tiết: all fields + link CV + portfolio
- Đổi status: dropdown (New → Reviewing → Interview → Offer / Rejected)
- Admin notes textarea
- Status badge màu:
  - `new` → blue
  - `reviewing` → amber
  - `interview` → purple
  - `offer` → green
  - `rejected` → red

---

## Telegram Notification

Khi có application mới, gửi message:
```
🎯 New Application: [Job Title]

👤 [Full Name]
📧 [email]
📱 [phone]
💼 [work_type] | [years_exp năm KN | rate/h for freelancer]
🔗 Portfolio: [url hoặc N/A]

View in Admin: https://www.tdgamestudio.com/admin
```

---

## Public Careers Page Changes

- Convert to **Server Component** (remove `"use client"`)
- Fetch jobs from `GET /api/jobs` at request time (`dynamic = "force-dynamic"`)
- Keep all existing UI/UX (search, filter, job cards, detail panel)
- Replace "Apply Now → /contact" with **inline ApplyForm component** inside the detail panel
- `ApplyForm` is a `"use client"` component — form fields + submit + success state

---

## Files to Create / Modify

| Action | File |
|--------|------|
| NEW | `supabase/migrations/001_careers.sql` |
| NEW | `src/app/api/jobs/route.ts` |
| NEW | `src/app/api/applications/route.ts` |
| NEW | `src/app/api/admin/jobs/route.ts` |
| NEW | `src/app/api/admin/jobs/[id]/route.ts` |
| NEW | `src/app/api/admin/applications/route.ts` |
| NEW | `src/app/api/admin/applications/[id]/route.ts` |
| NEW | `src/app/admin/_components/CareersTab.tsx` |
| NEW | `src/components/apply-form.tsx` |
| MODIFY | `src/app/careers/page.tsx` (dynamic fetch, wire ApplyForm) |
| MODIFY | `src/app/admin/page.tsx` (add Careers tab) |

---

## Out of Scope

- Email notification (dùng Telegram thay thế)
- Job application deadline (có thể thêm sau)
- Candidate-facing application tracking (no login system)
- CV preview in-browser
