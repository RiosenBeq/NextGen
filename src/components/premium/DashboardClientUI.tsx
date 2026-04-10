'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import {
  Plus,
  ChevronRight,
  Receipt,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UploadCloud
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { PremiumModal, PremiumDrawer } from './PremiumModal';
import ExpenseForm from '@/features/ledger/components/ExpenseForm';
import { uploadExpenseAttachment, updateExpenseAttachment } from '@/features/ledger/actions';
import NoteList from '@/features/notlar/components/NoteList';
import InteractiveKPICards from '@/features/ledger/components/InteractiveKPICards';

interface DashboardProps {
  stats: {
    revenue: number;
    expense: number;
    profit: number;
    roi: number;
    sessions: number;
    monthlyGrowth: number;
  };
  recentExpenses: any[];
  locations: any[];
  notes?: any[];
  totalInvestment: number;
  investmentBreakdown: Record<string, number>;
  allMonthCount: number;
  allExpenses: any[];
}

export default function DashboardClientUI({ 
  stats, 
  recentExpenses, 
  locations, 
  notes = [],
  totalInvestment,
  investmentBreakdown,
  allMonthCount,
  allExpenses
}: DashboardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
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
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  const ortalamaGider = allExpenses.length > 0
    ? allExpenses.reduce((toplam: number, gider: any) => toplam + (gider.amountWithVat || 0), 0) / allExpenses.length
    : 0;

  const resmiOran = allExpenses.length > 0
    ? (allExpenses.filter((gider: any) => gider.isOfficial).length / allExpenses.length) * 100
    : 0;

  const belgesizKayit = recentExpenses.filter((gider: any) => !gider.attachmentUrl).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Genel Bakış
          </h1>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">Finansal Performans & Analiz Merkezi</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200/50 active:scale-[0.97]"
        >
          <Plus size={18} />
          Yeni Gider
        </button>
      </header>

      {/* Summary Cards - Flipping KPIs */}
      <InteractiveKPICards 
        totalRevenue={stats.revenue}
        totalExpense={stats.expense}
        totalInvestment={totalInvestment}
        investmentBreakdown={investmentBreakdown}
        totalNetCash={stats.profit}
        expenses={allExpenses}
        allMonthCount={allMonthCount}
      />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            id: 'growth',
            title: 'Büyüme Notu',
            front: `%${stats.monthlyGrowth.toFixed(1)} aylık trend`,
            back: 'Trend değeri son dönem performans eğiliminden üretilir. Düzenli oturum artışı pozitif etki sağlar.',
            accent: 'border-l-blue-500',
          },
          {
            id: 'roi',
            title: 'ROI İzleme',
            front: `${stats.sessions.toLocaleString('tr-TR')} toplam seans`,
            back: 'Seans hacmi arttıkça amortisman etkisi azalır ve yatırım geri dönüş süresi kısalır.',
            accent: 'border-l-amber-500',
          },
          {
            id: 'cash',
            title: 'Nakit Uyarısı',
            front: formatCurrency(stats.profit),
            back: 'Net nakit negatif olduğunda gider kırılımını kontrol edip bir sonraki ay için sabit maliyet optimizasyonu yapın.',
            accent: stats.profit >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500',
          },
        ].map((card) => (
          <article key={card.id} className={cn("h-full rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm", card.accent)}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{card.title}</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{card.front}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{card.back}</p>
          </article>
        ))}
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Analiz Merkezi */}
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 sm:px-7 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Finansal Analiz Merkezi</h3>
            <p className="text-xs text-slate-500 mt-0.5">Aksiyon alınabilir finansal analiz kartları.</p>
          </div>

          <div className="p-5 sm:p-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>

        {/* Recent Transactions */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
           <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                 <Receipt size={16} className="text-slate-400" />
                 Son Kayıtlar
              </h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">{recentExpenses.length}</span>
           </div>

           <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {recentExpenses.length === 0 ? (
                 <div className="py-16 text-center">
                    <Receipt size={28} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-sm font-medium text-slate-400">Kayıt bulunamadı.</p>
                 </div>
              ) : (
                 recentExpenses.map((exp, idx) => (
                    <div
                      key={exp.id || idx}
                      className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => { setSelectedExpense(exp); setIsDrawerOpen(true); }}
                    >
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{exp.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{exp.location?.name || 'Genel'}</span>
                             <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                             <span className="text-[10px] font-medium text-slate-400">{exp.createdAt ? new Date(exp.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '-'}</span>
                          </div>
                       </div>
                       <span className={cn("text-sm font-bold tabular-nums whitespace-nowrap", exp.isOfficial ? "text-slate-900" : "text-slate-400")}>
                          {formatCurrency(exp.amountWithVat)}
                       </span>
                    </div>
                 ))
              )}
           </div>

           <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30">
              <Link href="/gelir-gider" className="text-[11px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors flex items-center justify-center gap-1.5">
                 Tümünü Görüntüle <ChevronRight size={14} />
              </Link>
           </div>
        </div>
      </section>
      
      {/* User Notes Section */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 sm:px-7 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
           <div className="p-2 bg-white rounded-xl border border-slate-200 text-blue-600"><FileText size={16} /></div>
           <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Kişisel Notlar</h3>
              <p className="text-xs text-slate-500 mt-0.5">Operasyonel notlar ve hatırlatıcılar.</p>
           </div>
        </div>
        <div className="p-5 sm:p-7">
          <NoteList initialNotes={notes} />
        </div>
      </section>

      {/* Modals & Drawers */}
      <PremiumModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Gider Tanımla" maxWidth="max-w-xl">
        <ExpenseForm locations={locations} onClose={() => { setIsModalOpen(false); router.refresh(); }} />
      </PremiumModal>

      <PremiumDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="İşlem Detayı">
        {selectedExpense && (
          <div className="space-y-8 py-4 animate-in slide-in-from-right-5 duration-500">
             <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Tutar</p>
                <p className="text-4xl font-bold text-slate-900 tabular-nums tracking-tighter italic">
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
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                      <FileText size={14} className="text-slate-400" />
                      Belge Durumu
                   </p>
                   
                   {selectedExpense.attachmentUrl ? (
                     <a href={selectedExpense.attachmentUrl} target="_blank" rel="noopener" className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-100 group">
                        <div className="flex items-center gap-3">
                           <div className="bg-white p-2 rounded-xl text-emerald-600 shadow-sm border border-emerald-100"><CheckCircle2 size={16} /></div>
                           <span className="text-sm font-bold text-emerald-800">Belge Mevcut</span>
                        </div>
                        <ChevronRight size={16} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
                     </a>
                   ) : (
                     <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100">
                           <AlertCircle size={16} className="text-rose-500" />
                           <span className="text-sm font-bold text-rose-800">Belge Bulunmuyor</span>
                        </div>
                        <input type="file" ref={fileRef} onChange={handleLateUpload} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" />
                        <button onClick={() => fileRef.current?.click()} disabled={isUploading} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-600 hover:bg-white transition-all text-sm font-bold">
                           {isUploading ? <><Loader2 size={18} className="animate-spin" /> Yükleniyor...</> : <><UploadCloud size={18} /> Belge Ekle</>}
                        </button>
                     </div>
                   )}
                </div>
             </div>

             <button onClick={() => setIsDrawerOpen(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold transition-all hover:bg-slate-800 active:scale-[0.98] shadow-xl">
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
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">Gösterilen Değer</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(ortalamaGider)}</p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Bu değer, sistemdeki tüm gider kayıtlarının <b>KDV dahil toplam tutarlarının</b> ortalamasıdır.
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
            <p className="font-semibold text-slate-700">Formül</p>
            <p className="text-slate-600">Ortalama Gider = Toplam Gider Tutarı / Gider Kayıt Adedi</p>
            <p className="text-xs text-slate-500">
              Toplam Tutar: <b>{formatCurrency(allExpenses.reduce((toplam: number, gider: any) => toplam + (gider.amountWithVat || 0), 0))}</b> •
              Kayıt Adedi: <b>{allExpenses.length}</b>
            </p>
          </div>
        </div>
      </PremiumModal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
       <p className="text-sm font-bold text-slate-900">{value}</p>
    </div>
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
  tone: 'blue' | 'emerald' | 'rose';
  onClick?: () => void;
  clickable?: boolean;
}) {
  const toneMap = {
    blue: { bg: 'bg-blue-50/60', border: 'border-blue-100', dot: 'bg-blue-500' },
    emerald: { bg: 'bg-emerald-50/60', border: 'border-emerald-100', dot: 'bg-emerald-500' },
    rose: { bg: 'bg-rose-50/60', border: 'border-rose-100', dot: 'bg-rose-500' },
  };
  const t = toneMap[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border p-4 text-left w-full transition-all',
        t.bg, t.border,
        clickable ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("w-1.5 h-1.5 rounded-full", t.dot)} />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</p>
        {clickable && <ChevronRight size={12} className="ml-auto text-blue-500" />}
      </div>
      <p className="mt-2.5 text-xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
    </button>
  );
}
