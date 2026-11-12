// Gửi event lên GA4 / Google Ads. An toàn khi gtag chưa load (env chưa set, adblock).
type Gtag = (...args: unknown[]) => void;

export function trackEvent(
  name: string,
  params: Record<string, unknown> = {},
  userData?: { email?: string },
) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (!gtag) return;
  gtag("event", name, params);

  // Google Ads conversion (vd "AW-123456789/AbCdEf") — chỉ bắn cho lead.
  const adsConversion = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION;
  if (name === "generate_lead" && adsConversion) {
    // Enhanced conversions: email gửi dạng thô cho gtag, gtag tự chuẩn hoá + hash SHA-256 trong
    // trình duyệt trước khi gửi Google. Chỉ set ngay trước conversion của lead (đã ghi ở Privacy Policy).
    const email = userData?.email?.trim().toLowerCase();
    if (email) gtag("set", "user_data", { email });
    gtag("event", "conversion", { send_to: adsConversion });
  }
}
