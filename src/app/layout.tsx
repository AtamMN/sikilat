/**
 * Root Layout
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LaporanProvider } from "@/context/LaporanContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi",
  description: "Aplikasi untuk membuat dan mengelola laporan kegiatan dengan mudah dan terintegrasi",
  keywords: ["laporan", "kegiatan", "SIKILAT", "balai bahasa", "jawa barat"],
  authors: [{ name: "Balai Bahasa Provinsi Jawa Barat" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased`}>
        <LaporanProvider>
          {children}
        </LaporanProvider>
      </body>
    </html>
  );
}
