import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SnapBooth | Admin Dashboard",
  description: "Manage your photobooth statistics, frames, and settings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex bg-[#0f172a] text-slate-100`}>
        <Sidebar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-950 p-8 pt-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
