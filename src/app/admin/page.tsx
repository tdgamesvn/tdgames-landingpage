"use client";

import { useMemo, useState } from "react";

type Project = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  slug: string;
  category: string;
  createdAt: string;
};

type ProjectsResponse = {
  projects: Project[];
};

type MediaAsset = {
  id: string;
  kind: string;
  source_type: "local_public" | "external";
  original_url: string;
  current_url: string;
  used_by?: string[];
  updated_at: string;
};
type Tab = "upload" | "attach" | "bulk";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("upload");
  const [adminKey, setAdminKey] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [uploadMessage, setUploadMessage] = useState("");
  const [attachMessage, setAttachMessage] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");

  const [lastUploadedUrl, setLastUploadedUrl] = useState("");
  const [replaceMediaId, setReplaceMediaId] = useState("");

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [attachImageUrl, setAttachImageUrl] = useState("");

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("2D Art");
  const [image, setImage] = useState("");

  const [bulkResult, setBulkResult] = useState<string>("");
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const selectedMedia = media.find((m) => m.id === replaceMediaId) ?? null;
  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;
  const previewUrl = lastUploadedUrl || selectedMedia?.current_url || attachImageUrl || "";
  const isVideoPreview = selectedMedia?.kind === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(previewUrl);
  const isImagePreview = selectedMedia?.kind === "image" || selectedMedia?.kind === "gif" || /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(previewUrl);

  const canCreate = useMemo(() => Boolean(adminKey && title && slug && category && image), [adminKey, title, slug, category, image]);

  async function loadProjects() {
    setLoadingProjects(true);
    try {
      const res = await fetch("/api/projects?limit=100&offset=0", { cache: "no-store" });
      const data = (await res.json()) as ProjectsResponse;
      setProjects(data.projects ?? []);
    } finally {
      setLoadingProjects(false);
    }
  }

  async function loadMedia() {
    if (!adminKey) return;
    setLoadingMedia(true);
    const res = await fetch("/api/admin/media", { headers: { "x-admin-key": adminKey }, cache: "no-store" });
    const data = await res.json();
    if (res.ok) setMedia(data.items ?? []);
    setLoadingMedia(false);
  }

  async function onUploadFile(file: File, mediaId?: string) {
    if (!adminKey) {
      setUploadMessage("Set admin key first");
      return;
    }
    setUploading(true);
    setUploadMessage("");
    const formData = new FormData();
    formData.append("file", file);
    if (mediaId) formData.append("mediaId", mediaId);
    const res = await fetch("/api/admin/upload", { method: "POST", headers: { "x-admin-key": adminKey }, body: formData });
    const data = await res.json();
    if (!res.ok) {
      setUploadMessage(data.error ?? "Upload failed");
      setUploading(false);
      return;
    }
    setLastUploadedUrl(data.url);
    setAttachImageUrl(data.url);
    setImage(data.url);
    setUploadMessage(mediaId ? "Replace file successful" : "Upload successful");
    await loadMedia();
    setUploading(false);
  }

  async function createProject() {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ title, subtitle, slug, category, image }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAttachMessage(data.error ?? "Create failed");
      return;
    }
    setAttachMessage("Project created");
    setTitle(""); setSubtitle(""); setSlug(""); setCategory("2D Art");
    await loadProjects();
  }

  async function attachCoverToProject() {
    if (!adminKey || !selectedProjectId || !attachImageUrl) {
      setAttachMessage("Select project and provide image URL");
      return;
    }
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return;
    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ id: selectedProjectId, title: project.title, subtitle: project.subtitle, slug: project.slug, category: project.category, image: attachImageUrl }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAttachMessage(data.error ?? "Attach failed");
      return;
    }
    setAttachMessage("Project cover updated");
    await loadProjects();
  }

  async function copyLatestUrl() {
    if (!lastUploadedUrl) return;
    try {
      await navigator.clipboard.writeText(lastUploadedUrl);
      setCopyMessage("Copied URL");
    } catch {
      setCopyMessage("Copy failed");
    }
  }

  async function runBulk(mode: "dry-run" | "apply" | "rollback") {
    if (!adminKey) {
      setBulkMessage("Set admin key first");
      return;
    }
    setBulkMessage(`Running ${mode}...`);
    const res = await fetch("/api/admin/media/replace-run", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ mode }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBulkMessage(data.error ?? `${mode} failed`);
      return;
    }
    setBulkResult(JSON.stringify(data.result, null, 2));
    setBulkMessage(`${mode} successful`);
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10 space-y-8">
      <section className="max-w-6xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold">Admin Media Wizard</h1>
        <p className="text-white/70">Bước 1 Upload, Bước 2 Attach vào project, Bước 3 Bulk replace an toàn với rollback.</p>
        <div className="grid gap-4 md:grid-cols-3">
          <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="Admin key" className="rounded-md bg-white/10 border border-white/20 px-3 py-2 md:col-span-2" />
          <div className="flex gap-2">
            <button onClick={loadProjects} className="rounded-md border border-white/20 px-3 py-2">{loadingProjects ? "Loading..." : "Load projects"}</button>
            <button onClick={loadMedia} className="rounded-md border border-white/20 px-3 py-2">{loadingMedia ? "Loading..." : "Load media"}</button>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab("upload")} className={`rounded-md px-4 py-2 ${tab === "upload" ? "bg-indigo-600" : "border border-white/20"}`}>1) Upload Asset</button>
          <button onClick={() => setTab("attach")} className={`rounded-md px-4 py-2 ${tab === "attach" ? "bg-indigo-600" : "border border-white/20"}`}>2) Attach to Project</button>
          <button onClick={() => setTab("bulk")} className={`rounded-md px-4 py-2 ${tab === "bulk" ? "bg-indigo-600" : "border border-white/20"}`}>3) Bulk Replace</button>
        </div>
      </section>

      {tab === "upload" && (
        <section className="max-w-6xl mx-auto space-y-4">
          <h2 className="text-xl font-semibold">Bước 1: Upload Asset</h2>
          <p className="text-sm text-white/70">Upload file mới hoặc chọn asset cũ để replace file trực tiếp.</p>
          <div className="flex gap-2 flex-wrap items-center">
            <label className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 cursor-pointer">
              <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUploadFile(e.target.files[0])} />
              <span>{uploading ? "Uploading..." : "Upload new file"}</span>
            </label>
            <select value={replaceMediaId} onChange={(e) => setReplaceMediaId(e.target.value)} className="rounded-md bg-white/10 border border-white/20 px-3 py-2 min-w-[320px]">
              <option value="">Select existing media to replace</option>
              {media.map((m) => <option key={m.id} value={m.id}>{m.kind} · {m.source_type} · {m.original_url}</option>)}
            </select>
            <label className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 cursor-pointer">
              <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files?.[0] && replaceMediaId && onUploadFile(e.target.files[0], replaceMediaId)} />
              <span>{uploading ? "Uploading..." : "Replace selected media file"}</span>
            </label>
          </div>
          {lastUploadedUrl ? (
            <div className="space-y-2">
              <p className="text-sm break-all">Latest URL: {lastUploadedUrl}</p>
              <div className="flex items-center gap-2">
                <button onClick={copyLatestUrl} className="rounded-md border border-white/20 px-3 py-1 text-sm">Copy URL</button>
                {copyMessage ? <span className="text-xs text-white/70">{copyMessage}</span> : null}
              </div>
            </div>
          ) : null}

          {previewUrl ? (
            <div className="rounded-md border border-white/15 p-3 space-y-2">
              <p className="text-sm text-white/70">Preview</p>
              {isImagePreview ? <img src={previewUrl} alt="media preview" className="max-h-64 rounded" /> : null}
              {isVideoPreview ? <video src={previewUrl} controls className="max-h-64 rounded" /> : null}
              {!isImagePreview && !isVideoPreview ? <a href={previewUrl} target="_blank" rel="noreferrer" className="text-sm underline">Open preview URL</a> : null}
            </div>
          ) : null}

          {selectedMedia ? <p className="text-xs text-white/60">Selected replace target: {selectedMedia.kind} · {selectedMedia.current_url}</p> : null}
          {uploadMessage ? <p className="text-sm text-white/80">{uploadMessage}</p> : null}
          {selectedProject ? <p className="text-xs text-white/60">Selected project: {selectedProject.title}</p> : null}

          <div className="rounded-lg border border-white/15 p-3 space-y-3">
            <h3 className="font-semibold">Media Preview List (chọn đúng asset trước khi replace)</h3>
            <p className="text-xs text-white/60">Hiển thị URL hiện tại + vị trí dùng (`used_by`) để bạn biết mình đang replace ở đâu.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {media.slice(0, 30).map((item) => {
                const url = item.current_url || item.original_url;
                const isImg = /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url);
                const isVid = /\.(mp4|webm|mov)(\?|$)/i.test(url);
                return (
                  <div key={item.id} className="rounded-md border border-white/10 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-white/70">{item.kind} · {item.source_type}</p>
                      <button
                        onClick={() => {
                          setReplaceMediaId(item.id);
                          setLastUploadedUrl(url);
                        }}
                        className="rounded-md border border-white/20 px-2 py-1 text-xs"
                      >
                        Pick for replace
                      </button>
                    </div>
                    {isImg ? <img src={url} alt="asset preview" className="h-36 w-full object-cover rounded" /> : null}
                    {isVid ? <video src={url} controls className="h-36 w-full rounded" /> : null}
                    {!isImg && !isVid ? <a href={url} target="_blank" rel="noreferrer" className="text-xs underline break-all">Open media URL</a> : null}
                    <p className="text-xs break-all">current_url: {item.current_url}</p>
                    <p className="text-xs break-all text-white/70">used_by: {(item.used_by && item.used_by.length > 0) ? item.used_by.join(" | ") : "(no usage path)"}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {tab === "attach" && (
        <section className="max-w-6xl mx-auto space-y-4">
          <h2 className="text-xl font-semibold">Bước 2: Attach to Project</h2>
          <p className="text-sm text-white/70">Chọn project và cập nhật cover URL (auto-fill từ bước upload nếu có).</p>
          <div className="grid gap-3 md:grid-cols-2">
            <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="rounded-md bg-white/10 border border-white/20 px-3 py-2">
              <option value="">Select project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title} · {p.slug}</option>)}
            </select>
            <input value={attachImageUrl} onChange={(e) => setAttachImageUrl(e.target.value)} placeholder="Cover image URL" className="rounded-md bg-white/10 border border-white/20 px-3 py-2" />
          </div>
          <button onClick={attachCoverToProject} className="rounded-md bg-indigo-600 px-4 py-2">Save cover to project</button>

          <div className="border-t border-white/10 pt-4 space-y-3">
            <h3 className="font-semibold">Create Project</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded-md bg-white/10 border border-white/20 px-3 py-2" />
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug" className="rounded-md bg-white/10 border border-white/20 px-3 py-2" />
              <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle" className="rounded-md bg-white/10 border border-white/20 px-3 py-2 md:col-span-2" />
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="rounded-md bg-white/10 border border-white/20 px-3 py-2" />
              <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="Cover URL" className="rounded-md bg-white/10 border border-white/20 px-3 py-2" />
            </div>
            <button onClick={createProject} disabled={!canCreate} className="rounded-md bg-emerald-600 px-4 py-2 disabled:opacity-40">Create project</button>
          </div>
          {attachMessage ? <p className="text-sm text-white/80">{attachMessage}</p> : null}
        </section>
      )}

      {tab === "bulk" && (
        <section className="max-w-6xl mx-auto space-y-4">
          <h2 className="text-xl font-semibold">Bước 3: Bulk Replace</h2>
          <p className="text-sm text-white/70">Chạy dry-run trước, sau đó apply, dùng rollback khi cần hoàn tác.</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => runBulk("dry-run")} className="rounded-md bg-slate-700 px-4 py-2">Dry run</button>
            <button onClick={() => setShowApplyConfirm(true)} className="rounded-md bg-amber-600 px-4 py-2">Apply</button>
            {showApplyConfirm ? (
              <div className="flex items-center gap-2 rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm">
                <span>Confirm apply bulk replace?</span>
                <button onClick={() => { setShowApplyConfirm(false); runBulk("apply"); }} className="rounded-md bg-amber-600 px-2 py-1">Confirm</button>
                <button onClick={() => setShowApplyConfirm(false)} className="rounded-md border border-white/20 px-2 py-1">Cancel</button>
              </div>
            ) : null}
            <button onClick={() => runBulk("rollback")} className="rounded-md bg-rose-600 px-4 py-2">Rollback</button>
          </div>
          {bulkMessage ? <p className="text-sm text-white/80">{bulkMessage}</p> : null}
          {bulkResult ? <pre className="text-xs bg-white/5 border border-white/10 rounded-md p-3 overflow-auto">{bulkResult}</pre> : null}
        </section>
      )}
    </main>
  );
}
