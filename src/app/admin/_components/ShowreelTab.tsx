"use client";

import { useCallback, useEffect, useState } from "react";
import { UploadZone } from "./UploadZone";
import { uploadFile } from "../_lib/api";

type Item = {
  id?: string;
  tab: "art" | "animation" | "vfx";
  category: string;
  title: string;
  url: string;
  thumbnail: string | null;
  kind: "image" | "video";
  sort_order: number;
  active: boolean;
};

const TABS = ["art", "animation", "vfx"] as const;

// Khớp MAX_FILE_SIZE ở /api/admin/upload và client_max_body_size của nginx.
const MAX_UPLOAD = 100 * 1024 * 1024;

// Gợi ý cho datalist — không ràng buộc, sếp gõ category mới thoải mái.
const CATEGORY_HINTS: Record<string, string[]> = {
  art: ["UI", "Concept", "Environment", "Character", "Prop", "Illustration"],
  animation: ["Character", "UI", "Cinematic", "Spine", "Frame by Frame"],
  vfx: ["Character", "UI", "Cinematic", "Skill Effect", "Particle"],
};

export function ShowreelTab({ adminKey }: { adminKey: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<Item["tab"]>("art");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // đếm thay vì boolean: kéo 10 file → 10 upload song song, cờ boolean sẽ tắt sớm.
  const [pending, setPending] = useState(0);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/showreel", {
        headers: { "x-admin-key": adminKey },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "load failed");
      setItems(data.items ?? []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    void load();
  }, [load]);

  // Lỗi phải CỘNG DỒN: kéo 10 file mà ghi đè thì chỉ thấy lỗi của file cuối,
  // 9 file chết im — đúng cái đã làm sếp tưởng "upload chỉ được 1 cái".
  const addErr = (line: string) => setMsg((m) => (m ? `${m}\n${line}` : line));

  async function onPick(file: File) {
    if (file.size > MAX_UPLOAD) {
      addErr(`${file.name}: ${(file.size / 1048576).toFixed(1)}MB — quá 100MB, nén trước đã.`);
      return;
    }
    setPending((p) => p + 1);
    try {
      const { url } = await uploadFile({ adminKey, file });
      const kind: Item["kind"] = file.type.startsWith("video/") ? "video" : "image";
      setItems((prev) => [
        ...prev,
        {
          tab,
          category: "",
          title: "",
          url,
          thumbnail: null,
          kind,
          sort_order: prev.filter((i) => i.tab === tab).length,
          active: true,
        },
      ]);
    } catch (e) {
      addErr(`${file.name}: ${e instanceof Error ? e.message : "upload lỗi"}`);
    } finally {
      setPending((p) => p - 1);
    }
  }

  function patch(index: number, next: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...next } : it)));
  }

  function move(index: number, dir: -1 | 1) {
    setItems((prev) => {
      // Đổi chỗ với item liền kề CÙNG TAB — không phải index liền kề trong mảng,
      // nếu không thì nút mũi tên nhảy lung tung khi các tab trộn lẫn.
      const myTab = prev[index].tab;
      let neighbour = -1;
      for (let i = index + dir; i >= 0 && i < prev.length; i += dir) {
        if (prev[i].tab === myTab) {
          neighbour = i;
          break;
        }
      }
      if (neighbour < 0) return prev;
      const next = [...prev];
      [next[index], next[neighbour]] = [next[neighbour], next[index]];
      return next.map((it, i) => ({ ...it, sort_order: i }));
    });
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const payload = items.map((it, idx) => ({ ...it, sort_order: idx }));
      const res = await fetch("/api/admin/showreel", {
        method: "PUT",
        headers: { "content-type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ items: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "save failed");
      setMsg(`Đã lưu ${data.count} item.`);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Lưu lỗi");
    } finally {
      setSaving(false);
    }
  }

  const visible = items
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => it.tab === tab);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "rounded-md px-3 py-1.5 text-sm capitalize " +
              (tab === t ? "bg-indigo-600 text-white" : "text-white/70 hover:bg-white/10")
            }
          >
            {t} ({items.filter((i) => i.tab === t).length})
          </button>
        ))}
        <span className="ml-auto" />
        <a
          href="/showreel"
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5"
        >
          Xem trang ↗
        </a>
        <button
          onClick={save}
          disabled={saving || loading}
          className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium hover:bg-emerald-500 disabled:opacity-40"
        >
          {saving ? "Đang lưu…" : "Lưu"}
        </button>
      </div>

      <UploadZone
        onPick={onPick}
        multiple
        uploading={pending > 0}
        height={140}
        label={`Kéo & thả nhiều ảnh/video vào đây — sẽ thêm vào tab "${tab}"`}
      />
      {pending > 0 ? (
        <p className="text-xs text-white/60">Đang upload {pending} file…</p>
      ) : null}

      {msg ? <p className="whitespace-pre-line text-xs text-amber-300/80">{msg}</p> : null}

      <datalist id="showreel-categories">
        {CATEGORY_HINTS[tab].map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {loading ? (
        <p className="text-sm text-white/50">Đang tải…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-white/50">Chưa có item nào trong tab này.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ it, i }) => (
            <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 space-y-2">
              <div className="h-36 overflow-hidden rounded bg-black/40">
                {it.kind === "video" ? (
                  <video src={it.url} muted loop playsInline className="h-full w-full object-contain" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.url} alt="" className="h-full w-full object-contain" />
                )}
              </div>
              <input
                value={it.title}
                onChange={(e) => patch(i, { title: e.target.value })}
                placeholder="Tiêu đề (tuỳ chọn)"
                className="w-full rounded border border-white/15 bg-white/5 px-2 py-1 text-xs"
              />
              <input
                value={it.category}
                list="showreel-categories"
                onChange={(e) => patch(i, { category: e.target.value })}
                placeholder="Category — vd: UI, Concept, Cinematic"
                className="w-full rounded border border-white/15 bg-white/5 px-2 py-1 text-xs"
              />
              <div className="flex items-center gap-2 text-xs">
                <select
                  value={it.tab}
                  onChange={(e) => patch(i, { tab: e.target.value as Item["tab"] })}
                  className="rounded border border-white/15 bg-zinc-800 px-2 py-1"
                >
                  {TABS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-white/60">
                  <input
                    type="checkbox"
                    checked={it.active}
                    onChange={(e) => patch(i, { active: e.target.checked })}
                  />
                  hiện
                </label>
                <span className="ml-auto flex gap-1">
                  <button onClick={() => move(i, -1)} className="rounded border border-white/15 px-2 hover:bg-white/10">↑</button>
                  <button onClick={() => move(i, 1)} className="rounded border border-white/15 px-2 hover:bg-white/10">↓</button>
                  <button
                    onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                    className="rounded border border-red-500/40 px-2 text-red-300 hover:bg-red-500/10"
                  >
                    ✕
                  </button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
