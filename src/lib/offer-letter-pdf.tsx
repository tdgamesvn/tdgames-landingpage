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
  note: { fontStyle: "italic" },
  sign: { marginTop: 18, alignSelf: "flex-end", width: 200, alignItems: "center" },
  signTitle: { fontWeight: "bold", fontSize: 11 },
  signName: { fontWeight: "bold", fontSize: 11, marginTop: 48 },
});

type Item = { label: string; body: ReactNode; note?: string; bold?: boolean };

function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((t, i) => (
        <View key={i} style={s.bullet} wrap={false}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

/** Thanh mục cam + các dòng; thanh luôn đi cùng dòng đầu (không bị bỏ lại cuối trang). */
function BarGroup({ title, rows }: { title: string; rows: ReactNode[] }) {
  if (!rows.length) return null;
  return (
    <View>
      <View wrap={false}>
        <View style={s.row}>
          <View style={s.bar}>
            <Text style={s.barText}>{title}</Text>
          </View>
        </View>
        {rows[0]}
      </View>
      {rows.slice(1)}
    </View>
  );
}

function Section({ title, items }: { title: string; items: Item[] }) {
  const rows = items.map((it, i) => (
    <View key={i} style={s.row} wrap={false}>
      <View style={[s.cell, s.colMain]}>
        <Text>
          <Text style={s.label}>{`${i + 1}. ${it.label}`}</Text>
          {typeof it.body === "string" ? ": " : ""}
          {typeof it.body === "string" ? <Text style={it.bold ? s.label : {}}>{it.body}</Text> : null}
        </Text>
        {typeof it.body === "string" ? null : it.body}
      </View>
      <View style={[s.cell, s.colNote]}>
        <Text style={s.note}>{it.note ?? ""}</Text>
      </View>
    </View>
  ));
  return <BarGroup title={title} rows={rows} />;
}

/** Mục có giá trị chữ: bỏ nếu trống và không có ghi chú. */
function textItem(label: string, value: string, note?: string): Item[] {
  return value.trim() || note?.trim() ? [{ label, body: value.trim(), note }] : [];
}

function listItem(label: string, values: string[], note?: string): Item[] {
  const v = values.filter((x) => x.trim());
  return v.length || note?.trim() ? [{ label, body: <Bullets items={v} />, note }] : [];
}

/** "Xăng xe" → "xăng xe" (ghép sau "Phụ cấp"); viết tắt như "KPI" giữ nguyên. */
function allowanceLabel(name: string): string {
  const t = name.trim();
  return t.length > 1 && t[1] === t[1].toLocaleLowerCase("vi") ? t[0].toLocaleLowerCase("vi") + t.slice(1) : t;
}

function salaryBlock(d: OfferLetterData): ReactNode {
  const lines: [string, string, boolean][] = [];
  if (d.baseSalary !== null) lines.push(["Lương cơ bản", formatVnd(d.baseSalary), false]);
  for (const a of d.allowances) if (a.amount !== null && a.name) lines.push([`Phụ cấp ${allowanceLabel(a.name)}`, formatVnd(a.amount), false]);
  lines.push(["Tổng lương gross", formatVnd(offerTotal(d)), true]);
  return (
    <View style={{ marginTop: 2 }}>
      {lines.map(([k, v, bold], i) => (
        <View key={i} style={[s.money, bold ? { marginTop: 2 } : {}]}>
          <Text style={bold ? s.label : {}}>{`• ${k}`}</Text>
          <Text style={bold ? s.label : {}}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

function OfferLetterDocument({ d }: { d: OfferLetterData }) {
  const start = formatStartVi(d.startDate, d.startTime);
  const sec1: Item[] = [
    ...textItem("Chức danh", d.jobTitle),
    ...textItem("Địa điểm làm việc", d.location),
    ...textItem("Thời gian làm việc", d.workingHours),
    ...(start ? [{ label: "Ngày bắt đầu làm việc", body: start, bold: true }] : []),
    { label: "Mức lương", body: salaryBlock(d), note: d.probationNote || undefined },
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
          <BarGroup
            title="IV. LỊCH TRÌNH NGÀY ĐẦU ĐI LÀM"
            rows={schedule.map((x, i) => (
              <View key={i} style={s.row} wrap={false}>
                <View style={[s.cell, s.colTime]}>
                  <Text style={s.label}>{x.time}</Text>
                </View>
                <View style={[s.cell, s.colTask]}>
                  <Text>{x.task}</Text>
                </View>
              </View>
            ))}
          />
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

/** Sinh PDF thư mời từ dữ liệu (đã sanitize). */
export async function renderOfferLetterPdf(data: OfferLetterData): Promise<Buffer> {
  ensureFonts();
  return renderToBuffer(<OfferLetterDocument d={data} />);
}
