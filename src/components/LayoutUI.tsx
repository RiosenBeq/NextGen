"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  StickyNote,
  ScrollText,
  Settings,
  User,
  TrendingUp,
  CreditCard,
  ShieldCheck,
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
  Target,
  Building2,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import { PremiumModal } from "./premium/PremiumModal";
import { ProfileSettingsForm } from "@/features/auth/components/ProfileSettingsForm";

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
  { href: "/avm-odemeleri", label: "AVM Ödeme Takibi", icon: Building2, category: "Finansal Analiz" },
  { href: "/sozlesmeler", label: "Sözleşmeler", icon: ScrollText, category: "Finansal Analiz" },
  { href: "/notlar", label: "Notlar", icon: StickyNote, category: "Destek" },
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
        className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors duration-200"
        title="Çıkış Yap"
      >
        <LogOut className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200 group"
    >
      <LogOut className={cn(
        "w-4 h-4",
        isPending && "animate-spin"
      )} />
      <span>{isPending ? 'Çıkılıyor...' : 'Çıkış Yap'}</span>
    </button>
  );
}

function navLinkClasses(isActive: boolean) {
  return cn(
    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors duration-200 border-l-2",
    isActive
      ? "bg-slate-100 text-slate-900 font-semibold border-blue-500"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium border-transparent"
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
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-64 shrink-0 hidden lg:flex flex-col h-screen relative z-50 bg-white border-r border-slate-200/70"
    >
      {/* Logo */}
      <div className="h-[65px] flex items-center px-5 border-b border-slate-200/70">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 transition-colors duration-200 group-hover:bg-blue-100">
            <Zap className="w-5 h-5 text-blue-600" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base tracking-tight text-slate-900 leading-tight">
              NextGen<span className="text-blue-600">Box</span>
            </span>
            <span className="text-[9px] font-medium tracking-[0.15em] text-slate-400 uppercase">Veri Merkezi</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {categories.map((cat) => (
          <div key={cat}>
            <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {cat}
            </p>
            <nav className="space-y-1">
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
                    className={navLinkClasses(isActive)}
                  >
                    <Icon className={cn(
                      "w-4 h-4 shrink-0",
                      isActive ? "text-blue-600" : "text-slate-400"
                    )} strokeWidth={2} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer — User + Logout */}
      <div className="p-4 border-t border-slate-200/70 space-y-2">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/50">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50">
            <User className="w-4 h-4 text-blue-600" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{displayName}</p>
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
        "h-[65px] flex items-center justify-between px-5 md:px-8 sticky top-0 z-40 transition-shadow duration-200 border-b bg-white/85 backdrop-blur-xl",
        scrolled ? "shadow-[0_1px_2px_rgba(0,0,0,0.04)] border-slate-200/70" : "border-slate-200/50"
      )}>
        <div className="flex items-center gap-6">
          <button
            onClick={onToggleMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
          >
            <Menu className="w-5 h-5 text-slate-500" strokeWidth={2} />
          </button>

          {/* Breadcrumb */}
          <nav className="hidden md:flex items-center gap-2 overflow-hidden">
             {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={crumb.href}>
                  <Link
                    href={crumb.href}
                    className={cn(
                      "text-xs font-medium tracking-tight transition-colors duration-200 whitespace-nowrap",
                      i === breadcrumbs.length - 1 ? "text-slate-900 font-semibold" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {crumb.label}
                  </Link>
                  {i < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" strokeWidth={2} />}
                </React.Fragment>
             ))}
          </nav>
        </div>

        <Link href="/" className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50">
            <Zap className="w-4 h-4 text-blue-600" strokeWidth={2} />
          </div>
          <span className="font-semibold text-base text-slate-900 tracking-tight">
            NextGen<span className="text-blue-600">Box</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LogoutButton variant="topbar" />
          <button
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-colors duration-200"
          >
            <div className="hidden md:flex flex-col items-end">
              <p className="text-xs font-semibold text-slate-900 leading-none mb-1 tracking-tight">{displayName}</p>
              <p className="text-[10px] font-medium text-slate-400 tracking-wide">{userRole === 'superadmin' ? 'Üst Yönetici' : 'Yönetim'}</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50">
              <User className="w-4 h-4 text-blue-600" strokeWidth={2} />
            </div>
          </button>
        </div>
      </header>

      <PremiumModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} title="Profil Ayarları" maxWidth="max-w-3xl">
        <div className="p-4">
          <ProfileSettingsForm
            user={{
              id: 'aktif-kullanici',
              email: userEmail || '',
              fullName: userFullName || '',
              role: userRole || 'user',
              birthDate: '',
            }}
          />
        </div>
      </PremiumModal>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 z-[60] bg-slate-900/20 backdrop-blur-sm lg:hidden"
              onClick={onToggleMenu}
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed top-0 left-0 w-64 h-full z-[70] overflow-y-auto lg:hidden bg-white border-r border-slate-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-200/70">
                <Link href="/" className="flex items-center gap-2.5" onClick={onToggleMenu}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50">
                    <Zap className="w-4 h-4 text-blue-600" strokeWidth={2} />
                  </div>
                  <span className="font-semibold text-base text-slate-900 tracking-tight">
                    NextGen<span className="text-blue-600">Box</span>
                  </span>
                </Link>
                <button onClick={onToggleMenu} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors duration-200">
                  <X className="w-4 h-4 text-slate-500" strokeWidth={2} />
                </button>
              </div>

              <nav className="p-3 space-y-1" role="navigation">
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
                      className={navLinkClasses(isActive)}
                    >
                      <Icon className={cn(
                        "w-4 h-4 shrink-0",
                        isActive ? "text-blue-600" : "text-slate-400"
                      )} strokeWidth={2} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Logout */}
              <div className="p-3 mt-4 border-t border-slate-200/70">
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
    <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 backdrop-blur-xl bg-white/95 border border-slate-200/70 px-2 py-1.5 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] max-w-[92vw]">
      <div className="flex items-center gap-1" role="navigation">
        {mobileLinks.map(link => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors duration-200",
                isActive
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="text-[10px] font-medium tracking-tight">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
