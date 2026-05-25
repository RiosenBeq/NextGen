'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Coffee,
  Users,
  TrendingUp,
  Receipt,
  Award,
  AlertCircle,
  PlusCircle,
  IceCream,
  UtensilsCrossed,
  Cookie,
  GlassWater,
  Package,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import type { ProfileSummary } from '@/providers/ProfileProvider';
import type { CafeDailyRow, CafeMonthlySummary } from '@/features/cafe/actions';
import { cn } from '@/lib/utils';

interface Props {
  profile: ProfileSummary;
  summary: CafeMonthlySummary | null;
  recent: CafeDailyRow[];
  months: string[];
  locations: { id: string; name: string }[];
  selectedMonth: string;
}

function formatTRY(n: number) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);
}

function formatMonthLabel(monthId: string) {
  const [y, m] = monthId.split('-').map((n) => parseInt(n, 10));
  if (!y || !m) return monthId;
  return new Date(y, m - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

const CATEGORY_META = [
  { key: 'coffee', label: 'Kahve', icon: Coffee, hue: '#6B4226' },
  { key: 'coldDrink', label: 'Soğuk', icon: GlassWater, hue: '#3FA3D9' },
  { key: 'dessert', label: 'Tatlı', icon: Cookie, hue: '#D9A86C' },
  { key: 'food', label: 'Yemek', icon: UtensilsCrossed, hue: '#A85542' },
  { key: 'other', label: 'Diğer', icon: Package, hue: '#94A3B8' },
] as const;

export default function CafeDashboardClient({
  profile,
  summary,
  recent,
  months,
  selectedMonth,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isEmpty = !summary || summary.totalRevenue === 0;

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams);
    params.set('m', e.target.value);
    router.push(`/cafe?${params.toString()}`);
  };

  return (
    <div className="page-wrapper space-y-10 animate-fade-in">
      {/* Hero */}
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="apple-eyebrow inline-flex items-center gap-2">
            <Coffee className="w-3.5 h-3.5" strokeWidth={2} />
            Cafe Paneli
          </p>
          <h1 className="apple-headline mt-3">
            <span
              style={{
                background: `linear-gradient(135deg, ${profile.primaryColor}, ${profile.accentColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {profile.brandName}
            </span>
          </h1>
          <p className="apple-body max-w-2xl mt-4">
            {formatMonthLabel(selectedMonth)} özeti — günlük ciro, müşteri ve kategori bazlı satış kırılımı.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-[--bg-elevated] rounded-full">
            <Calendar className="w-4 h-4 text-[--text-tertiary]" strokeWidth={2} />
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="bg-transparent text-[13px] font-semibold text-[--text] focus:outline-none"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <Link
            href="/cafe/satislar"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold text-white shadow-lg transition-transform active:scale-95"
            style={{ background: `linear-gradient(135deg, ${profile.primaryColor}, ${profile.accentColor})` }}
          >
            <PlusCircle className="w-4 h-4" strokeWidth={2.25} />
            Günlük Ciro Gir
          </Link>
        </div>
      </header>

      {isEmpty && (
        <div
          className="apple-card p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 border-2"
          style={{ borderColor: `${profile.primaryColor}33`, background: `${profile.primaryColor}08` }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${profile.primaryColor}, ${profile.accentColor})`,
              boxShadow: `0 10px 24px ${profile.primaryColor}44`,
            }}
          >
            <Coffee className="w-7 h-7 text-white" strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <h3 className="text-[17px] font-semibold text-[--text]" style={{ letterSpacing: '-0.012em' }}>
              Hoş geldin — {formatMonthLabel(selectedMonth)} için henüz veri yok
            </h3>
            <p className="text-[13px] text-[--text-secondary] mt-1">
              Bugünün cirosunu girerek başla. Kategori kırılımı sonra otomatik raporlara dönüşecek.
            </p>
          </div>
          <Link
            href="/cafe/satislar"
            className="px-4 py-2 rounded-full text-[13px] font-semibold text-white shadow-md whitespace-nowrap"
            style={{ background: `linear-gradient(135deg, ${profile.primaryColor}, ${profile.accentColor})` }}
          >
            İlk Kaydı Gir →
          </Link>
        </div>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <KpiCard
          label="Aylık Ciro"
          value={`₺${formatTRY(summary?.totalRevenue ?? 0)}`}
          icon={<TrendingUp className="w-[18px] h-[18px]" strokeWidth={1.75} />}
          tone={profile.primaryColor}
          highlight
        />
        <KpiCard
          label="Müşteri"
          value={formatTRY(summary?.totalCustomers ?? 0)}
          icon={<Users className="w-[18px] h-[18px]" strokeWidth={1.75} />}
          tone={profile.accentColor}
        />
        <KpiCard
          label="Günlük Ortalama"
          value={`₺${formatTRY(summary?.avgDailyRevenue ?? 0)}`}
          icon={<Receipt className="w-[18px] h-[18px]" strokeWidth={1.75} />}
        />
        <KpiCard
          label="Ortalama Hesap"
          value={`₺${formatTRY(summary?.avgTicket ?? 0)}`}
          icon={<Coffee className="w-[18px] h-[18px]" strokeWidth={1.75} />}
        />
      </section>

      {/* Category breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 md:gap-6">
        <div className="apple-card p-6 md:p-8">
          <p className="apple-eyebrow">Kategori Kırılımı</p>
          <h2 className="apple-title-1 mt-2">Ne satıyor?</h2>

          <div className="mt-6 space-y-3">
            {CATEGORY_META.map((cat) => {
              const value = summary
                ? (summary.categoryBreakdown[cat.key as keyof typeof summary.categoryBreakdown] as number)
                : 0;
              const total = summary?.totalRevenue ?? 0;
              const pct = total > 0 ? (value / total) * 100 : 0;
              const Icon = cat.icon;
              return (
                <div key={cat.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[14px] font-medium text-[--text]">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                        style={{ background: cat.hue }}
                      >
                        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                      </span>
                      {cat.label}
                    </span>
                    <span className="text-[13px] tabular-nums text-[--text-secondary]">
                      ₺{formatTRY(value)} <span className="text-[--text-tertiary] ml-1">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-[--bg-elevated] rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, background: cat.hue }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 md:space-y-5">
          <HighlightCard
            label="En İyi Gün"
            value={summary?.bestDay ? `₺${formatTRY(summary.bestDay.revenue)}` : '—'}
            sub={summary?.bestDay ? formatShortDate(summary.bestDay.date + 'T00:00:00Z') : 'Veri yok'}
            icon={<Award className="w-[18px] h-[18px] text-amber-600" strokeWidth={1.75} />}
            tone="amber"
          />
          <HighlightCard
            label="En Düşük Gün"
            value={summary?.worstDay ? `₺${formatTRY(summary.worstDay.revenue)}` : '—'}
            sub={summary?.worstDay ? formatShortDate(summary.worstDay.date + 'T00:00:00Z') : 'Veri yok'}
            icon={<AlertCircle className="w-[18px] h-[18px] text-slate-500" strokeWidth={1.75} />}
            tone="slate"
          />
          <HighlightCard
            label="Çalışılan Gün"
            value={summary ? `${summary.daysWithSales}` : '0'}
            sub={summary ? `${formatMonthLabel(summary.monthId)}` : ''}
            icon={<Calendar className="w-[18px] h-[18px] text-[--text-secondary]" strokeWidth={1.75} />}
          />
        </div>
      </section>

      {/* Recent entries */}
      <section className="apple-card overflow-hidden">
        <div className="px-6 py-5 border-b border-[--border] flex items-center justify-between">
          <div>
            <p className="apple-eyebrow">Son Günler</p>
            <h3 className="apple-title-2 mt-1">Yakın tarihli ciro kayıtları</h3>
          </div>
          <Link
            href="/cafe/raporlar"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[--text-secondary] hover:text-[--text]"
          >
            Tüm raporlar
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <IceCream className="w-10 h-10 mx-auto text-[--text-tertiary]" strokeWidth={1.5} />
            <p className="text-[14px] text-[--text-secondary] mt-4">Henüz ciro kaydı yok.</p>
            <Link
              href="/cafe/satislar"
              className="inline-block mt-4 px-4 py-2 rounded-full text-[13px] font-semibold text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${profile.primaryColor}, ${profile.accentColor})` }}
            >
              İlk kaydı gir →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[--border]">
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[--text-tertiary]">Tarih</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[--text-tertiary]">Lokasyon</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[--text-tertiary] text-center">Müşteri</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[--text-tertiary] text-right">Ciro</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[--text-tertiary] text-right">Ort. Hesap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border-soft]">
                {recent.map((r) => {
                  const avgTicket = r.customerCount > 0 ? r.totalRevenue / r.customerCount : 0;
                  return (
                    <tr key={r.id} className="hover:bg-[--bg-subtle] transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[14px] font-semibold text-[--text]">
                          {formatShortDate(r.date + 'T00:00:00Z')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-[--text-secondary]">{r.locationName}</td>
                      <td className="px-6 py-4 text-center text-[13px] tabular-nums text-[--text]">{r.customerCount}</td>
                      <td className="px-6 py-4 text-right text-[14px] font-semibold tabular-nums text-[--text]">
                        ₺{formatTRY(r.totalRevenue)}
                      </td>
                      <td className="px-6 py-4 text-right text-[13px] tabular-nums text-[--text-secondary]">
                        ₺{formatTRY(avgTicket)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tone,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn('apple-card p-5 md:p-6 relative overflow-hidden', highlight && 'border-2')}
      style={highlight && tone ? { borderColor: `${tone}33` } : undefined}
    >
      {highlight && tone && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: tone }}
        />
      )}
      <div
        className={cn(
          'inline-flex w-10 h-10 rounded-xl items-center justify-center',
          tone ? 'text-white' : 'bg-[--bg-elevated] text-[--text-secondary]'
        )}
        style={tone ? { background: tone } : undefined}
      >
        {icon}
      </div>
      <p className="text-[13px] text-[--text-secondary] mt-4" style={{ letterSpacing: '-0.005em' }}>
        {label}
      </p>
      <p
        className="text-[22px] md:text-[26px] font-semibold tabular-nums text-[--text] mt-1"
        style={{ letterSpacing: '-0.022em' }}
      >
        {value}
      </p>
    </div>
  );
}

function HighlightCard({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone?: 'amber' | 'slate';
}) {
  return (
    <div className="apple-card p-5">
      <div className="flex items-center justify-between">
        <p className="apple-eyebrow">{label}</p>
        <span
          className={cn(
            'inline-flex w-8 h-8 rounded-lg items-center justify-center',
            tone === 'amber' && 'bg-amber-50',
            tone === 'slate' && 'bg-slate-100',
            !tone && 'bg-[--bg-elevated]'
          )}
        >
          {icon}
        </span>
      </div>
      <p
        className="text-[20px] md:text-[22px] font-semibold tabular-nums text-[--text] mt-3"
        style={{ letterSpacing: '-0.018em' }}
      >
        {value}
      </p>
      <p className="text-[12px] text-[--text-tertiary] mt-1">{sub}</p>
    </div>
  );
}
