"use client";

import { useState } from "react";
import { Sidebar, Topbar, MobileNav } from "@/components/LayoutUI";
import { usePathname } from "next/navigation";

interface ClientShellProps {
  children: React.ReactNode;
  userEmail?: string;
  userFullName?: string;
  userRole?: string;
}

export default function ClientShell({ children, userEmail, userFullName, userRole }: ClientShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileMenuOpen(false);
  }

  return (
    <>
      <Sidebar userEmail={userEmail} userFullName={userFullName} userRole={userRole} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[--bg]">
        <Topbar
          onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          isOpen={mobileMenuOpen}
          userEmail={userEmail}
          userFullName={userFullName}
          userRole={userRole}
        />
        <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar pb-32 lg:pb-0">
          <div className="max-w-[1200px] mx-auto px-5 md:px-8 lg:px-12 py-6 md:py-10 lg:py-14 animate-fade-in">
            {children}
          </div>
        </div>
        <MobileNav hidden={mobileMenuOpen} />
      </main>
    </>
  );
}
