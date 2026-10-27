import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SetPasswordForm from "../_components/SetPasswordForm";
import "../hr-theme.css";

export const dynamic = "force-dynamic";

// Link chứa token một lần dùng → không index, không gửi Referer ra ngoài.
export const metadata: Metadata = {
  title: "Đặt mật khẩu — TD Games HR",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const inter = Inter({ subsets: ["latin", "vietnamese"], axes: ["opsz"], display: "swap" });

export default async function HrSetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" ? raw : "";
  return (
    <>
      <style>{`html[data-hr-theme]{--hr-font:${inter.style.fontFamily}}`}</style>
      <SetPasswordForm token={token} />
    </>
  );
}
