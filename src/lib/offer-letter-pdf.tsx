import "server-only";

/**
 * Render "Thư mời nhận việc" ra PDF (A4, tiếng Việt) bằng @react-pdf/renderer.
 * Bố cục theo file Word gốc: logo, tiêu đề, lời chào, bảng NỘI DUNG | GHI CHÚ chia mục
 * (thanh cam), đoạn kết, người ký. Font Noto Serif + logo nhúng từ repo (không cần mạng).
 * Dữ liệu đầu vào đã qua sanitize; dòng trống (không giá trị, không ghi chú) bị bỏ và đánh số lại.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { formatStartVi, formatVnd, offerTotal, type OfferLetterData } from "./offer-letter";
import { RenderSlots } from "./render-slots";

const ASSETS = path.join(process.cwd(), "src", "assets");
const FAMILY = "NotoSerif";

let registered = false;
function ensureFonts() {
  if (registered) return;
  const f = (name: string) => path.join(ASSETS, "fonts", `NotoSerif-${name}.ttf`);
  Font.register({
    family: FAMILY,
    fonts: [
      { src: f("Regular") },
      { src: f("Bold"), fontWeight: "bold" },
      { src: f("Italic"), fontStyle: "italic" },
      { src: f("BoldItalic"), fontWeight: "bold", fontStyle: "italic" },
    ],
  });
  // Không ngắt từ kiểu tiếng Anh (chèn gạch nối giữa âm tiết tiếng Việt).
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

let logo: Buffer | null = null;
function logoData() {
  logo ??= readFileSync(path.join(ASSETS, "offer-logo.png"));
  return { data: logo, format: "png" as const };
}

const ORANGE = "#F7931E";
const BORDER = "#C8C8C8";
const INK = "#1a1a1a";

const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 56, paddingHorizontal: 57, fontFamily: FAMILY, fontSize: 10.5, lineHeight: 1.45, color: INK },
  brand: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  logo: { width: 40, height: 40 },
  brandText: { marginLeft: 8, fontSize: 18, fontWeight: "bold", letterSpacing: 1.5, color: INK },
  title: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 14 },
  greet: { fontSize: 11, marginBottom: 6 },
  para: { fontSize: 11, textAlign: "justify", marginBottom: 10 },
  table: {},
  row: { flexDirection: "row", borderLeftWidth: 0.75, borderColor: BORDER },
  head: { backgroundColor: "#F2F2F2", borderTopWidth: 0.75 },
  cell: { borderRightWidth: 0.75, borderBottomWidth: 0.75, borderColor: BORDER, paddingVertical: 4, paddingHorizontal: 6 },
  colMain: { width: "66%" },
  colNote: { width: "34%" },
  colTime: { width: "26%" },
  colTask: { width: "74%" },
  headText: { fontWeight: "bold", textAlign: "center" },
  bar: { backgroundColor: ORANGE, borderRightWidth: 0.75, borderBottomWidth: 0.75, borderColor: BORDER, paddingVertical: 4, paddingHorizontal: 6, width: "100%" },
  barText: { color: "#FFFFFF", fontWeight: "bold" },
  label: { fontWeight: "bold" },
  bullet: { flexDirection: "row", marginTop: 1 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1 },
  money: { flexDirection: "row", justifyContent: "space-between" },
  moneyLabel: { flex: 1, paddingRight: 8 },
  note: { fontStyle: "italic" },
  sign: { marginTop: 18, alignSelf: "flex-end", width: 200, alignItems: "center" },
  signTitle: { fontWeight: "bold", fontSize: 11 },
  signName: { fontWeight: "bold", fontSize: 11, marginTop: 48 },
});

/**
 * Một mục trong bảng. `body` chuỗi = mục ngắn (≤ 300 ký tự, không bao giờ dài quá 1 trang);
 * `lines` = mục dạng danh sách (phúc lợi, giấy tờ, lương): mỗi dòng không bị cắt, giữa các dòng
 * được ngắt trang — danh sách dài tối đa (15 × 300 ký tự) không bao giờ bị xén.
 */
type Item = { label: string; note?: string; bold?: boolean } & ({ body: string } | { lines: ReactNode[] });

function bullet(t: string, key: number) {
  return (
    <View key={key} style={s.bullet} wrap={false}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{t}</Text>
    </View>
  );
}

function Bar({ title }: { title: string }) {
  return (
    <View style={s.row}>
      <View style={s.bar}>
        <Text style={s.barText}>{title}</Text>
      </View>
    </View>
  );
}

/** 1 dòng bảng: cột nội dung + cột ghi chú. `open` = phần tiếp theo còn nữa → bỏ kẻ dưới. */
function Row({ children, note, open, cont, wrap }: { children: ReactNode; note?: string; open?: boolean; cont?: boolean; wrap?: boolean }) {
  // open: còn phần tiếp → bỏ kẻ dưới; cont: là phần tiếp → bỏ đệm trên (liền mạch với phần đầu).
  const cellOpen = { ...(open ? { borderBottomWidth: 0, paddingBottom: 0 } : {}), ...(cont ? { paddingTop: 0 } : {}) };
  return (
    <View style={s.row} wrap={wrap ?? false}>
      <View style={[s.cell, s.colMain, cellOpen]}>{children}</View>
      <View style={[s.cell, s.colNote, cellOpen]}>
        <Text style={s.note}>{note ?? ""}</Text>
      </View>
    </View>
  );
}

/**
 * Phần đầu của mục (nhãn + dòng đầu, không ngắt) và phần còn lại (ngắt được giữa các dòng).
 * Thanh mục (nếu có) dính vào phần đầu của mục đầu tiên → không bao giờ đứng một mình cuối trang.
 * (Không dùng minPresenceAhead: react-pdf 4.9 bỏ qua nó ở đây — đã thử, thanh vẫn bị bỏ lại.)
 */
function ItemRows({ it, n, bar }: { it: Item; n: number; bar?: string }) {
  const label = <Text style={s.label}>{`${n}. ${it.label}`}</Text>;
  if ("body" in it) {
    return (
      <View wrap={false}>
        {bar && <Bar title={bar} />}
        <Row note={it.note}>
          <Text>
            {label}
            {it.body ? ": " : ""}
            <Text style={it.bold ? s.label : {}}>{it.body}</Text>
          </Text>
        </Row>
      </View>
    );
  }
  const [first, ...rest] = it.lines;
  return (
    <>
      <View wrap={false}>
        {bar && <Bar title={bar} />}
        <Row note={it.note} open={rest.length > 0}>
          {label}
          {first}
        </Row>
      </View>
      {rest.length > 0 && (
        <Row wrap cont>
          {rest}
        </Row>
      )}
    </>
  );
}

function Section({ title, items }: { title: string; items: Item[] }) {
  if (!items.length) return null;
  return (
    <>
      {items.map((it, i) => (
        <ItemRows key={i} it={it} n={i + 1} bar={i === 0 ? title : undefined} />
      ))}
    </>
  );
}

/** Mục có giá trị chữ: bỏ nếu trống và không có ghi chú. */
function textItem(label: string, value: string, note?: string): Item[] {
  return value.trim() || note?.trim() ? [{ label, body: value.trim(), note }] : [];
}

function listItem(label: string, values: string[], note?: string): Item[] {
  const v = values.filter((x) => x.trim());
  if (!v.length && !note?.trim()) return [];
  return [{ label, note, lines: v.length ? v.map(bullet) : [<View key={0} />] }];
}

/** "Xăng xe" → "xăng xe" (ghép sau "Phụ cấp"); viết tắt như "KPI" giữ nguyên. */
function allowanceLabel(name: string): string {
  const t = name.trim();
  return t.length > 1 && t[1] === t[1].toLocaleLowerCase("vi") ? t[0].toLocaleLowerCase("vi") + t.slice(1) : t;
}

function salaryLines(d: OfferLetterData): ReactNode[] {
  const lines: [string, string, boolean][] = [];
  if (d.baseSalary !== null) lines.push(["Lương cơ bản", formatVnd(d.baseSalary), false]);
  for (const a of d.allowances) if (a.amount !== null && a.name) lines.push([`Phụ cấp ${allowanceLabel(a.name)}`, formatVnd(a.amount), false]);
  lines.push(["Tổng lương gross", formatVnd(offerTotal(d)), true]);
  return lines.map(([k, v, bold], i) => (
    <View key={i} style={[s.money, i === 0 || bold ? { marginTop: 2 } : {}]} wrap={false}>
      <Text style={[s.moneyLabel, bold ? s.label : {}]}>{`• ${k}`}</Text>
      <Text style={bold ? s.label : {}}>{v}</Text>
    </View>
  ));
}

function OfferLetterDocument({ d }: { d: OfferLetterData }) {
  const start = formatStartVi(d.startDate, d.startTime);
  const sec1: Item[] = [
    ...textItem("Chức danh", d.jobTitle),
    ...textItem("Địa điểm làm việc", d.location),
    ...textItem("Thời gian làm việc", d.workingHours),
    ...(start ? [{ label: "Ngày bắt đầu làm việc", body: start, bold: true }] : []),
    { label: "Mức lương", lines: salaryLines(d), note: d.probationNote || undefined },
    ...textItem("Máy tính làm việc", d.computer),
    ...textItem("Điện thoại", d.phone),
  ];
  const sec2: Item[] = [
    ...textItem("Trợ cấp gửi xe", d.parkingAllowance),
    ...listItem("Phúc lợi khác", d.otherBenefits),
  ];
  const sec3: Item[] = [
    ...textItem("Email công việc", d.workEmail),
    ...listItem("Các giấy tờ cần chuẩn bị", d.documents, d.documentsNote || undefined),
  ];
  const schedule = d.schedule.filter((x) => x.time || x.task);

  return (
    <Document title={`Thư mời nhận việc - ${d.candidateName}`} author="TD Games" creator="TD Games HR" language="vi">
      <Page size="A4" style={s.page}>
        <View style={s.brand}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image không có alt */}
          <Image style={s.logo} src={logoData()} />
          <Text style={s.brandText}>TD GAMES</Text>
        </View>
        <Text style={s.title}>THƯ MỜI NHẬN VIỆC</Text>
        <Text style={s.greet}>
          Thân gửi bạn <Text style={s.label}>{d.candidateName}</Text>,
        </Text>
        {d.intro ? <Text style={s.para}>{d.intro}</Text> : null}

        <View style={s.table}>
          <View style={[s.row, s.head]} wrap={false}>
            <View style={[s.cell, s.colMain]}>
              <Text style={s.headText}>NỘI DUNG</Text>
            </View>
            <View style={[s.cell, s.colNote]}>
              <Text style={s.headText}>GHI CHÚ</Text>
            </View>
          </View>
          <Section title="I. THÔNG TIN VỊ TRÍ" items={sec1} />
          <Section title="II. CHÍNH SÁCH PHÚC LỢI" items={sec2} />
          <Section title="III. CHUẨN BỊ CHO NGÀY ĐẦU ĐI LÀM" items={sec3} />
          {schedule.map((x, i) => (
            <View key={i} wrap={false}>
              {i === 0 && <Bar title="IV. LỊCH TRÌNH NGÀY ĐẦU ĐI LÀM" />}
              <View style={s.row}>
                <View style={[s.cell, s.colTime]}>
                  <Text style={s.label}>{x.time}</Text>
                </View>
                <View style={[s.cell, s.colTask]}>
                  <Text>{x.task}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {d.closing ? <Text style={[s.para, { marginTop: 12 }]}>{d.closing}</Text> : null}
        <View style={s.sign} wrap={false}>
          <Text style={s.signTitle}>{d.signerTitle}</Text>
          <Text style={s.signName}>{d.signerName}</Text>
        </View>
      </Page>
    </Document>
  );
}

// ── Giới hạn render đồng thời (render ~0.5–1.5s CPU; chặn spam làm nghẽn server) ──

const slots = new RenderSlots({ max: 2, maxQueue: 10, maxWaitPerUser: 2, maxOverrun: 2 });
/** Gửi mail / tải lại file đã gửi chờ slot tối đa chừng này (xem RenderSlots.acquire). */
const WAIT_MS = 15_000;
/** Render quá lâu (dữ liệu lạ / máy quá tải) → bỏ, nhả slot, route trả 503. */
const RENDER_TIMEOUT_MS = 20_000;

export const PDF_BUSY_MESSAGE = "Đang tạo PDF khác, thử lại sau giây lát";
export const PDF_TIMEOUT_MESSAGE = "Tạo PDF quá lâu, thử lại";

/** Server đang bận tạo PDF (vượt giới hạn / trần hàng chờ) → route trả 429. */
export class PdfBusyError extends Error {
  constructor() {
    super(PDF_BUSY_MESSAGE);
  }
}

/** Render quá RENDER_TIMEOUT_MS → route trả 503. */
export class PdfTimeoutError extends Error {
  constructor() {
    super(PDF_TIMEOUT_MESSAGE);
  }
}

/**
 * Sinh PDF thư mời từ dữ liệu (đã sanitize). Tối đa 2 bản cùng lúc toàn server (`userKey` = id/email tài khoản).
 * - `mode: "preview"` (mặc định): hết slot hoặc người này đang có 1 bản → PdfBusyError ngay.
 * - `mode: "wait"` (gửi mail offer, tải lại file đã gửi): xếp hàng chờ slot tối đa 15s; vượt trần
 *   (2 việc chờ/người, hàng chờ 10, hết hạn mà đã chạy ≥ 4 bản) → PdfBusyError.
 * Render quá 20s → PdfTimeoutError cho caller; slot chỉ nhả khi render cũ thật sự xong (không huỷ được).
 */
export async function renderOfferLetterPdf(
  data: OfferLetterData,
  userKey: string,
  mode: "preview" | "wait" = "preview",
): Promise<Buffer> {
  const release = mode === "wait" ? await slots.acquire(userKey, WAIT_MS) : slots.tryAcquire(userKey);
  if (!release) throw new PdfBusyError();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let render: Promise<Buffer>;
  try {
    ensureFonts();
    render = renderToBuffer(<OfferLetterDocument d={data} />);
  } catch (e) {
    release();
    throw e;
  }
  // Slot chỉ nhả khi render THỰC SỰ xong (kể cả sau khi caller đã nhận timeout) — không để
  // render bị bỏ dở chạy nền mà vẫn mở slot cho việc mới (trần đồng thời vẫn đúng).
  void render.then(release, release);
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new PdfTimeoutError()), RENDER_TIMEOUT_MS);
  });
  try {
    return await Promise.race([render, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Lỗi render → response (429 bận, 503 quá lâu); lỗi khác → null để route tự xử lý. */
export function pdfErrorResponse(e: unknown): { status: number; error: string } | null {
  if (e instanceof PdfBusyError) return { status: 429, error: e.message };
  if (e instanceof PdfTimeoutError) return { status: 503, error: e.message };
  return null;
}
