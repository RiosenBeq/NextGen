"use client";

import { useState, useEffect } from "react";
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
  TrendingUp,
  CreditCard,
  Database,
  ShieldCheck,
  ChevronRight,
  Command,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, category: "STRATEJİ" },
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
      className="w-80 bg-black border-r border-white-[0.03] shrink-0 hidden lg:flex flex-col h-screen text-white relative z-50 overflow-hidden"
    >
      {/* Premium Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.03] via-transparent to-indigo-500/[0.03] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="h-28 flex items-center px-10 relative z-10">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
            <TrendingUp className="w-7 h-7 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter text-white leading-none">
              NextGen<span className="text-emerald-500">Box</span>
            </span>
            <span className="text-[10px] font-black tracking-[0.4em] text-zinc-600 uppercase mt-1">Strategic</span>
          </div>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 py-8 relative z-10 custom-scrollbar space-y-10">
        {categories.map((cat) => (
          <div key={cat}>
            <p className="px-5 text-[11px] font-black text-zinc-700 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
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
                      "group relative flex items-center justify-between px-5 py-4 text-[13px] font-black rounded-2xl transition-all duration-400 ease-out",
                      isActive 
                        ? "text-white bg-white/[0.05] border border-white/[0.05] shadow-[shadow-inner]" 
                        : "text-zinc-500 hover:text-white hover:bg-white/[0.02] border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500",
                        isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.02] text-zinc-600 group-hover:text-zinc-300"
                      )}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <span className="tracking-tighter uppercase italic">{link.label}</span>
                    </div>
                    {isActive && (
                      <motion.div 
                        layoutId="sidebar-active"
                        className="absolute inset-0 bg-white/[0.02] rounded-2xl border border-white/5"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <ChevronRight className={cn(
                        "w-3.5 h-3.5 transition-all duration-500",
                        isActive ? "text-emerald-400 opacity-100" : "text-zinc-800 opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                    )} />
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-8 mt-auto border-t border-white/[0.03] space-y-6 relative z-10">
        <div className="flex items-center gap-4 px-4 py-2 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
           <ShieldCheck className="w-4 h-4 text-emerald-500" />
           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">End-to-End Encryption</span>
        </div>
        
        <div className="p-5 rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-white-[0.05] flex items-center gap-5 hover:border-white/20 transition-all cursor-pointer group shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors" />
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform relative z-10">
            <User className="w-6 h-6 text-black" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-black text-white uppercase tracking-tighter">Yönetici</p>
            <div className="flex items-center gap-1.5 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[9px] text-zinc-500 font-black tracking-widest uppercase italic">Operational Status</p>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

export function Topbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
      "h-24 flex items-center justify-between px-12 sticky top-0 z-40 transition-all duration-500 border-b",
      scrolled 
        ? "bg-black/60 backdrop-blur-2xl border-white/10 h-20 shadow-2xl" 
        : "bg-transparent border-transparent"
    )}>
      <div className="flex items-center gap-10">
        <div className="flex items-center bg-white/[0.03] px-6 py-3.5 rounded-2xl w-[480px] border border-white-[0.03] focus-within:border-white/20 focus-within:bg-white/[0.06] transition-all group shadow-inner">
          <Search className="w-4 h-4 text-zinc-600 mr-4 group-focus-within:text-emerald-400 transition-colors" />
          <input 
            type="text" 
            placeholder="İşlem, AVM veya stratejik rapor ara..." 
            className="bg-transparent border-none outline-none text-sm w-full font-black tracking-tighter placeholder:text-zinc-700 text-zinc-200"
          />
          <div className="flex items-center gap-1 ml-4 px-2 py-1.5 rounded-xl bg-black border border-white/5">
             <Command className="w-2.5 h-2.5 text-zinc-600" />
             <span className="text-[10px] font-black text-zinc-600">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Network Mode</span>
              <span className="text-[10px] font-black text-white italic uppercase tracking-tighter">Enterprise Cloud</span>
           </div>
           <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
              <Globe className="w-4 h-4 text-zinc-500" />
           </div>
        </div>

        <div className="h-8 w-[1px] bg-white/5 opacity-50"></div>

        <motion.button 
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          className="relative p-3 text-zinc-500 hover:text-white transition-colors hover:bg-white/[0.05] rounded-2xl border border-transparent hover:border-white/10"
        >
          <Bell className="w-5.5 h-5.5" />
          <span className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full border-2 border-black shadow-[0_0_15px_rgba(16,185,129,0.8)]"></span>
        </motion.button>
        
        <div className="flex items-center gap-5 cursor-pointer group">
          <div className="text-right hidden md:block">
            <p className="text-sm font-black text-white leading-none mb-1 group-hover:text-emerald-400 transition-colors italic tracking-tighter uppercase">Kurucu Ortak</p>
            <div className="flex items-center justify-end gap-1.5">
               <span className="text-[9px] text-emerald-500 font-black tracking-widest uppercase">Verified Seat</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-white to-zinc-400 p-[1px] shadow-2xl shadow-emerald-500/10 group-hover:scale-105 transition-all duration-500">
            <div className="w-full h-full rounded-3xl overflow-hidden bg-black flex items-center justify-center">
               <User className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Add these to satisfy the import in layout.tsx if they were combined, but usually Sidebar and Topbar are exported separately.
// The file already has them as named exports.
