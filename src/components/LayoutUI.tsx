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
  { href: "/", label: "Panel", icon: LayoutDashboard, category: "Genel" },
  { href: "/performans", label: "Performans Girişi", icon: PlusCircle, category: "Operasyon" },
  { href: "/raporlar", label: "Nakit Akışı", icon: TrendingUp, category: "Analiz" },
  { href: "/hedefler", label: "Hedefler", icon: Target, category: "Analiz" },
  { href: "/aylik-ozet", label: "Aylık Özet", icon: Calendar, category: "Analiz" },
  { href: "/gelir-gider", label: "Gelir & Gider", icon: Wallet, category: "Analiz" },
  { href: "/finans", label: "Finansal Tablo", icon: BarChart3, category: "Analiz" },
  { href: "/giderler", label: "Gider Yönetimi", icon: CreditCard, category: "Analiz" },
  { href: "/faturalar", label: "Faturalar", icon: Receipt, category: "Analiz" },
  { href: "/avm-odemeleri", label: "AVM Ödemeleri", icon: Building2, category: "Analiz" },
  { href: "/sozlesmeler", label: "Sözleşmeler", icon: ScrollText, category: "Analiz" },
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
        className="w-11 h-11 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--text] hover:bg-[--bg-elevated] transition-colors duration-200"
        title="Çıkış Yap"
        aria-label="Çıkış Yap"
      >
        <LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-normal text-[--text-secondary] hover:text-[--text] hover:bg-[--bg-elevated] transition-colors duration-200"
    >
      <LogOut className={cn("w-4 h-4", isPending && "animate-spin")} strokeWidth={1.75} />
      <span>{isPending ? 'Çıkılıyor…' : 'Çıkış Yap'}</span>
    </button>
  );
}

function navLinkClasses(isActive: boolean) {
  return cn(
    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-colors duration-200",
    isActive
      ? "bg-[--bg-elevated] text-[--text] font-medium"
      : "text-[--text-secondary] hover:bg-[--bg-elevated] hover:text-[--text] font-normal"
  );
}

function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "font-semibold tracking-tight text-[--text] leading-none",
          size === 'sm' ? "text-[17px]" : "text-[19px]"
        )}
        style={{ letterSpacing: '-0.022em' }}
      >
        NextGen<span className="text-[--accent]">Box</span>
      </span>
    </div>
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-64 shrink-0 hidden lg:flex flex-col h-screen relative z-50 bg-[--surface] border-r border-[--border]"
    >
      {/* Logo */}
      <div className="h-[64px] flex items-center px-6">
        <Link href="/" className="flex items-center">
          <BrandMark />
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
        {categories.map((cat) => {
          const visibleLinks = navLinks.filter(l => {
            if (l.category !== cat) return false;
            if (userRole !== 'superadmin' && (l.href === '/ayarlar' || l.href === '/gunlukler')) return false;
            return true;
          });
          if (visibleLinks.length === 0) return null;

          return (
            <div key={cat}>
              <p className="px-3 text-[12px] font-medium text-[--text-quaternary] mb-2" style={{ letterSpacing: '-0.005em' }}>
                {cat}
              </p>
              <nav className="space-y-0.5">
                {visibleLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={navLinkClasses(isActive)}
                    >
                      <Icon
                        className={cn(
                          "w-[18px] h-[18px] shrink-0",
                          isActive ? "text-[--accent]" : "text-[--text-tertiary]"
                        )}
                        strokeWidth={1.75}
                      />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Footer — User + Logout */}
      <div className="p-3 border-t border-[--border] space-y-1">
        <div className="flex items-center gap-3 p-3 rounded-xl">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[--bg-elevated]">
            <User className="w-[18px] h-[18px] text-[--text-secondary]" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-[--text] truncate" style={{ letterSpacing: '-0.005em' }}>{displayName}</p>
            <p className="text-[12px] text-[--text-tertiary] truncate">{userRole === 'superadmin' ? 'Üst Yönetici' : 'Yönetim'}</p>
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
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getBreadcrumbs = () => {
    if (!pathname || pathname === '/') return [{ label: 'Panel', href: '/' }];
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
      <header
        className={cn(
          "h-[56px] flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 transition-colors duration-200 backdrop-blur-xl",
          scrolled ? "bg-white/72 border-b border-[--border]" : "bg-white/72 border-b border-transparent"
        )}
        style={{ backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
      >
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onToggleMenu}
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-full hover:bg-[--bg-elevated] transition-colors duration-200"
            aria-label="Menü"
          >
            <Menu className="w-5 h-5 text-[--text]" strokeWidth={1.75} />
          </button>

          {/* Breadcrumb */}
          <nav className="hidden md:flex items-center gap-1.5 overflow-hidden min-w-0">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.href}>
                <Link
                  href={crumb.href}
                  className={cn(
                    "text-[13px] transition-colors duration-200 whitespace-nowrap",
                    i === breadcrumbs.length - 1
                      ? "text-[--text] font-medium"
                      : "text-[--text-tertiary] hover:text-[--text] font-normal"
                  )}
                  style={{ letterSpacing: '-0.005em' }}
                >
                  {crumb.label}
                </Link>
                {i < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-[--text-quaternary] shrink-0" strokeWidth={1.75} />
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        <Link href="/" className="lg:hidden flex items-center">
          <BrandMark size="sm" />
        </Link>

        <div className="flex items-center gap-1">
          <LogoutButton variant="topbar" />
          <button
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer hover:bg-[--bg-elevated] py-1.5 px-1.5 rounded-full transition-colors duration-200"
            aria-label="Profil"
          >
            <div className="hidden md:flex flex-col items-end">
              <p className="text-[13px] font-medium text-[--text] leading-none mb-0.5" style={{ letterSpacing: '-0.005em' }}>
                {displayName}
              </p>
              <p className="text-[11px] text-[--text-tertiary]">{userRole === 'superadmin' ? 'Üst Yönetici' : 'Yönetim'}</p>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[--bg-elevated]">
              <User className="w-[18px] h-[18px] text-[--text-secondary]" strokeWidth={1.75} />
            </div>
          </button>
        </div>
      </header>

      <PremiumModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Profil Ayarları"
        maxWidth="max-w-3xl"
      >
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
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={onToggleMenu}
            />
            <motion.div
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 left-0 w-72 h-full z-[70] overflow-y-auto lg:hidden bg-[--surface] border-r border-[--border]"
            >
              <div className="flex items-center justify-between px-5 h-[64px] border-b border-[--border]">
                <Link href="/" className="flex items-center" onClick={onToggleMenu}>
                  <BrandMark size="sm" />
                </Link>
                <button
                  onClick={onToggleMenu}
                  className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-[--bg-elevated] transition-colors duration-200"
                  aria-label="Kapat"
                >
                  <X className="w-5 h-5 text-[--text]" strokeWidth={1.75} />
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
                      className={navLinkClasses(isActive)}
                    >
                      <Icon
                        className={cn(
                          "w-[18px] h-[18px] shrink-0",
                          isActive ? "text-[--accent]" : "text-[--text-tertiary]"
                        )}
                        strokeWidth={1.75}
                      />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 mt-2 border-t border-[--border]">
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
    { href: "/", label: "Ana", icon: Home },
    { href: "/gelir-gider", label: "Finans", icon: Wallet },
    { href: "/raporlar", label: "Rapor", icon: TrendingUp },
    { href: "/giderler", label: "Gider", icon: CreditCard },
  ];

  return (
    <nav
      className="lg:hidden fixed left-1/2 -translate-x-1/2 z-50 backdrop-blur-2xl bg-white/80 border border-[--border] rounded-full max-w-[92vw]"
      style={{
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      <div className="flex items-center gap-1 px-2 py-1.5" role="navigation">
        {mobileLinks.map(link => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-full transition-colors duration-200 min-w-[58px] min-h-[44px] justify-center",
                isActive ? "text-[--accent]" : "text-[--text-secondary] hover:text-[--text]"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-[20px] h-[20px]" strokeWidth={isActive ? 2 : 1.75} />
              <span className="text-[10px] font-medium" style={{ letterSpacing: '-0.005em' }}>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
