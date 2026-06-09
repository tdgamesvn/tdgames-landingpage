"use client";

import { useEffect, useRef, useState } from "react";

type PageSlot = {
  id: number;
  page: string;
  slot: string;
  url: string;
  thumb_url?: string | null;
  display_name?: string | null;
  display_label?: string | null;
  sort_order: number;
  is_active: boolean;
};

const PAGES = [
  { value: "home", label: "Home" },
  { value: "about", label: "About" },
  { value: "careers", label: "Careers" },
  { value: "services-2d-art", label: "Services — 2D Art" },
  { value: "services-2d-animation", label: "Services — 2D Animation" },
  { value: "services-2d-vfx", label: "Services — 2D VFX" },
];

const isVideoUrl = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

type Props = { adminKey: string };

export function PageSlotsTab({ adminKey }: Props) {
  const [selectedPage, setSelectedPage] = useState("home");
  const [slots, setSlots] = useState<PageSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Add new slot form
  const [addUrl, setAddUrl] = useState("");
  const [addThumb, setAddThumb] = useState("");
  const [addName, setAddName] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [addSlot, setAddSlot] = useState("hero");
  const [adding, setAdding] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editThumb, setEditThumb] = useState("");
  const [editName, setEditName] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [saving, setSaving] = useState(false);

  // Upload state: which field is uploading
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<string | null>(null); // "editUrl"|"editThumb"|"addUrl"|"addThumb"

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget.current) return;
    const field = uploadTarget.current;
    setUploadingField(field);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-admin-key": adminKey },
        body: fd,
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");
      if (field === "editUrl") setEditUrl(json.url);
      else if (field === "editThumb") setEditThumb(json.url);
      else if (field === "addUrl") setAddUrl(json.url);
      else if (field === "addThumb") setAddThumb(json.url);
      setMsg("Uploaded ✓");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploadingField(null);
      uploadTarget.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function triggerUpload(field: string) {
    uploadTarget.current = field;
    fileInputRef.current?.click();
  }

  useEffect(() => {
    void loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPage]);

  async function loadSlots() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/page-slots?page=${selectedPage}`, {
        headers: { "x-admin-key": adminKey },
      });
      const json = (await res.json()) as { slots?: PageSlot[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setSlots((json.slots ?? []).filter((s) => s.page === selectedPage));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!addUrl || !addSlot) return;
    setAdding(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/page-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          page: selectedPage,
          slot: addSlot,
          url: addUrl,
          thumb_url: addThumb || null,
          display_name: addName || null,
          display_label: addLabel || null,
          sort_order: slots.filter((s) => s.slot === addSlot).length,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setAddUrl("");
      setAddThumb("");
      setAddName("");
      setAddLabel("");
      await loadSlots();
      setMsg("Added ✓");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(slot: PageSlot) {
    setEditingId(slot.id);
    setEditUrl(slot.url);
    setEditThumb(slot.thumb_url ?? "");
    setEditName(slot.display_name ?? "");
    setEditLabel(slot.display_label ?? "");
  }

  async function handleSave(id: number) {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/page-slots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          url: editUrl,
          thumb_url: editThumb || null,
          display_name: editName || null,
          display_label: editLabel || null,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setEditingId(null);
      await loadSlots();
      setMsg("Saved ✓");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this slot?")) return;
    setMsg("");
    try {
      const res = await fetch(`/api/admin/page-slots/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed");
      await loadSlots();
      setMsg("Deleted ✓");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }

  async function handleMove(id: number, direction: "up" | "down") {
    const target = slots.find((s) => s.id === id);
    if (!target) return;
    const group = slots.filter((s) => s.slot === target.slot);
    const idx = group.findIndex((s) => s.id === id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === group.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const items = [
      { id: group[idx].id, sort_order: group[swapIdx].sort_order },
      { id: group[swapIdx].id, sort_order: group[idx].sort_order },
    ];
    await fetch("/api/admin/page-slots/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ items }),
    });
    await loadSlots();
  }

  const grouped = slots.reduce<Record<string, PageSlot[]>>((acc, s) => {
    (acc[s.slot] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Hidden file input shared by all upload triggers */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelected}
      />
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Page Slots</h2>
        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          className="rounded-md border border-white/15 bg-zinc-800 px-3 py-1.5 text-sm"
        >
          {PAGES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => void loadSlots()}
          className="rounded-md border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5"
        >
          Refresh
        </button>
        {msg ? <span className="text-xs text-amber-300">{msg}</span> : null}
      </div>

      {/* Slot list */}
      {loading ? (
        <p className="text-sm text-white/50">Loading…</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([slotName, items]) => (
            <section key={slotName} className="space-y-3">
              <h3 className="border-b border-white/10 pb-1 text-sm font-semibold uppercase tracking-wider text-white/50">
                slot: {slotName} ({items.length} item{items.length !== 1 ? "s" : ""})
              </h3>
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="space-y-3 rounded-lg border border-white/10 bg-zinc-900 p-4"
                >
                  <div className="flex items-start gap-4">
                    {/* Preview — show both bg + card thumbnail when both exist */}
                    <div className="flex shrink-0 gap-2">
                      {/* Background media */}
                      <div className="space-y-0.5">
                        <p className="text-center text-[9px] uppercase tracking-wider text-white/30">BG</p>
                        <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded bg-black">
                          {isVideoUrl(item.url) ? (
                            <video src={item.url} className="h-full w-full object-cover" muted playsInline autoPlay loop />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.url} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                      </div>
                      {/* Card thumbnail (only if different from url) */}
                      {item.thumb_url && item.thumb_url !== item.url && (
                        <div className="space-y-0.5">
                          <p className="text-center text-[9px] uppercase tracking-wider text-white/30">Card</p>
                          <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded bg-black">
                            {isVideoUrl(item.thumb_url) ? (
                              <video src={item.thumb_url} className="h-full w-full object-cover" muted playsInline autoPlay loop />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.thumb_url} alt="" className="h-full w-full object-cover" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Info / edit form */}
                    <div className="min-w-0 flex-1">
                      {editingId === item.id ? (
                        <div className="space-y-2">
                          {/* BG URL + upload */}
                          <div className="flex gap-1.5">
                            <input
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              placeholder="Background URL (video/image) *"
                              className="flex-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => triggerUpload("editUrl")}
                              disabled={uploadingField !== null}
                              className="rounded border border-white/15 px-2 py-1 text-[10px] hover:bg-white/5 disabled:opacity-40"
                            >
                              {uploadingField === "editUrl" ? "…" : "↑ BG"}
                            </button>
                          </div>
                          {/* Thumb URL + upload */}
                          <div className="flex gap-1.5">
                            <input
                              value={editThumb}
                              onChange={(e) => setEditThumb(e.target.value)}
                              placeholder="Card thumbnail URL"
                              className="flex-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => triggerUpload("editThumb")}
                              disabled={uploadingField !== null}
                              className="rounded border border-white/15 px-2 py-1 text-[10px] hover:bg-white/5 disabled:opacity-40"
                            >
                              {uploadingField === "editThumb" ? "…" : "↑ Card"}
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Name (e.g. MALEFICA)"
                              className="flex-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs"
                            />
                            <input
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              placeholder="Label (e.g. Skin 2 – I)"
                              className="flex-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {item.display_name && (
                            <p className="text-sm font-medium">{item.display_name}</p>
                          )}
                          {item.display_label && (
                            <p className="text-xs text-white/50">{item.display_label}</p>
                          )}
                          <p className="truncate text-[10px] text-white/30">{item.url}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col gap-1">
                      {editingId === item.id ? (
                        <>
                          <button
                            onClick={() => void handleSave(item.id)}
                            disabled={saving}
                            className="rounded bg-amber-500 px-2 py-1 text-[10px] font-medium text-black hover:bg-amber-400 disabled:opacity-40"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded border border-white/15 px-2 py-1 text-[10px] hover:bg-white/5"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(item)}
                            className="rounded border border-white/15 px-2 py-1 text-[10px] hover:bg-white/5"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void handleDelete(item.id)}
                            className="rounded border border-red-500/30 px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/10"
                          >
                            Del
                          </button>
                        </>
                      )}
                      {items.length > 1 && (
                        <>
                          <button
                            onClick={() => void handleMove(item.id, "up")}
                            disabled={idx === 0}
                            className="rounded border border-white/10 px-2 py-0.5 text-[10px] disabled:opacity-30 hover:bg-white/5"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => void handleMove(item.id, "down")}
                            disabled={idx === items.length - 1}
                            className="rounded border border-white/10 px-2 py-0.5 text-[10px] disabled:opacity-30 hover:bg-white/5"
                          >
                            ↓
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          ))}

          {Object.keys(grouped).length === 0 && (
            <p className="text-sm text-white/40">No slots for this page yet.</p>
          )}
        </div>
      )}

      {/* Add new slot */}
      <section className="space-y-3 rounded-lg border border-white/10 bg-zinc-900 p-4">
        <h3 className="text-sm font-semibold">Add Slot</h3>
        <div className="flex flex-wrap gap-2">
          <select
            value={addSlot}
            onChange={(e) => setAddSlot(e.target.value)}
            className="w-40 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs"
          >
            <option value="hero">hero</option>
            <option value="hero-carousel">hero-carousel</option>
            <option value="service-card">service-card</option>
            <option value="workflow-step">workflow-step</option>
            <option value="showcase-character-art">showcase-character-art</option>
            <option value="showcase-animation">showcase-animation</option>
            <option value="showcase-environment">showcase-environment</option>
            <option value="showcase-vfx">showcase-vfx</option>
            <option value="gallery">gallery</option>
          </select>
          {/* BG URL + upload */}
          <div className="flex min-w-48 flex-1 gap-1.5">
            <input
              value={addUrl}
              onChange={(e) => setAddUrl(e.target.value)}
              placeholder="URL (video/image) *"
              className="flex-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs"
            />
            <button
              type="button"
              onClick={() => triggerUpload("addUrl")}
              disabled={uploadingField !== null}
              className="rounded border border-white/15 px-2 py-1 text-[10px] hover:bg-white/5 disabled:opacity-40"
            >
              {uploadingField === "addUrl" ? "…" : "↑ BG"}
            </button>
          </div>
          {/* Thumb URL + upload */}
          <div className="flex min-w-48 flex-1 gap-1.5">
            <input
              value={addThumb}
              onChange={(e) => setAddThumb(e.target.value)}
              placeholder="Thumbnail URL"
              className="flex-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs"
            />
            <button
              type="button"
              onClick={() => triggerUpload("addThumb")}
              disabled={uploadingField !== null}
              className="rounded border border-white/15 px-2 py-1 text-[10px] hover:bg-white/5 disabled:opacity-40"
            >
              {uploadingField === "addThumb" ? "…" : "↑ Card"}
            </button>
          </div>
          <input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Name"
            className="w-32 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs"
          />
          <input
            value={addLabel}
            onChange={(e) => setAddLabel(e.target.value)}
            placeholder="Display label"
            className="w-32 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs"
          />
          <button
            onClick={() => void handleAdd()}
            disabled={!addUrl || !addSlot || adding}
            className="rounded bg-indigo-600 px-3 py-1 text-xs hover:bg-indigo-500 disabled:opacity-40"
          >
            {adding ? "Adding…" : "Add"}
          </button>
        </div>
      </section>
    </div>
  );
}
