// Màu status pipeline: DB lưu key (blue, red, ...), UI map sang class Tailwind tĩnh.
// `hr-tag--status` (hr-theme.css) vẽ chấm 7px màu `--tag` + chữ thường — theo styleguide
// "chấm + chữ, không tô nền". Class text-* giữ lại cho KPI (lấy màu chữ số đếm).
export const STATUS_PALETTE: Record<string, string> = {
  slate: "hr-tag hr-tag--status [--tag:var(--color-slate-400)] text-slate-300",
  blue: "hr-tag hr-tag--status [--tag:var(--color-blue-500)] text-blue-300",
  sky: "hr-tag hr-tag--status [--tag:var(--color-sky-500)] text-sky-300",
  cyan: "hr-tag hr-tag--status [--tag:var(--color-cyan-500)] text-cyan-300",
  teal: "hr-tag hr-tag--status [--tag:var(--color-teal-500)] text-teal-300",
  green: "hr-tag hr-tag--status [--tag:var(--color-green-500)] text-green-300",
  lime: "hr-tag hr-tag--status [--tag:var(--color-lime-500)] text-lime-300",
  yellow: "hr-tag hr-tag--status [--tag:var(--color-yellow-500)] text-yellow-300",
  amber: "hr-tag hr-tag--status [--tag:var(--color-amber-500)] text-amber-300",
  orange: "hr-tag hr-tag--status [--tag:var(--color-orange-500)] text-orange-300",
  red: "hr-tag hr-tag--status [--tag:var(--color-red-500)] text-red-300",
  pink: "hr-tag hr-tag--status [--tag:var(--color-pink-500)] text-pink-300",
  purple: "hr-tag hr-tag--status [--tag:var(--color-purple-500)] text-purple-300",
  indigo: "hr-tag hr-tag--status [--tag:var(--color-indigo-500)] text-indigo-300",
};
