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
  animation: string;
  skin: string;
  active: boolean;
};

const BLANK: FormState = {
  name: "",
  slug: "",
  json_url: "",
  atlas_url: "",
  animation: "idle",
  skin: "",
  active: true,
};

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function SpineTab({ adminKey }: Props) {
  const [characters, setCharacters] = useState<SpineCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // editor
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);

  // file uploads
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [skelFile, setSkelFile] = useState<File | null>(null);
  const [atlasFile, setAtlasFile] = useState<File | null>(null);
  const [pngFiles, setPngFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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
  }

  function openEdit(c: SpineCharacter) {
    setEditId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      json_url: c.json_url ?? "",
      atlas_url: c.atlas_url ?? "",
      animation: c.animation,
      skin: c.skin ?? "",
      active: c.active,
    });
    clearFiles();
  }

  function closeEditor() {
    setEditId(null);
    setForm(BLANK);
    clearFiles();
    setMsg("");
  }

  function clearFiles() {
    setJsonFile(null);
    setSkelFile(null);
    setAtlasFile(null);
    setPngFiles([]);
  }

  async function handleUploadFiles(): Promise<{ jsonUrl: string; atlasUrl: string }> {
    const slug = form.slug.trim();
    let jsonUrl = form.json_url;
    let atlasUrl = form.atlas_url;

    // Upload JSON or SKEL
    const skeletonFile = skelFile ?? jsonFile;
    if (skeletonFile) {
      const res = await uploadSpineFile({ adminKey, file: skeletonFile, slug });
      jsonUrl = res.url;
    }

    // Upload atlas
    if (atlasFile) {
      const res = await uploadSpineFile({ adminKey, file: atlasFile, slug });
      atlasUrl = res.url;
    }

    // Upload PNGs (fire and forget — URLs will be referenced by atlas)
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
        animation: form.animation.trim() || "idle",
        skin: form.skin.trim() || undefined,
        active: form.active,
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

  // ── File drop zone ─────────────────────────────────────────────────────────
  function FileZone({
    label,
    accept,
    file,
    onPick,
    hint,
  }: {
    label: string;
    accept: string;
    file: File | null;
    onPick: (f: File) => void;
    hint?: string;
  }) {
    return (
      <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed border-white/20 bg-white/3 px-3 py-3 text-center transition hover:border-amber-500/50 hover:bg-white/5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
          {label}
        </span>
        {file ? (
          <span className="text-xs text-amber-400 break-all">{file.name}</span>
        ) : (
          <span className="text-[11px] text-white/25">{hint ?? "Kéo hoặc chọn file"}</span>
        )}
        <input
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
          }}
        />
      </label>
    );
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
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-white">{c.name}</span>
                  <code className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] text-amber-400">
                    {c.slug}
                  </code>
                  <span className="text-[10px] text-white/35">anim: {c.animation}</span>
                  {c.skin && (
                    <span className="text-[10px] text-white/35">skin: {c.skin}</span>
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
              <div className="flex shrink-0 gap-2">
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

            {/* Animation + Skin */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Animation
                </span>
                <input
                  value={form.animation}
                  onChange={(e) => setForm((f) => ({ ...f, animation: e.target.value }))}
                  placeholder="idle"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/25 focus:border-amber-500 focus:outline-none font-mono"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Skin (tuỳ chọn)
                </span>
                <input
                  value={form.skin}
                  onChange={(e) => setForm((f) => ({ ...f, skin: e.target.value }))}
                  placeholder="default"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/25 focus:border-amber-500 focus:outline-none font-mono"
                />
              </label>
            </div>

            {/* File upload zones */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Files Spine (upload → R2 tự động)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <FileZone
                  label="JSON (hoặc SKEL)"
                  accept=".json,.skel"
                  file={skelFile ?? jsonFile}
                  onPick={(f) => {
                    if (f.name.endsWith(".skel")) setSkelFile(f);
                    else setJsonFile(f);
                  }}
                  hint=".json hoặc .skel"
                />
                <FileZone
                  label="Atlas"
                  accept=".atlas"
                  file={atlasFile}
                  onPick={setAtlasFile}
                  hint=".atlas"
                />
              </div>

              {/* PNG textures */}
              <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed border-white/20 bg-white/3 px-3 py-3 text-center transition hover:border-amber-500/50 hover:bg-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Texture PNGs (có thể chọn nhiều)
                </span>
                {pngFiles.length > 0 ? (
                  <span className="text-xs text-amber-400">
                    {pngFiles.map((f) => f.name).join(", ")}
                  </span>
                ) : (
                  <span className="text-[11px] text-white/25">.png</span>
                )}
                <input
                  type="file"
                  accept=".png,.webp"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length) setPngFiles(files);
                  }}
                />
              </label>
            </div>

            {/* Manual URL fallback */}
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

            {/* Active toggle */}
            <label className="flex cursor-pointer items-center gap-3">
              <div
                onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                className={`relative h-5 w-9 rounded-full transition-colors ${
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
