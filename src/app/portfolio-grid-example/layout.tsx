import type { Metadata } from "next";

// Trang demo/mock data — không cho Google index (page là client component nên đặt metadata ở layout).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
