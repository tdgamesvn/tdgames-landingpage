"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  deleteProject,
  detectKindFromUrl,
  fetchProjects,
  patchProject,
  uploadFile,
} from "../_lib/api";
import { getPresetById } from "../_lib/sizes";
import type { Project } from "../_lib/types";
import { MediaPreview } from "./MediaPreview";
import { SlotHint } from "./SlotHint";
import { UploadZone } from "./UploadZone";

type Props = {
  adminKey: string;
};

export function ProjectsTab({ adminKey }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState("");

  const editorRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? null,
    [projects, selectedId],
  );

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setErrorMsg("");
    try {
      const list = await fetchProjects();
      setProjects(list);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  function pickProject(id: string) {
    setSelectedId(id);
    requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return projects;
    return projects.filter((p) =>
      [p.title, p.subtitle, p.slug, p.category].join(" ").toLowerCase().includes(kw),
    );
  }, [projects, keyword]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">Projects ({projects.length})</h2>
        <button
          onClick={load}
          className="rounded-md border border-white/20 px-3 py-1.5 text-xs hover:bg-white/5"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo title / slug / category"
          className="grow min-w-[200px] rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm"
        />
        {errorMsg ? <span className="text-xs text-rose-300">{errorMsg}</span> : null}
        {selected ? (
          <span className="text-xs text-white/60">
            Selected: <span className="text-white">{selected.title}</span>
          </span>
        ) : null}
      </header>

      <section className="rounded-lg border border-white/10 bg-zinc-900 p-4">
        <p className="text-xs uppercase tracking-wide text-white/50 mb-3">
          Click vào project để chỉnh sửa
        </p>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const isSel = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pickProject(p.id)}
                className={
                  "text-left rounded-lg border p-2 space-y-2 transition-colors cursor-pointer " +
                  (isSel
                    ? "border-indigo-400 bg-indigo-500/15 ring-2 ring-indigo-400/50"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/30")
                }
              >
                <MediaPreview url={p.image} height={120} />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-tight line-clamp-2">{p.title}</p>
                  <p className="text-[11px] text-white/55 line-clamp-1">{p.category}</p>
                  <p className="text-[10px] font-mono text-white/35 line-clamp-1">/{p.slug}</p>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && !loading ? (
            <div className="col-span-full rounded-md border border-white/10 bg-white/[0.02] p-6 text-center text-xs text-white/50">
              Không có project nào.
            </div>
          ) : null}
        </div>
      </section>

      <section
        ref={editorRef}
        className="rounded-lg border border-white/10 bg-zinc-900 p-5 scroll-mt-24"
      >
        {selected ? (
          <ProjectEditor
            key={selected.id}
            project={selected}
            adminKey={adminKey}
            onSaved={(updated) => {
              setProjects((curr) => curr.map((p) => (p.id === updated.id ? updated : p)));
            }}
            onDelete={() => setConfirmDeleteId(selected.id)}
          />
        ) : (
          <div className="py-12 text-center space-y-2">
            <p className="text-sm text-white/60">
              Chọn 1 project ở grid bên trên để bắt đầu chỉnh sửa.
            </p>
            <p className="text-xs text-white/40">
              Trong editor bạn có thể: đổi cover (drag-drop), title, subtitle, slug, category — hoặc xóa project.
            </p>
          </div>
        )}
      </section>

      {confirmDeleteId ? (
        <ConfirmDeleteModal
          adminKey={adminKey}
          projectId={confirmDeleteId}
          projectTitle={projects.find((p) => p.id === confirmDeleteId)?.title ?? ""}
          onCancel={() => setConfirmDeleteId("")}
          onDeleted={() => {
            setProjects((curr) => curr.filter((p) => p.id !== confirmDeleteId));
            setConfirmDeleteId("");
            if (selectedId === confirmDeleteId) setSelectedId("");
          }}
        />
      ) : null}
    </div>
  );
}

function ProjectEditor({
  project,
  adminKey,
  onSaved,
  onDelete,
}: {
  project: Project;
  adminKey: string;
  onSaved: (p: Project) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(project.title);
  const [subtitle, setSubtitle] = useState(project.subtitle ?? "");
  const [slug, setSlug] = useState(project.slug);
  const [category, setCategory] = useState(project.category);
  const [image, setImage] = useState(project.image);

  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [pickedPreviewUrl, setPickedPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!pickedFile) {
      setPickedPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(pickedFile);
    setPickedPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pickedFile]);

  const dirty =
    title !== project.title ||
    subtitle !== (project.subtitle ?? "") ||
    slug !== project.slug ||
    category !== project.category ||
    image !== project.image;

  const preset = getPresetById("project_cover");

  async function handleUploadCover() {
    if (!pickedFile) return;
    setUploading(true);
    setStatusMsg("");
    setErrorMsg("");
    try {
      const result = await uploadFile({ adminKey, file: pickedFile });
      setImage(result.url);
      setStatusMsg("Cover mới đã upload — nhớ bấm Save để cập nhật DB");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setErrorMsg("");
    setStatusMsg("");
    try {
      const updated = await patchProject({
        adminKey,
        id: project.id,
        updates: { title, subtitle, slug, category, image },
      });
      onSaved(updated);
      setPickedFile(null);
      setStatusMsg("Đã lưu");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const previewKind = pickedPreviewUrl ? detectKindFromUrl(pickedPreviewUrl) : null;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-white/40">Editing</p>
          <h3 className="text-xl font-semibold">{project.title}</h3>
          <p className="text-[11px] text-white/50">
            ID: <span className="font-mono">{project.id}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : dirty ? "Save changes" : "No changes"}
          </button>
          <button
            onClick={onDelete}
            className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/20"
          >
            Xóa project
          </button>
        </div>
      </header>

      {statusMsg ? (
        <p className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          {statusMsg}
        </p>
      ) : null}
      {errorMsg ? (
        <p className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {errorMsg}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <section className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/60">
            Metadata
          </h4>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Title" value={title} onChange={setTitle} />
            <Field label="Slug" value={slug} onChange={setSlug} mono />
            <Field
              label="Subtitle"
              value={subtitle}
              onChange={setSubtitle}
              className="md:col-span-2"
            />
            <Field label="Category" value={category} onChange={setCategory} />
            <Field label="Cover URL" value={image} onChange={setImage} mono />
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-white/10 bg-zinc-950 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/60">
            Cover image
          </h4>
          <p className="text-xs text-white/55">
            <span className="text-white/85">{preset.recommendedSize}</span>
            {" · "}
            {preset.aspect}
            {" · ≤ "}
            {preset.maxBytesLabel}
            {" · "}
            {preset.format}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wide text-white/50">Hiện tại</p>
              <MediaPreview url={project.image} height={140} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wide text-white/50">
                {pickedPreviewUrl
                  ? "File mới (preview)"
                  : image !== project.image
                    ? "URL mới"
                    : "Sẽ thay khi upload"}
              </p>
              <MediaPreview
                url={pickedPreviewUrl || (image !== project.image ? image : "")}
                height={140}
                emptyLabel={
                  pickedFile ? "Đang xử lý preview…" : "Kéo file ảnh xuống vùng dưới ↓"
                }
              />
            </div>
          </div>

          <UploadZone
            onPick={(f) => {
              setPickedFile(f);
              setStatusMsg("");
              setErrorMsg("");
            }}
            accept={preset.acceptedTypes.join(",")}
            uploading={uploading}
            selectedFile={pickedFile}
            selectedPreviewUrl={pickedPreviewUrl}
            height={140}
            label="Kéo & thả ảnh cover, hoặc bấm để chọn"
          />

          <SlotHint
            value="project_cover"
            onChange={() => {}}
            fileSize={pickedFile?.size}
            fileType={pickedFile?.type}
          />

          {previewKind === "video" ? (
            <p className="text-xs text-amber-300">
              Cover thường là ảnh tĩnh — bạn đang chọn video, hãy cân nhắc.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleUploadCover}
              disabled={!pickedFile || uploading}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm hover:bg-indigo-500 disabled:opacity-40"
            >
              {uploading ? "Đang upload…" : "Upload làm cover URL"}
            </button>
            {pickedFile ? (
              <button
                onClick={() => setPickedFile(null)}
                className="rounded-md border border-white/20 px-3 py-1.5 text-xs hover:bg-white/5"
              >
                Bỏ chọn file
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  mono?: boolean;
}) {
  return (
    <label className={"flex flex-col gap-1 text-xs " + (className ?? "")}>
      <span className="text-[10px] uppercase tracking-wide text-white/50">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          "rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:bg-white/10 " +
          (mono ? "font-mono text-xs" : "")
        }
      />
    </label>
  );
}

function ConfirmDeleteModal({
  adminKey,
  projectId,
  projectTitle,
  onCancel,
  onDeleted,
}: {
  adminKey: string;
  projectId: string;
  projectTitle: string;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleDelete() {
    setBusy(true);
    setErrorMsg("");
    try {
      await deleteProject({ adminKey, id: projectId });
      onDeleted();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg border border-rose-500/30 bg-zinc-950 p-5 space-y-4">
        <h3 className="text-lg font-semibold text-rose-200">Xác nhận xóa project</h3>
        <p className="text-sm text-white/70">
          Bạn sắp xóa{" "}
          <span className="font-medium text-white">{projectTitle}</span>. Hành động này
          không thể hoàn tác (cover image trên R2 vẫn còn, nhưng record DB sẽ bị xóa).
        </p>
        {errorMsg ? <p className="text-xs text-rose-300">{errorMsg}</p> : null}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-white/20 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            Hủy
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="rounded-md bg-rose-600 px-3 py-1.5 text-sm hover:bg-rose-500 disabled:opacity-40"
          >
            {busy ? "Đang xóa…" : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}
