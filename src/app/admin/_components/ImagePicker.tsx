"use client";

import { useEffect, useState } from "react";
import { fetchMedia, generateImage, uploadFile } from "../_lib/api";
import type { MediaAsset } from "../_lib/types";
import { UploadZone } from "./UploadZone";

type Tab = "library" | "upload" | "ai";

type Props = {
  adminKey: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
};

export function ImagePicker({ adminKey, value, onChange, label = "Image" }: Props) {
  const [tab, setTab] = useState<Tab>("library");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [search, setSearch] = useState("");
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (tab !== "library" || media.length) return;
    fetchMedia(adminKey)
      .then((items) => setMedia(items.filter((m) => m.kind === "image")))
      .catch((e) => setMsg(String(e)));
  }, [tab, media.length, adminKey]);

  async function run(fn: () => Promise<string>, okMsg: string) {
    setBusy(true);
    setMsg("");
    try {
      onChange(await fn());
      setMsg(okMsg);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const filtered = search
    ? media.filter((m) => (m.label || m.current_url).toLowerCase().includes(search.toLowerCase()))
    : media;

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-white/60">{label}</label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://cdn.tdgamestudio.com/…"
        className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
      />

      <div className="flex gap-1 text-xs">
        {(
          [
            ["library", "Kho"],
            ["upload", "Upload"],
            ["ai", "AI"],
          ] as const
        ).map(([id, text]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={
              "rounded-md px-3 py-1.5 transition-colors " +
              (tab === id ? "bg-indigo-500/25 text-white" : "text-white/50 hover:bg-white/10")
            }
          >
            {text}
          </button>
        ))}
      </div>

      {tab === "library" && (
        <div className="space-y-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo label hoặc URL…"
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-400"
          />
          <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto rounded-lg border border-white/10 p-2">
            {filtered.slice(0, 60).map((m) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={m.id}
                src={m.current_url}
                alt={m.label || ""}
                onClick={() => onChange(m.current_url)}
                className={
                  "h-16 w-full cursor-pointer rounded object-cover ring-offset-2 ring-offset-black hover:opacity-80 " +
                  (value === m.current_url ? "ring-2 ring-indigo-400" : "")
                }
              />
            ))}
            {!filtered.length && (
              <p className="col-span-4 py-6 text-center text-xs text-white/40">Không có ảnh nào</p>
            )}
          </div>
        </div>
      )}

      {tab === "upload" && (
        <UploadZone
          accept="image/*"
          height={150}
          uploading={busy}
          onPick={(file) =>
            void run(async () => (await uploadFile({ adminKey, file })).url, "Đã upload ✓")
          }
        />
      )}

      {tab === "ai" && (
        <div className="space-y-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="VD: dark amber abstract gradient, subtle grain, wide banner…"
            className="w-full resize-none rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
          />
          <p className="text-[11px] text-white/40">
            Chỉ dùng cho nền / trừu tượng / sơ đồ khái niệm. Character và art asset phải do artist
            vẽ.
          </p>
          <button
            type="button"
            disabled={busy || !prompt.trim()}
            onClick={() =>
              void run(
                async () => (await generateImage({ adminKey, prompt })).url,
                "Đã tạo & lưu vào kho ✓",
              )
            }
            className="rounded-md border border-white/15 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-40"
          >
            {busy ? "Đang tạo… (~1 phút)" : "Tạo ảnh"}
          </button>
        </div>
      )}

      {msg && <p className="text-xs text-white/60">{msg}</p>}

      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="preview" className="h-28 w-full rounded-lg object-cover" />
      )}
    </div>
  );
}
