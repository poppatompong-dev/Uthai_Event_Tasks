import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/context";

export const metadata: Metadata = {
  title: "ปฏิทินดำเนินงาน/นับวันราชการ",
  description: "ระบบปฏิทินกิจกรรมและนับวันราชการ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
