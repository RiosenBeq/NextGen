import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlusCircle, LayoutDashboard, FileText, Settings } from "lucide-react";
import Link from 'next/link';

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
      <body className={`${inter.className} bg-gray-50 flex h-screen overflow-hidden text-gray-900`}>
        {/* Sidebar */}
        <aside className="w-64 bg-black text-white shrink-0 hidden md:flex flex-col">
          <div className="h-16 flex items-center px-6 font-bold text-xl tracking-tight border-b border-gray-800">
            NextGenBox
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium">
              <LayoutDashboard className="w-5 h-5" />
              Özet (Dashboard)
            </Link>
            <Link href="/performance" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/10 text-white font-medium text-sm transition-colors">
              <PlusCircle className="w-5 h-5" />
              Performans Girişi
            </Link>
            <Link href="/reports" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium">
              <FileText className="w-5 h-5" />
              Nakit Akış
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium">
              <Settings className="w-5 h-5" />
              Parametreler
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#F9FAFB]">
          <div className="p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
