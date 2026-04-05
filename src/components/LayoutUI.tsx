"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Bell, 
  User,
  TrendingUp,
  CreditCard,
  Database,
  ShieldCheck,
  ChevronRight,
  Wallet,
  Receipt,
  Menu,
  X,
  Home,
  BarChart3,
  Search,
  PlusCircle,
  Zap,
  LogOut,
  Calendar,
  Scale,
  Building2,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, category: "Main" },
  { href: "/performance", label: "Performans", icon: PlusCircle, category: "Operasyonlar" },
  { href: "/reports", label: "Nakit Akışı", icon: TrendingUp, category: "Finans" },
  { href: "/hedefler", label: "Hedefler & Projeksiyon", icon: Target, category: "Finans" },
  { href: "/monthly", label: "Aylık Özet", icon: Calendar, category: "Finans" },
  { href: "/avm-odemeleri", label: "AVM Kira Ödemeleri", icon: Building2, category: "Finans" },
  { href: "/gelir-gider", label: "Gelir & Gider", icon: Wallet, category: "Finans" },
  { href: "/finans", label: "Finansal Tablo", icon: BarChart3, category: "Finans" },
  { href: "/expenses", label: "Gider Yönetimi", icon: CreditCard, category: "Finans" },
  { href: "/faturalar", label: "Faturalar & Belgeler", icon: Receipt, category: "Finans" },
  { href: "/notes", label: "Notlar", icon: FileText, category: "Diğer" },
  { href: "/logs", label: "Sistem Logları", icon: ShieldCheck, category: "Sistem" },
  { href: "/settings", label: "Ayarlar", icon: Settings, category: "Sistem" },
];

export function Sidebar() {
  const pathname = usePathname();
  const categories = Array.from(new Set(navLinks.map(l => l.category)));

  return (
    <motion.aside 
      initial={{ x: -260, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-[#1E293B] shrink-0 hidden lg:flex flex-col h-screen text-white relative z-50"
    >
      {/* Logo */}
      <div className="h-[65px] flex items-center px-5 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-white leading-tight">
              NextGen<span className="text-[#60A5FA]">Box</span>
            </span>
            <span className="text-[9px] font-semibold tracking-[0.15em] text-slate-500 uppercase">Intelligence</span>
          </div>
        </Link>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {categories.map((cat) => (
          <div key={cat}>
            <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">
              {cat}
            </p>
            <nav className="space-y-0.5">
              {navLinks.filter(l => l.category === cat).map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={cn(
                      "sidebar-link",
                      isActive && "active"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 shrink-0",
                      isActive ? "text-[#60A5FA]" : "text-slate-600"
                    )} />
                    <span className="text-sm">{link.label}</span>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#60A5FA]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.06] space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:bg-white/[0.06] transition-colors">
          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Admin</p>
            <p className="text-[10px] text-slate-500">Yönetici</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

export function Topbar({ onToggleMenu, isOpen }: { onToggleMenu?: () => void, isOpen?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className={cn(
        "h-[65px] flex items-center justify-between px-5 md:px-8 sticky top-0 z-40 transition-all duration-200 border-b bg-white",
        scrolled ? "shadow-sm border-slate-200" : "border-slate-100"
      )}>
        <button 
          onClick={onToggleMenu}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>

        <Link href="/" className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-base text-slate-900">
            NextGen<span className="text-[#2563EB]">Box</span>
          </span>
        </Link>

        {/* Search */}
        <div className="hidden lg:flex items-center gap-2 flex-1 max-w-sm">
          <div className="flex items-center bg-slate-100 px-4 py-2 rounded-xl w-full border border-slate-200 focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm transition-all group">
            <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
            <input 
              type="text" 
              placeholder="Arama..." 
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-xs font-semibold text-slate-800 leading-none mb-0.5">Yönetici</p>
              <p className="text-[10px] text-slate-400">Admin Panel</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <User className="w-4.5 h-4.5 text-white" />
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm lg:hidden"
              onClick={onToggleMenu}
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed top-0 left-0 w-64 h-full z-[70] bg-[#1E293B] overflow-y-auto lg:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <Link href="/" className="flex items-center gap-2.5" onClick={onToggleMenu}>
                  <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
                    <Zap className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="font-bold text-base text-white">
                    NextGen<span className="text-[#60A5FA]">Box</span>
                  </span>
                </Link>
                <button onClick={onToggleMenu} className="p-1.5 rounded-lg hover:bg-white/[0.06]">
                  <X className="w-4.5 h-4.5 text-slate-400" />
                </button>
              </div>

              <nav className="p-3 space-y-0.5">
                {navLinks.map(link => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onToggleMenu}
                      className={cn("sidebar-link", isActive && "active")}
                    >
                      <Icon className={cn("w-4 h-4", isActive ? "text-[#60A5FA]" : "text-slate-600")} />
                      <span>{link.label}</span>
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

export function MobileNav({ hidden }: { hidden?: boolean }) {
  const pathname = usePathname();
  if (hidden) return null;

  const mobileLinks = [
    { href: "/", label: "Ana Sayfa", icon: Home },
    { href: "/gelir-gider", label: "Finans", icon: Wallet },
    { href: "/reports", label: "Rapor", icon: TrendingUp },
    { href: "/expenses", label: "Giderler", icon: CreditCard },
  ];

  return (
    <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 px-2 py-1.5 rounded-2xl shadow-xl shadow-slate-200/70 max-w-[92vw]">
      <div className="flex items-center gap-0.5">
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
                  ? "text-[#2563EB] bg-blue-50"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-semibold tracking-wide">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
