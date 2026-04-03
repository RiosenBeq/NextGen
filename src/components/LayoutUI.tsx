"use client";

import { useState } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from "framer-motion";
import { PlusCircle, LayoutDashboard, FileText, Settings, Bell, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/performance", label: "Performans Girişi", icon: PlusCircle },
    { href: "/reports", label: "Nakit Akış Raporu", icon: FileText },
    { href: "/expenses", label: "Giderler ve Yatırım", icon: FileText },
    { href: "/settings", label: "Parametreler", icon: Settings },
  ];

  return (
    <motion.aside 
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="w-64 bg-[#0A0A0A]/95 backdrop-blur-xl border-r border-white/10 shrink-0 hidden md:flex flex-col h-screen text-white relative z-50 shadow-2xl"
    >
      <div className="h-20 flex items-center px-8 font-extrabold text-2xl tracking-tighter bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
        NextGenBox
      </div>
      
      <div className="px-6 py-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Finansal Yönetim</p>
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href || (pathname !== '/' && link.href !== '/' && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group overflow-hidden",
                  isActive ? "text-white" : "text-gray-400 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-bg"
                    className="absolute inset-0 bg-white/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={cn("w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110", isActive && "text-blue-400")} />
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.aside>
  );
}

export function Topbar() {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center bg-gray-100/50 px-4 py-2 rounded-2xl w-96 border border-gray-200/50 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 shadow-inner">
        <Search className="w-4 h-4 text-gray-400 mr-3" />
        <input 
          type="text" 
          placeholder="İşlem veya AVM ara..." 
          className="bg-transparent border-none outline-none text-sm w-full font-medium placeholder:text-gray-400"
        />
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="h-8 w-px bg-gray-200"></div>
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-[2px] shadow-md group-hover:shadow-lg transition-all">
            <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-800">Kurucu Ortak</p>
            <p className="text-xs text-gray-500 font-medium">Yönetici Paneli</p>
          </div>
        </div>
      </div>
    </header>
  );
}
