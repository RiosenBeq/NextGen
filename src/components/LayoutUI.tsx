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
  ChevronRight,
  Coffee,
  Sparkles,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import { PremiumModal } from "./premium/PremiumModal";
import { ProfileSettingsForm } from "@/features/auth/components/ProfileSettingsForm";
import { useProfile } from "@/providers/ProfileProvider";
import { ProfileSwitcher } from "./ProfileSwitcher";

type NavLink = { href: string; label: string; icon: typeof LayoutDashboard; category: string };

const karaokeNavLinks: NavLink[] = [
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

const cafeNavLinks: NavLink[] = [
  { href: "/cafe", label: "Cafe Paneli", icon: Coffee, category: "Genel" },
  { href: "/cafe/satislar", label: "Günlük Ciro Girişi", icon: PlusCircle, category: "Operasyon" },
  { href: "/cafe/raporlar", label: "Aylık Raporlar", icon: BookOpen, category: "Analiz" },
  { href: "/giderler", label: "Gider Yönetimi", icon: CreditCard, category: "Analiz" },
  { href: "/faturalar", label: "Faturalar", icon: Receipt, category: "Analiz" },
  { href: "/avm-odemeleri", label: "AVM Ödemeleri", icon: Building2, category: "Analiz" },
  { href: "/sozlesmeler", label: "Sözleşmeler", icon: ScrollText, category: "Analiz" },
  { href: "/notlar", label: "Notlar", icon: StickyNote, category: "Destek" },
  { href: "/gunlukler", label: "Sistem Logları", icon: ShieldCheck, category: "Sistem" },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings, category: "Sistem" },
];

function useNavLinks(): NavLink[] {
  const { activeProfile } = useProfile();
  return activeProfile?.businessType === 'cafe' ? cafeNavLinks : karaokeNavLinks;
}

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
        className="w-11 h-11 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--text] hover:bg-white/70 transition-colors duration-200"
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
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/8 transition-colors duration-200"
    >
      <LogOut className={cn("w-4 h-4", isPending && "animate-spin")} strokeWidth={1.75} />
      <span>{isPending ? 'Çıkılıyor…' : 'Çıkış Yap'}</span>
    </button>
  );
}

function navLinkClasses(isActive: boolean, dark = false) {
  if (dark) {
    return cn("sidebar-link", isActive && "active");
  }
  return cn(
    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-colors duration-200",
    isActive
      ? "bg-[--bg-elevated] text-[--text] font-medium"
      : "text-[--text-secondary] hover:bg-[--bg-elevated] hover:text-[--text] font-normal"
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const sanitized = hex.replace('#', '');
  const value = sanitized.length === 3
    ? sanitized.split('').map(c => c + c).join('')
    : sanitized;
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function BrandMark({ size = 'md', tone = 'auto' }: { size?: 'sm' | 'md', tone?: 'auto' | 'light' | 'dark' }) {
  const { activeProfile } = useProfile();
  const isLight = tone === 'light';
  const monogram = activeProfile?.monogram ?? 'NG';
  const brandName = activeProfile?.brandName ?? 'NextGenBox';
  const primary = activeProfile?.primaryColor ?? '#4F46E5';
  const accent = activeProfile?.accentColor ?? '#06B6D4';
  const gradient = `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`;

  return (
    <div className="flex items-center gap-2.5">
      <span
        className="relative flex items-center justify-center rounded-xl"
        style={{
          width: size === 'sm' ? 28 : 32,
          height: size === 'sm' ? 28 : 32,
          background: gradient,
          boxShadow: `0 6px 16px ${hexToRgba(primary, 0.45)}`,
        }}
        aria-hidden
      >
        <span
          className="absolute inset-[2px] rounded-[10px] flex items-center justify-center"
          style={{
            background: 'rgba(11, 16, 35, 0.85)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <span
            className="font-extrabold text-white leading-none"
            style={{ fontSize: size === 'sm' ? 13 : 14, letterSpacing: '-0.04em' }}
          >
            {monogram}
          </span>
        </span>
      </span>
      <span
        className={cn(
          "font-semibold tracking-tight leading-none",
          size === 'sm' ? "text-[17px]" : "text-[19px]",
          isLight ? "text-white" : "text-[--text]"
        )}
        style={{ letterSpacing: '-0.022em' }}
      >
        {brandName}
      </span>
    </div>
  );
}

export function Sidebar({ userEmail, userFullName, userRole }: { userEmail?: string, userFullName?: string, userRole?: string }) {
  const pathname = usePathname();
  const navLinks = useNavLinks();
  const categories = Array.from(new Set(navLinks.map(l => l.category)));

  const displayName = userFullName || (userEmail
    ? userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1)
    : 'Yönetici');

  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="sidebar-shell w-64 shrink-0 hidden lg:flex flex-col h-screen relative z-50"
    >
      {/* Logo */}
      <div className="h-[72px] flex items-center px-5 relative z-[2]">
        <Link href="/" className="flex items-center">
          <BrandMark tone="light" />
        </Link>
      </div>

      <div className="px-5 relative z-[2] pb-2">
        <ProfileSwitcher variant="sidebar" />
      </div>

      <div className="px-5 relative z-[2]">
        <div className="divider-gradient" />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 relative z-[2] custom-scrollbar">
        {categories.map((cat) => {
          const visibleLinks = navLinks.filter(l => {
            if (l.category !== cat) return false;
            if (userRole !== 'superadmin' && (l.href === '/ayarlar' || l.href === '/gunlukler')) return false;
            return true;
          });
          if (visibleLinks.length === 0) return null;

          return (
            <div key={cat}>
              <p className="sidebar-section-label px-3 mb-2.5">
                {cat}
              </p>
              <nav className="space-y-1">
                {visibleLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={navLinkClasses(isActive, true)}
                    >
                      <Icon
                        className="w-[18px] h-[18px] shrink-0"
                        strokeWidth={1.75}
                      />
                      <span>{link.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Footer — User + Logout */}
      <div className="p-3 border-t border-[--sidebar-border] space-y-2 relative z-[2]">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white"
            style={{ background: 'var(--grad-aurora)', boxShadow: '0 6px 14px rgba(79, 70, 229, 0.45)' }}
          >
            <User className="w-[18px] h-[18px]" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate" style={{ letterSpacing: '-0.005em' }}>{displayName}</p>
            <p className="text-[11px] text-white/55 truncate uppercase tracking-wider">{userRole === 'superadmin' ? 'Üst Yönetici' : 'Yönetim'}</p>
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
  const navLinks = useNavLinks();
  const { activeProfile } = useProfile();
  const isCafe = activeProfile?.businessType === 'cafe';

  const displayName = userFullName || (userEmail
    ? userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1)
    : 'Yönetici');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const homeHref = isCafe ? '/cafe' : '/';
  const homeLabel = isCafe ? 'Cafe' : 'Panel';

  const getBreadcrumbs = () => {
    if (!pathname || pathname === homeHref) return [{ label: homeLabel, href: homeHref }];
    const segments = pathname.split('/').filter(Boolean);
    const crumbs = segments.map((seg, i) => {
      const href = '/' + segments.slice(0, i + 1).join('/');
      const link = navLinks.find(l => l.href === href);
      return { label: link?.label || seg.charAt(0).toUpperCase() + seg.slice(1), href };
    });
    return [{ label: homeLabel, href: homeHref }, ...crumbs];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      <header
        className={cn(
          "topbar-glass h-[64px] flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 transition-colors duration-200",
          !scrolled && "border-b-transparent"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMenu}
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/70 transition-colors duration-200"
            aria-label="Menü"
          >
            <Menu className="w-5 h-5 text-[--text]" strokeWidth={1.75} />
          </button>

          {/* Breadcrumb */}
          <nav className="hidden md:flex items-center gap-2 overflow-hidden min-w-0 px-3 py-1.5 rounded-full bg-white/55 border border-white/60 backdrop-blur-md">
            <span
              aria-hidden
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: 'var(--grad-aurora)', boxShadow: '0 0 8px rgba(139, 92, 246, 0.6)' }}
            />
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.href}>
                <Link
                  href={crumb.href}
                  className={cn(
                    "text-[12px] transition-colors duration-200 whitespace-nowrap",
                    i === breadcrumbs.length - 1
                      ? "text-[--text] font-semibold"
                      : "text-[--text-tertiary] hover:text-[--text] font-medium"
                  )}
                  style={{ letterSpacing: '-0.005em' }}
                >
                  {crumb.label}
                </Link>
                {i < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-[--text-quaternary] shrink-0" strokeWidth={2} />
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        <Link href="/" className="lg:hidden flex items-center">
          <BrandMark size="sm" />
        </Link>

        <div className="flex items-center gap-1.5">
          <div className="hidden md:block mr-1">
            <ProfileSwitcher variant="topbar" />
          </div>
          <LogoutButton variant="topbar" />
          <button
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer hover:bg-white/70 py-1 pl-3 pr-1 rounded-full transition-colors duration-200 border border-white/55 bg-white/35 backdrop-blur-md"
            aria-label="Profil"
          >
            <div className="hidden md:flex flex-col items-end">
              <p className="text-[13px] font-semibold text-[--text] leading-none mb-0.5" style={{ letterSpacing: '-0.005em' }}>
                {displayName}
              </p>
              <p className="text-[10px] text-[--text-tertiary] uppercase tracking-wider">{userRole === 'superadmin' ? 'Üst Yönetici' : 'Yönetim'}</p>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white"
              style={{ background: 'var(--grad-aurora)', boxShadow: '0 6px 14px rgba(79, 70, 229, 0.4)' }}
            >
              <User className="w-[18px] h-[18px]" strokeWidth={2} />
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
              initial={{ x: -304 }}
              animate={{ x: 0 }}
              exit={{ x: -304 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="sidebar-shell fixed top-0 left-0 w-72 h-full z-[70] overflow-y-auto lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-5 h-[72px] relative z-[2]">
                <Link href="/" className="flex items-center" onClick={onToggleMenu}>
                  <BrandMark size="sm" tone="light" />
                </Link>
                <button
                  onClick={onToggleMenu}
                  className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-200 text-white"
                  aria-label="Kapat"
                >
                  <X className="w-5 h-5" strokeWidth={1.75} />
                </button>
              </div>

              <div className="px-5 relative z-[2] pb-2">
                <ProfileSwitcher variant="drawer" />
              </div>

              <div className="px-5 relative z-[2]">
                <div className="divider-gradient" />
              </div>

              <nav className="p-3 space-y-1 flex-1 relative z-[2]" role="navigation">
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
                      className={navLinkClasses(isActive, true)}
                    >
                      <Icon
                        className="w-[18px] h-[18px] shrink-0"
                        strokeWidth={1.75}
                      />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-[--sidebar-border] relative z-[2]">
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
  const { activeProfile } = useProfile();
  if (hidden) return null;

  const isCafe = activeProfile?.businessType === 'cafe';

  const leftLinks = isCafe
    ? [
        { href: "/cafe", label: "Cafe", icon: Coffee },
        { href: "/cafe/raporlar", label: "Rapor", icon: BookOpen },
      ]
    : [
        { href: "/", label: "Ana", icon: Home },
        { href: "/gelir-gider", label: "Finans", icon: Wallet },
      ];
  const rightLinks = isCafe
    ? [
        { href: "/giderler", label: "Gider", icon: CreditCard },
        { href: "/avm-odemeleri", label: "AVM", icon: Building2 },
      ]
    : [
        { href: "/raporlar", label: "Rapor", icon: TrendingUp },
        { href: "/giderler", label: "Gider", icon: CreditCard },
      ];

  const renderLink = (link: { href: string; label: string; icon: typeof Home }) => {
    const isActive = pathname === link.href;
    const Icon = link.icon;
    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          "mobile-nav-link relative flex flex-col items-center justify-center gap-1 flex-1 min-w-[56px] h-[52px] rounded-2xl px-2 transition-colors duration-200",
          isActive ? "text-[--accent]" : "text-[--text-secondary] active:text-[--text]"
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        {isActive && (
          <span
            aria-hidden
            className="absolute top-1 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full"
            style={{ background: 'var(--grad-aurora)', boxShadow: '0 0 10px rgba(139, 92, 246, 0.55)' }}
          />
        )}
        <Icon className="w-[20px] h-[20px]" strokeWidth={isActive ? 2.25 : 1.75} />
        <span className="text-[10px] font-semibold leading-none tracking-wide">{link.label}</span>
      </Link>
    );
  };

  return (
    <nav
      className="mobile-pill-nav lg:hidden !fixed left-1/2 -translate-x-1/2 z-[60]"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom) + 14px)',
      }}
      aria-label="Mobil navigasyon"
    >
      <div className="flex items-stretch gap-0.5 px-2.5 py-2 relative" role="navigation">
        {leftLinks.map(renderLink)}
        <div className="relative flex items-center justify-center w-[60px] shrink-0">
          <Link
            href={isCafe ? '/cafe/satislar' : '/performans'}
            aria-label={isCafe ? 'Günlük ciro gir' : 'Performans Ekle'}
            className="mobile-nav-fab absolute -top-5 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full text-white"
            style={{
              width: 52,
              height: 52,
              background: 'var(--grad-aurora)',
              boxShadow: '0 14px 32px rgba(79, 70, 229, 0.45), 0 0 0 4px rgba(255, 255, 255, 0.92)',
            }}
          >
            <span
              aria-hidden
              className="absolute inset-[3px] rounded-full pointer-events-none"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 55%)' }}
            />
            <PlusCircle className="w-[22px] h-[22px] relative" strokeWidth={2.25} />
          </Link>
        </div>
        {rightLinks.map(renderLink)}
      </div>
    </nav>
  );
}
