import Script from "next/script";

// GA4 + (tuỳ chọn) Google Ads qua gtag.js. Không set env → không render gì.
// NEXT_PUBLIC_* được inline lúc build → phải có trong .env trên VPS TRƯỚC khi build.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

export default function GoogleAnalytics() {
  const ids = [GA_ID, ADS_ID].filter(Boolean) as string[];
  if (ids.length === 0) return null;

  const config = ids.map((id) => `gtag('config', '${id}');`).join("\n");

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${ids[0]}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
${config}`}
      </Script>
    </>
  );
}
