'use client';
import { useRouter } from 'next/navigation';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Download,
  ChevronRight,
  Calendar,
  Building2,
  Activity,
  HandCoins,
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Zap,
  Receipt,
  Wallet,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PremiumModal, PremiumDrawer } from './PremiumModal';
import ExpenseForm from '@/features/ledger/components/ExpenseForm';
import MonthlyPerformanceForm from '@/features/ledger/components/MonthlyPerformanceForm';
import { deleteMonthlyPerformance } from '@/features/ledger/actions';
import Link from 'next/link';
import { toast } from '@/hooks/useToast';

type GelirGiderLocation = { id: string; name: string };
type GelirGiderCategory = { id: string; name: string };

type GelirGiderEntry = {
  perfId: string;
  monthId: string;
  month: string;
  locationName: string;
  sessions: number;
  grossRevenue: number;
  avmExpense: number;
  netCash: number;
  revenueShare: number;
  totalCommission: number;
  extraExpense: number;
  extraNotes?: string;
};

type GelirGiderBreakdown = {
  label: string;
  subLabel?: string;
  value: number;
  color: string;
};

interface GelirGiderProps {
  summary: { gross: number; expense: number; net: number; margin: number };
  entries: GelirGiderEntry[];
  categories: GelirGiderCategory[];
  locations: GelirGiderLocation[];
  filters: { month: string; location: string; category: string };
  breakdown: GelirGiderBreakdown[];
  availableMonths: string[];
}

export default function GelirGiderClientUI({
  summary,
  entries,
  locations,
  filters,
  breakdown,
  availableMonths,
}: GelirGiderProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<GelirGiderEntry | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  const handleDelete = async (perfId: string) => {
    if (confirm('Bu performans kaydını silmek istediğinize emin misiniz?')) {
      const res = await deleteMonthlyPerformance(perfId);
      if (res.success) {
        setIsDrawerOpen(false);
        router.refresh();
      } else {
        toast.error('Silme hatası: ' + res.error);
      }
    }
  };

  const getMonthName = (monthId: string) => {
    if (!monthId) return 'Tümü';
    const [y, m] = monthId.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-12 md:space-y-16 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <p className="apple-eyebrow">Finansal Akış</p>
          <h1 className="apple-headline mt-3">Gelir &amp; <span className="hero-serif text-gradient-emerald">gider</span></h1>
          <p className="mt-4 apple-body max-w-2xl">
            Ticari döküm, vergi analizi ve operasyonel performans bir arada.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative min-w-[200px]">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[--text-tertiary] pointer-events-none" size={16} strokeWidth={1.75} />
            <select
              value={filters.month}
              onChange={(e) => (window.location.href = `/gelir-gider?month=${e.target.value}&location=${filters.location}&category=${filters.category}`)}
              className="w-full pl-11 pr-10 py-3 bg-[--bg-elevated] border border-transparent rounded-full text-[14px] text-[--text] appearance-none focus:bg-[--surface] focus:border-[--accent] transition-colors cursor-pointer min-h-[44px]"
            >
              <option value="">Tüm Dönemler</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {getMonthName(m)}
                </option>
              ))}
            </select>
          </div>

          <button onClick={() => setIsModalOpen(true)} className="elite-button-primary">
            <Plus size={16} strokeWidth={2} />
            Yeni Kayıt
          </button>
        </div>
      </header>

      {/* Location Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <FilterLink
          href={`/gelir-gider?month=${filters.month}&location=all&category=${filters.category}`}
          active={filters.location === 'all'}
          label="Tüm Şubeler"
        />
        {locations.map((loc) => (
          <FilterLink
            key={loc.id}
            href={`/gelir-gider?month=${filters.month}&location=${loc.id}&category=${filters.category}`}
            active={filters.location === loc.id}
            label={loc.name}
          />
        ))}
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <KPICard label="Brüt Gelir" value={formatCurrency(summary.gross)} icon={<TrendingUp />} subtitle="Ticari ciro akışı" />
        <KPICard label="Toplam Gider" value={formatCurrency(summary.expense)} icon={<TrendingDown />} subtitle="Operasyonel maliyetler" />
        <KPICard label="Net Nakit" value={formatCurrency(summary.net)} icon={<Activity />} subtitle="Serbest nakit (KDV dahil)" highlight={summary.net >= 0} />
        <KPICard label="Kâr Marjı" value={`%${summary.margin.toFixed(1)}`} icon={<Zap />} subtitle="İşletme verimliliği" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
        <section className="xl:col-span-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="apple-eyebrow">Aylık Döküm</p>
              <h3 className="apple-title-1 mt-2">Finansal Tablo</h3>
            </div>
            <button className="elite-button-tertiary">
              <Download size={14} strokeWidth={1.75} /> PDF
            </button>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block apple-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[--border]">
                  <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary]">Dönem & Lokasyon</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-center">Seans</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-right">Brüt Ciro</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-right">Net Gider</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-right">Net Kâr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border-soft]">
                {entries.map((entry, idx) => (
                  <tr
                    key={idx}
                    className="group hover:bg-[--bg-subtle] transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedEntry(entry);
                      setIsDrawerOpen(true);
                    }}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[--bg-elevated] flex items-center justify-center text-[--text-secondary]">
                          <Calendar size={16} strokeWidth={1.75} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[15px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>{entry.month}</span>
                          <span className="text-[12px] text-[--text-tertiary]">{entry.locationName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-[14px] tabular-nums text-[--text-secondary]">{entry.sessions}</span>
                    </td>
                    <td className="px-6 py-5 text-right text-[15px] font-medium tabular-nums text-[--text]">
                      ₺{entry.grossRevenue?.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-5 text-right text-[15px] tabular-nums text-[--text-secondary]">
                      ₺{entry.avmExpense?.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 text-[15px] font-medium tabular-nums',
                        entry.netCash >= 0 ? 'text-[--text]' : 'text-[--text-secondary]'
                      )}>
                        ₺{entry.netCash?.toLocaleString('tr-TR')}
                        <ChevronRight size={14} strokeWidth={1.75} className="text-[--text-tertiary] group-hover:text-[--text]" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {entries.map((entry, idx) => (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: idx * 0.04 }}
                key={idx}
                onClick={() => {
                  setSelectedEntry(entry);
                  setIsDrawerOpen(true);
                }}
                className="w-full text-left p-5 apple-card transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[--bg-elevated] text-[--text-secondary] flex items-center justify-center">
                      <Calendar size={18} strokeWidth={1.75} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>{entry.month}</span>
                      <span className="text-[12px] text-[--text-tertiary]">{entry.locationName}</span>
                    </div>
                  </div>
                  <span className="text-[12px] text-[--text-tertiary] tabular-nums">{entry.sessions} seans</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-[--border]">
                  <div>
                    <p className="text-[12px] text-[--text-tertiary]">Brüt Ciro</p>
                    <p className="text-[16px] font-medium tabular-nums text-[--text] mt-0.5">₺{entry.grossRevenue?.toLocaleString('tr-TR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-[--text-tertiary]">Toplam Gider</p>
                    <p className="text-[16px] font-medium tabular-nums text-[--text-secondary] mt-0.5">₺{entry.avmExpense?.toLocaleString('tr-TR')}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[--border] flex items-center justify-between">
                  <p className="text-[13px] text-[--text-secondary]">Net Nakit</p>
                  <p className={cn(
                    'text-[20px] font-semibold tabular-nums',
                    entry.netCash >= 0 ? 'text-[--text]' : 'text-[--text-secondary]'
                  )} style={{ letterSpacing: '-0.018em' }}>₺{entry.netCash?.toLocaleString('tr-TR')}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Distribution */}
        <section className="xl:col-span-4 space-y-5">
          <div>
            <p className="apple-eyebrow">Analiz</p>
            <h3 className="apple-title-1 mt-2">Gider Dağılımı</h3>
          </div>

          <div className="apple-card p-6 space-y-6">
            <div className="space-y-5">
              {breakdown.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-end justify-between gap-3">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>{item.label}</span>
                      {item.subLabel && <span className="text-[12px] text-[--text-tertiary]">{item.subLabel}</span>}
                    </div>
                    <span className="text-[14px] font-medium tabular-nums text-[--text] shrink-0">
                      ₺{item.value?.toLocaleString('tr-TR')}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-[--bg-elevated] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / Math.max(summary.expense, 1)) * 100}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-[--text]"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-[--border]">
              <div className="rounded-[18px] bg-[--bg-elevated] px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-[--text-secondary]">Toplam Maliyet</p>
                  <p className="text-[12px] text-[--text-tertiary]">Operasyonel + AVM</p>
                </div>
                <span className="text-[22px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.022em' }}>
                  ₺{summary.expense?.toLocaleString('tr-TR')}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <PremiumModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Gider Girişi" maxWidth="max-w-xl">
        <ExpenseForm locations={locations} onClose={() => { setIsModalOpen(false); router.refresh(); }} />
      </PremiumModal>

      <PremiumDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setIsEditing(false); }}
        title={isEditing ? 'Verileri Güncelle' : 'Dönem Detayı'}
      >
        {selectedEntry && (
          <div className="space-y-8 py-4">
            {isEditing ? (
              <MonthlyPerformanceForm
                id={selectedEntry.perfId}
                initialData={{
                  sessions: selectedEntry.sessions,
                  extraExpense: selectedEntry.extraExpense,
                  extraNotes: selectedEntry.extraNotes ?? '',
                  month: selectedEntry.monthId,
                  locationName: selectedEntry.locationName,
                }}
                onClose={() => setIsEditing(false)}
                onDelete={handleDelete}
              />
            ) : (
              <div className="space-y-8">
                <div className="rounded-[22px] bg-[--bg-elevated] p-6 space-y-5">
                  <div className="flex items-center gap-2 text-[--text-secondary]">
                    <Calendar size={14} strokeWidth={1.75} />
                    <span className="text-[13px]">{selectedEntry.month}</span>
                  </div>
                  <p className="text-[28px] md:text-[32px] font-semibold text-[--text]" style={{ letterSpacing: '-0.025em' }}>{selectedEntry.locationName}</p>
                  <div className="grid grid-cols-2 gap-6 pt-5 border-t border-[--border]">
                    <div>
                      <p className="text-[12px] text-[--text-tertiary]">Brüt Ciro</p>
                      <p className="text-[20px] md:text-[22px] font-semibold tabular-nums text-[--text] mt-1" style={{ letterSpacing: '-0.018em' }}>
                        ₺{selectedEntry.grossRevenue?.toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] text-[--text-tertiary]">Seans</p>
                      <p className="text-[20px] md:text-[22px] font-semibold tabular-nums text-[--text] mt-1" style={{ letterSpacing: '-0.018em' }}>
                        {selectedEntry.sessions}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-[--border]">
                    <h4 className="text-[13px] text-[--text-secondary] flex items-center gap-2">
                      <Receipt size={14} strokeWidth={1.75} className="text-[--text-tertiary]" />
                      Gider Analizi
                    </h4>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[--bg-elevated] text-[--text-tertiary] hover:text-[--text] transition-colors"
                        aria-label="Düzenle"
                      >
                        <Edit2 size={16} strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => handleDelete(selectedEntry.perfId)}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[--danger-soft] text-[--text-tertiary] hover:text-[--danger] transition-colors"
                        aria-label="Sil"
                      >
                        <Trash2 size={16} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <DetailMetric label="Sözleşme Ciro Payı" value={formatCurrency(selectedEntry.revenueShare)} icon={<HandCoins size={14} strokeWidth={1.75} />} />
                    <DetailMetric label="AVM Sabit Kira & Aidat" value={formatCurrency(selectedEntry.avmExpense - selectedEntry.revenueShare)} icon={<Building2 size={14} strokeWidth={1.75} />} />
                    <DetailMetric label="Altyapı Komisyonları" value={formatCurrency(selectedEntry.totalCommission)} icon={<CreditCard size={14} strokeWidth={1.75} />} />
                    {selectedEntry.extraExpense > 0 && (
                      <DetailMetric label="Operasyonel Ekstra" value={formatCurrency(selectedEntry.extraExpense)} icon={<Zap size={14} strokeWidth={1.75} />} />
                    )}
                  </div>

                  {selectedEntry.extraNotes && (
                    <div className="p-5 rounded-xl bg-[--bg-elevated] space-y-2">
                      <p className="text-[12px] text-[--text-tertiary]">Operasyonel Notlar</p>
                      <p className="text-[14px] text-[--text] leading-relaxed">{selectedEntry.extraNotes}</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-[--border]">
                  <div className="rounded-[22px] bg-[--bg-elevated] p-6 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] text-[--text-secondary]">Net Nakit Akışı</p>
                      <p className={cn(
                        'text-[28px] md:text-[32px] font-semibold tabular-nums mt-1',
                        selectedEntry.netCash >= 0 ? 'text-[--text]' : 'text-[--text-secondary]'
                      )} style={{ letterSpacing: '-0.025em' }}>{formatCurrency(selectedEntry.netCash)}</p>
                    </div>
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center',
                      selectedEntry.netCash >= 0 ? 'bg-[--accent-soft] text-[--accent]' : 'bg-[--bg-elevated] text-[--text-tertiary]'
                    )}>
                      <Wallet size={20} strokeWidth={1.75} />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full elite-button-secondary"
                >
                  Detayları Kapat
                </button>
              </div>
            )}
          </div>
        )}
      </PremiumDrawer>
    </div>
  );
}

function KPICard({
  label,
  value,
  icon,
  subtitle,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactElement;
  subtitle: string;
  highlight?: boolean;
}) {
  return (
    <div className="apple-card p-6 md:p-7 transition-all">
      <div className="flex items-center justify-between">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          highlight ? 'bg-[--accent-soft] text-[--accent]' : 'bg-[--bg-elevated] text-[--text-secondary]'
        )}>
          {React.cloneElement(icon as React.ReactElement<{ size?: number; strokeWidth?: number }>, { size: 18, strokeWidth: 1.75 })}
        </div>
      </div>
      <p className="text-[13px] text-[--text-secondary] mt-5" style={{ letterSpacing: '-0.005em' }}>{label}</p>
      <p className="text-[24px] md:text-[28px] font-semibold tabular-nums text-[--text] mt-1" style={{ letterSpacing: '-0.022em' }}>
        {value}
      </p>
      <p className="text-[12px] text-[--text-tertiary] mt-3">{subtitle}</p>
    </div>
  );
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'px-4 py-2 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap min-h-[36px] flex items-center',
        active
          ? 'bg-[--text] text-white'
          : 'text-[--text-secondary] hover:text-[--text] hover:bg-[--bg-elevated]'
      )}
      style={{ letterSpacing: '-0.005em' }}
    >
      {label}
    </Link>
  );
}

function DetailMetric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 bg-[--surface] border border-[--border] rounded-xl transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[--bg-elevated] text-[--text-secondary] flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[14px] text-[--text]" style={{ letterSpacing: '-0.005em' }}>{label}</span>
      </div>
      <span className="text-[15px] font-medium tabular-nums text-[--text]">{value}</span>
    </div>
  );
}
