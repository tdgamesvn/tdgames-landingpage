"use client";

import { useCallback, useRef, useState } from "react";
import { detectKindFromUrl } from "../_lib/api";
import { formatBytes } from "../_lib/sizes";

type Props = {
  onPick: (file: File) => void;
  uploading?: boolean;
  accept?: string;
  label?: string;
  height?: number;
  selectedFile?: File | null;
  selectedPreviewUrl?: string;
};

export function UploadZone({
  onPick,
  uploading,
  accept = "image/*,video/*",
  label = "Kéo & thả file vào đây hoặc bấm để chọn",
  height = 220,
  selectedFile,
  selectedPreviewUrl,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File | undefined | null) => {
      if (!file) return;
      onPick(file);
    },
    [onPick],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      handleFile(file);
    },
    [handleFile],
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
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
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
        {uploading ? (
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
