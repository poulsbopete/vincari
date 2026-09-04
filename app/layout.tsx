import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ApmHeartbeat } from "@/components/apm-heartbeat";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Surgical CAPD",
  description:
    "Surgical computer-assisted physician documentation demo backed by Elastic Serverless Observability.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ApmHeartbeat />
        {children}
      </body>
    </html>
  );
}
