/**
 * Bare layout for /spine-demo/* — không có nav, footer, hay padding.
 * Dùng để embed vào Behance/portfolio qua iframe.
 */
export default function SpineDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: "hidden", background: "transparent" }}>
        {children}
      </body>
    </html>
  );
}
