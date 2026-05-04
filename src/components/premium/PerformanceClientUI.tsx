'use client';
import { useRouter } from 'next/navigation';

import React, { useState } from 'react';
import { 
  BarChart3,
  Activity,
  History as HistoryIcon,
  Edit2,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DailyPerformanceForm from '@/features/ledger/components/DailyPerformanceForm';
import { PremiumDrawer, PremiumModal } from './PremiumModal';
import { deleteDailyPerformance } from '@/features/ledger/performans-actions';
import { toast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/errors';

type PerformanceLocation = { id: string; name: string };

type PerformanceHistoryRow = {
  id: string;
  locationId: string;
  date: string;
  sessionCount: number;
  testCount: number;
  extraMetrics?: { notlar?: string } | null;
  location?: { name?: string } | null;
};

interface PerformanceClientProps {
  locations: PerformanceLocation[];
  history: PerformanceHistoryRow[];
  historyLocId: string;
}

export default function PerformanceClientUI({ locations, history, historyLocId }: PerformanceClientProps) {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PerformanceHistoryRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatMonth = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleDelete = async (row: PerformanceHistoryRow) => {
    if (!confirm('Bu günlük kaydı silmek istediğinize emin misiniz?')) return;
    setIsLoading(true);
    try {
      const resp = await deleteDailyPerformance(row.id, row.locationId, row.date);
      if (!resp.success) toast.error(resp.error ?? '');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Silme sırasında bir hata oluştu'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (row: PerformanceHistoryRow) => {
    setSelectedRow(row);
    setIsEditModalOpen(true);
  };


  const totalSessions = history.reduce((acc, row) => acc + Number(row.sessionCount || 0), 0);
  const totalTests = history.reduce((acc, row) => acc + Number(row.testCount || 0), 0);
  const avgSessionPerDay = history.length > 0 ? Math.round(totalSessions / history.length) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-1">
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              Performans Yönetimi
           </h1>
           <p className="text-sm text-slate-500 font-medium">Günlük seans girişlerini ve operasyonel verileri yönetin.</p>
        </div>
        <div className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-bold uppercase tracking-widest italic">
           <Activity size={14} className="inline mr-2" />
           Manuel Mod Aktif
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Toplam Oturum" value={totalSessions.toLocaleString('tr-TR')} subtitle="Filtrelenen kayıtlar" />
        <StatCard label="Toplam Test" value={totalTests.toLocaleString('tr-TR')} subtitle="Operasyon takibi" />
        <StatCard label="Günlük Ortalama" value={avgSessionPerDay.toLocaleString('tr-TR')} subtitle="Oturum / gün" />
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
         
         {/* Form Section */}
         <section className="xl:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-1 shadow-sm">
               <DailyPerformanceForm locations={locations} onSuccess={() => router.refresh()} />
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-4 shadow-xl">
               <div className="flex items-center gap-2">
                  <HistoryIcon size={18} className="text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sistem Bilgisi</h3>
               </div>
               <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Girdiğiniz günlük veriler, ilgili döneme ait <span className="text-white font-bold italic">Nakit Akışı (P&L)</span> raporlarına otomatik olarak aktarılır.
               </p>
            </div>
         </section>

         {/* History Section */}
         <section className="xl:col-span-7 space-y-4">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <HistoryIcon size={16} /> Giriş Geçmişi
               </h3>
               <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <FilterLink href="/performans?location=all" active={historyLocId === '' || historyLocId === 'all'} label="Tümü" />
                  {locations.map(loc => (
                    <FilterLink key={loc.id} href={`/performans?location=${loc.id}`} active={historyLocId === loc.id} label={loc.name} />
                  ))}
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tarih / Şube</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Oturum</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Test</th>
                        <th className="px-6 py-4"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {history.length === 0 ? (
                        <tr><td colSpan={4} className="py-20 text-center text-xs font-medium text-slate-400 italic">Kayıt bulunamadı.</td></tr>
                     ) : (
                        history.map((row, idx) => (
                           <tr key={row.id || idx} className="group hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => { setSelectedRow(row); setIsDrawerOpen(true); }}>
                              <td className="px-6 py-5">
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{formatMonth(row.date)}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.location?.name || 'GENEL'}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-5 text-center"><span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-mono font-bold">{row.sessionCount}</span></td>
                              <td className="px-6 py-5 text-center"><span className="px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-xs font-mono font-bold">{row.testCount}</span></td>
                              <td className="px-6 py-5 text-right opacity-0 group-hover:opacity-100 transition-all">
                                 <div className="flex items-center justify-end gap-2">
                                    <button disabled={isLoading} onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"><Edit2 size={14} /></button>
                                    <button disabled={isLoading} onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 size={14} /></button>
                                 </div>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </section>
      </div>

      <PremiumDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Veri Detayı">
        {selectedRow && (
           <div className="space-y-10 py-6">
              <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-6 shadow-xl">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{formatMonth(selectedRow.date)}</p>
                    <p className="text-3xl font-bold italic tracking-tighter uppercase">{selectedRow.location?.name}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-8 pt-4 border-t border-white/10">
                    <div className="space-y-1"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Oturum</p><p className="text-2xl font-bold italic">{selectedRow.sessionCount}</p></div>
                    <div className="space-y-1"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Test</p><p className="text-2xl font-bold italic">{selectedRow.testCount}</p></div>
                 </div>
              </div>
              <div className="space-y-4 px-1">
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Notlar</h4>
                 <p className="text-sm font-medium text-slate-600 italic leading-relaxed">{selectedRow.extraMetrics?.notlar || "Not eklenmemiş."}</p>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl transition-all hover:bg-slate-800">Kapat</button>
           </div>
        )}
      </PremiumDrawer>

      <PremiumModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Veriyi Düzenle" maxWidth="max-w-xl">
        <DailyPerformanceForm locations={locations} initialData={selectedRow ?? undefined} onSuccess={() => setIsEditModalOpen(false)} onCancel={() => setIsEditModalOpen(false)} />
      </PremiumModal>

    </div>
  );
}

function FilterLink({ href, active, label }: { href: string, active: boolean, label: string }) {
  return (
    <a href={href} className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", active ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600")}>{label}</a>
  );
}

function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-500">{subtitle}</p>
    </div>
  );
}
