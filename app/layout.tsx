import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopHeader from "@/app/components/TopHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "コツコツたまご",
  description: "推しのたまごを、1日1回だけコツコツできる。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-transparent">
        <div className="bg-particles" aria-hidden="true" />
        <div className="bg-clouds-left" aria-hidden="true" />
        <div className="bg-clouds-right" aria-hidden="true" />
        <div className="vignette" aria-hidden="true" />
        <div className="relative z-[5] flex flex-col min-h-full">
          <TopHeader />
          <div className="pt-16">{children}</div>
        </div>
      </body>
    </html>
  );
}
