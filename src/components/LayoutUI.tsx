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
  Globe,
  Wallet,
  Receipt,
  Menu,
  X,
  Home,
  BarChart3,
  SearchIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, category: "Main" },
  { href: "/performance", label: "Performans", icon: PlusCircle, category: "Operations" },
  { href: "/reports", label: "Nakit Akışı", icon: TrendingUp, category: "Finance" },
  { href: "/gelir-gider", label: "Gelir & Gider", icon: Wallet, category: "Finance" },
  { href: "/finans", label: "Finansal Tablo", icon: BarChart3, category: "Finance" },
  { href: "/expenses", label: "Yatırımlar", icon: CreditCard, category: "Finance" },
  { href: "/kabin", label: "Kabin Verisi", icon: Database, category: "Data" },
  { href: "/notes", label: "Notlar", icon: FileText, category: "Other" },
  { href: "/settings", label: "Ayarlar", icon: Settings, category: "System" },
];

export function Sidebar() {
  const pathname = usePathname();
  const categories = Array.from(new Set(navLinks.map(l => l.category)));

  return (
    <motion.aside 
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-72 bg-[#0c0d12] border-r border-white/[0.04] shrink-0 hidden lg:flex flex-col h-screen text-white relative z-50 overflow-hidden"
    >
      {/* Refined Subtle Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.01] via-transparent to-emerald-500/[0.01] pointer-events-none" />
      
      <div className="h-24 flex items-center px-8 relative z-10">
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-105">
            <TrendingUp className="w-5 h-5 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-white leading-tight">
              NextGen<span className="text-emerald-500">Box</span>
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] text-zinc-500 uppercase mt-0.5">Intelligence</span>
          </div>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-6 relative z-10 space-y-8">
        {categories.map((cat) => (
          <div key={cat}>
            <p className="px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              {cat}
            </p>
            <nav className="space-y-1">
              {navLinks.filter(l => l.category === cat).map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={cn(
                      "group relative flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200",
                      isActive 
                        ? "text-white bg-white/[0.03] border border-white/[0.06] shadow-sm" 
                        : "text-zinc-500 hover:text-white hover:bg-white/[0.02] border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3.5 relative z-10">
                      <Icon className={cn(
                        "w-4.5 h-4.5 transition-colors",
                        isActive ? "text-emerald-400" : "text-zinc-600 group-hover:text-zinc-400"
                      )} />
                      <span className="text-sm font-medium tracking-tight">{link.label}</span>
                    </div>
                    {isActive && (
                      <motion.div 
                        layoutId="sidebar-active"
                        className="absolute inset-0 bg-white/[0.02] rounded-xl"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <ChevronRight className={cn(
                        "w-3.5 h-3.5 transition-all duration-300",
                        isActive ? "text-emerald-500 opacity-100" : "text-zinc-800 opacity-0 group-hover:opacity-40 group-hover:translate-x-0.5"
                    )} />
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-6 mt-auto border-t border-white/[0.03] space-y-4 relative z-10">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-500/[0.04] rounded-xl border border-emerald-500/[0.08]">
           <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" />
           <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest">Secure Environment</span>
        </div>
        
        <div className="p-4 rounded-2xl bg-[#15161c] border border-white/[0.04] flex items-center gap-4 hover:border-white/[0.1] transition-all cursor-pointer group shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center border border-white/[0.06] group-hover:scale-105 transition-transform">
            <User className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-white tracking-tight">Admin Console</p>
            <div className="flex items-center gap-1.5 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <p className="text-[9px] text-zinc-500 font-medium tracking-wide">Operational</p>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

export function Topbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className={cn(
        "h-16 md:h-20 flex items-center justify-between px-6 md:px-10 sticky top-0 z-40 transition-all duration-300 border-b",
        scrolled 
          ? "bg-[#08090d]/80 backdrop-blur-3xl border-white/[0.06] shadow-xl" 
          : "bg-transparent border-transparent"
      )}>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl hover:bg-white/[0.05] transition-colors"
        >
          <Menu className="w-5 h-5 text-zinc-400" />
        </button>

        <Link href="/" className="lg:hidden flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight text-white">
            NextGen<span className="text-emerald-500">.</span>
          </span>
        </Link>

        {/* Global Action Search */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center bg-white/[0.02] px-5 py-2.5 rounded-xl w-[400px] border border-white/[0.04] focus-within:border-white/[0.1] focus-within:bg-white/[0.04] transition-all group">
            <SearchIcon className="w-4 h-4 text-zinc-500 mr-3 transition-colors group-focus-within:text-white" />
            <input 
              type="text" 
              placeholder="Hızlı arama veya veri sorgula..." 
              className="bg-transparent border-none outline-none text-sm w-full font-medium placeholder:text-zinc-600 text-zinc-200"
            />
            <div className="flex items-center gap-1 ml-3 px-1.5 py-1 rounded bg-black/40 border border-white/[0.06]">
               <Command className="w-3 h-3 text-zinc-500" />
               <span className="text-[10px] font-bold text-zinc-500">K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 md:gap-8">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2.5 text-zinc-400 hover:text-white transition-colors hover:bg-white/[0.05] rounded-xl border border-transparent hover:border-white/[0.06]"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-black shadow-[0_0_10px_rgba(52,199,89,0.5)]"></span>
          </motion.button>
          
          <div className="flex items-center gap-4 cursor-pointer group">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-white leading-none mb-1 group-hover:text-emerald-400 transition-colors">Yönetici</p>
              <p className="text-[10px] text-zinc-500 font-medium">Strategic Partner</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-zinc-700 to-zinc-900 p-[1px] shadow-lg group-hover:scale-105 transition-all duration-300">
              <div className="w-full h-full rounded-xl overflow-hidden bg-[#0c0d12] flex items-center justify-center">
                 <User className="w-5 h-5 text-zinc-500" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 w-72 h-full z-[70] bg-[#0c0d12] border-r border-white/[0.06] overflow-y-auto lg:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/[0.04]">
                <Link href="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-black" />
                  </div>
                  <span className="font-bold text-lg tracking-tight text-white">
                    NextGen<span className="text-emerald-500">Box</span>
                  </span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl hover:bg-white/[0.05]">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <nav className="p-4 space-y-1">
                {navLinks.map(link => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-emerald-500/[0.06] text-emerald-400 border border-emerald-500/[0.1]"
                          : "text-zinc-500 hover:text-white hover:bg-white/[0.04] border border-transparent"
                      )}
                    >
                      <Icon className="w-4.5 h-4.5" />
                      <span className="tracking-tight">{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  const mobileLinks = [
    { href: "/", label: "Homet", icon: Home },
    { href: "/gelir-gider", label: "Finans", icon: Wallet },
    { href: "/reports", label: "Raporlar", icon: TrendingUp },
    { href: "/kabin", label: "Cihazlar", icon: Database },
    { href: "/expenses", label: "Giderler", icon: CreditCard },
  ];

  return (
    <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111116]/80 backdrop-blur-3xl border border-white/[0.08] px-3 py-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] max-w-[90vw]">
      <div className="flex items-center gap-1.5">
        {mobileLinks.map(link => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                isActive
                  ? "text-emerald-400 bg-white/[0.04]"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_rgba(52,199,89,0.4)]")} />
              <span className="text-[9px] font-bold uppercase tracking-wider">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

