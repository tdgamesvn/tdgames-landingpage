"use client";

/**
 * SpineStage — dàn nhân vật Spine chạy trực tiếp trong case study (Monster Legends
 * từng hệ). Mỗi quái một sân khấu riêng xếp dọc: khách lướt xuống là xem, không phải
 * bấm chọn (sếp chốt 2026-10-18). Trong từng sân khấu đổi được bậc + animation.
 *
 * - Mỗi sân khấu chỉ dựng SpinePlayer (1 WebGL context) khi gần vào màn hình và huỷ
 *   khi ra xa → cả trang chỉ 1–3 context sống, dù có 11+ quái.
 * - Cỡ quái đồng đều: khung camera ôm THÂN ở dáng idle (bỏ slot additive = FX/aura),
 *   thân luôn cao FILL × khung. Chân (đáy thân) đặt đúng tâm sàn của ảnh nền (groundY).
 * - Không vẽ bóng: elip/drop-shadow tĩnh không khớp dáng + animation (sếp bỏ 2026-10-18).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { SpineCharacter } from "@/components/spine-character";

import type { ProjectTheme, SpineMonster } from "./case-study-types";
import { hexToRgba } from "./portfolio-color-utils";

/** Thứ tự showreel + nhãn mặc định; key lạ vẫn hiện bằng tên gốc. */
const ORDER = ["breathe", "walk", "attack", "attack_skill", "special1", "levelup", "prone"];
const SHOWREEL = "__showreel";
const IDLE = "breathe";
/** Chiều cao thân (dáng idle) so với chiều cao khung nhân vật. */
const FILL = 0.57;
/** Trần theo chiều rộng khung cho "cỡ" thân (xem frameBody). */
const MAX_W = 0.6;
/** Hạ chân quái thấp hơn tâm sàn ảnh một chút (tỉ lệ chiều cao sân khấu). */
const DROP = 0.03;

type Box = { x: number; y: number; width: number; height: number };
/** Thân + "cỡ" dùng để chuẩn hoá (có thể nhỏ hơn height khi có cánh/vũ khí giơ cao). */
type Body = Box & { size: number };

/** Tỉ lệ thân-đặc / chiều cao toàn bộ của một quái "thường" (đo 21 skeleton Fire: 0.80–0.86). */
const CORE_RATIO = 0.82;
/** Trung vị √diện tích / cỡ-theo-chiều-cao trên 21 skeleton Fire (dải 0.77–1.54). */
const AREA_RATIO = 1.17;

/**
 * Chiều cao phần THÂN ĐẶC: từ chân lên tới mức chứa 90% diện tích hình. Cánh, trượng,
 * kiếm giơ cao chiếm ít diện tích nhưng kéo chiều cao lên nhiều — chuẩn hoá theo chiều cao
 * toàn bộ làm Kaih/Kennix (Awakened) bé hơn hẳn các con khác (sếp bắt 2026-10-18).
 * Duck-typing attachment vì bundle production đổi tên class.
 */
function coreHeight(sk: Player, bottom: number): { core: number; area: number } | null {
  const pts: [number, number][] = [];
  let total = 0;
  for (const slot of sk.drawOrder) {
    const a = slot.getAttachment();
    if (!a || !slot.bone.active) continue;
    let v: number[];
    let tris: ArrayLike<number>;
    if (a.triangles && a.worldVerticesLength) {
      v = new Array(a.worldVerticesLength);
      a.computeWorldVertices(slot, 0, a.worldVerticesLength, v, 0, 2);
      tris = a.triangles;
    } else if (a.offset?.length === 8) {
      v = new Array(8);
      a.computeWorldVertices(slot, v, 0, 2);
      tris = [0, 1, 2, 2, 3, 0];
    } else continue;
    for (let t = 0; t < tris.length; t += 3) {
      const [i, j, k] = [tris[t] * 2, tris[t + 1] * 2, tris[t + 2] * 2];
      const area = Math.abs((v[j] - v[i]) * (v[k + 1] - v[i + 1]) - (v[k] - v[i]) * (v[j + 1] - v[i + 1])) / 2;
      pts.push([(v[i + 1] + v[j + 1] + v[k + 1]) / 3, area]);
      total += area;
    }
  }
  if (!(total > 0)) return null;
  pts.sort((p, q) => p[0] - q[0]);
  let acc = 0;
  for (const [y, w] of pts) if ((acc += w) >= total * 0.9) return { core: y - bottom, area: total };
  return null;
}
type Foot = { x: number; y: number; w: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Player = any;

/**
 * Bounds của THÂN qua cả animation idle: tạm cho slot additive (aura, lửa, glow — FX
 * bung rộng tuỳ con) trả về "không có attachment" trong lúc player đo, rồi trả lại.
 * ponytail: chạm internal spine-player (calculateAnimationViewport) + Slot.getAttachment.
 */
function bodyBounds(player: Player, idle: string): Body | null {
  const sk = player.skeleton;
  const anim = sk?.data?.findAnimation?.(idle) ?? sk?.data?.animations?.[0];
  if (!anim) return null;
  // Không tính vào thân: slot additive (BlendMode.Additive = 1), attachment FX (rig Monster
  // Legends đặt tên "fx/…", thân là "basic/…"), và slot đang ẩn (alpha ≈ 0). Akira có
  // "fx-sword_fx" blend thường, alpha 0 ở idle, dài gấp đôi thân → quái bé + bóng rơi xa.
  for (const s of sk.slots) {
    const own = Object.getPrototypeOf(s).getAttachment;
    s.getAttachment = function () {
      const a = own.call(this);
      if (!a || this.data.blendMode === 1 || this.color.a < 0.05) return null;
      // "fx/…" là chuẩn; vài rig đặt "VFX/…" (Light – Master Shannara) → so không phân biệt hoa thường.
      if (/^v?fx\//i.test(a.name ?? "") || (a.color && a.color.a < 0.05)) return null;
      return a;
    };
  }
  try {
    const v = { x: 0, y: 0, width: 0, height: 0 };
    player.calculateAnimationViewport(anim, v);
    if (!(v.width > 0 && v.height > 0)) return null;
    // Đo thân đặc trên pose cuối của idle (calculateAnimationViewport để skeleton ở đó).
    const m = coreHeight(sk, v.y);
    if (!m) return { ...v, size: v.height };
    const tall = Math.min(v.height, m.core / CORE_RATIO);
    // Cùng chiều cao thì con mảnh (Ember, Shallinar) trông nhỏ, con bè (Aquatorum) trông to
    // → trộn thêm "độ đầy": hệ số theo căn diện tích / chiều cao, so với mức trung vị.
    const fullness = Math.sqrt(m.area) / tall / AREA_RATIO;
    const adjust = Math.min(1.15, Math.max(0.85, fullness ** 0.35));
    return { ...v, size: tall * adjust };
  } finally {
    for (const s of sk.slots) delete s.getAttachment;
    // calculateAnimationViewport để skeleton ở pose cuối animation vừa đo. Thuộc tính chỉ
    // animation đó key (Kennix: "prone" thu bone cánh ×0.4) sẽ kẹt mãi vì animation khác
    // không key lại → cánh bé (sếp 2026-10-19). Trả về setup pose.
    sk.setToSetupPose();
  }
}

/**
 * Đặt camera: "cỡ" thân (Body.size) cao min(FILL × khung cao, MAX_W × khung rộng) — một
 * con số chung cho mọi quái trong cùng khung. Trước đây con bè chạm mép bị thu nhỏ riêng
 * → trên mobile (khung hẹp) mỗi con một cỡ (sếp bắt 2026-10-18). MAX_W chọn sao cho con
 * bè nhất (Aquatorum, rộng ≈ 1.55 × cỡ) vẫn lọt khung.
 */
function frameBody(player: Player, body: Body, W: number, H: number, scale = 1, sizeH = H) {
  let px = Math.min(FILL * sizeH, MAX_W * W) * scale; // chiều cao (px) của "cỡ" thân
  let s = px / body.size; // px trên mỗi đơn vị world
  // Chốt an toàn: không để thân tràn ngang khỏi khung.
  if (body.width * s > 0.96 * W) {
    s = (0.96 * W) / body.width;
    px = s * body.size;
  }
  const vw = W / s;
  const vh = H / s;
  const padX = (vw - body.width) / 2;
  // Chân cách đáy canvas 30%: canvas kéo dài quá mép dưới sân khấu nên FX dưới chân (vòng
  // phép, bụi, nước) không bị cắt ngang ở đáy canvas (sếp 2026-10-18, Crabsair).
  const padBottom = vh * 0.3;
  player.currentViewport = {
    ...body,
    padLeft: padX,
    padRight: padX,
    padBottom,
    padTop: vh - body.height - padBottom,
  };
  player.previousViewport = null;
}

type Viewport = Box & { padLeft: number; padRight: number; padTop: number; padBottom: number };

/** Lề an toàn khi lùi camera (tỉ lệ khoảng trống phía trên/hai bên). */
const FIT_MARGIN = 0.05;
/** Camera lùi tối đa ×1.5 (sếp 2026-10-18) — khớp phần nền dư của arena-v4; cần hơn thì chịu cắt. */
const MAX_PULLBACK = 1.5;
/**
 * Bóng đổ theo dáng (sếp 2026-10-18 — không phải elip tròn): mỗi khung hình chép chính
 * canvas nhân vật sang canvas bóng (½ độ phân giải), ép dẹt + xiên quanh đường chân như
 * nguồn sáng chiếu chéo từ trước-trái, rồi CSS tô đen + làm mềm. Đúng dáng, cử động theo
 * animation; FX additive (alpha 0) không đổ bóng.
 */
const SHADOW = { squash: 0.3, skew: 0.75, res: 0.5, blur: 3, opacity: 0.42 };

/** Thời gian camera lùi ra / zoom về (giây). */
const CAMERA_TRANSITION = 0.3;

/**
 * Camera lùi ra cho animation có thân vượt khung (nhảy cao, vung rộng) — sếp 2026-10-18:
 * Iceblood nhảy bị cắt mất người. Giữ nguyên vị trí chân trên màn hình (zoom quanh chân)
 * nên nền + mặt sàn không lệch. Trả null nếu animation đã lọt khung chuẩn.
 */
function fitViewport(base: Viewport, body: Box, anim: Box, topCut = 0): Viewport | null {
  const left = base.x - base.padLeft;
  const bottom = base.y - base.padBottom;
  const vw = base.width + base.padLeft + base.padRight;
  const vh = base.height + base.padTop + base.padBottom;
  const fx = body.x + body.width / 2;
  const fy = body.y;
  const rx = (fx - left) / vw; // vị trí chân trong khung (0–1)
  const ry = (fy - bottom) / vh;
  const keep = 1 - FIT_MARGIN;
  const ratios = [
    // topCut: phần đầu canvas bị sân khấu che (canvas được kéo lên quá mép trên để chân
    // đúng mặt sàn) — tính khoảng trống theo mép trên NHÌN THẤY, không theo mép canvas.
    ((1 - ry - topCut) * vh * keep) / (anim.y + anim.height - fy), // phía trên chân
    (rx * vw * keep) / (fx - anim.x), // bên trái
    ((1 - rx) * vw * keep) / (anim.x + anim.width - fx), // bên phải
  ].filter((r) => Number.isFinite(r) && r > 0);
  const k = Math.max(1 / MAX_PULLBACK, Math.min(1, ...ratios));
  if (k >= 0.995) return null;
  const w = vw / k;
  const h = vh / k;
  return { x: fx - rx * w, y: fy - ry * h, width: w, height: h, padLeft: 0, padRight: 0, padTop: 0, padBottom: 0 };
}

const vpWidth = (v: Viewport) => v.width + v.padLeft + v.padRight;

/** Điểm chân (đáy giữa của thân) trong toạ độ khung — tái hiện phép chiếu của player. */
function footOf(player: Player, body: Box, W: number, H: number): Foot | null {
  const v = player?.currentViewport;
  if (!v || !(v.width > 0)) return null;
  const vw = v.width + v.padLeft + v.padRight;
  const vh = v.height + v.padTop + v.padBottom;
  const s = Math.min(W / vw, H / vh);
  const cx = v.x - v.padLeft + vw / 2;
  const cy = v.y - v.padBottom + vh / 2;
  const toX = (x: number) => W / 2 + (x - cx) * s;
  const toY = (y: number) => H / 2 - (y - cy) * s;
  return { x: toX(body.x + body.width / 2), y: toY(body.y), w: body.width * s };
}

function sortAnims(list: readonly string[]) {
  const rank = (a: string) => (ORDER.includes(a) ? ORDER.indexOf(a) : ORDER.length);
  return [...list].sort((a, b) => rank(a) - rank(b));
}

type StageProps = {
  background: string;
  /** Tâm sàn trong ảnh nền, tính theo tỉ lệ chiều cao ảnh (0–1). */
  groundY: number;
  /** Ảnh nền rộng hơn phần hiển thị bao nhiêu lần (outpaint) — chỗ cho camera lùi. */
  backgroundRoom: number;
  animationLabels: Readonly<Record<string, string>>;
  theme: ProjectTheme;
};

export default function SpineStage({
  roster,
  logo,
  animationLabels = {},
  groundY = 0.7,
  backgroundRoom = 1,
  ...rest
}: Omit<StageProps, "animationLabels" | "groundY" | "backgroundRoom"> & {
  roster: readonly SpineMonster[];
  logo?: string;
  animationLabels?: Readonly<Record<string, string>>;
  groundY?: number;
  backgroundRoom?: number;
}) {
  return (
    <div className="px-3 pb-8 pt-4 md:px-6 md:pb-12">
      {logo && (
        <div className="mb-8 flex flex-col items-center gap-3 text-center md:mb-12">
          {/* Logo to hơn 50% + bỏ dòng mô tả dưới logo (sếp 2026-10-18). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="Monster Legends" className="w-[300px] md:w-[420px]" />
        </div>
      )}
      <div className="flex flex-col gap-12 md:gap-20">
        {roster.map((m) => (
          <MonsterStage
            key={m.id}
            monster={m}
            animationLabels={animationLabels}
            groundY={groundY}
            backgroundRoom={backgroundRoom}
            {...rest}
          />
        ))}
      </div>
    </div>
  );
}

function MonsterStage({
  monster,
  background,
  groundY,
  backgroundRoom,
  animationLabels,
  theme,
}: StageProps & { monster: SpineMonster }) {
  // Mặc định bậc cao nhất — bản đẹp nhất để khoe.
  const [tierKey, setTierKey] = useState(monster.tiers[monster.tiers.length - 1].key);
  const tier = monster.tiers.find((t) => t.key === tierKey) ?? monster.tiers[0];
  const [anim, setAnim] = useState<string>(SHOWREEL);
  const [ready, setReady] = useState(false);
  const [near, setNear] = useState(false);
  const [lift, setLift] = useState(0);
  // Vị trí ảnh nền (px) để tâm sàn trùng chân quái; null = object-cover mặc định.
  const [bg, setBg] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const playerRef = useRef<Player>(null);
  const bodyRef = useRef<Body | null>(null);
  // Khung thân từng animation (đo 1 lần lúc tải) + khung camera chuẩn (dáng idle).
  const animBoxRef = useRef<Map<string, Box>>(new Map());
  const baseVpRef = useRef<Viewport | null>(null);
  /** Tỉ lệ chiều cao canvas bị che phía trên (xem fitViewport). */
  const topCutRef = useRef(0);
  // Nền thu/phóng cùng camera, tâm = chân quái (toạ độ sân khấu).
  const [zoom, setZoom] = useState({ k: 1, ox: 0, oy: 0 });
  const originRef = useRef({ ox: 0, oy: 0 });
  /** Nền không được thu nhỏ quá mức này (sẽ hở mép sân khấu) — tính theo hình học khung. */
  const minBgKRef = useRef(1);
  const shadowRef = useRef<HTMLCanvasElement>(null);
  /** Điểm chân trong toạ độ canvas (px CSS) — trục ép/xiên của bóng. */
  const footRef = useRef<Foot | null>(null);

  const anims = useMemo(() => sortAnims(tier.animations), [tier]);
  // Showreel (sếp chốt 2026-10-18): idle xen giữa mọi lần đổi animation, walk lặp 2 lần.
  // Bỏ "prone" (ngã gục) — nằm giữa chuỗi trông như lỗi. Chuỗi lặp lại từ idle đầu.
  const showreel = useMemo(() => {
    const idle = anims.includes(IDLE) ? IDLE : null;
    const seq: string[] = [];
    for (const a of anims) {
      if (a === IDLE || a === "prone") continue;
      if (idle) seq.push(idle);
      for (let i = 0; i < (a === "walk" ? 2 : 1); i++) seq.push(a);
    }
    return seq.length ? seq : anims.slice(0, 1);
  }, [anims]);
  const playing = useMemo(() => (anim === SHOWREEL ? showreel : [anim]), [anim, showreel]);

  // Dựng khi gần vào màn hình, huỷ khi ra xa (giữ số WebGL context thấp).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setNear(e.isIntersecting);
        if (!e.isIntersecting) {
          setReady(false);
          playerRef.current = null;
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const layout = useCallback(() => {
    const box = boxRef.current;
    const stage = stageRef.current;
    const p = playerRef.current;
    const body = bodyRef.current;
    if (!box || !stage || !p || !body) return;
    const W = box.clientWidth;
    const H = box.clientHeight;
    const SW0 = stage.clientWidth;
    const SH0 = stage.clientHeight;
    // Cỡ quái tính theo chiều cao khung cũ (94% sân khấu), không theo canvas đã kéo dài.
    frameBody(p, body, W, H, tier.scale, SH0 * 0.94);
    const f = footOf(p, body, W, H);
    footRef.current = f;
    baseVpRef.current = { ...p.currentViewport };
    // Tâm sàn của ảnh nền sau object-cover (neo mép trên) → toạ độ sân khấu.
    const img = bgRef.current;
    const aspect = img?.naturalWidth ? img.naturalWidth / img.naturalHeight : 1.5;
    const SW = SW0;
    const SH = SH0;
    const drawnH = Math.max(SH, SW / aspect);
    const ground = groundY * drawnH + DROP * SH;
    // Khung hẹp (mobile vuông): sàn ảnh ở ~66% → con cao chạm mép trên (sếp 2026-10-18).
    // Chân lấy điểm THẤP hơn giữa mặt sàn và vị trí để quái cân giữa khung theo chiều dọc;
    // phần sàn đá kéo tới đáy ảnh nên chân vẫn trên sàn. Desktop gần như không đổi.
    const heightPx = f ? (f.w / body.width) * body.height : 0;
    const centred = Math.min(0.92 * SH, (SH + heightPx) / 2);
    // Chỉ khung hẹp (mobile vuông) mới căn giữa + dời nền; khung ngang giữ nguyên bản
    // sếp đã duyệt (chân đúng mặt sàn, nền cố định — đồng đều giữa các sân khấu).
    const narrow = SW / SH < 1.2;
    const feet = narrow ? Math.max(ground, centred) : ground;
    const liftPx = f ? feet - box.offsetTop - f.y : 0;
    setLift(liftPx);
    topCutRef.current = Math.max(0, -(box.offsetTop + liftPx)) / H;
    // Đang chạy animation vượt khung lúc resize → giữ khung đã lùi (không transition).
    const cur = p.animationState?.getCurrent(0)?.animation?.name;
    const curBox = cur ? animBoxRef.current.get(cur) : undefined;
    const fit = curBox ? fitViewport(baseVpRef.current!, body, curBox, topCutRef.current) : null;
    if (fit) p.currentViewport = fit;
    originRef.current = { ox: box.offsetLeft + (f?.x ?? W / 2), oy: feet };
    setZoom({ k: fit ? vpWidth(baseVpRef.current!) / vpWidth(fit) : 1, ...originRef.current });
    // Nền đi theo chân (sếp 2026-10-18: mobile chân lệch khỏi vùng sàn sáng): phóng ảnh
    // vừa đủ để tâm sàn (groundY) nằm đúng `feet` mà vẫn phủ kín khung.
    // Khung ảnh "trong" (phần trông thấy lúc bình thường): khung ngang neo mép trên như bản
    // đã duyệt; khung hẹp phóng để tâm sàn trùng chân. Ảnh thật rộng hơn ×backgroundRoom
    // (arena-v4 outpaint) — phần dư chỉ lộ khi camera lùi.
    let innerH = drawnH;
    let innerTop = 0;
    if (narrow) {
      innerH = Math.max(drawnH, (feet - DROP * SH) / groundY, (SH - feet + DROP * SH) / (1 - groundY));
      innerTop = feet - DROP * SH - groundY * innerH;
    }
    const innerW = innerH * aspect;
    const fullW = innerW * backgroundRoom;
    const fullH = innerH * backgroundRoom;
    const rect = {
      left: (SW - innerW) / 2 - (fullW - innerW) / 2,
      top: innerTop - (fullH - innerH) / 2,
      width: fullW,
      height: fullH,
    };
    setBg(rect);
    // Thu nhỏ quanh chân (ox, oy) mà vẫn phủ kín sân khấu → k tối thiểu theo từng mép. Chân
    // nằm thấp nên phía trên cần nhiều nền dư hơn; camera lùi xa nhất thì nền dừng sớm vài %
    // thay vì hở dải tối ở mép trên.
    const { ox, oy } = originRef.current;
    minBgKRef.current = Math.min(
      1,
      Math.max(
        ox / (ox - rect.left),
        (SW - ox) / (rect.left + rect.width - ox),
        oy / (oy - rect.top),
        (SH - oy) / (rect.top + rect.height - oy),
      ),
    );
    setZoom((z) => ({ ...z, k: Math.max(z.k, minBgKRef.current) }));
  }, [groundY, tier.scale, backgroundRoom]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(layout);
    ro.observe(box);
    return () => ro.disconnect();
  }, [layout]);

  function selectTier(key: string) {
    if (key === tier.key) return;
    setTierKey(key);
    const next = monster.tiers.find((t) => t.key === key);
    if (anim !== SHOWREEL && !next?.animations.includes(anim)) setAnim(SHOWREEL);
    setReady(false);
  }

  const glow = tier.highlight ? theme.accentSoft : theme.accent;

  return (
    <section aria-label={monster.name}>
      {/* Tên + bậc */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 md:mb-4">
        <div>
          <div className="text-[13px] font-semibold" style={{ color: glow }}>
            {monster.rank}
            {tier.highlight ? " · Awakened" : ""}
          </div>
          <h3
            className="text-[28px] font-black leading-none text-white md:text-[40px]"
            style={{ fontFamily: "var(--font-rajdhani)" }}
          >
            {monster.name}
          </h3>
        </div>
        {monster.tiers.length > 1 && (
          <div
            role="radiogroup"
            aria-label={`${monster.name} evolution stage`}
            className="flex gap-1 rounded-full bg-white/[0.06] p-1"
          >
            {monster.tiers.map((t) => {
              const on = t.key === tier.key;
              const c = t.highlight ? theme.accentSoft : theme.accent;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => selectTier(t.key)}
                  className="rounded-full px-3 py-1.5 text-[12px] font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white sm:px-4 sm:text-[13px]"
                  style={on ? { backgroundColor: c, color: "#1a0f12" } : { color: hexToRgba(c, 0.85) }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        ref={stageRef}
        data-spine-stage
        className="relative isolate aspect-square w-full overflow-hidden rounded-[22px] bg-[#1a0f12] sm:aspect-[4/3] lg:aspect-[16/9]"
      >
        {/* Nền thu/phóng cùng camera quanh chân quái — khớp transition tuyến tính của player. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20"
          style={{
            transform: `scale(${zoom.k})`,
            transformOrigin: `${zoom.ox}px ${zoom.oy}px`,
            transition: `transform ${CAMERA_TRANSITION}s linear`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={bgRef}
            src={background}
            alt=""
            loading="lazy"
            onLoad={layout}
            className={bg ? "absolute max-w-none" : "absolute inset-0 h-full w-full object-cover"}
            // Chưa đo: neo mép trên. Đã đo: đặt theo khung tính trong layout().
            style={
              bg
                ? { filter: "brightness(0.82)", left: bg.left, top: bg.top, width: bg.width, height: bg.height }
                : { filter: "brightness(0.82)", objectPosition: "50% 0%" }
            }
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background: `radial-gradient(ellipse 30% 40% at 50% ${groundY * 100 - 12}%, ${hexToRgba(glow, tier.highlight ? 0.22 : 0.14)}, transparent 70%), radial-gradient(ellipse 90% 80% at 50% 55%, transparent 45%, rgba(20,6,10,0.7) 100%)`,
            transition: "background 600ms ease",
          }}
        />
        <Embers color={glow} />

        {/* Nhân vật */}
        <div
          ref={boxRef}
          className="absolute inset-x-0 -bottom-[24%] -top-[24%] transition-opacity duration-500"
          style={{
            opacity: ready ? 1 : 0,
            transform: `translateY(${lift}px)`,
          }}
        >
          <canvas
            ref={shadowRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ filter: `brightness(0) blur(${SHADOW.blur}px)`, opacity: SHADOW.opacity }}
          />
          {near && (
            <SpineCharacter
              key={tier.base}
              jsonUrl={`${tier.base}.json`}
              atlasUrl={`${tier.base}.atlas`}
              animations={playing}
              mixDuration={0.25} // sếp chốt 2026-10-18 (0.18 giật khi đổi dáng xa)
              className="relative h-full w-full"
              onSuccess={(player) => {
                const p = player as Player;
                playerRef.current = p;
                bodyRef.current = bodyBounds(p, "breathe");
                const boxes = new Map<string, Box>();
                for (const a of anims) {
                  const b = bodyBounds(p, a);
                  if (b) boxes.set(a, b);
                }
                animBoxRef.current = boxes;
                p.config.viewport.transitionTime = CAMERA_TRANSITION;
                // Vẽ bóng ngay sau mỗi khung hình của player (cùng task → canvas WebGL còn nội
                // dung dù không preserveDrawingBuffer).
                const draw = p.drawFrame.bind(p);
                p.drawFrame = (next?: boolean) => {
                  draw(next);
                  const sc = shadowRef.current;
                  const foot = footRef.current;
                  const src = p.canvas as HTMLCanvasElement | undefined;
                  // Player vừa bị huỷ (cuộn qua / đổi bậc) vẫn có thể chạy thêm 1 nhịp với
                  // canvas 0×0 → drawImage ném lỗi.
                  if (!sc || !foot || !src || !src.isConnected || !src.width || !src.height) return;
                  const w = Math.round(src.clientWidth * SHADOW.res);
                  const h = Math.round(src.clientHeight * SHADOW.res);
                  if (sc.width !== w || sc.height !== h) {
                    sc.width = w;
                    sc.height = h;
                  }
                  const ctx = sc.getContext("2d");
                  if (!ctx) return;
                  const r = SHADOW.res;
                  const { squash, skew } = SHADOW;
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.clearRect(0, 0, w, h);
                  // (x, y) → (x + skew·(fy − y), fy + squash·(y − fy)), rồi thu ×res.
                  ctx.setTransform(r, 0, -skew * r, squash * r, skew * foot.y * r, (1 - squash) * foot.y * r);
                  ctx.drawImage(src, 0, 0, src.clientWidth, src.clientHeight);
                };
                p.animationState?.addListener({
                  start: (entry: Player) => {
                    const base = baseVpRef.current;
                    const body = bodyRef.current;
                    if (entry.trackIndex !== 0 || !base || !body) return;
                    const b = animBoxRef.current.get(entry.animation?.name);
                    const target = (b && fitViewport(base, body, b, topCutRef.current)) || base;
                    // Xuất phát từ khung đang vẽ (có thể đang giữa transition) → không giật.
                    const v = p.viewport;
                    p.previousViewport = { x: v.x, y: v.y, width: v.width, height: v.height, padLeft: 0, padRight: 0, padTop: 0, padBottom: 0 };
                    p.currentViewport = target;
                    p.viewportTransitionStart = performance.now();
                    setZoom({
                      k: Math.max(minBgKRef.current, vpWidth(base) / vpWidth(target)),
                      ...originRef.current,
                    });
                  },
                });
                layout();
                setReady(true);
              }}
            />
          )}
        </div>

        {near && !ready && (
          <div className="absolute inset-0 grid place-items-center" aria-live="polite">
            <span className="rounded-full bg-black/45 px-4 py-2 text-[13px] text-white/80 backdrop-blur-sm">
              Summoning {monster.name}…
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[SHOWREEL, ...anims].map((a) => {
          const on = a === anim;
          return (
            <button
              key={a}
              type="button"
              aria-pressed={on}
              onClick={() => setAnim(a)}
              className="shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white"
              style={
                on
                  ? { borderColor: glow, backgroundColor: hexToRgba(glow, 0.18), color: "#fff" }
                  : { borderColor: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.7)" }
              }
            >
              {a === SHOWREEL ? "Showreel" : (animationLabels[a] ?? a)}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Đốm lửa bay lên — CSS thuần, tắt khi người dùng bật giảm chuyển động. */
function Embers({ color }: { color: string }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        // Giả ngẫu nhiên cố định theo index → SSR/CSR khớp nhau.
        const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
        return {
          left: `${r(1) * 100}%`,
          size: 2 + r(2) * 2.5,
          dur: 6 + r(3) * 7,
          delay: -r(4) * 12,
          drift: (r(5) - 0.5) * 80,
        };
      }),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-[5] overflow-hidden opacity-70">
      <style>{`
        @keyframes ss-ember { 0% { transform: translate(0, 0); opacity: 0 } 15% { opacity: 1 }
          100% { transform: translate(var(--drift), -110cqh); opacity: 0 } }
        @media (prefers-reduced-motion: reduce) { .ss-ember { animation: none !important; opacity: 0 } }
      `}</style>
      <div className="absolute inset-0" style={{ containerType: "size" }}>
        {dots.map((d, i) => (
          <span
            key={i}
            className="ss-ember absolute bottom-0 rounded-full"
            style={
              {
                left: d.left,
                width: d.size,
                height: d.size,
                background: color,
                boxShadow: `0 0 ${d.size * 3}px ${color}`,
                animation: `ss-ember ${d.dur}s linear ${d.delay}s infinite`,
                "--drift": `${d.drift}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
