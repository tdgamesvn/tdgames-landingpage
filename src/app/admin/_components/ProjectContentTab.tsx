"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchProjectContent,
  fetchProjectSlugs,
  replaceProjectSlot,
  uploadFile,
} from "../_lib/api";
import { formatBytes, getPresetById } from "../_lib/sizes";
import type { ProjectContent, ProjectSlot } from "../_lib/types";
import { MediaPreview } from "./MediaPreview";
import { SlotHint } from "./SlotHint";
import { UploadZone } from "./UploadZone";

type Props = {
  adminKey: string;
};

function shortUrl(url: string) {
  if (!url) return "";
  const max = 64;
  if (url.length <= max) return url;
  const tail = url.slice(-Math.max(20, max - 24));
  return `…${tail}`;
}

function slotKey(s: ProjectSlot) {
  if (s.source === "cover") return "cover";
  return `${s.moduleId ?? ""}:${s.moduleVariant ?? ""}:${s.srcIndex ?? 0}`;
}

function suggestedPresetId(s: ProjectSlot | null): string {
  if (!s) return "free";
  if (s.source === "cover") return "case_study_hero";
  switch (s.moduleVariant) {
    case "fullGif":
      return "fullgif";
    case "full":
    case "video":
    case "videoEmbed":
      return s.kind === "video" ? "fullgif" : "case_study_hero";
    case "banner":
      return "mosaic_banner";
    case "duo":
    case "trio":
    case "square":
      return "gallery_item";
    case "portrait":
      return "gallery_item";
    case "vimeo":
      return "free";
    default:
      return "free";
  }
}

export function ProjectContentTab({ adminKey }: Props) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState<ProjectContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedKey, setSelectedKey] = useState<string>("");
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [pickedPreviewUrl, setPickedPreviewUrl] = useState("");
  const [slotPresetId, setSlotPresetId] = useState("free");
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const replacePanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!adminKey) return;
    void (async () => {
      try {
        const list = await fetchProjectSlugs(adminKey);
        setSlugs(list);
        if (list.length && !slug) setSlug(list[0]);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Failed to load slugs");
      }
    })();
  }, [adminKey, slug]);

  useEffect(() => {
    if (!adminKey || !slug) return;
    void loadSlug(slug);
  }, [adminKey, slug]);

  useEffect(() => {
    if (!pickedFile) {
      setPickedPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(pickedFile);
    setPickedPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pickedFile]);

  async function loadSlug(s: string) {
    setLoading(true);
    setErrorMsg("");
    setSelectedKey("");
    setPickedFile(null);
    setStatusMsg("");
    try {
      const data = await fetchProjectContent(adminKey, s);
      setContent(data);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed");
      setContent(null);
    } finally {
      setLoading(false);
    }
  }

  const allSlots = useMemo<ProjectSlot[]>(() => {
    if (!content) return [];
    const out: ProjectSlot[] = [];
    if (content.coverImage) {
      out.push({ source: "cover", url: content.coverImage, kind: detectKindBasic(content.coverImage) });
    }
    for (const m of content.modules) out.push(m);
    return out;
  }, [content]);

  const selectedSlot = useMemo(
    () => allSlots.find((s) => slotKey(s) === selectedKey) ?? null,
    [allSlots, selectedKey],
  );

  function pickSlot(s: ProjectSlot) {
    const k = slotKey(s);
    setSelectedKey(k);
    setSlotPresetId(suggestedPresetId(s));
    setPickedFile(null);
    setStatusMsg("");
    requestAnimationFrame(() => {
      replacePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function handleApplyReplace() {
    if (!selectedSlot || !pickedFile || !content) return;
    setUploading(true);
    setStatusMsg("Uploading…");
    setErrorMsg("");
    try {
      const uploaded = await uploadFile({ adminKey, file: pickedFile });
      setStatusMsg("Rewriting source + DB…");
      const result = await replaceProjectSlot({
        adminKey,
        slug: content.slug,
        oldUrl: selectedSlot.url,
        newUrl: uploaded.url,
      });
      const parts: string[] = [];
      parts.push(`✓ Source updated (${result.replacements} ref)`);
      if (result.dbUpdated > 0) parts.push(`DB sync (${result.dbUpdated} row)`);
      if (result.warning) parts.push(`⚠ ${result.warning}`);
      setStatusMsg(parts.join(" · "));
      setPickedFile(null);
      await loadSlug(content.slug);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Replace failed");
      setStatusMsg("");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end gap-3">
        <div>
          <h2 className="text-xl font-semibold">Project content</h2>
          <p className="text-xs text-white/60 mt-1">
            Thay từng ảnh/video trong case study. Upload file → tự động ghi đè URL trong{" "}
            <span className="font-mono text-[11px]">project-data.ts</span> và sync DB.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="text-xs text-white/50 uppercase tracking-wide">Project</label>
          <select
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={!slugs.length || loading}
            className="rounded-md border border-white/15 bg-zinc-900 text-white px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
          >
            {slugs.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={() => slug && loadSlug(slug)}
            disabled={!slug || loading}
            className="rounded-md border border-white/20 px-3 py-1.5 text-xs hover:bg-white/5 disabled:opacity-40"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </header>

      {errorMsg ? <p className="text-xs text-rose-300">{errorMsg}</p> : null}

      {content ? (
        <>
          <p className="text-xs text-white/50">
            File:{" "}
            <span className="font-mono text-[11px] text-white/80">{content.filePath}</span> ·{" "}
            <span className="text-white/70">{allSlots.length} slot</span>
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allSlots.map((s) => {
              const k = slotKey(s);
              const isSel = selectedKey === k;
              return (
                <button
                  key={k}
                  onClick={() => pickSlot(s)}
                  className={
                    "text-left rounded-lg border p-3 space-y-2 transition-colors " +
                    (isSel
                      ? "border-indigo-400 ring-2 ring-indigo-400/40 bg-indigo-500/5"
                      : "border-white/10 hover:border-white/30 bg-white/[0.02]")
                  }
                >
                  <MediaPreview url={s.url} height={140} />
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide">
                    <span
                      className={
                        "rounded px-1.5 py-0.5 " +
                        (s.source === "cover"
                          ? "bg-amber-400/20 text-amber-200"
                          : "bg-white/10 text-white/70")
                      }
                    >
                      {s.source === "cover" ? "COVER" : s.moduleVariant}
                    </span>
                    {s.source === "module" ? (
                      <span className="text-white/50">{s.moduleId}</span>
                    ) : null}
                    {typeof s.srcIndex === "number" ? (
                      <span className="text-white/40">[{s.srcIndex}]</span>
                    ) : null}
                    <span className="ml-auto text-white/40">{s.kind}</span>
                  </div>
                  <p className="text-[11px] text-white/55 break-all line-clamp-2">{shortUrl(s.url)}</p>
                </button>
              );
            })}
          </div>

          {selectedSlot ? (
            <section
              ref={replacePanelRef}
              className="rounded-xl border border-indigo-400/40 bg-indigo-500/[0.04] p-4 space-y-3 mt-4"
            >
              <header className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">Replace slot</h3>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/70">
                  {selectedSlot.source === "cover"
                    ? "COVER"
                    : `${selectedSlot.moduleVariant} · ${selectedSlot.moduleId}${
                        typeof selectedSlot.srcIndex === "number" ? ` [${selectedSlot.srcIndex}]` : ""
                      }`}
                </span>
                <button
                  onClick={() => setSelectedKey("")}
                  className="ml-auto rounded-md border border-white/15 px-2 py-1 text-[11px] hover:bg-white/5"
                >
                  Close
                </button>
              </header>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wide text-white/50">Hiện tại</p>
                  <MediaPreview url={selectedSlot.url} height={180} />
                  <p className="text-[10px] text-white/50 break-all">{selectedSlot.url}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wide text-white/50">File mới</p>
                  <UploadZone
                    onPick={setPickedFile}
                    accept={getPresetById(slotPresetId).acceptedTypes.join(",")}
                    uploading={uploading}
                    selectedFile={pickedFile}
                    selectedPreviewUrl={pickedPreviewUrl}
                    height={180}
                    label="Kéo & thả file mới, hoặc bấm để chọn"
                  />
                </div>
              </div>

              <SlotHint
                value={slotPresetId}
                onChange={setSlotPresetId}
                fileSize={pickedFile?.size}
                fileType={pickedFile?.type}
              />

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={handleApplyReplace}
                  disabled={!pickedFile || uploading}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-40"
                >
                  {uploading ? "Replacing…" : "Replace this slot"}
                </button>
                {pickedFile ? (
                  <span className="text-[11px] text-white/60">
                    {pickedFile.name} · {formatBytes(pickedFile.size)}
                  </span>
                ) : null}
                {statusMsg ? <span className="text-[11px] text-emerald-300">{statusMsg}</span> : null}
              </div>
            </section>
          ) : (
            <p className="text-xs text-white/40 italic">Chọn 1 ô bên trên để bắt đầu replace.</p>
          )}
        </>
      ) : (
        <p className="text-sm text-white/50">Loading project content…</p>
      )}
    </div>
  );
}

function detectKindBasic(url: string): ProjectSlot["kind"] {
  if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)) return "video";
  if (/\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(url)) return "image";
  return "other";
}
