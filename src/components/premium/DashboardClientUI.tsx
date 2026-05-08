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

const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
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
    higherIsBetter: boolean;
  };

  const trendCards: MoMTrend[] = [
    {
      id: 'profit',
      title: 'Net Kâr',
      icon: <Wallet size={18} strokeWidth={1.75} />,
      currentValue: formatCurrency(stats.currentMonth.profit),
      currentLabel: monthLabel(stats.currentMonthId),
      previousValue: formatCurrency(stats.previousMonth.profit),
      previousLabel: monthLabel(stats.previousMonthId),
      pct: stats.growth.profit,
      higherIsBetter: true,
    },
    {
      id: 'revenue',
      title: 'Aylık Ciro',
      icon: <TrendingUp size={18} strokeWidth={1.75} />,
      currentValue: formatCurrency(stats.currentMonth.revenue),
      currentLabel: monthLabel(stats.currentMonthId),
      previousValue: formatCurrency(stats.previousMonth.revenue),
      previousLabel: monthLabel(stats.previousMonthId),
      pct: stats.growth.revenue,
      higherIsBetter: true,
    },
    {
      id: 'sessions',
      title: 'Seans Hacmi',
      icon: <Activity size={18} strokeWidth={1.75} />,
      currentValue: `${formatCompact(stats.currentMonth.sessions)} seans`,
      currentLabel: monthLabel(stats.currentMonthId),
      previousValue: `${formatCompact(stats.previousMonth.sessions)} seans`,
      previousLabel: monthLabel(stats.previousMonthId),
      pct: stats.growth.sessions,
      higherIsBetter: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8 sm:space-y-12 md:space-y-16"
    >
      {/* Hero Section */}
      <motion.header {...fadeInUp} className="hero-card p-5 sm:p-7 md:p-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] text-white/85"
              style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.14)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--violet)', boxShadow: '0 0 10px var(--violet)' }}
              />
              Genel Bakış · Bugün
            </div>
            <h1
              className="mt-5 leading-[1.02] text-white"
              style={{ fontSize: 'clamp(36px, 4.6vw, 56px)', fontWeight: 700, letterSpacing: '-0.025em' }}
            >
              Finansal kontrol{' '}
              <span className="hero-serif" style={{ background: 'linear-gradient(135deg, #C7B8FF 0%, #FFA8E2 60%, #7BE8FF 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>
                merkezi
              </span>.
            </h1>
            <p className="mt-5 text-[15px] md:text-[17px] text-white/72 leading-relaxed max-w-xl">
              Sistem genelindeki performans, gider akışı ve aylık karşılaştırmalar tek bir tasarım dilinde.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 md:items-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="elite-button-primary"
            >
              <Plus size={16} strokeWidth={2.25} />
              Yeni Gider
            </button>
            <Link
              href="/performans"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[14px] font-semibold text-white/90 hover:text-white border border-white/20 bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-md transition-colors"
            >
              Performans Gir
              <ArrowRight size={14} strokeWidth={2.25} />
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Summary Cards - Flipping KPIs */}
      <motion.section {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.05 }}>
        <InteractiveKPICards
          totalRevenue={stats.revenue}
          totalExpense={stats.expense}
          totalInvestment={totalInvestment}
          investmentBreakdown={investmentBreakdown}
          totalNetCash={stats.profit}
          expenses={allExpenses}
          allMonthCount={allMonthCount}
        />
      </motion.section>

      {/* MoM Trend Cards */}
      <motion.section
        {...fadeInUp}
        transition={{ ...fadeInUp.transition, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5"
      >
        {trendCards.map((card) => (
          <TrendCard key={card.id} card={card} />
        ))}
      </motion.section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 md:gap-6">
        <motion.div
          {...fadeInUp}
          transition={{ ...fadeInUp.transition, delay: 0.15 }}
          className="xl:col-span-8 apple-card p-5 sm:p-6 md:p-8 relative overflow-hidden"
        >
          <div
            aria-hidden
            className="deco-orb deco-orb--violet"
            style={{ width: 220, height: 220, top: -80, right: -60, opacity: 0.35 }}
          />
          <div className="mb-8 relative">
            <p className="apple-eyebrow">Analiz</p>
            <h3 className="apple-title-1 mt-3">Finansal Analiz Merkezi</h3>
            <p className="mt-2 text-[15px] text-[--text-secondary]" style={{ letterSpacing: '-0.005em' }}>
              Aksiyon alınabilir finansal göstergeler.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            <AnalyzerCard
              title="Ortalama Gider"
              value={formatCurrency(ortalamaGider)}
              description="Son kayıtlar baz alınarak ortalama gider tutarı."
              onClick={() => setIsAverageExpenseModalOpen(true)}
              clickable
            />
            <AnalyzerCard
              title="Resmi Evrak Oranı"
              value={`%${resmiOran.toFixed(1)}`}
              description="Kayıtların resmi evrak ile işlenme oranı."
            />
            <AnalyzerCard
              title="Belgesiz Son Kayıt"
              value={`${belgesizKayit}`}
              description="Son kayıtlar içinde belgesi eksik gider sayısı."
            />
            <AnalyzerCard
              title="Net Nakit Durumu"
              value={formatCurrency(stats.profit)}
              description="Toplam gelir-gider sonrası kalan net nakit."
              negative={stats.profit < 0}
            />
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          {...fadeInUp}
          transition={{ ...fadeInUp.transition, delay: 0.2 }}
          className="xl:col-span-4 apple-card overflow-hidden flex flex-col"
        >
          <div className="px-6 py-5 border-b border-[--border] flex items-center justify-between">
            <div>
              <p className="apple-eyebrow">Audit</p>
              <h3 className="apple-title-2 mt-2">Son Kayıtlar</h3>
            </div>
            <span
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
              style={{ background: 'var(--grad-aurora)', boxShadow: '0 6px 16px rgba(79, 70, 229, 0.30)' }}
            >
              <Receipt size={18} strokeWidth={2} />
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {recentExpenses.length === 0 ? (
              <div className="empty-state">
                <Receipt className="empty-state-icon" />
                <p className="empty-state-title">Kayıt bulunamadı</p>
                <p className="empty-state-desc">Yeni bir gider girdiğinizde burada listelenir.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[--border-soft]">
                {recentExpenses.map((exp, idx) => (
                  <li key={exp.id || idx}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExpense(exp);
                        setIsDrawerOpen(true);
                      }}
                      className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-[--bg-subtle] transition-colors duration-200 min-h-[60px]"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-[15px] font-medium text-[--text] truncate" style={{ letterSpacing: '-0.005em' }}>
                          {exp.description}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[12px] text-[--text-tertiary]">{exp.location?.name || 'Genel'}</span>
                          <span className="w-1 h-1 rounded-full bg-[--text-quaternary]" />
                          <span className="text-[12px] text-[--text-tertiary]">
                            {exp.createdAt
                              ? new Date(exp.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
                              : '-'}
                          </span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'text-[15px] font-medium tabular-nums whitespace-nowrap',
                          exp.isOfficial ? 'text-[--text]' : 'text-[--text-secondary]'
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

          <div className="px-6 py-3 border-t border-[--border] text-center">
            <Link
              href="/gelir-gider"
              className="text-[14px] font-medium text-[--accent] hover:text-[--accent-hover] transition-colors inline-flex items-center justify-center gap-1.5"
            >
              Tümünü Görüntüle
              <ChevronRight size={14} strokeWidth={2} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* User Notes Section */}
      <motion.section
        {...fadeInUp}
        transition={{ ...fadeInUp.transition, delay: 0.25 }}
        className="apple-card p-5 sm:p-6 md:p-8 relative overflow-hidden"
      >
        <div
          aria-hidden
          className="deco-orb deco-orb--cyan"
          style={{ width: 240, height: 240, bottom: -100, left: -80, opacity: 0.35 }}
        />
        <div className="mb-8 relative">
          <p className="apple-eyebrow">Not Defteri</p>
          <h3 className="apple-title-1 mt-3">
            Kişisel <span className="hero-serif text-gradient-aurora">notlar</span>
          </h3>
          <p className="mt-2 text-[15px] text-[--text-secondary]" style={{ letterSpacing: '-0.005em' }}>
            Operasyonel notlar ve hatırlatıcılar.
          </p>
        </div>
        <div className="relative">
          <NoteList initialNotes={notes} />
        </div>
      </motion.section>

      {/* Modals & Drawers */}
      <PremiumModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Gider Tanımla" maxWidth="max-w-xl">
        <ExpenseForm locations={locations} onClose={() => { setIsModalOpen(false); router.refresh(); }} />
      </PremiumModal>

      <PremiumDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="İşlem Detayı">
        {selectedExpense && (
          <div className="space-y-8 py-4">
            <div className="p-6 rounded-[18px] bg-[--bg-elevated] space-y-2">
              <p className="text-[13px] text-[--text-secondary]">Net Tutar</p>
              <p className="text-[32px] font-semibold text-[--text] tabular-nums" style={{ letterSpacing: '-0.025em' }}>
                {formatCurrency(selectedExpense.amountWithVat)}
              </p>
            </div>

            <div className="space-y-5 px-1">
              <DetailRow label="Açıklama" value={selectedExpense.description} />
              <DetailRow label="Tip" value={selectedExpense.type === 'RECURRING' ? 'Mükerrer' : 'Tek Seferlik'} />
              <DetailRow label="Durum" value={selectedExpense.isOfficial ? 'Resmi Evrak' : 'Gayri Resmi'} />
              <DetailRow label="Lokasyon" value={selectedExpense.location?.name || 'Tümü'} />
              <DetailRow label="Tarih" value={new Date(selectedExpense.createdAt).toLocaleString('tr-TR')} />

              <div className="pt-6 border-t border-[--border] space-y-4">
                <p className="text-[13px] text-[--text-secondary] flex items-center gap-2">
                  <FileText size={14} strokeWidth={1.75} className="text-[--text-tertiary]" />
                  Belge Durumu
                </p>

                {selectedExpense.attachmentUrl ? (
                  <a
                    href={selectedExpense.attachmentUrl}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center justify-between p-4 rounded-xl bg-[--bg-elevated] hover:bg-[#ECECEE] transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18} strokeWidth={1.75} className="text-[--accent]" />
                      <span className="text-[14px] font-medium text-[--text]">Belge Mevcut</span>
                    </div>
                    <ChevronRight size={16} strokeWidth={1.75} className="text-[--text-tertiary]" />
                  </a>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-[--danger-soft]">
                      <AlertCircle size={18} strokeWidth={1.75} className="text-[--danger]" />
                      <span className="text-[14px] font-medium text-[--danger]">Belge Bulunmuyor</span>
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
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full border border-[--border-strong] text-[--text] hover:bg-[--bg-elevated] transition-colors duration-200 text-[14px] font-medium min-h-[48px]"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" strokeWidth={2} /> Yükleniyor…
                        </>
                      ) : (
                        <>
                          <UploadCloud size={16} strokeWidth={1.75} /> Belge Ekle
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
              className="elite-button-primary w-full"
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
          <div className="rounded-[18px] bg-[--bg-elevated] p-5">
            <p className="text-[13px] text-[--text-secondary]">Gösterilen Değer</p>
            <p className="mt-2 text-[28px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.022em' }}>{formatCurrency(ortalamaGider)}</p>
          </div>
          <p className="text-[15px] text-[--text-secondary] leading-relaxed">
            Bu değer, sistemdeki tüm gider kayıtlarının <b className="text-[--text]">KDV dahil toplam tutarlarının</b> ortalamasıdır.
          </p>
          <div className="rounded-xl bg-[--bg-elevated] p-4 space-y-2 text-[14px]">
            <p className="font-medium text-[--text]">Formül</p>
            <p className="text-[--text-secondary]">Ortalama Gider = Toplam Gider Tutarı / Gider Kayıt Adedi</p>
            <p className="text-[12px] text-[--text-tertiary]">
              Toplam Tutar:{' '}
              <b className="tabular-nums text-[--text]">
                {formatCurrency(allExpenses.reduce((toplam, gider) => toplam + (gider.amountWithVat || 0), 0))}
              </b>{' '}
              · Kayıt Adedi: <b className="tabular-nums text-[--text]">{allExpenses.length}</b>
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
      <span className="text-[12px] text-[--text-tertiary]">{label}</span>
      <p className="text-[15px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>{value}</p>
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
  };
};

function TrendCard({ card }: TrendCardProps) {
  const direction =
    card.pct === null ? 'neutral' : card.pct > 0 ? 'up' : card.pct < 0 ? 'down' : 'flat';
  const isGood =
    direction === 'flat' || direction === 'neutral'
      ? null
      : card.higherIsBetter
        ? direction === 'up'
        : direction === 'down';

  const ArrowIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : ArrowRight;

  const pctLabel =
    card.pct === null
      ? 'Yetersiz veri'
      : `${card.pct > 0 ? '+' : ''}${card.pct.toFixed(1)}%`;

  const iconGradient =
    card.id === 'profit'
      ? 'var(--grad-aurora)'
      : card.id === 'revenue'
        ? 'var(--grad-emerald)'
        : 'var(--grad-sunset)';

  return (
    <article className="apple-card p-5 sm:p-6 md:p-7 relative overflow-hidden">
      <span
        aria-hidden
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-30 blur-2xl pointer-events-none"
        style={{ background: iconGradient }}
      />
      <div className="flex items-start justify-between gap-3 relative">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white"
          style={{ background: iconGradient, boxShadow: '0 8px 18px rgba(79, 70, 229, 0.25)' }}
        >
          {card.icon}
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold tabular-nums border',
            isGood === null
              ? 'bg-[--bg-elevated] text-[--text-secondary] border-[--border]'
              : isGood
                ? 'bg-[--success-soft] text-[--success] border-[--success-tint]'
                : 'bg-[--danger-soft] text-[--danger] border-[--danger-tint]'
          )}
        >
          <ArrowIcon size={12} strokeWidth={2.5} />
          {pctLabel}
        </span>
      </div>

      <p className="mt-6 text-[12px] uppercase tracking-wider font-semibold text-[--text-tertiary]">{card.title}</p>
      <p className="mt-2 text-[30px] md:text-[36px] font-bold tabular-nums text-[--text]" style={{ letterSpacing: '-0.025em' }}>
        {card.currentValue}
      </p>
      <p className="mt-1 text-[12px] text-[--text-tertiary]">{card.currentLabel}</p>

      <div className="mt-5 pt-4 border-t border-[--border] flex items-baseline justify-between gap-3">
        <span className="text-[12px] text-[--text-tertiary]">vs Geçen Ay</span>
        <span className="text-[14px] font-semibold tabular-nums text-[--text-secondary]">
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
  onClick,
  clickable = false,
  negative = false,
}: {
  title: string;
  value: string;
  description: string;
  onClick?: () => void;
  clickable?: boolean;
  negative?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={cn(
        'rounded-[18px] border border-[--border] bg-[--surface] p-5 text-left w-full transition-all duration-200',
        clickable
          ? 'hover:border-[--border-strong] hover:bg-[--bg-subtle] cursor-pointer'
          : 'cursor-default'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-[--text-secondary]" style={{ letterSpacing: '-0.005em' }}>{title}</p>
        {clickable && (
          <span className="text-[12px] font-medium text-[--accent]">
            Detay →
          </span>
        )}
      </div>
      <p className={cn(
        'mt-3 text-[24px] md:text-[28px] font-semibold tabular-nums',
        negative ? 'text-[--text-secondary]' : 'text-[--text]'
      )} style={{ letterSpacing: '-0.022em' }}>
        {value}
      </p>
      <p className="mt-1.5 text-[13px] text-[--text-tertiary] leading-relaxed">{description}</p>
    </button>
  );
}
