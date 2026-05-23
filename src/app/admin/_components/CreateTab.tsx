"use client";

import { useEffect, useMemo, useState } from "react";
import { createProject, uploadFile } from "../_lib/api";
import { getPresetById } from "../_lib/sizes";
import { MediaPreview } from "./MediaPreview";
import { SlotHint } from "./SlotHint";
import { UploadZone } from "./UploadZone";

type Props = {
  adminKey: string;
  onCreated?: () => void;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CreateTab({ adminKey, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState("2D Animation");
  const [image, setImage] = useState("");

  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [pickedPreviewUrl, setPickedPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
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

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const preset = getPresetById("project_cover");
  const canCreate = useMemo(
    () => Boolean(adminKey && title && slug && category && image),
    [adminKey, title, slug, category, image],
  );

  async function handleUploadCover() {
    if (!pickedFile) return;
    setUploading(true);
    setStatusMsg("");
    setErrorMsg("");
    try {
      const result = await uploadFile({ adminKey, file: pickedFile });
      setImage(result.url);
      setStatusMsg("Cover URL đã set, sẵn sàng tạo project");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    setStatusMsg("");
    setErrorMsg("");
    try {
      await createProject({
        adminKey,
        payload: { title, subtitle, slug, category, image },
      });
      setStatusMsg("Project đã được tạo");
      setTitle("");
      setSubtitle("");
      setSlug("");
      setSlugTouched(false);
      setCategory("2D Animation");
      setImage("");
      setPickedFile(null);
      onCreated?.();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-xl font-semibold">Tạo project mới</h2>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Title *" value={title} onChange={setTitle} />
        <Field
          label="Slug *"
          value={slug}
          onChange={(v) => {
            setSlug(v);
            setSlugTouched(true);
          }}
          mono
        />
        <Field label="Subtitle" value={subtitle} onChange={setSubtitle} className="md:col-span-2" />
        <Field label="Category *" value={category} onChange={setCategory} />
        <Field label="Cover URL *" value={image} onChange={setImage} mono />
      </div>

      <section className="rounded-md border border-white/10 p-3 space-y-3">
        <h4 className="text-sm font-semibold">Cover image</h4>
        <UploadZone
          onPick={setPickedFile}
          accept={preset.acceptedTypes.join(",")}
          uploading={uploading}
          selectedFile={pickedFile}
          selectedPreviewUrl={pickedPreviewUrl}
          height={160}
          label="Kéo & thả cover, hoặc bấm để chọn"
        />
        <SlotHint
          value="project_cover"
          onChange={() => {}}
          fileSize={pickedFile?.size}
          fileType={pickedFile?.type}
        />
        {pickedPreviewUrl ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/50 mb-1">Preview</p>
              <MediaPreview url={pickedPreviewUrl} height={140} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/50 mb-1">
                Sau khi upload (URL)
              </p>
              <MediaPreview url={image} height={140} emptyLabel="Bấm Upload để có URL" />
            </div>
          </div>
        ) : null}

        <button
          onClick={handleUploadCover}
          disabled={!pickedFile || uploading}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm disabled:opacity-40"
        >
          {uploading ? "Đang upload…" : "Upload cover (lấy URL)"}
        </button>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleCreate}
          disabled={!canCreate || creating}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          {creating ? "Creating…" : "Create project"}
        </button>
        {statusMsg ? <span className="text-xs text-emerald-300">{statusMsg}</span> : null}
        {errorMsg ? <span className="text-xs text-rose-300">{errorMsg}</span> : null}
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
          "rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm " +
          (mono ? "font-mono text-xs" : "")
        }
      />
    </label>
  );
}
