import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { Nunito_Sans } from "next/font/google";

import JsonLd from "@/components/json-ld";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import { jobPostingJsonLd } from "@/lib/job-posting";
import { getActiveJob, isJobSlug, listActiveJobs } from "@/lib/jobs-data";
import { ogImages } from "@/lib/seo";
import JobActions from "./job-actions";

// Trang chi tiết 1 job (tiếng Việt) — trang index được cho từ khoá "tuyển dụng <vị trí> hà nội".
// /careers?job=<slug> (panel) vẫn giữ; /apply/<slug> là form (noindex).
// Cache DB 300s như /careers. Job đóng (is_active=false) / slug lạ → 404, không giữ trang
// job hết hạn (JobPosting không có validThrough).

// Font riêng có subset vietnamese: Nunito của root layout chỉ có latin, Rajdhani/Changa One không có dấu tiếng Việt.
const nunitoVi = Nunito_Sans({ weight: ["400", "600", "700", "800", "900"], subsets: ["latin", "vietnamese"] });

export const revalidate = 300;
const CACHE_SECONDS = 300;

const cachedJob = unstable_cache((slug: string) => getActiveJob(slug), ["careers-job-page"], {
  revalidate: CACHE_SECONDS,
});
const cachedActiveJobs = unstable_cache(() => listActiveJobs(), ["careers-active-jobs"], {
  revalidate: CACHE_SECONDS,
});

type Props = { params: Promise<{ slug: string }> };

async function loadJob(slug: string) {
  return isJobSlug(slug) ? cachedJob(slug) : null;
}

const TYPE_LABEL: Record<string, string> = {
  fulltime: "Toàn thời gian",
  parttime: "Bán thời gian",
  freelancer: "Freelancer",
  remote: "Làm từ xa",
};

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await loadJob(slug);
  if (!job) return { title: "Không tìm thấy vị trí", robots: { index: false, follow: true } };

  const full = `Tuyển ${job.title} tại Hà Nội | TD Games`;
  const title = full.length <= 60 ? full : `Tuyển ${job.title} | TD Games`;
  const description = clip(
    [job.salary ? `Lương: ${job.salary.replace(/\s*\|\s*/g, ", ")}.` : "", job.summary || job.description || ""]
      .filter(Boolean)
      .join(" "),
    160,
  );
  const path = `/careers/${job.slug}`;
  const images = ogImages(job.image_url ? { url: job.image_url, alt: job.title } : null);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: `https://tdgamestudio.com${path}`,
      siteName: "TD Games",
      type: "website",
      locale: "vi_VN",
      images,
    },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-white/10 pt-6">
      <h2 className="text-lg font-extrabold tracking-tight text-white md:text-xl">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function BulletList({ items, muted = false }: { items: string[]; muted?: boolean }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className={`flex gap-3 text-[15px] leading-relaxed ${muted ? "text-white/60" : "text-white/75"}`}>
          <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${muted ? "bg-white/40" : "bg-[#f59e0b]"}`} />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-white/50">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-relaxed text-white">{children}</dd>
    </div>
  );
}

export default async function CareerJobPage({ params }: Props) {
  const { slug } = await params;
  const job = await loadJob(slug);
  if (!job) notFound();

  let others: Awaited<ReturnType<typeof listActiveJobs>> = [];
  try {
    others = (await cachedActiveJobs()).filter((j) => j.slug !== job.slug).slice(0, 6);
  } catch (err) {
    console.error("[careers/slug] active jobs", err);
  }

  const salaryLines = (job.salary || "Thoả thuận").split("|").map((s) => s.trim()).filter(Boolean);
  const posted = new Date(job.created_at);
  const postedLabel = Number.isNaN(posted.getTime())
    ? null
    : posted.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const lists = {
    responsibilities: (job.responsibilities ?? []).filter(Boolean),
    requirements: (job.requirements ?? []).filter(Boolean),
    nice: (job.nice_to_have ?? []).filter(Boolean),
    skills: (job.skills ?? []).filter(Boolean),
  };

  return (
    <>
      <JsonLd data={jobPostingJsonLd(job)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Tuyển dụng", path: "/careers" },
          { name: job.title, path: `/careers/${job.slug}` },
        ])}
      />
      <SiteHeader />
      <main lang="vi" className={`min-h-screen bg-[#090a10] text-white ${nunitoVi.className}`}>
        <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-24 md:px-6 md:pt-32">
          <nav aria-label="Breadcrumb" className="text-xs text-white/50">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-[#f59e0b]">Trang chủ</Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/careers" className="hover:text-[#f59e0b]">Tuyển dụng</Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-white/75" aria-current="page">{job.title}</li>
            </ol>
          </nav>

          <header className="mt-6 grid gap-6 md:grid-cols-[1fr_280px] md:items-start">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff9f1a]">Đang tuyển</p>
              <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
                Tuyển dụng {job.title}{" "}
                <span className="text-[#f59e0b]">— TD Games (Hà Nội)</span>
              </h1>
              {job.categories?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {job.categories.map((cat) => (
                    <span
                      key={cat}
                      className="rounded-md border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f59e0b]"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
              {job.summary && <p className="mt-5 text-base leading-relaxed text-white/80">{job.summary}</p>}
              <JobActions slug={job.slug} />
            </div>
            {job.image_url && (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 md:aspect-square">
                <Image
                  src={job.image_url}
                  alt={job.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 280px"
                />
              </div>
            )}
          </header>

          <dl className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Mức lương">
              {salaryLines.map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </Fact>
            <Fact label="Địa điểm">{job.location || "Hà Nội"}</Fact>
            <Fact label="Hình thức">{TYPE_LABEL[job.type] ?? job.type}</Fact>
            <Fact label="Cấp bậc">{job.level || "Mọi cấp bậc"}</Fact>
          </dl>
          {postedLabel && <p className="mt-3 text-xs text-white/45">Đăng ngày {postedLabel}</p>}

          <div className="mt-10 flex flex-col gap-8">
            {job.description && job.description !== job.summary && (
              <Section title="Mô tả công việc">
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-white/75">{job.description}</p>
              </Section>
            )}
            {lists.responsibilities.length > 0 && (
              <Section title="Trách nhiệm">
                <BulletList items={lists.responsibilities} />
              </Section>
            )}
            {lists.requirements.length > 0 && (
              <Section title="Yêu cầu">
                <BulletList items={lists.requirements} />
              </Section>
            )}
            {lists.nice.length > 0 && (
              <Section title="Ưu tiên">
                <BulletList items={lists.nice} muted />
              </Section>
            )}
            {lists.skills.length > 0 && (
              <Section title="Kỹ năng">
                <div className="flex flex-wrap gap-2">
                  {lists.skills.map((skill) => (
                    <span key={skill} className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80">
                      {skill}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>

          <div className="mt-12 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/[0.06] p-5 md:flex md:items-center md:justify-between md:gap-6 md:p-6">
            <div>
              <p className="text-base font-extrabold text-white">Sẵn sàng gia nhập TD Games?</p>
              <p className="mt-1 text-sm text-white/65">
                Văn phòng: Toà Hoà Bình Green City, 505 Minh Khai, Hà Nội.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <JobActions slug={job.slug} compact />
            </div>
          </div>

          <section className="mt-14">
            <h2 className="text-lg font-extrabold tracking-tight text-white md:text-xl">Vị trí khác đang tuyển</h2>
            {others.length > 0 && (
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {others.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/careers/${o.slug}`}
                      className="block rounded-lg border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-[#f59e0b]/40 hover:bg-white/[0.05]"
                    >
                      <span className="block font-bold text-white">{o.title}</span>
                      {o.salary && (
                        <span className="mt-1 block text-xs text-white/55">{o.salary.split("|")[0].trim()}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/careers"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#f59e0b] hover:underline"
            >
              ← Xem tất cả vị trí tại TD Games
            </Link>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
