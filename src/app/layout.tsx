import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar, Topbar } from "@/components/LayoutUI";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NextGenBox Financial Ledger",
  description: "NextGenBox Partner Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-[#F4F7FB] flex h-screen overflow-hidden text-gray-900 font-sans antialiased selection:bg-blue-200`}>
        <Sidebar  />
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <Topbar />
          <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
