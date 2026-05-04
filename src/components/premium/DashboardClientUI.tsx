'use client';
import { useRouter } from 'next/navigation';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  ChevronRight,
  Receipt,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UploadCloud,
  TrendingUp,
  TrendingDown,
  Activity,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { PremiumModal, PremiumDrawer } from './PremiumModal';
import ExpenseForm from '@/features/ledger/components/ExpenseForm';
import { uploadExpenseAttachment, updateExpenseAttachment } from '@/features/ledger/actions';
import NoteList from '@/features/notlar/components/NoteList';
import InteractiveKPICards from '@/features/ledger/components/InteractiveKPICards';
import { toast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/errors';

type DashboardLocation = { id: string; name: string };

type DashboardExpense = {
  id: string;
  description: string;
  amountWithVat: number;
  type?: string;
  isOfficial?: boolean;
  attachmentUrl?: string | null;
  createdAt: string;
  location?: { name?: string } | null;
};

type DashboardNote = {
  id: string | number;
  title: string;
  content?: string;
  color: string;
  createdAt: string;
};

type MonthSlice = { revenue: number; profit: number; sessions: number };

interface DashboardProps {
  stats: {
    revenue: number;
    expense: number;
    profit: number;
    roi: number;
    sessions: number;
    monthlyGrowth: number;
    currentMonth: MonthSlice;
    previousMonth: MonthSlice;
    currentMonthId: string;
    previousMonthId: string;
    growth: {
      revenue: number | null;
      profit: number | null;
      sessions: number | null;
    };
  };
  recentExpenses: DashboardExpense[];
  locations: DashboardLocation[];
  notes?: DashboardNote[];
  totalInvestment: number;
  investmentBreakdown: Record<string, number>;
  allMonthCount: number;
  allExpenses: DashboardExpense[];
}

type AccentTone = 'blue' | 'emerald' | 'rose' | 'amber';

const TONE_STYLES: Record<AccentTone, { iconBg: string; iconText: string; chipBg: string; chipText: string }> = {
  blue: {
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    chipBg: 'bg-blue-50',
    chipText: 'text-blue-600',
  },
  emerald: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    chipBg: 'bg-emerald-50',
    chipText: 'text-emerald-600',
  },
  rose: {
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-600',
    chipBg: 'bg-rose-50',
    chipText: 'text-rose-600',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    chipBg: 'bg-amber-50',
    chipText: 'text-amber-600',
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: 'easeOut' as const },
};

export default function DashboardClientUI({
  stats,
  recentExpenses,
  locations,
  notes = [],
  totalInvestment,
  investmentBreakdown,
  allMonthCount,
  allExpenses,
}: DashboardProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<DashboardExpense | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAverageExpenseModalOpen, setIsAverageExpenseModalOpen] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleLateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExpense) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const upload = await uploadExpenseAttachment(formData);
      if (!upload.success || !upload.publicUrl) throw new Error(upload.error || 'Yükleme başarısız');

      const update = await updateExpenseAttachment(selectedExpense.id, upload.publicUrl);
      if (!update.success) throw new Error(update.error);

      toast.success('Belge başarıyla eklendi.');
      setIsDrawerOpen(false);
      router.refresh();
    } catch (error) {
      toast.error('Hata: ' + getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  const ortalamaGider = allExpenses.length > 0
    ? allExpenses.reduce((toplam, gider) => toplam + (gider.amountWithVat || 0), 0) / allExpenses.length
    : 0;

  const resmiOran = allExpenses.length > 0
    ? (allExpenses.filter((gider) => gider.isOfficial).length / allExpenses.length) * 100
    : 0;

  const belgesizKayit = recentExpenses.filter((gider) => !gider.attachmentUrl).length;

  // ── Bu ay ↔ geçen ay karşılaştırma kartları için yardımcılar ────────────
  const monthLabel = (yyyymm: string) => {
    const [y, m] = yyyymm.split('-');
    if (!y || !m) return yyyymm;
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  };

  const formatCompact = (val: number) =>
    new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 }).format(val);

  type MoMTrend = {
    id: string;
    title: string;
    icon: React.ReactNode;
    currentValue: string;
    currentLabel: string;
    previousValue: string;
    previousLabel: string;
    pct: number | null;
    // Pozitif yön (artış iyi mi?). Profit/Revenue/Sessions için: true.
    higherIsBetter: boolean;
    accent: AccentTone;
  };

  const trendCards: MoMTrend[] = [
    {
      id: 'profit',
      title: 'Net Kâr',
      icon: <Wallet size={16} />,
      currentValue: formatCurrency(stats.currentMonth.profit),
      currentLabel: monthLabel(stats.currentMonthId),
      previousValue: formatCurrency(stats.previousMonth.profit),
      previousLabel: monthLabel(stats.previousMonthId),
      pct: stats.growth.profit,
      higherIsBetter: true,
      accent: stats.currentMonth.profit >= 0 ? 'emerald' : 'rose',
    },
    {
      id: 'revenue',
      title: 'Aylık Ciro',
      icon: <TrendingUp size={16} />,
      currentValue: formatCurrency(stats.currentMonth.revenue),
      currentLabel: monthLabel(stats.currentMonthId),
      previousValue: formatCurrency(stats.previousMonth.revenue),
      previousLabel: monthLabel(stats.previousMonthId),
      pct: stats.growth.revenue,
      higherIsBetter: true,
      accent: 'blue',
    },
    {
      id: 'sessions',
      title: 'Seans Hacmi',
      icon: <Activity size={16} />,
      currentValue: `${formatCompact(stats.currentMonth.sessions)} seans`,
      currentLabel: monthLabel(stats.currentMonthId),
      previousValue: `${formatCompact(stats.previousMonth.sessions)} seans`,
      previousLabel: monthLabel(stats.previousMonthId),
      pct: stats.growth.sessions,
      higherIsBetter: true,
      accent: 'amber',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-8 pb-20"
    >
      {/* Header Section */}
      <motion.div {...fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Genel Bakış</h1>
          <p className="text-sm text-slate-500">Sistem genelindeki finansal performans ve analiz merkezi.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors duration-200 shadow-sm"
          >
            <Plus size={16} />
            Yeni Gider Girişi
          </button>
        </div>
      </motion.div>

      {/* Summary Cards - Flipping KPIs */}
      <motion.div {...fadeInUp} transition={{ duration: 0.25, ease: 'easeOut', delay: 0.05 }}>
        <InteractiveKPICards
          totalRevenue={stats.revenue}
          totalExpense={stats.expense}
          totalInvestment={totalInvestment}
          investmentBreakdown={investmentBreakdown}
          totalNetCash={stats.profit}
          expenses={allExpenses}
          allMonthCount={allMonthCount}
        />
      </motion.div>

      {/* MoM Trend Cards — bu ay vs geçen ay */}
      <motion.section
        {...fadeInUp}
        transition={{ duration: 0.25, ease: 'easeOut', delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {trendCards.map((card) => (
          <TrendCard key={card.id} card={card} />
        ))}
      </motion.section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Analiz Merkezi */}
        <motion.div
          {...fadeInUp}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.15 }}
          className="xl:col-span-8 bg-white border border-slate-200/70 rounded-2xl p-6 sm:p-8 shadow-sm"
        >
          <div className="space-y-1 mb-6">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Analiz</p>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">Finansal Analiz Merkezi</h3>
            <p className="text-sm text-slate-500">Aksiyon alınabilir finansal analiz kartları.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnalyzerCard
              title="Ortalama Gider"
              value={formatCurrency(ortalamaGider)}
              description="Son kayıtlar baz alınarak ortalama gider tutarı."
              tone="blue"
              onClick={() => setIsAverageExpenseModalOpen(true)}
              clickable
            />
            <AnalyzerCard
              title="Resmi Evrak Oranı"
              value={`%${resmiOran.toFixed(1)}`}
              description="Kayıtların resmi evrak ile işlenme oranı."
              tone="emerald"
            />
            <AnalyzerCard
              title="Belgesiz Son Kayıt"
              value={`${belgesizKayit}`}
              description="Son kayıtlar içinde belgesi eksik olan gider adedi."
              tone="rose"
            />
            <AnalyzerCard
              title="Net Nakit Durumu"
              value={formatCurrency(stats.profit)}
              description="Toplam gelir-gider sonrası kalan net nakit."
              tone={stats.profit >= 0 ? 'emerald' : 'rose'}
            />
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          {...fadeInUp}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.2 }}
          className="xl:col-span-4 bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-sm flex flex-col"
        >
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Receipt size={18} className="text-slate-400" />
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">Son Kayıtlar</h3>
            </div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              Audit
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {recentExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mb-3">
                  <Receipt size={20} />
                </div>
                <p className="text-sm font-medium text-slate-600">Kayıt bulunamadı</p>
                <p className="mt-1 text-xs text-slate-400">Yeni bir gider girdiğinizde burada listelenir.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentExpenses.map((exp, idx) => (
                  <li key={exp.id || idx}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExpense(exp);
                        setIsDrawerOpen(true);
                      }}
                      className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50 transition-colors duration-200"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-slate-900 truncate">{exp.description}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-slate-500">{exp.location?.name || 'Genel'}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-xs text-slate-400">
                            {exp.createdAt
                              ? new Date(exp.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
                              : '-'}
                          </span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'text-sm font-semibold tabular-nums tracking-tight whitespace-nowrap',
                          exp.isOfficial ? 'text-slate-900' : 'text-slate-500'
                        )}
                      >
                        {formatCurrency(exp.amountWithVat)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="px-4 py-3 border-t border-slate-100 text-center">
            <Link
              href="/gelir-gider"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              Tümünü Görüntüle
              <ChevronRight size={14} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* User Notes Section */}
      <motion.section
        {...fadeInUp}
        transition={{ duration: 0.25, ease: 'easeOut', delay: 0.25 }}
        className="bg-white border border-slate-200/70 rounded-2xl p-6 sm:p-8 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">Kişisel Notlar</h3>
            <p className="text-sm text-slate-500 mt-0.5">Operasyonel notlar ve hatırlatıcılar.</p>
          </div>
        </div>
        <NoteList initialNotes={notes} />
      </motion.section>

      {/* Modals & Drawers */}
      <PremiumModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Gider Tanımla" maxWidth="max-w-xl">
        <ExpenseForm locations={locations} onClose={() => { setIsModalOpen(false); router.refresh(); }} />
      </PremiumModal>

      <PremiumDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="İşlem Detayı">
        {selectedExpense && (
          <div className="space-y-8 py-4">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Net Tutar</p>
              <p className="text-3xl font-semibold text-slate-900 tabular-nums tracking-tight">
                {formatCurrency(selectedExpense.amountWithVat)}
              </p>
            </div>

            <div className="space-y-5 px-1">
              <DetailRow label="Açıklama" value={selectedExpense.description} />
              <DetailRow label="Tip" value={selectedExpense.type === 'RECURRING' ? 'Mükerrer' : 'Tek Seferlik'} />
              <DetailRow label="Durum" value={selectedExpense.isOfficial ? 'Resmi Evrak' : 'Gayri Resmi'} />
              <DetailRow label="Lokasyon" value={selectedExpense.location?.name || 'Tümü'} />
              <DetailRow label="Tarih" value={new Date(selectedExpense.createdAt).toLocaleString('tr-TR')} />

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={14} className="text-slate-400" />
                  Belge Durumu
                </p>

                {selectedExpense.attachmentUrl ? (
                  <a
                    href={selectedExpense.attachmentUrl}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-100 group hover:bg-emerald-100/60 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg text-emerald-600 shadow-sm border border-emerald-100">
                        <CheckCircle2 size={16} />
                      </div>
                      <span className="text-sm font-medium text-emerald-700">Belge Mevcut</span>
                    </div>
                    <ChevronRight size={16} className="text-emerald-500 group-hover:translate-x-1 transition-transform duration-200" />
                  </a>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100">
                      <AlertCircle size={16} className="text-rose-600" />
                      <span className="text-sm font-medium text-rose-700">Belge Bulunmuyor</span>
                    </div>
                    <input
                      type="file"
                      ref={fileRef}
                      onChange={handleLateUpload}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={isUploading}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/40 transition-colors duration-200 text-sm font-medium"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Yükleniyor...
                        </>
                      ) : (
                        <>
                          <UploadCloud size={16} /> Belge Ekle
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors duration-200 shadow-sm"
            >
              Pencereyi Kapat
            </button>
          </div>
        )}
      </PremiumDrawer>

      <PremiumModal
        isOpen={isAverageExpenseModalOpen}
        onClose={() => setIsAverageExpenseModalOpen(false)}
        title="Ortalama Gider Hesaplaması"
        maxWidth="max-w-lg"
      >
        <div className="p-6 space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-700">Gösterilen Değer</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{formatCurrency(ortalamaGider)}</p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Bu değer, sistemdeki tüm gider kayıtlarının <b>KDV dahil toplam tutarlarının</b> ortalamasıdır.
          </p>
          <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4 space-y-2 text-sm">
            <p className="font-medium text-slate-700">Formül</p>
            <p className="text-slate-600">Ortalama Gider = Toplam Gider Tutarı / Gider Kayıt Adedi</p>
            <p className="text-xs text-slate-500">
              Toplam Tutar:{' '}
              <b className="tabular-nums">
                {formatCurrency(allExpenses.reduce((toplam, gider) => toplam + (gider.amountWithVat || 0), 0))}
              </b>{' '}
              • Kayıt Adedi: <b className="tabular-nums">{allExpenses.length}</b>
            </p>
          </div>
        </div>
      </PremiumModal>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

type TrendCardProps = {
  card: {
    id: string;
    title: string;
    icon: React.ReactNode;
    currentValue: string;
    currentLabel: string;
    previousValue: string;
    previousLabel: string;
    pct: number | null;
    higherIsBetter: boolean;
    accent: AccentTone;
  };
};

function TrendCard({ card }: TrendCardProps) {
  const tone = TONE_STYLES[card.accent];

  // Yön + renk: pct null ise nötr badge, sayı ise yüksek/düşük göre yeşil/kırmızı.
  const direction =
    card.pct === null ? 'neutral' : card.pct > 0 ? 'up' : card.pct < 0 ? 'down' : 'flat';
  const isGood =
    direction === 'flat' || direction === 'neutral'
      ? null
      : card.higherIsBetter
        ? direction === 'up'
        : direction === 'down';

  const badgeStyles =
    isGood === null
      ? 'bg-slate-100 text-slate-600 border-slate-200'
      : isGood
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
        : 'bg-rose-50 text-rose-700 border-rose-200/60';

  const ArrowIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : ArrowRight;

  const pctLabel =
    card.pct === null
      ? 'Yetersiz veri'
      : `${card.pct > 0 ? '+' : ''}${card.pct.toFixed(1)}%`;

  return (
    <article className="rounded-2xl bg-white border border-slate-200/70 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-200 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', tone.iconBg, tone.iconText)}>
          {card.icon}
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium tabular-nums',
            badgeStyles
          )}
        >
          <ArrowIcon size={12} />
          {pctLabel}
        </span>
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-500">{card.title}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
        {card.currentValue}
      </p>
      <p className="mt-1 text-xs text-slate-500">{card.currentLabel}</p>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">vs Geçen Ay</span>
        <span className="text-sm font-medium tabular-nums tracking-tight text-slate-600">
          {card.previousValue}
        </span>
      </div>
    </article>
  );
}

function AnalyzerCard({
  title,
  value,
  description,
  tone,
  onClick,
  clickable = false,
}: {
  title: string;
  value: string;
  description: string;
  tone: AccentTone;
  onClick?: () => void;
  clickable?: boolean;
}) {
  const t = TONE_STYLES[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-slate-200/70 bg-white p-5 text-left w-full shadow-sm transition-all duration-200',
        clickable
          ? 'hover:shadow-md hover:border-slate-300/60 cursor-pointer'
          : 'cursor-default'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={cn('w-2 h-2 rounded-full', t.iconText.replace('text-', 'bg-'))} />
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
        </div>
        {clickable && (
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md', t.chipBg, t.chipText)}>
            Detay
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>
      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{description}</p>
    </button>
  );
}
