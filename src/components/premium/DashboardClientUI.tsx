'use client';

import React, { useState } from 'react';
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

      alert('Belge başarıyla eklendi.');
      setIsDrawerOpen(false);
      window.location.reload();
    } catch (err: any) {
      alert('Hata: ' + err.message);
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
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Genel Bakış</h1>
          <p className="text-sm text-slate-500 font-medium italic">Sistem genelindeki finansal performans ve analiz merkezi.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsModalOpen(true)}
             className="inline-flex items-center gap-2.5 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
           >
              <Plus size={20} />
              Yeni Gider Girişi
           </button>
        </div>
      </div>

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

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Analiz Merkezi */}
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="space-y-1 mb-6">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Finansal Analiz Merkezi</h3>
            <p className="text-xs text-slate-500 font-medium italic">Trend grafiği yerine aksiyon alınabilir analiz kartları.</p>
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
        </div>

        {/* Recent Transactions */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
           <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                 <Receipt size={20} className="text-slate-400" />
                 Son Kayıtlar
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">AUDIT</span>
           </div>
           
           <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                 <tbody className="divide-y divide-slate-50">
                    {recentExpenses.length === 0 ? (
                       <tr><td className="py-20 text-center text-xs font-medium text-slate-400 italic">Kayıt bulunamadı.</td></tr>
                    ) : (
                       recentExpenses.map((exp, idx) => (
                          <tr 
                            key={exp.id || idx} 
                            className="group hover:bg-slate-50/50 transition-all cursor-pointer"
                            onClick={() => { setSelectedExpense(exp); setIsDrawerOpen(true); }}
                          >
                             <td className="px-6 py-4">
                                <div className="flex flex-col">
                                   <span className="text-sm font-bold text-slate-800 line-clamp-1">{exp.description}</span>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{exp.location?.name || 'Genel'}</span>
                                      <span className="w-0.5 h-0.5 rounded-full bg-slate-200" />
                                      <span className="text-[10px] font-medium text-slate-400 lowercase">{exp.createdAt ? new Date(exp.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '-'}</span>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <span className={cn("text-sm font-bold tabular-nums tracking-tighter italic", exp.isOfficial ? "text-slate-900" : "text-slate-500")}>
                                   {formatCurrency(exp.amountWithVat)}
                                </span>
                             </td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
           
           <div className="p-4 border-t border-slate-100 text-center">
              <Link href="/gelir-gider" className="text-[11px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors flex items-center justify-center gap-2">
                 Tümünü Görüntüle <ChevronRight size={14} />
              </Link>
           </div>
        </div>
      </section>
      
      {/* User Notes Section */}
      <section className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
           <FileText size={20} className="text-blue-600" />
           <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Kişisel Notlar</h3>
              <p className="text-xs text-slate-500 font-medium italic mt-0.5">Operasyonel notlar ve hatırlatıcılar.</p>
           </div>
        </div>
        <NoteList initialNotes={notes} />
      </section>

      {/* Modals & Drawers */}
      <PremiumModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Gider Tanımla" maxWidth="max-w-xl">
        <ExpenseForm locations={locations} onClose={() => { setIsModalOpen(false); window.location.reload(); }} />
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
    blue: 'border-blue-200 bg-blue-50/50',
    emerald: 'border-emerald-200 bg-emerald-50/50',
    rose: 'border-rose-200 bg-rose-50/50',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-4 text-left w-full transition-all',
        toneMap[tone],
        clickable ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
        {clickable && <span className="text-[10px] font-bold text-blue-600 uppercase">Detay</span>}
      </div>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{description}</p>
    </button>
  );
}
