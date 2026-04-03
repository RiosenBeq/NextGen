"use client";

// Vercel Trigger: Last Sync @ 2026-04-04
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar, Topbar, MobileNav } from "@/components/LayoutUI";
import * as motion from "framer-motion/client";
import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="tr" className="dark">
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>NextGenBox — Financial Control</title>
      </head>
      <body className={`${inter.className} bg-[#111116] flex h-screen overflow-hidden text-zinc-50 font-sans antialiased selection:bg-emerald-500/30`}>
        <Sidebar />
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <Topbar />
          <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar pb-20 lg:pb-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="min-h-full"
              >
                <div className="max-w-[1800px] mx-auto p-4 md:p-10">
                  {children}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <MobileNav />
        </main>
      </body>
    </html>
  );
}
