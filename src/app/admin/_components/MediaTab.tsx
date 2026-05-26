"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchMedia, uploadFile } from "../_lib/api";
import { getPresetById } from "../_lib/sizes";
import type { MediaAsset, MediaKind, MediaSource } from "../_lib/types";
import { MediaPreview } from "./MediaPreview";
import { SlotHint } from "./SlotHint";
import { UploadZone } from "./UploadZone";

const PAGE_SIZE = 24;

type Props = {
  adminKey: string;
};

export function MediaTab({ adminKey }: Props) {
  const replacePanelRef = useRef<HTMLDivElement | null>(null);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [keyword, setKeyword] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | MediaKind>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | MediaSource>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [pageFilter, setPageFilter] = useState("all");
  const [page, setPage] = useState(0);

  const [pickedMediaId, setPickedMediaId] = useState("");
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [pickedPreviewUrl, setPickedPreviewUrl] = useState("");
  const [slotPresetId, setSlotPresetId] = useState("free");

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [lastUploadedUrl, setLastUploadedUrl] = useState("");
  const [copyMsg, setCopyMsg] = useState("");

  const pickedMedia = useMemo(
    () => media.find((m) => m.id === pickedMediaId) ?? null,
    [media, pickedMediaId],
  );

  useEffect(() => {
    if (!adminKey) return;
    void load();
  }, [adminKey]);

  useEffect(() => {
    if (!pickedFile) {
      setPickedPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(pickedFile);
    setPickedPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pickedFile]);

  async function load() {
    if (!adminKey) {
      setErrorMsg("Cần admin key");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const items = await fetchMedia(adminKey);
      setMedia(items);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  // Map page filter value → substring to match in used_by FILE PATHS
  // used_by stores source file paths like "src/app/about/page.tsx"
  const PAGE_FILTER_OPTIONS = [
    { id: "all",        label: "Tất cả trang" },
    { id: "home",       label: "Home",         match: "home-projects-section" },
    { id: "about",      label: "About",        match: "src/app/about/" },
    { id: "portfolio",  label: "Portfolio",    match: "src/app/portfolio/" },
    { id: "services",   label: "Services",     match: "src/app/services/" },
    { id: "careers",    label: "Careers",      match: "src/app/careers/" },
    { id: "blog",       label: "Blog",         match: "src/app/blog/" },
    { id: "contact",    label: "Contact",      match: "src/app/contact/" },
    { id: "spine-demo", label: "Spine Demo",   match: "spine-demo" },
    { id: "no-page",    label: "Chưa dùng ở đâu", match: null },
  ] as const;

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const pageOpt = PAGE_FILTER_OPTIONS.find((o) => o.id === pageFilter);
    return media.filter((m) => {
      if (kindFilter !== "all" && m.kind !== kindFilter) return false;
      if (sourceFilter !== "all" && m.source_type !== sourceFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      // Page filter
      if (pageFilter !== "all" && pageOpt) {
        if (pageOpt.id === "no-page") {
          if ((m.used_by ?? []).length > 0) return false;
        } else if ("match" in pageOpt && pageOpt.match) {
          const usedByStr = (m.used_by ?? []).join(" ").toLowerCase();
          if (!usedByStr.includes(pageOpt.match)) return false;
        }
      }
      if (!kw) return true;
      const haystack = [
        m.original_url,
        m.current_url,
        m.r2_key ?? "",
        ...(m.used_by ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(kw);
    });
  }, [media, keyword, kindFilter, sourceFilter, statusFilter, pageFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPage(0);
  }, [keyword, kindFilter, sourceFilter, statusFilter, pageFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visibleItems = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  async function handleUpload() {
    if (!adminKey) {
      setUploadMsg("Cần admin key");
      return;
    }
    if (!pickedFile) {
      setUploadMsg("Chưa chọn file");
      return;
    }
    setUploading(true);
    setUploadMsg("");
    try {
      const result = await uploadFile({
        adminKey,
        file: pickedFile,
        mediaId: pickedMediaId || undefined,
      });
      setLastUploadedUrl(result.url);
      setUploadMsg(pickedMediaId ? "Replace thành công" : "Upload thành công");
      await load();
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleCopy() {
    if (!lastUploadedUrl) return;
    try {
      await navigator.clipboard.writeText(lastUploadedUrl);
      setCopyMsg("Đã copy URL");
      setTimeout(() => setCopyMsg(""), 1500);
    } catch {
      setCopyMsg("Copy failed");
    }
  }

  const preset = getPresetById(slotPresetId);
  const presetAccept = preset.acceptedTypes.join(",");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">Media library</h2>
        <button
          onClick={load}
          className="rounded-md border border-white/20 px-3 py-1.5 text-xs"
        >
          {loading ? "Loading…" : `Refresh (${media.length})`}
        </button>
        {errorMsg ? <span className="text-xs text-rose-300">{errorMsg}</span> : null}
      </header>

      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <section
          ref={replacePanelRef}
          className="space-y-4 rounded-lg border border-white/10 bg-zinc-900 p-4 scroll-mt-24"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
            {pickedMediaId ? "Replace media" : "Upload mới"}
          </h3>

          <SlotHint
            value={slotPresetId}
            onChange={setSlotPresetId}
            fileSize={pickedFile?.size}
            fileType={pickedFile?.type}
          />

          <UploadZone
            onPick={(f) => {
              setPickedFile(f);
              setUploadMsg("");
            }}
            accept={presetAccept || "image/*,video/*"}
            uploading={uploading}
            selectedFile={pickedFile}
            selectedPreviewUrl={pickedPreviewUrl}
            label="Kéo & thả ảnh/video, hoặc bấm để chọn"
          />

          {pickedMedia ? (
            <div className="grid gap-3 md:grid-cols-2 rounded-md border border-white/10 p-3">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-white/50">
                  Asset cũ (sẽ bị thay)
                </p>
                <MediaPreview url={pickedMedia.current_url} height={140} />
                <p className="text-[10px] break-all text-white/50">{pickedMedia.current_url}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-white/50">
                  Asset mới (preview)
                </p>
                <MediaPreview
                  url={pickedPreviewUrl}
                  height={140}
                  emptyLabel="Chọn file để xem preview"
                />
                <p className="text-[10px] break-all text-white/50">
                  {pickedFile ? `${pickedFile.name}` : "—"}
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading || !pickedFile}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              {uploading
                ? "Đang upload…"
                : pickedMediaId
                  ? "Replace asset đã chọn"
                  : "Upload làm asset mới"}
            </button>
            {pickedMediaId ? (
              <button
                onClick={() => {
                  setPickedMediaId("");
                  setPickedFile(null);
                }}
                className="rounded-md border border-white/20 px-3 py-2 text-xs"
              >
                Bỏ chọn replace target
              </button>
            ) : null}
          </div>

          {uploadMsg ? <p className="text-xs text-white/70">{uploadMsg}</p> : null}

          {lastUploadedUrl ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
              <p className="text-xs text-emerald-300">URL mới:</p>
              <p className="break-all text-xs text-white/80">{lastUploadedUrl}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="rounded-md border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-xs"
                >
                  Copy URL
                </button>
                {copyMsg ? <span className="text-xs text-white/60">{copyMsg}</span> : null}
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-3 rounded-lg border border-white/10 bg-zinc-900 p-4">
          <header className="space-y-3">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo URL, key, used_by…"
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2 text-xs">
              <FilterPills
                label="Kind"
                value={kindFilter}
                onChange={(v) => setKindFilter(v as "all" | MediaKind)}
                options={[
                  { id: "all", label: "All" },
                  { id: "image", label: "Image" },
                  { id: "gif", label: "GIF" },
                  { id: "video", label: "Video" },
                  { id: "other", label: "Other" },
                ]}
              />
              <FilterPills
                label="Source"
                value={sourceFilter}
                onChange={(v) => setSourceFilter(v as "all" | MediaSource)}
                options={[
                  { id: "all", label: "All" },
                  { id: "local_public", label: "Local" },
                  { id: "external", label: "External" },
                ]}
              />
              <FilterPills
                label="Status"
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as "all" | "active" | "archived")}
                options={[
                  { id: "all", label: "All" },
                  { id: "active", label: "Active" },
                  { id: "archived", label: "Archived" },
                ]}
              />
              {/* Page filter */}
              <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
                <span className="text-[10px] uppercase tracking-wide text-white/40">Page</span>
                <select
                  value={pageFilter}
                  onChange={(e) => setPageFilter(e.target.value)}
                  className={`rounded bg-transparent px-1 py-0.5 text-[11px] outline-none cursor-pointer ${
                    pageFilter !== "all" ? "text-amber-400" : "text-white/60"
                  }`}
                >
                  {PAGE_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-zinc-900 text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>
                Hiển thị {visibleItems.length} / {filtered.length} (toàn bộ {media.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="rounded border border-white/15 px-2 py-1 disabled:opacity-30"
                >
                  ← Prev
                </button>
                <span>
                  {safePage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage >= totalPages - 1}
                  className="rounded border border-white/15 px-2 py-1 disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            </div>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => {
              const isPicked = item.id === pickedMediaId;
              return (
                <article
                  key={item.id}
                  className={
                    "rounded-md border p-2 space-y-2 transition-colors " +
                    (isPicked
                      ? "border-indigo-400 bg-indigo-400/10"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]")
                  }
                >
                  <MediaPreview url={item.current_url || item.original_url} height={120} />
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-white/50">
                    <span>
                      {item.kind} · {item.source_type}
                    </span>
                    <span
                      className={
                        item.status === "active" ? "text-emerald-300" : "text-white/40"
                      }
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="break-all text-[10px] text-white/60">
                    {item.current_url || item.original_url}
                  </p>
                  {item.used_by && item.used_by.length > 0 ? (
                    <p className="break-all text-[10px] text-white/40">
                      used: {item.used_by.slice(0, 2).join(", ")}
                      {item.used_by.length > 2 ? `, +${item.used_by.length - 2}` : ""}
                    </p>
                  ) : null}
                  <button
                    onClick={() => {
                      const next = isPicked ? "" : item.id;
                      setPickedMediaId(next);
                      setUploadMsg("");
                      if (next) {
                        requestAnimationFrame(() => {
                          replacePanelRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        });
                      }
                    }}
                    className={
                      "w-full rounded-md px-2 py-1 text-xs " +
                      (isPicked
                        ? "bg-indigo-600 text-white"
                        : "border border-white/20 text-white/80 hover:bg-white/10")
                    }
                  >
                    {isPicked ? "Đang chọn — bỏ" : "Chọn để replace"}
                  </button>
                </article>
              );
            })}
            {visibleItems.length === 0 && !loading ? (
              <div className="col-span-full rounded-md border border-white/10 bg-white/[0.02] p-6 text-center text-xs text-white/50">
                Không có media nào khớp filter.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function FilterPills<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
      <span className="text-[10px] uppercase tracking-wide text-white/40">{label}</span>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={
            "rounded px-2 py-0.5 text-[11px] transition-colors " +
            (value === opt.id ? "bg-white/15 text-white" : "text-white/60 hover:text-white")
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
