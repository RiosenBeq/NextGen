"use client";

import { useState, useEffect } from "react";
import { Sidebar, Topbar, MobileNav } from "@/components/LayoutUI";
import { usePathname } from "next/navigation";

interface ClientShellProps {
  children: React.ReactNode;
  userEmail?: string;
}

export default function ClientShell({ children, userEmail }: ClientShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <Sidebar userEmail={userEmail} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Topbar
          onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          isOpen={mobileMenuOpen}
          userEmail={userEmail}
        />
        <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar pb-48 lg:pb-0">
          <div className="max-w-[1800px] mx-auto p-4 md:p-10 animate-fade-in">
            {children}
          </div>
        </div>
        <MobileNav hidden={mobileMenuOpen} />
      </main>
    </>
  );
}
