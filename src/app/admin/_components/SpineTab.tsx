"use client";

import { useEffect, useState } from "react";
import {
  fetchSpineCharacters,
  createSpineCharacter,
  patchSpineCharacter,
  deleteSpineCharacter,
  uploadSpineFile,
} from "../_lib/api";
import type { SpineCharacter } from "../_lib/types";

type Props = { adminKey: string };

type FormState = {
  name: string;
  slug: string;
  json_url: string;
  atlas_url: string;
  animations: string[];
  skin: string;
  active: boolean;
  scale: number;
  offset_x: number;
  offset_y: number;
  premultiplied_alpha: boolean;
  mix_duration: number;
};

const BLANK: FormState = {
  name: "",
  slug: "",
  json_url: "",
  atlas_url: "",
  animations: ["idle"],
  skin: "",
  active: true,
  scale: 1.0,
  offset_x: 0,
  offset_y: 0,
  premultiplied_alpha: true,
  mix_duration: 0.0,
};

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Flatten 1 entry (file hoặc folder) từ drag-and-drop thành danh sách File. */
async function collectFiles(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) =>
      (entry as FileSystemFileEntry).file(resolve, reject)
    );
    return [file];
  }
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const out: File[] = [];
  // readEntries chỉ trả tối đa ~100 entry mỗi lần → loop đến khi rỗng
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
      reader.readEntries(resolve, reject)
    );
    if (batch.length === 0) break;
    for (const e of batch) out.push(...(await collectFiles(e)));
  }
  return out;
}

/** Một ô duy nhất: kéo cả thư mục Spine (hoặc nhiều file) vào, tự phân loại theo đuôi. */
function SpineDropZone({
  jsonFile,
  skelFile,
  atlasFile,
  pngFiles,
  onFiles,
}: {
  jsonFile: File | null;
  skelFile: File | null;
  atlasFile: File | null;
  pngFiles: File[];
  onFiles: (files: File[]) => void;
}) {
  const [over, setOver] = useState(false);
  const skeleton = skelFile ?? jsonFile;

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const entries = Array.from(e.dataTransfer.items)
          .map((i) => i.webkitGetAsEntry?.())
          .filter((x): x is FileSystemEntry => Boolean(x));
        const dropped = Array.from(e.dataTransfer.files);
        void (async () => {
          const files = entries.length
            ? (await Promise.all(entries.map(collectFiles))).flat()
            : dropped;
          if (files.length) onFiles(files);
        })();
      }}
      className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed px-3 py-5 text-center transition ${
        over
          ? "border-amber-500 bg-amber-500/10"
          : "border-white/20 bg-white/3 hover:border-amber-500/50 hover:bg-white/5"
      }`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
        Kéo cả thư mục Spine vào đây
      </span>
      <span className="text-[11px] text-white/25">
        .json/.skel + .atlas + .png · hoặc click để chọn nhiều file
      </span>
      <div className="mt-1 space-y-0.5 text-[11px]">
        <p className={skeleton ? "text-amber-400" : "text-white/25"}>
          {skeleton ? `✓ ${skeleton.name}` : "· chưa có .json/.skel"}
        </p>
        <p className={atlasFile ? "text-amber-400" : "text-white/25"}>
          {atlasFile ? `✓ ${atlasFile.name}` : "· chưa có .atlas"}
        </p>
        <p className={pngFiles.length ? "text-amber-400" : "text-white/25"}>
          {pngFiles.length
            ? `✓ ${pngFiles.length} texture: ${pngFiles.map((f) => f.name).join(", ")}`
            : "· chưa có texture .png"}
        </p>
      </div>
      <input
        type="file"
        accept=".json,.skel,.atlas,.png,.webp"
        multiple
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
        }}
      />
    </label>
  );
}

export function SpineTab({ adminKey }: Props) {
  const [characters, setCharacters] = useState<SpineCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // editor
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);

  // parsed from Spine JSON file
  const [parsedSkins, setParsedSkins] = useState<string[]>([]);
  const [parsedAnimations, setParsedAnimations] = useState<string[]>([]);

  // texture pages đọc từ file .atlas trên CDN (DB không lưu texture)
  const [textures, setTextures] = useState<{ name: string; ok: boolean | null }[]>([]);

  // file uploads
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [skelFile, setSkelFile] = useState<File | null>(null);
  const [atlasFile, setAtlasFile] = useState<File | null>(null);
  const [pngFiles, setPngFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // UI: show/hide replace-file section when editing existing character
  const [showReplaceFiles, setShowReplaceFiles] = useState(false);

  useEffect(() => { void load(); }, []); // eslint-disable-line

  async function load() {
    setLoading(true);
    try {
      const chars = await fetchSpineCharacters(adminKey);
      setCharacters(chars);
    } catch {
      setMsg("❌ Không tải được danh sách characters");
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditId("__new__");
    setForm(BLANK);
    clearFiles();
    resetParsed();
    setShowReplaceFiles(false);
  }

  function openEdit(c: SpineCharacter) {
    setEditId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      json_url: c.json_url ?? "",
      atlas_url: c.atlas_url ?? "",
      animations: c.animations && c.animations.length > 0 ? c.animations : ["idle"],
      skin: c.skin ?? "",
      active: c.active,
      scale: c.scale ?? 1.0,
      offset_x: c.offset_x ?? 0,
      offset_y: c.offset_y ?? 0,
      premultiplied_alpha: c.premultiplied_alpha ?? true,
      mix_duration: c.mix_duration ?? 0.0,
    });
    clearFiles();
    resetParsed();
    setShowReplaceFiles(false);
    // Auto-fetch JSON từ CDN để populate skin dropdown + animation picker
    if (c.json_url?.endsWith(".json")) {
      void fetchAndParseJsonUrl(c.json_url);
    }
    if (c.atlas_url) void loadTextures(c.atlas_url);
  }

  function closeEditor() {
    setEditId(null);
    setForm(BLANK);
    clearFiles();
    resetParsed();
    setMsg("");
    setShowReplaceFiles(false);
  }

  function clearFiles() {
    setJsonFile(null);
    setSkelFile(null);
    setAtlasFile(null);
    setPngFiles([]);
  }

  function resetParsed() {
    setParsedSkins([]);
    setParsedAnimations([]);
    setTextures([]);
  }

  /**
   * Texture PNG không nằm trong DB — tên trang texture chỉ có trong file .atlas.
   * Đọc .atlas trên CDN, lấy tên các trang, rồi HEAD từng file xem còn sống không.
   */
  async function loadTextures(atlasUrl: string) {
    const ask = (url: string, check = false) =>
      fetch(
        `/api/admin/spine-json?${check ? "check=1&" : ""}url=${encodeURIComponent(url)}`,
        { headers: { "x-admin-key": adminKey } }
      );

    try {
      const res = await ask(atlasUrl);
      if (!res.ok) return;
      const text = await res.text();
      // Trang texture = dòng chỉ chứa tên file ảnh (không thụt đầu dòng như bounds/rotate)
      const names = [
        ...new Set(
          text
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => /^[^:]+\.(png|webp)$/i.test(l))
        ),
      ];
      if (names.length === 0) return;
      setTextures(names.map((name) => ({ name, ok: null })));

      const base = atlasUrl.slice(0, atlasUrl.lastIndexOf("/") + 1);
      const checked = await Promise.all(
        names.map(async (name) => {
          try {
            const r = await ask(base + name, true);
            const j = (await r.json()) as { ok?: boolean };
            return { name, ok: Boolean(j.ok) };
          } catch {
            return { name, ok: false };
          }
        })
      );
      setTextures(checked);
    } catch {
      // im lặng — chỉ là thông tin phụ trợ
    }
  }

  // ── Parse Spine JSON client-side ────────────────────────────────────────────

  function applyParsedSpineData(text: string, keepExistingAnimations = false) {
    const data = JSON.parse(text) as {
      skins?: Array<{ name: string } | string>;
      animations?: Record<string, unknown>;
    };

    const skins: string[] = (data.skins ?? []).map((s) =>
      typeof s === "string" ? s : s.name
    ).filter(Boolean);

    const animationNames: string[] = Object.keys(data.animations ?? {});

    setParsedSkins(skins);
    setParsedAnimations(animationNames);

    setForm((f) => {
      const validCurrent = f.animations.filter((a) => animationNames.includes(a));
      return {
        ...f,
        // Nếu keepExistingAnimations: giữ list hiện tại (khi load edit)
        // Nếu không: reset nếu không còn valid (khi chọn file mới)
        animations: validCurrent.length > 0
          ? validCurrent
          : (keepExistingAnimations ? f.animations : []),
        skin: f.skin || (skins.includes("default") ? "default" : (skins[0] ?? "")),
      };
    });
  }

  async function parseSpineJson(file: File) {
    try {
      const text = await file.text();
      applyParsedSpineData(text, false);
    } catch {
      setParsedSkins([]);
      setParsedAnimations([]);
      setMsg("⚠️ Không parse được file JSON — có thể không phải Spine JSON. Dùng text input thủ công.");
    }
  }

  async function fetchAndParseJsonUrl(jsonUrl: string) {
    if (!jsonUrl.endsWith(".json")) return;
    try {
      const res = await fetch(
        `/api/admin/spine-json?url=${encodeURIComponent(jsonUrl)}`,
        { headers: { "x-admin-key": adminKey } }
      );
      if (!res.ok) return;
      const text = await res.text();
      applyParsedSpineData(text, true);
    } catch {
      // Silently fail — user can still edit manually
    }
  }

  /** Phân loại file (từ folder drop hoặc multi-select) theo đuôi. */
  function acceptFiles(files: File[]) {
    const pngs: File[] = [];
    for (const f of files) {
      const n = f.name.toLowerCase();
      if (n.startsWith(".")) continue; // bỏ .DS_Store & bạn bè
      if (n.endsWith(".skel")) setSkelFile(f);
      else if (n.endsWith(".json")) {
        setJsonFile(f);
        void parseSpineJson(f);
      } else if (n.endsWith(".atlas")) setAtlasFile(f);
      else if (n.endsWith(".png") || n.endsWith(".webp")) pngs.push(f);
    }
    if (pngs.length) setPngFiles(pngs);
    const missing = [
      files.some((f) => /\.(json|skel)$/i.test(f.name)) ? null : ".json/.skel",
      files.some((f) => /\.atlas$/i.test(f.name)) ? null : ".atlas",
      pngs.length ? null : "texture .png",
    ].filter(Boolean);
    setMsg(missing.length ? `⚠️ Thư mục thiếu: ${missing.join(", ")}` : "");
  }

  async function handleUploadFiles(): Promise<{ jsonUrl: string; atlasUrl: string }> {
    const slug = form.slug.trim();
    let jsonUrl = form.json_url;
    let atlasUrl = form.atlas_url;

    const skeletonFile = skelFile ?? jsonFile;
    if (skeletonFile) {
      const res = await uploadSpineFile({ adminKey, file: skeletonFile, slug });
      jsonUrl = res.url;
    }

    if (atlasFile) {
      const res = await uploadSpineFile({ adminKey, file: atlasFile, slug });
      atlasUrl = res.url;
    }

    for (const png of pngFiles) {
      await uploadSpineFile({ adminKey, file: png, slug });
    }

    return { jsonUrl, atlasUrl };
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) {
      setMsg("⚠️ Tên và slug là bắt buộc");
      return;
    }

    setUploading(true);
    setMsg("Đang upload files…");
    let jsonUrl = form.json_url;
    let atlasUrl = form.atlas_url;

    try {
      const uploaded = await handleUploadFiles();
      jsonUrl = uploaded.jsonUrl;
      atlasUrl = uploaded.atlasUrl;
    } catch (e) {
      setMsg(`❌ Upload thất bại: ${e instanceof Error ? e.message : "lỗi"}`);
      setUploading(false);
      return;
    }
    setUploading(false);

    setSaving(true);
    setMsg("Đang lưu…");

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        json_url: jsonUrl || undefined,
        atlas_url: atlasUrl || undefined,
        animations: form.animations.length > 0 ? form.animations : ["idle"],
        skin: form.skin.trim() || undefined,
        active: form.active,
        scale: form.scale,
        offset_x: form.offset_x,
        offset_y: form.offset_y,
        premultiplied_alpha: form.premultiplied_alpha,
        mix_duration: form.mix_duration,
      };

      if (editId === "__new__") {
        const created = await createSpineCharacter({ adminKey, payload });
        setCharacters((prev) => [created, ...prev]);
      } else if (editId) {
        const updated = await patchSpineCharacter({ adminKey, id: editId, updates: payload });
        setCharacters((prev) => prev.map((c) => (c.id === editId ? updated : c)));
      }

      setMsg("✅ Đã lưu!");
      closeEditor();
    } catch (e) {
      setMsg(`❌ Lỗi: ${e instanceof Error ? e.message : "không xác định"}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: SpineCharacter) {
    if (!confirm(`Xóa character "${c.name}"?`)) return;
    try {
      await deleteSpineCharacter({ adminKey, id: c.id });
      setCharacters((prev) => prev.filter((x) => x.id !== c.id));
      setMsg("✅ Đã xóa");
    } catch (e) {
      setMsg(`❌ Lỗi xóa: ${e instanceof Error ? e.message : "không xác định"}`);
    }
  }

  async function toggleActive(c: SpineCharacter) {
    try {
      const updated = await patchSpineCharacter({
        adminKey,
        id: c.id,
        updates: { active: !c.active },
      });
      setCharacters((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
    } catch (e) {
      setMsg(`❌ ${e instanceof Error ? e.message : "lỗi"}`);
    }
  }

  // ── Animation helpers ────────────────────────────────────────────────────────
  function toggleAnimation(anim: string) {
    setForm((f) => {
      if (f.animations.includes(anim)) {
        return { ...f, animations: f.animations.filter((a) => a !== anim) };
      }
      return { ...f, animations: [...f.animations, anim] };
    });
  }

  function moveAnimation(index: number, direction: -1 | 1) {
    setForm((f) => {
      const arr = [...f.animations];
      const target = index + direction;
      if (target < 0 || target >= arr.length) return f;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return { ...f, animations: arr };
    });
  }

  function removeAnimation(index: number) {
    setForm((f) => ({
      ...f,
      animations: f.animations.filter((_, i) => i !== index),
    }));
  }

  function duplicateAnimation(index: number) {
    setForm((f) => {
      const arr = [...f.animations];
      arr.splice(index + 1, 0, arr[index]);
      return { ...f, animations: arr };
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Spine Characters</h2>
          <p className="mt-0.5 text-xs text-white/50">
            Upload .json/.skel + .atlas + texture PNGs · site đọc từ DB theo slug
          </p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-amber-400"
        >
          + Thêm character
        </button>
      </div>

      {msg && !editId && (
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
          {msg}
        </div>
      )}

      {/* Character list */}
      {loading ? (
        <p className="text-sm text-white/40">Đang tải…</p>
      ) : characters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 py-14 text-center">
          <p className="text-sm text-white/40">Chưa có character nào. Thêm character đầu tiên.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {characters.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              {/* active badge */}
              <button
                onClick={() => void toggleActive(c)}
                title={c.active ? "Active — click để tắt" : "Inactive — click để bật"}
                className={`h-2 w-2 shrink-0 rounded-full transition ${
                  c.active ? "bg-emerald-400" : "bg-white/20"
                }`}
              />

              {/* info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-bold text-white">{c.name}</span>
                  <code className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] text-amber-400">
                    {c.slug}
                  </code>
                  <span className="text-[10px] text-white/35">
                    anim: {c.animations?.join(" → ") || "idle"}
                  </span>
                  {c.skin && (
                    <span className="text-[10px] text-white/35">skin: {c.skin}</span>
                  )}
                  <span className="text-[10px] text-white/25">
                    {(c.scale ?? 1).toFixed(2)}× ({c.offset_x ?? 0},{c.offset_y ?? 0})
                  </span>
                  {!(c.premultiplied_alpha ?? true) && (
                    <span className="rounded bg-sky-500/20 px-1 py-0.5 text-[9px] font-bold text-sky-400">
                      straight-α
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex gap-3 text-[10px] text-white/30 truncate">
                  {c.json_url ? (
                    <span className="truncate" title={c.json_url}>
                      JSON/SKEL: {c.json_url.split("/").slice(-1)[0]}
                    </span>
                  ) : (
                    <span className="text-red-400/60">❌ Chưa có JSON/SKEL</span>
                  )}
                  {c.atlas_url ? (
                    <span className="truncate" title={c.atlas_url}>
                      Atlas: {c.atlas_url.split("/").slice(-1)[0]}
                    </span>
                  ) : (
                    <span className="text-red-400/60">❌ Chưa có atlas</span>
                  )}
                </div>
              </div>

              {/* actions */}
              <div className="flex shrink-0 flex-col gap-1.5 items-end">
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(c)}
                    className="rounded px-2 py-1 text-xs text-white/50 transition hover:text-white"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => void handleDelete(c)}
                    className="rounded px-2 py-1 text-xs text-red-400 transition hover:text-red-300"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* ── Editor modal ─────────────────────────────────────────────────────── */}
      {editId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-base font-bold text-white">
              {editId === "__new__" ? "Thêm character mới" : "Sửa character"}
            </h3>

            {/* Name + Slug */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Tên hiển thị
                </span>
                <input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name,
                      slug: editId === "__new__" ? toSlug(name) : f.slug,
                    }));
                  }}
                  placeholder="Careers Hero"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/25 focus:border-amber-500 focus:outline-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Slug (unique)
                </span>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: toSlug(e.target.value) }))}
                  placeholder="careers-hero"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/25 focus:border-amber-500 focus:outline-none font-mono"
                />
              </label>
            </div>

            {/* File upload zones — new vs edit */}
            {editId === "__new__" ? (
              /* ── CREATE MODE: show upload zones ───────────────────────────── */
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Files Spine (upload → R2 tự động)
                </p>
                <SpineDropZone
                  jsonFile={jsonFile}
                  skelFile={skelFile}
                  atlasFile={atlasFile}
                  pngFiles={pngFiles}
                  onFiles={acceptFiles}
                />
                {parsedAnimations.length > 0 && (
                  <p className="text-[10px] text-emerald-400/80">
                    ✓ Parsed {parsedAnimations.length} animations, {parsedSkins.length} skins từ JSON
                  </p>
                )}
              </div>
            ) : (
              /* ── EDIT MODE: show existing files + collapsible replace section */
              <div className="space-y-2">
                {/* Current file status */}
                <div className="rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                    Files hiện tại
                  </p>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 text-xs leading-4">✓</span>
                    <div className="min-w-0">
                      <span className="text-[10px] text-white/40 font-bold uppercase">JSON/SKEL</span>
                      {form.json_url ? (
                        <p className="font-mono text-[11px] text-white/60 truncate" title={form.json_url}>
                          {form.json_url.split("/").pop()}
                        </p>
                      ) : (
                        <p className="text-[11px] text-red-400/60">Chưa có file</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 text-xs leading-4">✓</span>
                    <div className="min-w-0">
                      <span className="text-[10px] text-white/40 font-bold uppercase">Atlas</span>
                      {form.atlas_url ? (
                        <p className="font-mono text-[11px] text-white/60 truncate" title={form.atlas_url}>
                          {form.atlas_url.split("/").pop()}
                        </p>
                      ) : (
                        <p className="text-[11px] text-red-400/60">Chưa có file</p>
                      )}
                    </div>
                  </div>
                  {/* Texture — DB không lưu, đọc tên từ chính file .atlas */}
                  <div className="flex items-start gap-2">
                    <span
                      className={`shrink-0 text-xs leading-4 ${
                        textures.some((t) => t.ok === false)
                          ? "text-red-400"
                          : textures.length > 0 && textures.every((t) => t.ok)
                          ? "text-emerald-400"
                          : "text-white/30"
                      }`}
                    >
                      {textures.some((t) => t.ok === false) ? "✕" : "✓"}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Texture (theo .atlas)
                      </span>
                      {textures.length === 0 ? (
                        <p className="text-[11px] text-white/30">
                          {form.atlas_url ? "Đang đọc .atlas…" : "Chưa có atlas để đọc"}
                        </p>
                      ) : (
                        textures.map((t) => (
                          <p
                            key={t.name}
                            className={`font-mono text-[11px] truncate ${
                              t.ok === false ? "text-red-400" : "text-white/60"
                            }`}
                            title={t.name}
                          >
                            {t.ok === null ? "…" : t.ok ? "✓" : "❌ mất trên CDN"} {t.name}
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Toggle replace section */}
                <button
                  type="button"
                  onClick={() => {
                    setShowReplaceFiles((v) => !v);
                    if (showReplaceFiles) {
                      clearFiles();
                      resetParsed();
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-lg border border-dashed border-white/15 px-3 py-2 text-[11px] text-white/40 transition hover:border-amber-500/40 hover:text-white/60"
                >
                  <span>{showReplaceFiles ? "✕ Huỷ thay thế file" : "↑ Thay thế file (tuỳ chọn)"}</span>
                </button>

                {showReplaceFiles && (
                  <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/3 p-3">
                    <p className="text-[10px] text-amber-400/70">
                      Chọn file mới để thay thế. Để trống = giữ nguyên file cũ.
                    </p>
                    <SpineDropZone
                      jsonFile={jsonFile}
                      skelFile={skelFile}
                      atlasFile={atlasFile}
                      pngFiles={pngFiles}
                      onFiles={acceptFiles}
                    />
                    {parsedAnimations.length > 0 && (
                      <p className="text-[10px] text-emerald-400/80">
                        ✓ Parsed {parsedAnimations.length} animations, {parsedSkins.length} skins từ JSON
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Skin picker ───────────────────────────────────────────────── */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Skin {parsedSkins.length > 0 ? `(${parsedSkins.length} available)` : "(tuỳ chọn)"}
              </span>
              {parsedSkins.length > 0 ? (
                <select
                  value={form.skin}
                  onChange={(e) => setForm((f) => ({ ...f, skin: e.target.value }))}
                  className="w-full rounded-lg border border-white/15 bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none font-mono"
                >
                  <option value="">(skin mặc định)</option>
                  {parsedSkins.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={form.skin}
                  onChange={(e) => setForm((f) => ({ ...f, skin: e.target.value }))}
                  placeholder="default (hoặc để trống)"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/25 focus:border-amber-500 focus:outline-none font-mono"
                />
              )}
            </div>

            {/* ── Animation picker ──────────────────────────────────────────── */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Animations {parsedAnimations.length > 0 ? `(${parsedAnimations.length} available)` : ""}
              </span>

              {parsedAnimations.length > 0 ? (
                <div className="space-y-2">
                  {/* Available animations — checkbox list */}
                  <div className="rounded-lg border border-white/10 bg-white/3 p-2">
                    <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-white/30">
                      Available (tick để thêm)
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-0.5">
                      {parsedAnimations.map((anim) => {
                        const selected = form.animations.includes(anim);
                        return (
                          <label
                            key={anim}
                            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 transition hover:bg-white/5"
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleAnimation(anim)}
                              className="accent-amber-500"
                            />
                            <span className={`font-mono text-xs ${selected ? "text-amber-400" : "text-white/60"}`}>
                              {anim}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected animations — ordered list with reorder */}
                  {form.animations.length > 0 && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
                      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-amber-400/60">
                        Selected (thứ tự phát)
                      </p>
                      <div className="space-y-1">
                        {form.animations.map((anim, idx) => (
                          <div
                            key={`${anim}-${idx}`}
                            className="flex items-center gap-1.5 rounded bg-white/5 px-2 py-1"
                          >
                            <span className="text-[10px] font-mono text-white/30 w-4 text-right shrink-0">
                              {idx + 1}.
                            </span>
                            <span className="flex-1 font-mono text-xs text-white/80 truncate">{anim}</span>
                            <div className="flex shrink-0 gap-0.5">
                              <button
                                type="button"
                                onClick={() => moveAnimation(idx, -1)}
                                disabled={idx === 0}
                                className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-white/40 transition hover:text-white disabled:opacity-20"
                                title="Lên"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => moveAnimation(idx, 1)}
                                disabled={idx === form.animations.length - 1}
                                className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-white/40 transition hover:text-white disabled:opacity-20"
                                title="Xuống"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                onClick={() => duplicateAnimation(idx)}
                                className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-amber-400/60 transition hover:text-amber-300"
                                title="Duplicate (chèn thêm 1 bản copy phía dưới)"
                              >
                                ⊕
                              </button>
                              <button
                                type="button"
                                onClick={() => removeAnimation(idx)}
                                className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-red-400 transition hover:text-red-300"
                                title="Xóa khỏi danh sách"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {form.animations.length > 1 && (
                        <p className="mt-1.5 text-[9px] text-white/25">
                          Sẽ phát tuần tự: {form.animations.join(" → ")} → (loop)
                        </p>
                      )}
                    </div>
                  )}

                  {form.animations.length === 0 && (
                    <p className="text-[10px] text-amber-400/60">
                      ⚠️ Chọn ít nhất 1 animation. Mặc định "idle" sẽ được dùng.
                    </p>
                  )}
                </div>
              ) : (
                /* Fallback: text input khi chưa parse được JSON */
                <div className="space-y-1">
                  <input
                    value={form.animations[0] ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        animations: e.target.value ? [e.target.value] : ["idle"],
                      }))
                    }
                    placeholder="idle"
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/25 focus:border-amber-500 focus:outline-none font-mono"
                  />
                  <p className="text-[9px] text-white/25">
                    Upload file .json để mở skin/animation picker · Có thể nhập thủ công tên animation
                  </p>
                </div>
              )}
            </div>

            {/* Manual URL — only show when creating new */}
            {editId === "__new__" && (
              <div className="space-y-2 border-t border-white/8 pt-3">
                <p className="text-[10px] text-white/30">
                  Hoặc nhập URL CDN trực tiếp (nếu đã upload thủ công):
                </p>
                <input
                  value={form.json_url}
                  onChange={(e) => setForm((f) => ({ ...f, json_url: e.target.value }))}
                  placeholder="https://cdn.tdgamestudio.com/landing/spine/…/character.json"
                  className="w-full rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-[11px] text-white/60 placeholder-white/20 focus:border-amber-500 focus:outline-none font-mono"
                />
                <input
                  value={form.atlas_url}
                  onChange={(e) => setForm((f) => ({ ...f, atlas_url: e.target.value }))}
                  placeholder="https://cdn.tdgamestudio.com/landing/spine/…/character.atlas"
                  className="w-full rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-[11px] text-white/60 placeholder-white/20 focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>
            )}



            {/* ── Visual Controls ───────────────────────────────────────────── */}
            <div className="space-y-3 border-t border-white/8 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Visual Controls
              </p>

              {/* Scale */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Scale</span>
                  <span className="font-mono text-xs text-amber-400">{form.scale.toFixed(2)}×</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0.3} max={3.0} step={0.05}
                    value={form.scale}
                    onChange={(e) => setForm((f) => ({ ...f, scale: parseFloat(e.target.value) }))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-amber-500"
                  />
                  <input
                    type="number"
                    min={0.3} max={3.0} step={0.05}
                    value={form.scale}
                    onChange={(e) => setForm((f) => ({ ...f, scale: Math.max(0.3, Math.min(3.0, parseFloat(e.target.value) || 1)) }))}
                    className="w-16 rounded border border-white/15 bg-white/5 px-2 py-1 text-center text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Offset X */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Offset X</span>
                  <span className="font-mono text-xs text-amber-400">{form.offset_x}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-400} max={400} step={1}
                    value={form.offset_x}
                    onChange={(e) => setForm((f) => ({ ...f, offset_x: parseInt(e.target.value) }))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-amber-500"
                  />
                  <input
                    type="number"
                    min={-400} max={400} step={1}
                    value={form.offset_x}
                    onChange={(e) => setForm((f) => ({ ...f, offset_x: Math.max(-400, Math.min(400, parseInt(e.target.value) || 0)) }))}
                    className="w-16 rounded border border-white/15 bg-white/5 px-2 py-1 text-center text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Offset Y */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Offset Y</span>
                  <span className="font-mono text-xs text-amber-400">{form.offset_y}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-400} max={400} step={1}
                    value={form.offset_y}
                    onChange={(e) => setForm((f) => ({ ...f, offset_y: parseInt(e.target.value) }))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-amber-500"
                  />
                  <input
                    type="number"
                    min={-400} max={400} step={1}
                    value={form.offset_y}
                    onChange={(e) => setForm((f) => ({ ...f, offset_y: Math.max(-400, Math.min(400, parseInt(e.target.value) || 0)) }))}
                    className="w-16 rounded border border-white/15 bg-white/5 px-2 py-1 text-center text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Reset button */}
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, scale: 1.0, offset_x: 0, offset_y: 0 }))}
                className="text-[10px] text-white/30 transition hover:text-white/60"
              >
                ↺ Reset scale &amp; offset
              </button>

              {/* Mix Duration */}
              <div className="space-y-1 border-t border-white/8 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Animation Mix
                  </span>
                  <span className="font-mono text-xs text-amber-400">
                    {form.mix_duration === 0 ? "Off (hard cut)" : `${form.mix_duration.toFixed(2)}s`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0} max={1.0} step={0.05}
                    value={form.mix_duration}
                    onChange={(e) => setForm((f) => ({ ...f, mix_duration: parseFloat(e.target.value) }))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-amber-500"
                  />
                  <input
                    type="number"
                    min={0} max={1.0} step={0.05}
                    value={form.mix_duration}
                    onChange={(e) => setForm((f) => ({ ...f, mix_duration: Math.max(0, Math.min(1.0, parseFloat(e.target.value) || 0)) }))}
                    className="w-16 rounded border border-white/15 bg-white/5 px-2 py-1 text-center text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
                <p className="text-[9px] text-white/25">
                  0 = hard cut. 0.2–0.4s thường đủ mượt. Chỉ ảnh hưởng khi có nhiều animation.
                </p>
              </div>
            </div>

            {/* Active + Premultiplied Alpha toggles */}
            <div className="space-y-3 border-t border-white/8 pt-3">
              <label className="flex cursor-pointer items-center gap-3">
                <div
                  onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                    form.active ? "bg-amber-500" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      form.active ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <span className="text-sm text-white/70">Active (hiển thị trên site)</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <div
                  onClick={() => setForm((f) => ({ ...f, premultiplied_alpha: !f.premultiplied_alpha }))}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                    form.premultiplied_alpha ? "bg-amber-500" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      form.premultiplied_alpha ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <div>
                  <span className="text-sm text-white/70">Premultiplied Alpha</span>
                  <p className="text-[10px] text-white/30">Tắt nếu texture bị viền đen (straight alpha)</p>
                </div>
              </label>
            </div>

            {msg && <p className="text-xs text-amber-400">{msg}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={closeEditor}
                className="flex-1 rounded-lg border border-white/15 px-4 py-2 text-sm text-white/60 transition hover:text-white"
              >
                Hủy
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving || uploading}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
              >
                {uploading ? "Đang upload…" : saving ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
