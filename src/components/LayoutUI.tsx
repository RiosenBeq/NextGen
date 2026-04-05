"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  User,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  Wallet,
  Receipt,
  Menu,
  X,
  Home,
  BarChart3,
  PlusCircle,
  Zap,
  LogOut,
  Calendar,
  Building2,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout, updateProfile } from "@/app/actions/auth";
import { PremiumModal } from "./premium/PremiumModal";

const navLinks = [
  { href: "/", label: "Panel", icon: LayoutDashboard, category: "Ana Panel" },
  { href: "/performans", label: "Performans Girişi", icon: PlusCircle, category: "Operasyonlar" },
  { href: "/raporlar", label: "Nakit Akışı", icon: TrendingUp, category: "Finansal Analiz" },
  { href: "/hedefler", label: "Hedefler & Projeksiyon", icon: Target, category: "Finansal Analiz" },
  { href: "/aylik-ozet", label: "Aylık Özet", icon: Calendar, category: "Finansal Analiz" },
  { href: "/gelir-gider", label: "Gelir & Gider", icon: Wallet, category: "Finansal Analiz" },
  { href: "/finans", label: "Finansal Tablo", icon: BarChart3, category: "Finansal Analiz" },
  { href: "/giderler", label: "Gider Yönetimi", icon: CreditCard, category: "Finansal Analiz" },
  { href: "/faturalar", label: "Faturalar & Belgeler", icon: Receipt, category: "Finansal Analiz" },
  { href: "/notlar", label: "Notlar", icon: FileText, category: "Destek" },
  { href: "/gunlukler", label: "Sistem Logları", icon: ShieldCheck, category: "Sistem" },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings, category: "Sistem" },
];

function LogoutButton({ variant = 'sidebar' }: { variant?: 'sidebar' | 'topbar' }) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  if (variant === 'topbar') {
    return (
      <button
        onClick={handleLogout}
        disabled={isPending}
        className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all group"
        title="Çıkış Yap"
      >
        <LogOut className="w-4 h-4 group-hover:scale-105 transition-transform" />
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-white/[0.04] transition-all group"
    >
      <LogOut className={cn(
        "w-4 h-4 transition-transform",
        isPending ? "animate-spin" : "group-hover:-translate-x-0.5"
      )} />
      <span>{isPending ? 'Çıkılıyor...' : 'Çıkış Yap'}</span>
    </button>
  );
}

export function Sidebar({ userEmail, userFullName, userRole }: { userEmail?: string, userFullName?: string, userRole?: string }) {
  const pathname = usePathname();
  const categories = Array.from(new Set(navLinks.map(l => l.category)));

  const displayName = userFullName || (userEmail
    ? userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1)
    : 'Yönetici');

  return (
    <motion.aside 
      initial={{ x: -260, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 shrink-0 hidden lg:flex flex-col h-screen text-white relative z-50 shadow-2xl"
      style={{ background: '#1E2A44' }}
    >
      {/* Logo */}
      <div className="h-[65px] flex items-center px-5 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105" style={{ background: '#2F6BFF' }}>
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-white leading-tight">
              NextGen<span className="text-[#60A5FA]">Box</span>
            </span>
            <span className="text-[9px] font-semibold tracking-[0.15em] text-slate-500 uppercase">Veri Merkezi</span>
          </div>
        </Link>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {categories.map((cat) => (
          <div key={cat}>
            <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">
              {cat}
            </p>
            <nav className="space-y-0.5">
              {navLinks.filter(l => {
                if (l.category === cat) {
                  if (userRole !== 'superadmin' && (l.href === '/ayarlar' || l.href === '/gunlukler')) return false;
                  return true;
                }
                return false;
              }).map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={cn(
                      "sidebar-link",
                      isActive && "active text-white bg-white/[0.06] shadow-sm"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 shrink-0",
                      isActive ? "text-[#60A5FA]" : "text-slate-600"
                    )} />
                    <span className="text-sm font-medium">{link.label}</span>
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

      {/* Footer — User + Logout */}
      <div className="p-4 border-t border-white/[0.06] space-y-2">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ background: 'rgba(47,107,255,0.2)' }}>
            <User className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{displayName}</p>
            <p className="text-[10px] font-medium text-slate-500 truncate">{userRole === 'superadmin' ? 'Üst Yönetici' : 'Yönetim'}</p>
          </div>
        </div>
        <LogoutButton variant="sidebar" />
      </div>
    </motion.aside>
  );
}

export function Topbar({ onToggleMenu, isOpen, userEmail, userFullName, userRole }: { onToggleMenu?: () => void, isOpen?: boolean, userEmail?: string, userFullName?: string, userRole?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const pathname = usePathname();

  const displayName = userFullName || (userEmail
    ? userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1)
    : 'Yönetici');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getBreadcrumbs = () => {
    if (!pathname) return [{ label: 'Panel', href: '/' }];
    if (pathname === '/') return [{ label: 'Panel', href: '/' }];
    const segments = pathname.split('/').filter(Boolean);
    const crumbs = segments.map((seg, i) => {
      const href = '/' + segments.slice(0, i + 1).join('/');
      const link = navLinks.find(l => l.href === href);
      return { label: link?.label || seg.charAt(0).toUpperCase() + seg.slice(1), href };
    });
    return [{ label: 'Panel', href: '/' }, ...crumbs];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      <header className={cn(
        "h-[65px] flex items-center justify-between px-5 md:px-8 sticky top-0 z-40 transition-all duration-200 border-b bg-white/80 backdrop-blur-md",
        scrolled ? "shadow-sm border-slate-200" : "border-slate-100"
      )}>
        <div className="flex items-center gap-6">
          <button 
            onClick={onToggleMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-500" />
          </button>

          {/* Breadcrumb */}
          <nav className="hidden md:flex items-center gap-2 overflow-hidden">
             {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={crumb.href}>
                  <Link 
                    href={crumb.href}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap",
                      i === breadcrumbs.length - 1 ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {crumb.label}
                  </Link>
                  {i < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
                </React.Fragment>
             ))}
          </nav>
        </div>

        <Link href="/" className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#2F6BFF' }}>
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-base text-slate-900">
            NextGen<span style={{ color: '#2F6BFF' }}>Box</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LogoutButton variant="topbar" />
          <button onClick={() => setProfileModalOpen(true)} className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-all border border-transparent hover:border-slate-200">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-[11px] font-semibold text-slate-900 leading-none mb-1">{displayName}</p>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">{userRole === 'superadmin' ? 'Üst Yönetici' : 'Yönetim'}</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #2F6BFF, #2457E6)' }}>
              <User className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>
      </header>

      <PremiumModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} title="Profil Ayarları" maxWidth="max-w-md">
        <div className="p-8">
          <form action={async (formData) => {
            setIsUpdating(true);
            const res = await updateProfile(formData);
            setIsUpdating(false);
            if (res.success) {
               setProfileModalOpen(false);
               window.location.reload();
            } else {
               alert((res as any).error || "Bir hata oluştu.");
            }
          }} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Ad Soyad (Sistem Kimliği)</label>
               <input 
                  type="text" 
                  name="fullName"
                  required
                  defaultValue={userFullName || ''}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-black italic uppercase tracking-tighter text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-inner"
                  placeholder="İsminizi giriniz..."
               />
            </div>
            <div className="space-y-2 opacity-50 pointer-events-none">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">E-Posta (Yalnızca Okuma)</label>
               <div className="w-full px-6 py-4 bg-slate-100 border border-slate-200 rounded-[22px] text-sm font-bold text-slate-400 italic">
                  {userEmail}
               </div>
            </div>
            <div className="pt-6">
               <button 
                 type="submit"
                 disabled={isUpdating}
                 className="w-full py-5 bg-blue-600 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
               >
                 {isUpdating ? 'Senkronize Ediliyor...' : 'Profil Ayarlarını Uygula'}
               </button>
            </div>
          </form>
        </div>
      </PremiumModal>

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
              className="fixed top-0 left-0 w-64 h-full z-[70] overflow-y-auto lg:hidden shadow-2xl"
              style={{ background: '#1E2A44' }}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <Link href="/" className="flex items-center gap-2.5" onClick={onToggleMenu}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#2F6BFF' }}>
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

              <nav className="p-3 space-y-0.5" role="navigation">
                {navLinks.filter(l => {
                  if (userRole !== 'superadmin' && (l.href === '/ayarlar' || l.href === '/gunlukler')) return false;
                  return true;
                }).map(link => {
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

              {/* Mobile Logout */}
              <div className="p-3 mt-4 border-t border-white/[0.06]">
                <LogoutButton variant="sidebar" />
              </div>
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
    { href: "/raporlar", label: "Rapor", icon: TrendingUp },
    { href: "/giderler", label: "Giderler", icon: CreditCard },
  ];

  return (
    <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 px-2 py-1.5 rounded-2xl shadow-xl shadow-slate-200/70 max-w-[92vw]">
      <div className="flex items-center gap-0.5" role="navigation">
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
                  ? "text-blue-600 bg-blue-50"
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
