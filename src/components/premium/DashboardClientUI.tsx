'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  UploadCloud,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { PremiumDrawer, PremiumModal } from './PremiumModal';
import ExpenseForm from '@/features/ledger/components/ExpenseForm';
import { updateExpenseAttachment, uploadExpenseAttachment } from '@/features/ledger/actions';
import NoteList from '@/features/notlar/components/NoteList';
import InteractiveKPICards from '@/features/ledger/components/InteractiveKPICards';

interface RecentExpense {
  id: string;
  description: string;
  amountWithVat: number;
  isOfficial: boolean;
  createdAt: string;
  type: string;
  attachmentUrl?: string | null;
  location?: { name?: string | null } | null;
}

interface LocationItem {
  id: string;
  name: string;
}

interface DashboardChartPoint {
  month: string;
  revenue: number;
  profit: number;
}

interface DashboardProps {
  stats: {
    revenue: number;
    expense: number;
    profit: number;
    roi: number;
    sessions: number;
    monthlyGrowth: number;
  };
  recentExpenses: RecentExpense[];
  locations: LocationItem[];
  chartData?: DashboardChartPoint[];
  notes?: unknown[];
  totalInvestment: number;
  allMonthCount: number;
  allExpenses: Array<{ amountWithVat?: number; isOfficial?: boolean }>;
}

export default function DashboardClientUI({
  stats,
  recentExpenses,
  locations,
  chartData = [],
  notes = [],
  totalInvestment,
  allMonthCount,
  allExpenses,
}: DashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<RecentExpense | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const formatCurrency = (value: number) => new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value || 0);

  const operationalSnapshot = useMemo(() => {
    const avgMonthlyExpense = allMonthCount > 0 ? stats.expense / allMonthCount : stats.expense;
    const officialExpense = allExpenses
      .filter((item) => item.isOfficial)
      .reduce((sum, item) => sum + Number(item.amountWithVat || 0), 0);

    return {
      netMargin: stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0,
      burnRate: stats.revenue > 0 ? (stats.expense / stats.revenue) * 100 : 0,
      avgMonthlyExpense,
      officialExpense,
      unofficialExpense: Math.max(0, stats.expense - officialExpense),
    };
  }, [allExpenses, allMonthCount, stats.expense, stats.profit, stats.revenue]);

  const handleLateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedExpense) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResult = await uploadExpenseAttachment(formData);
      if (!uploadResult.success || !uploadResult.publicUrl) {
        throw new Error(uploadResult.error || 'Yükleme başarısız.');
      }

      const updateResult = await updateExpenseAttachment(selectedExpense.id, uploadResult.publicUrl);
      if (!updateResult.success) throw new Error(updateResult.error || 'Kayıt güncellenemedi.');

      alert('Belge başarıyla eklendi.');
      setIsDrawerOpen(false);
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      alert(`Hata: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Genel Bakış</h1>
          <p className="text-sm text-slate-500 font-medium italic">Sistem genelindeki finansal performans ve analiz merkezi.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
        >
          <Plus size={20} />
          Yeni Gider Girişi
        </button>
      </div>

      {/* Top KPI cards - untouched */}
      <InteractiveKPICards
        totalRevenue={stats.revenue}
        totalExpense={stats.expense}
        totalInvestment={totalInvestment}
        totalNetCash={stats.profit}
        expenses={allExpenses}
        allMonthCount={allMonthCount}
      />

      {/* Redesigned advanced analytics area (below top cards) */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 md:px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Finansal Trend Analizi</h3>
              <p className="text-xs text-slate-500 mt-1">Ciro ve net nakit performansının son dönem kırılımı.</p>
            </div>
            <div className="inline-flex items-center gap-4 text-[11px] font-semibold text-slate-500">
              <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Ciro</span>
              <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Net Nakit</span>
            </div>
          </div>
          <div className="p-6 md:p-8 h-[380px]">
            <ProfessionalTrendChart data={chartData} />
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <InsightCard
            title="Net Marj"
            value={`${operationalSnapshot.netMargin.toFixed(1)}%`}
            description="Toplam ciroya göre net kazanç oranı"
            tone="emerald"
          />
          <InsightCard
            title="Gider Yoğunluğu"
            value={`${operationalSnapshot.burnRate.toFixed(1)}%`}
            description="Ciroya göre toplam operasyonel gider oranı"
            tone="amber"
          />
          <InsightCard
            title="Aylık Ortalama Gider"
            value={formatCurrency(operationalSnapshot.avgMonthlyExpense)}
            description="Tüm dönem ortalaması"
            tone="slate"
          />
          <InsightCard
            title="Resmi / Gayriresmi"
            value={`${formatCurrency(operationalSnapshot.officialExpense)} / ${formatCurrency(operationalSnapshot.unofficialExpense)}`}
            description="Belge statüsüne göre gider dağılımı"
            tone="blue"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-7 rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Son Gider Kayıtları</h3>
            <Link href="/gelir-gider" className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
              Hepsini Gör <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentExpenses.length === 0 ? (
              <p className="p-10 text-sm text-slate-500 text-center">Henüz kayıt bulunamadı.</p>
            ) : recentExpenses.slice(0, 8).map((expense) => (
              <button
                key={expense.id}
                onClick={() => {
                  setSelectedExpense(expense);
                  setIsDrawerOpen(true);
                }}
                className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">{expense.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {expense.location?.name || 'Genel'} • {new Date(expense.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-bold', expense.isOfficial ? 'text-slate-900' : 'text-slate-500')}>
                      {formatCurrency(expense.amountWithVat)}
                    </p>
                    <span className={cn(
                      'text-[11px] font-semibold inline-flex items-center gap-1',
                      expense.isOfficial ? 'text-emerald-600' : 'text-amber-600'
                    )}>
                      {expense.isOfficial ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {expense.isOfficial ? 'Resmi' : 'Gayriresmi'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-5 rounded-[28px] border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Kişisel Not Merkezi</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">Hatırlatmalar, operasyon notları ve yönetim kararlarını tek yerde tutun.</p>
          <NoteList initialNotes={notes} />
        </div>
      </section>

      <PremiumModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Gider Tanımla" maxWidth="max-w-2xl">
        <ExpenseForm locations={locations} onClose={() => { setIsModalOpen(false); window.location.reload(); }} />
      </PremiumModal>

      <PremiumDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="İşlem Detayı">
        {selectedExpense && (
          <div className="space-y-6 py-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Tutar</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{formatCurrency(selectedExpense.amountWithVat)}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow label="Açıklama" value={selectedExpense.description} />
              <DetailRow label="Tip" value={selectedExpense.type === 'RECURRING' ? 'Mükerrer' : 'Tek Seferlik'} />
              <DetailRow label="Lokasyon" value={selectedExpense.location?.name || 'Genel'} />
              <DetailRow label="Tarih" value={new Date(selectedExpense.createdAt).toLocaleString('tr-TR')} />
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Belge Durumu</p>

              {selectedExpense.attachmentUrl ? (
                <a
                  href={selectedExpense.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                >
                  <span className="text-sm font-semibold text-emerald-700 inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Belge Mevcut
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-700" />
                </a>
              ) : (
                <>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                    Bu kayıtta henüz belge yok.
                  </div>
                  <input
                    type="file"
                    ref={fileRef}
                    onChange={handleLateUpload}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={isUploading}
                    className="w-full rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    {isUploading ? (
                      <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...</span>
                    ) : (
                      <span className="inline-flex items-center gap-2"><UploadCloud className="w-4 h-4" /> Belge Ekle</span>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </PremiumDrawer>
    </div>
  );
}

function InsightCard({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  tone: 'emerald' | 'amber' | 'blue' | 'slate';
}) {
  const toneClassMap: Record<typeof tone, string> = {
    emerald: 'border-emerald-200 bg-emerald-50/60 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50/60 text-amber-900',
    blue: 'border-blue-200 bg-blue-50/60 text-blue-900',
    slate: 'border-slate-200 bg-slate-50 text-slate-900',
  };

  return (
    <div className={cn('rounded-2xl border p-5 shadow-sm', toneClassMap[tone])}>
      <p className="text-xs font-semibold opacity-75">{title}</p>
      <p className="text-xl font-black mt-2 leading-tight break-words">{value}</p>
      <p className="text-xs mt-2 opacity-75">{description}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3 bg-white">
      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function ProfessionalTrendChart({ data }: { data: DashboardChartPoint[] }) {
  if (!data || data.length === 0) {
    return <div className="h-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-500">Grafik için yeterli veri yok.</div>;
  }

  const padding = 40;
  const height = 300;
  const width = 1000;
  const maxValue = Math.max(...data.map((item) => Math.max(item.revenue, item.profit)), 1) * 1.15;

  const points = data.map((item, index) => ({
    x: padding + (index * (width - padding * 2) / Math.max(1, data.length - 1)),
    revenueY: height - padding - (item.revenue / maxValue) * (height - padding * 2),
    profitY: height - padding - (item.profit / maxValue) * (height - padding * 2),
  }));

  const revenuePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.revenueY}`).join(' ');
  const profitPath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.profitY}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none" role="img" aria-label="Ciro ve net nakit trend grafiği">
      <defs>
        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map((ratio) => {
        const y = padding + ratio * (height - padding * 2);
        return <line key={ratio} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />;
      })}

      <path d={`${revenuePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`} fill="url(#revenueFill)" />
      <path d={`${profitPath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`} fill="url(#profitFill)" />

      <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1 }} d={revenuePath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
      <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, delay: 0.15 }} d={profitPath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />

      {points.map((point, index) => (
        <g key={`${point.x}-${index}`}>
          <circle cx={point.x} cy={point.revenueY} r="3.5" fill="#2563eb" />
          <circle cx={point.x} cy={point.profitY} r="3.5" fill="#10b981" />
          <text x={point.x} y={height - 8} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="700">{data[index].month}</text>
        </g>
      ))}
    </svg>
  );
}
