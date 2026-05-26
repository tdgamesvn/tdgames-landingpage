/**
 * Bare layout for /spine-demo/* — không có nav, footer, hay padding.
 * Dùng để embed vào Behance/portfolio qua iframe.
 *
 * NOTE: Không được có <html> hay <body> ở đây — root layout đã có rồi.
 * _client.tsx dùng position:fixed + inset:0 để chiếm toàn viewport.
 */
export default function SpineDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
