"use client";

import { useEffect, useState } from "react";
import { uploadFile } from "../_lib/api";
import type { TeamMember } from "../_lib/types";
import { UploadZone } from "./UploadZone";

type Props = { adminKey: string };

const BLANK: Omit<TeamMember, "id"> = { name: "", title: "", photo: "" };

export function TeamTab({ adminKey }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // editor state
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<TeamMember, "id">>(BLANK);
  const [uploadFile_, setUploadFile_] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // ── load ──────────────────────────────────────────────────────────────────
  useEffect(() => { void load(); }, []); // eslint-disable-line

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/team", {
        headers: { "x-admin-key": adminKey },
        cache: "no-store",
      });
      const data = await res.json();
      setMembers(data.team ?? []);
    } catch {
      setMsg("❌ Không tải được danh sách team");
    } finally {
      setLoading(false);
    }
  }

  // ── save all ──────────────────────────────────────────────────────────────
  async function saveAll(next: TeamMember[]) {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/team", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ team: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMembers(next);
      setMsg("✅ Đã lưu!");
    } catch (e) {
      setMsg(`❌ ${e instanceof Error ? e.message : "Lỗi lưu"}`);
    } finally {
      setSaving(false);
    }
  }

  // ── open editor ───────────────────────────────────────────────────────────
  function openNew() {
    setEditId("__new__");
    setForm(BLANK);
    setUploadFile_(null);
  }

  function openEdit(m: TeamMember) {
    setEditId(m.id);
    setForm({ name: m.name, title: m.title, photo: m.photo });
    setUploadFile_(null);
  }

  function closeEditor() {
    setEditId(null);
    setForm(BLANK);
    setUploadFile_(null);
  }

  // ── upload photo then save ────────────────────────────────────────────────
  async function handleSave() {
    let photoUrl = form.photo;

    if (uploadFile_) {
      setUploading(true);
      try {
        const result = await uploadFile({ adminKey, file: uploadFile_ });
        photoUrl = result.url;
      } catch (e) {
        setMsg(`❌ Upload thất bại: ${e instanceof Error ? e.message : "lỗi"}`);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    if (!form.name.trim() || !form.title.trim() || !photoUrl.trim()) {
      setMsg("⚠️ Điền đủ tên, chức danh và ảnh");
      return;
    }

    let next: TeamMember[];
    if (editId === "__new__") {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: form.name.trim(),
        title: form.title.trim(),
        photo: photoUrl.trim(),
      };
      next = [...members, newMember];
    } else {
      next = members.map((m) =>
        m.id === editId
          ? { ...m, name: form.name.trim(), title: form.title.trim(), photo: photoUrl.trim() }
          : m,
      );
    }
    await saveAll(next);
    closeEditor();
  }

  // ── delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm("Xóa thành viên này?")) return;
    await saveAll(members.filter((m) => m.id !== id));
  }

  // ── move order ────────────────────────────────────────────────────────────
  async function move(id: string, dir: -1 | 1) {
    const idx = members.findIndex((m) => m.id === id);
    if (idx < 0) return;
    const next = [...members];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    await saveAll(next);
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Team members</h2>
          <p className="text-xs text-white/50 mt-0.5">
            Hiện {members.length} thành viên — hiển thị tại /about (section "Passionate Artists")
          </p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-amber-400 transition"
        >
          + Thêm thành viên
        </button>
      </div>

      {msg && (
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
          {msg}
        </div>
      )}

      {/* member grid */}
      {loading ? (
        <p className="text-white/40 text-sm">Đang tải…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {members.map((m, idx) => (
            <div
              key={m.id}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5"
            >
              {/* photo */}
              <div className="relative aspect-square w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.photo}
                  alt={m.name}
                  className="h-full w-full object-cover grayscale transition-all group-hover:grayscale-0"
                />
              </div>

              {/* info */}
              <div className="px-3 py-2">
                <p className="truncate text-sm font-bold text-white">{m.name}</p>
                <p className="truncate text-xs text-amber-400">{m.title}</p>
              </div>

              {/* actions */}
              <div className="flex items-center gap-1 border-t border-white/10 px-2 py-1.5">
                <button
                  onClick={() => move(m.id, -1)}
                  disabled={idx === 0 || saving}
                  className="rounded px-2 py-1 text-xs text-white/40 hover:text-white disabled:opacity-20 transition"
                  title="Lên trên"
                >
                  ←
                </button>
                <button
                  onClick={() => move(m.id, 1)}
                  disabled={idx === members.length - 1 || saving}
                  className="rounded px-2 py-1 text-xs text-white/40 hover:text-white disabled:opacity-20 transition"
                  title="Xuống dưới"
                >
                  →
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => openEdit(m)}
                  className="rounded px-2 py-1 text-xs text-white/60 hover:text-white transition"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={saving}
                  className="rounded px-2 py-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── editor modal ──────────────────────────────────────────────────── */}
      {editId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              {editId === "__new__" ? "Thêm thành viên mới" : "Sửa thông tin"}
            </h3>

            {/* name */}
            <label className="block space-y-1">
              <span className="text-xs text-white/50 uppercase tracking-wider">Tên</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nguyễn Văn A"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500"
              />
            </label>

            {/* title */}
            <label className="block space-y-1">
              <span className="text-xs text-white/50 uppercase tracking-wider">Chức danh</span>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="2D Animator"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500"
              />
            </label>

            {/* photo */}
            <div className="space-y-1">
              <span className="text-xs text-white/50 uppercase tracking-wider">Ảnh</span>
              <UploadZone
                onPick={setUploadFile_}
                uploading={uploading}
                accept="image/*"
                label="Kéo & thả ảnh hoặc bấm để chọn"
                height={160}
                selectedFile={uploadFile_}
                selectedPreviewUrl={
                  uploadFile_ ? URL.createObjectURL(uploadFile_) : form.photo || undefined
                }
              />
              {!uploadFile_ && (
                <input
                  value={form.photo}
                  onChange={(e) => setForm((f) => ({ ...f, photo: e.target.value }))}
                  placeholder="https://cdn.tdgamestudio.com/..."
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/70 placeholder-white/30 focus:outline-none focus:border-amber-500 mt-2"
                />
              )}
            </div>

            {msg && <p className="text-xs text-amber-400">{msg}</p>}

            <div className="flex gap-2 pt-2">
              <button
                onClick={closeEditor}
                className="flex-1 rounded-lg border border-white/15 px-4 py-2 text-sm text-white/60 hover:text-white transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black hover:bg-amber-400 disabled:opacity-50 transition"
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
