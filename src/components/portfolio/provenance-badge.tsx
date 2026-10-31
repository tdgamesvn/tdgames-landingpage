import type { ProjectProvenance } from "@/lib/project-provenance";

/** Badge + 1 dòng ghi nguồn gốc ở hero case study (dự án founder làm trước khi có TD Games). */
export function ProvenanceNotice({ provenance }: { provenance: ProjectProvenance }) {
  return (
    <div className="mt-4 max-w-2xl" data-provenance={provenance.kind}>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8h.01M11 12h1v4h1" />
        </svg>
        {provenance.label}
      </span>
      <p className="mt-2 text-[12px] leading-relaxed text-white/60">{provenance.note}</p>
    </div>
  );
}

/** Nhãn nhỏ trên thẻ dự án trong lưới / "More Projects". */
export function ProvenanceChip({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-white/25 bg-black/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm ${className}`}
      data-provenance-chip
    >
      {label}
    </span>
  );
}
