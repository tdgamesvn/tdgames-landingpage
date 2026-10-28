"use client";

/**
 * Upload ghi âm PV chia phần 5MB qua /api/hr/upload/audio/multipart.
 * Mỗi phần: nếu 30s không thêm byte nào → huỷ, gửi lại phần đó (tối đa 5 lần).
 */

import { planParts } from "@/lib/interview-audio";
import { hrFetch } from "./HrSession";

const API = "/api/hr/upload/audio/multipart";
const STALL_MS = 30_000;
const MAX_TRIES = 5;

type Uploaded = { url: string; key: string; bytes: number };

async function postJson(body: unknown) {
  const res = await hrFetch(API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
  return j;
}

function putPart(url: string, blob: Blob, onLoaded: (n: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let stall: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(stall);
      stall = setTimeout(() => xhr.abort(), STALL_MS);
    };
    xhr.open("PUT", url);
    // Cookie phiên tự đi theo (cùng origin).
    xhr.setRequestHeader("content-type", "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      arm();
      onLoaded(e.loaded);
    };
    xhr.onload = () => {
      clearTimeout(stall);
      let j: { etag?: string; error?: string } = {};
      try {
        j = JSON.parse(xhr.responseText);
      } catch {
        // server trả HTML lỗi
      }
      if (xhr.status >= 200 && xhr.status < 300 && j.etag) resolve(j.etag);
      else reject(new Error(j.error ?? `HTTP ${xhr.status}`));
    };
    xhr.onerror = () => {
      clearTimeout(stall);
      reject(new Error("mất kết nối"));
    };
    xhr.onabort = () => reject(new Error("kẹt quá 30s"));
    arm();
    xhr.send(blob);
  });
}

export async function uploadAudioChunked(
  file: File,
  onProgress: (p: { loaded: number; total: number; retry?: string }) => void,
): Promise<Uploaded> {
  const { key, uploadId } = await postJson({ action: "init", name: file.name, type: file.type, size: file.size });
  const done: { partNumber: number; etag: string }[] = [];
  let sent = 0;
  try {
    for (const p of planParts(file.size)) {
      const url = `${API}?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}&part=${p.partNumber}`;
      let lastErr: Error | null = null;
      for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
        try {
          const etag = await putPart(url, file.slice(p.start, p.end), (n) =>
            onProgress({ loaded: sent + n, total: file.size }),
          );
          done.push({ partNumber: p.partNumber, etag });
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e instanceof Error ? e : new Error(String(e));
          onProgress({ loaded: sent, total: file.size, retry: `phần ${p.partNumber} ${lastErr.message}, thử lại lần ${attempt}/${MAX_TRIES - 1}` });
          await new Promise((r) => setTimeout(r, Math.min(8000, 1000 * attempt)));
        }
      }
      if (lastErr) throw new Error(`Không gửi được phần ${p.partNumber} sau ${MAX_TRIES} lần (${lastErr.message}) — mạng đang chập chờn, thử lại sau`);
      sent = p.end;
      onProgress({ loaded: sent, total: file.size });
    }
    const out = await postJson({ action: "complete", key, uploadId, size: file.size, parts: done });
    return { url: out.url, key: out.key, bytes: file.size };
  } catch (e) {
    void postJson({ action: "abort", key, uploadId }).catch(() => {});
    throw e;
  }
}
