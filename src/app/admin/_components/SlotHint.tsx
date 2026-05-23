"use client";

import { useMemo } from "react";
import { GROUP_LABEL, SLOT_PRESETS, formatBytes, getPresetById } from "../_lib/sizes";
import type { SlotPreset } from "../_lib/types";

type Props = {
  value: string;
  onChange: (id: string) => void;
  fileSize?: number;
  fileType?: string;
  className?: string;
};

const GROUP_ORDER: Array<NonNullable<SlotPreset["group"]>> = [
  "image",
  "video",
  "icon",
  "other",
];

export function SlotHint({ value, onChange, fileSize, fileType, className }: Props) {
  const preset = useMemo<SlotPreset>(() => getPresetById(value), [value]);

  const grouped = useMemo(() => {
    const map = new Map<NonNullable<SlotPreset["group"]>, SlotPreset[]>();
    for (const p of SLOT_PRESETS) {
      const g = p.group ?? "other";
      const arr = map.get(g) ?? [];
      arr.push(p);
      map.set(g, arr);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
      group: g,
      label: GROUP_LABEL[g],
      items: map.get(g)!,
    }));
  }, []);

  const overLimit = typeof fileSize === "number" && fileSize > preset.maxBytes;
  const wrongType =
    fileType && preset.acceptedTypes.length > 0
      ? !preset.acceptedTypes.some((t) => {
          if (t.endsWith("/*")) return fileType.startsWith(t.slice(0, -1));
          return t === fileType;
        })
      : false;

  return (
    <div className={"space-y-2 " + (className ?? "")}>
      <label className="block text-xs uppercase tracking-wide text-white/50">
        Vị trí dùng
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-white/15 bg-zinc-900 text-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
      >
        {grouped.map((g) => (
          <optgroup key={g.group} label={g.label}>
            {g.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <div className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-xs text-white/70 space-y-1">
        <div>
          <span className="text-white/50">Aspect:</span>{" "}
          <span className="text-white/90">{preset.aspect}</span>
          <span className="text-white/30"> · </span>
          <span className="text-white/50">Size:</span>{" "}
          <span className="text-white/90">{preset.recommendedSize}</span>
        </div>
        <div>
          <span className="text-white/50">Format:</span>{" "}
          <span className="text-white/90">{preset.format}</span>
          <span className="text-white/30"> · </span>
          <span className="text-white/50">Max:</span>{" "}
          <span className="text-white/90">{preset.maxBytesLabel}</span>
        </div>
        <div className="text-white/50">{preset.description}</div>

        {preset.tip ? (
          <div className="pt-1 mt-1 border-t border-white/10 text-amber-200/80">
            <span className="text-amber-300/70 mr-1">Tip:</span>
            {preset.tip}
          </div>
        ) : null}

        {typeof fileSize === "number" && fileSize > 0 ? (
          <div className="pt-1 mt-1 border-t border-white/10 flex items-center gap-2 flex-wrap">
            <span className="text-white/50">File hiện tại:</span>
            <span className={overLimit ? "text-rose-300" : "text-emerald-300"}>
              {formatBytes(fileSize)}
            </span>
            {overLimit ? (
              <span className="rounded bg-rose-500/20 text-rose-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                Quá limit
              </span>
            ) : null}
            {wrongType ? (
              <span className="rounded bg-amber-500/20 text-amber-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                Sai định dạng
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
