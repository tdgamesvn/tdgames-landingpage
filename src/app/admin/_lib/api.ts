"use client";

import type { MediaAsset, MediaKind, Project, ProjectContent } from "./types";

/**
 * Thin client wrappers around the admin/public REST endpoints used by the
 * admin UI. Admin-only endpoints expect the `x-admin-key` header — the UI
 * stores that key in localStorage and passes it through as `adminKey`.
 */

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* fallthrough */
  }
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : null) ??
      (text || `${res.status} ${res.statusText}`);
    throw new Error(msg);
  }
  return data as T;
}

// ─────────────────────────────────────────────────────────────── Projects API

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`/api/projects?limit=100&offset=0`, { cache: "no-store" });
  const data = await jsonOrThrow<{ projects: Project[] }>(res);
  return data.projects ?? [];
}

export async function createProject(args: {
  adminKey: string;
  payload: {
    title: string;
    subtitle?: string;
    slug: string;
    category: string;
    image: string;
  };
}): Promise<Project> {
  const res = await fetch(`/api/projects`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-key": args.adminKey,
    },
    body: JSON.stringify(args.payload),
  });
  const data = await jsonOrThrow<{ project: Project }>(res);
  return data.project;
}

export async function patchProject(args: {
  adminKey: string;
  id: string;
  updates: Partial<{
    title: string;
    subtitle: string;
    slug: string;
    category: string;
    image: string;
  }>;
}): Promise<Project> {
  const res = await fetch(`/api/projects`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      "x-admin-key": args.adminKey,
    },
    body: JSON.stringify({ id: args.id, ...args.updates }),
  });
  const data = await jsonOrThrow<{ project: Project }>(res);
  return data.project;
}

export async function deleteProject(args: {
  adminKey: string;
  id: string;
}): Promise<void> {
  const res = await fetch(`/api/projects?id=${encodeURIComponent(args.id)}`, {
    method: "DELETE",
    headers: { "x-admin-key": args.adminKey },
  });
  await jsonOrThrow<{ success: true }>(res);
}

// ────────────────────────────────────────────────────────────────── Media API

export async function fetchMedia(adminKey: string): Promise<MediaAsset[]> {
  const res = await fetch(`/api/admin/media`, {
    headers: { "x-admin-key": adminKey },
    cache: "no-store",
  });
  const data = await jsonOrThrow<{ items: MediaAsset[] }>(res);
  return data.items ?? [];
}

export async function uploadFile(args: {
  adminKey: string;
  file: File;
  mediaId?: string;
}): Promise<{ key: string; url: string; size: number; contentType: string }> {
  const fd = new FormData();
  fd.append("file", args.file);
  if (args.mediaId) fd.append("mediaId", args.mediaId);

  const res = await fetch(`/api/admin/upload`, {
    method: "POST",
    headers: { "x-admin-key": args.adminKey },
    body: fd,
  });
  return jsonOrThrow<{ key: string; url: string; size: number; contentType: string }>(res);
}

// ─────────────────────────────────────────────────────────── Project content

export async function fetchProjectSlugs(adminKey: string): Promise<string[]> {
  const res = await fetch(`/api/admin/project-content`, {
    headers: { "x-admin-key": adminKey },
    cache: "no-store",
  });
  const data = await jsonOrThrow<{ slugs: string[] }>(res);
  return data.slugs ?? [];
}

export async function fetchProjectContent(
  adminKey: string,
  slug: string,
): Promise<ProjectContent> {
  const res = await fetch(`/api/admin/project-content?slug=${encodeURIComponent(slug)}`, {
    headers: { "x-admin-key": adminKey },
    cache: "no-store",
  });
  return jsonOrThrow<ProjectContent>(res);
}

export async function replaceProjectSlot(args: {
  adminKey: string;
  slug: string;
  oldUrl: string;
  newUrl: string;
}): Promise<{ replacements: number; dbUpdated: number; file?: string; warning?: string }> {
  const res = await fetch(`/api/admin/project-content/replace`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-key": args.adminKey,
    },
    body: JSON.stringify({ slug: args.slug, oldUrl: args.oldUrl, newUrl: args.newUrl }),
  });
  return jsonOrThrow(res);
}

// ──────────────────────────────────────────────────────────── Bulk replace API

export async function runBulkReplace(args: {
  adminKey: string;
  mode: "dry-run" | "apply" | "rollback";
}): Promise<unknown> {
  const res = await fetch(`/api/admin/media/replace-run`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-key": args.adminKey,
    },
    body: JSON.stringify({ mode: args.mode }),
  });
  return jsonOrThrow(res);
}

// ──────────────────────────────────────────────────────────────────── Helpers

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;

export function detectKindFromUrl(url: string): MediaKind {
  if (!url) return "other";
  // blob: previews from URL.createObjectURL — use mime hint if present, else
  // assume image (preview thumbnails).
  if (url.startsWith("blob:")) return "image";
  if (VIDEO_EXT.test(url)) return "video";
  if (/\.gif(\?.*)?$/i.test(url)) return "gif";
  if (IMAGE_EXT.test(url)) return "image";
  return "other";
}
