"use client";

import { useCallback, useRef, useState } from "react";
import { detectKindFromUrl } from "../_lib/api";
import { formatBytes } from "../_lib/sizes";

type Props = {
  onPick: (file: File) => void | Promise<void>;
  uploading?: boolean;
  accept?: string;
  label?: string;
  height?: number;
  selectedFile?: File | null;
  selectedPreviewUrl?: string;
  /** opt-in: nhận nhiều file 1 lần, onPick được gọi cho từng file */
  multiple?: boolean;
};

export function UploadZone({
  onPick,
  uploading,
  accept = "image/*,video/*",
  label = "Kéo & thả file vào đây hoặc bấm để chọn",
  height = 220,
  selectedFile,
  selectedPreviewUrl,
  multiple = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [queue, setQueue] = useState({ done: 0, total: 0 });

  const handleFiles = useCallback(
    async (files: FileList | null | undefined) => {
      if (!files?.length) return;
      // multiple=false → giữ nguyên hành vi cũ: chỉ lấy file đầu.
      const list = multiple ? Array.from(files) : [files[0]];
      // TUẦN TỰ, không Promise.all: 20 file × 10MB upload song song làm Node
      // buffer cả đống vào RAM, vượt `max_memory_restart` 512MB của PM2 →
      // process bị giết giữa chừng, client ăn 502. Upstream vẫn là nút cổ chai
      // nên tuần tự gần như không chậm hơn.
      setQueue({ done: 0, total: list.length });
      for (const [i, file] of list.entries()) {
        await onPick(file);
        setQueue({ done: i + 1, total: list.length });
      }
      setQueue({ done: 0, total: 0 });
    },
    [onPick, multiple],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const previewKind = selectedPreviewUrl ? detectKindFromUrl(selectedPreviewUrl) : null;

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={
        "relative cursor-pointer rounded-lg border-2 border-dashed transition-colors flex items-center justify-center text-center text-sm " +
        (dragOver
          ? "border-indigo-400 bg-indigo-400/10"
          : "border-white/20 bg-white/[0.03] hover:bg-white/[0.06]")
      }
      style={{ height }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {selectedPreviewUrl && previewKind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={selectedPreviewUrl}
          alt="selected preview"
          className="absolute inset-0 h-full w-full rounded-lg object-contain p-2"
        />
      ) : null}
      {selectedPreviewUrl && previewKind === "video" ? (
        <video
          src={selectedPreviewUrl}
          muted
          autoPlay
          loop
          className="absolute inset-0 h-full w-full rounded-lg object-contain p-2"
        />
      ) : null}
      <div className="relative z-10 px-4 py-2 rounded-md bg-black/60 text-xs text-white/80 backdrop-blur">
        {queue.total > 1 ? (
          <span>
            Đang upload {queue.done + 1}/{queue.total}…
          </span>
        ) : uploading ? (
          <span>Đang upload…</span>
        ) : selectedFile ? (
          <span>
            <span className="font-medium">{selectedFile.name}</span>{" "}
            <span className="text-white/50">({formatBytes(selectedFile.size)})</span>
            <span className="text-white/40"> — bấm để đổi file</span>
          </span>
        ) : (
          <span>{label}</span>
        )}
      </div>
    </div>
  );
}
