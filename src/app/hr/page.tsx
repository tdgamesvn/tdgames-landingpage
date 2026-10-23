import { Inter } from "next/font/google";
import HRDashboard from "./_components/HRDashboard";
import "./hr-theme.css";

export const dynamic = "force-dynamic";

// Styleguide TD Games Work: Inter (optical sizing), đủ tiếng Việt. Gắn qua biến --hr-font
// trên <html> (hr-theme.css) để cả modal portal cũng dùng.
const inter = Inter({ subsets: ["latin", "vietnamese"], axes: ["opsz"], display: "swap" });

export default function HRPage() {
  return (
    <>
      <style>{`html[data-hr-theme]{--hr-font:${inter.style.fontFamily}}`}</style>
      <HRDashboard />
    </>
  );
}
