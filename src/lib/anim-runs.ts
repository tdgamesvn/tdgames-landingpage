/**
 * Sequence animation của Spine lưu trong DB là mảng phẳng ["breathe","breathe","walk"].
 * Admin hiển thị gọn hơn bằng cách gộp các mục liên tiếp trùng tên: breathe ×2 → walk.
 * ponytail: chỉ là lớp hiển thị — DB và <SpineCharacter> vẫn ăn mảng phẳng.
 */
export type AnimRun = { name: string; count: number };

export function toRuns(list: string[]): AnimRun[] {
  const runs: AnimRun[] = [];
  for (const name of list) {
    const last = runs[runs.length - 1];
    if (last && last.name === name) last.count++;
    else runs.push({ name, count: 1 });
  }
  return runs;
}

export function expandRuns(runs: AnimRun[]): string[] {
  return runs.flatMap((r) => Array<string>(Math.max(1, Math.floor(r.count))).fill(r.name));
}
