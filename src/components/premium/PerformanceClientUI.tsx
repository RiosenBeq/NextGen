'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
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

interface PerformanceClientProps {
  locations: any[];
  history: any[];
  historyLocId: string;
}

export default function PerformanceClientUI({ locations, history, historyLocId }: PerformanceClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatMonth = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleDelete = async (row: any) => {
    if (!confirm('Bu günlük kaydı silmek istediğinize emin misiniz?')) return;
    setIsLoading(true);
    try {
      const resp = await deleteDailyPerformance(row.id, row.locationId, row.date);
      if (!resp.success) {
        toast.error(resp.error || 'Silme başarısız.');
      } else {
        toast.success('Kayıt başarıyla silindi.');
        router.refresh();
      }
    } catch (err) {
      toast.error('Silme sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (row: any) => {
    setSelectedRow(row);
    setIsEditModalOpen(true);
  };


  const totalSessions = history.reduce((acc, row) => acc + Number(row.sessionCount || 0), 0);
  const totalTests = history.reduce((acc, row) => acc + Number(row.testCount || 0), 0);
  const avgSessionPerDay = history.length > 0 ? Math.round(totalSessions / history.length) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <BarChart3 size={20} />
           </div>
           <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Performans Yönetimi</h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">Günlük Seans & Operasyonel Veri</p>
           </div>
        </div>
        <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-widest">
           <Activity size={12} className="inline mr-1.5" />
           Manuel Mod
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
         <section className="xl:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
               <DailyPerformanceForm locations={locations} onSuccess={() => router.refresh()} />
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
               <div className="flex items-center gap-2">
                  <HistoryIcon size={14} className="text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sistem Bilgisi</h3>
               </div>
               <p className="text-xs text-slate-400 leading-relaxed">
                  Girdiğiniz günlük veriler, ilgili döneme ait <span className="text-white font-semibold">Nakit Akışı (P&L)</span> raporlarına otomatik olarak aktarılır.
               </p>
            </div>
         </section>

         {/* History Section */}
         <section className="xl:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <HistoryIcon size={14} className="text-slate-400" /> Giriş Geçmişi
               </h3>
               <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  <FilterLink href="/performans?location=all" active={historyLocId === '' || historyLocId === 'all'} label="Tümü" />
                  {locations.map(loc => (
                    <FilterLink key={loc.id} href={`/performans?location=${loc.id}`} active={historyLocId === loc.id} label={loc.name} />
                  ))}
               </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="px-6 py-4">Tarih / Şube</th>
                        <th className="px-4 py-4 text-center">Oturum</th>
                        <th className="px-4 py-4 text-center">Test</th>
                        <th className="px-6 py-4"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {history.length === 0 ? (
                        <tr><td colSpan={4} className="py-16 text-center">
                           <BarChart3 size={28} className="mx-auto text-slate-200 mb-2" />
                           <p className="text-sm font-medium text-slate-400">Kayıt bulunamadı.</p>
                        </td></tr>
                     ) : (
                        history.map((row, idx) => (
                           <tr key={row.id || idx} className="group hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => { setSelectedRow(row); setIsDrawerOpen(true); }}>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-slate-800">{formatMonth(row.date)}</span>
                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{row.location?.name || 'Genel'}</span>
                                 </div>
                              </td>
                              <td className="px-4 py-4 text-center"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-mono font-bold">{row.sessionCount}</span></td>
                              <td className="px-4 py-4 text-center"><span className="px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-xs font-mono font-bold">{row.testCount}</span></td>
                              <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                 <div className="flex items-center justify-end gap-2">
                                    <button disabled={isLoading} onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-white transition-all disabled:opacity-50"><Edit2 size={14} /></button>
                                    <button disabled={isLoading} onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-white transition-all disabled:opacity-50"><Trash2 size={14} /></button>
                                 </div>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
               {history.length === 0 ? (
                  <div className="py-16 text-center">
                     <BarChart3 size={28} className="mx-auto text-slate-200 mb-2" />
                     <p className="text-sm font-medium text-slate-400">Kayıt bulunamadı.</p>
                  </div>
               ) : (
                  history.map((row, idx) => (
                     <div key={row.id || idx} className="px-5 py-4 flex items-center justify-between gap-3" onClick={() => { setSelectedRow(row); setIsDrawerOpen(true); }}>
                        <div className="flex-1 min-w-0">
                           <p className="text-sm font-semibold text-slate-800">{formatMonth(row.date)}</p>
                           <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{row.location?.name || 'Genel'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-mono font-bold">{row.sessionCount}</span>
                           <span className="px-2 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-xs font-mono font-bold">{row.testCount}</span>
                        </div>
                     </div>
                  ))
               )}
            </div>
         </section>
      </div>

      <PremiumDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Veri Detayı">
        {selectedRow && (
           <div className="space-y-6 py-4">
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{formatMonth(selectedRow.date)}</p>
                    <p className="text-xl font-bold tracking-tight">{selectedRow.location?.name}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                    <div className="space-y-1"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Oturum</p><p className="text-xl font-bold">{selectedRow.sessionCount}</p></div>
                    <div className="space-y-1"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Test</p><p className="text-xl font-bold">{selectedRow.testCount}</p></div>
                 </div>
              </div>
              <div className="space-y-3">
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Notlar</h4>
                 <p className="text-sm text-slate-600 leading-relaxed">{selectedRow.extraMetrics?.notlar || "Not eklenmemiş."}</p>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-sm font-semibold transition-all hover:bg-slate-800">Kapat</button>
           </div>
        )}
      </PremiumDrawer>

      <PremiumModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Veriyi Düzenle" maxWidth="max-w-xl">
        <DailyPerformanceForm locations={locations} initialData={selectedRow} onSuccess={() => { setIsEditModalOpen(false); router.refresh(); }} onCancel={() => setIsEditModalOpen(false)} />
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
