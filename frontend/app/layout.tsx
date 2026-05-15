import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cảnh Đức Digital Form",
  description: "Nói chuyện với phiên bản số của Cảnh Đức",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
