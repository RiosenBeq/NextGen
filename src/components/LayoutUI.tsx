"use client";

import { useState } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import { 
  PlusCircle, 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Bell, 
  Search, 
  User,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, category: "GENEL" },
    { href: "/performance", label: "Performans Girişi", icon: PlusCircle, category: "OPERASYON" },
    { href: "/reports", label: "Nakit Akış Raporu", icon: TrendingUp, category: "FİNANS" },
    { href: "/expenses", label: "Giderler ve Yatırım", icon: CreditCard, category: "FİNANS" },
    { href: "/kabin", label: "Kabin Rapor", icon: Database, category: "VERİ" },
    { href: "/notes", label: "Notlar", icon: FileText, category: "DİĞER" },
    { href: "/settings", label: "Parametreler", icon: Settings, category: "AYARLAR" },
  ];

  const categories = Array.from(new Set(links.map(l => l.category)));

  return (
    <motion.aside 
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="w-72 bg-zinc-950/40 backdrop-blur-2xl border-r border-white/5 shrink-0 hidden lg:flex flex-col h-screen text-white relative z-50"
    >
      <div className="h-24 flex items-center px-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            NextGen<span className="text-emerald-400">Box</span>
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
        {categories.map((cat) => (
          <div key={cat} className="mb-8">
            <p className="px-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">
              {cat}
            </p>
            <nav className="space-y-1.5">
              {links.filter(l => l.category === cat).map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={cn(
                      "relative flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 group overflow-hidden",
                      isActive 
                        ? "text-white bg-white/5 shadow-sm" 
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                    )}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <Icon className={cn(
                        "w-5 h-5 transition-transform duration-300 group-hover:scale-110", 
                        isActive ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300"
                      )} />
                      <span>{link.label}</span>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-white/5">
        <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Yönetici Paneli</p>
            <p className="text-[10px] text-emerald-400/80 font-medium">Pro Versiyon</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

export function Topbar() {
  return (
    <header className="h-20 bg-background/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-10 sticky top-0 z-40">
      <div className="flex items-center gap-8">
        <div className="flex items-center bg-zinc-900/50 px-5 py-2.5 rounded-2xl w-[400px] border border-white/5 focus-within:bg-zinc-800/50 transition-all shadow-inner">
          <Search className="w-4 h-4 text-zinc-500 mr-3" />
          <input 
            type="text" 
            placeholder="İşlem, AVM veya kabin ara..." 
            className="bg-transparent border-none outline-none text-sm w-full font-medium placeholder:text-zinc-600 text-zinc-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2.5 text-zinc-400 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-zinc-950"></span>
          </motion.button>
        </div>
        
        <div className="h-8 w-px bg-white/5"></div>
        
        <motion.div 
          whileHover={{ x: 3 }}
          className="flex items-center gap-4 cursor-pointer group"
        >
          <div className="text-right">
            <p className="text-sm font-bold text-white leading-tight">Kurucu Ortak</p>
            <p className="text-[10px] text-zinc-500 font-black tracking-wider uppercase">NG-001</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 p-[1px] shadow-xl">
            <div className="w-full h-full rounded-2xl overflow-hidden bg-zinc-950 flex items-center justify-center">
               <User className="w-6 h-6 text-zinc-500" />
            </div>
          </div>
        </motion.div>
      </div>
    </header>
  );
}
