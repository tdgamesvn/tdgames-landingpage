// Gửi event lên GA4 / Google Ads. An toàn khi gtag chưa load (env chưa set, adblock).
type Gtag = (...args: unknown[]) => void;

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (!gtag) return;
  gtag("event", name, params);

  // Google Ads conversion (vd "AW-123456789/AbCdEf") — chỉ bắn cho lead.
  const adsConversion = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION;
  if (name === "generate_lead" && adsConversion) {
    gtag("event", "conversion", { send_to: adsConversion });
  }
}
