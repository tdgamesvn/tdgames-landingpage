import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-admin-root
      className="relative z-20 isolate min-h-screen w-full bg-zinc-950 text-white"
      style={{ colorScheme: "dark" }}
    >
      {children}
    </div>
  );
}
