'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  Calendar,
  Wallet,
  Activity,
  ChevronRight,
  Eye,
  Trash2,
  Edit2,
  FileText,
  TrendingUp,
  ArrowUpRight,
  CalendarDays,
  X,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PremiumModal, PremiumDrawer } from './PremiumModal';
import MonthlyPerformanceForm from './MonthlyPerformanceForm';
import { deleteMonthlyPerformance } from '@/features/ledger/performans-actions';

interface CashFlowClientUIProps {
  locations: any[];
  initialData: any[];
  filterLocation: string;
}

export default function CashFlowClientUI({ 
  locations, 
  initialData, 
  filterLocation 
}: CashFlowClientUIProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [kpiModal, setKpiModal] = useState<'revenue' | 'profit' | 'sessions' | null>(null);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu finansal kaydı silmek istediğinize emin misiniz?')) return;
    
    setIsLoading(true);
    try {
      const res = await deleteMonthlyPerformance(id);
      if (!res.success) toast.error(res.error);
    } catch (err) {
      toast.error('Silme sırasında hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const currentTotals = {
    revenue: initialData.reduce((s: number, r: any) => s + (r.grossRevenue || 0), 0),
    profit: initialData.reduce((s: number, r: any) => s + (r.netCash || 0), 0),
    sessions: initialData.reduce((s: number, r: any) => s + (r.sessionCount || 0), 0),
  };

  const totalExpenses = initialData.reduce((s: number, r: any) => s + (r.totalExpense || 0), 0);

  const kpis: { key: 'revenue' | 'profit' | 'sessions'; label: string; value: string; icon: any; cardClass: string; iconColor: string; iconBg: string; tag: string }[] = [
    { key: 'revenue', label: "Toplam Ciro", value: formatCurrency(currentTotals.revenue), icon: TrendingUp, cardClass: "bg-emerald-50 border-emerald-100", iconColor: "text-emerald-600", iconBg: "bg-emerald-100 border-emerald-200", tag: "Hacim" },
    { key: 'profit', label: "Net Nakit Akışı", value: formatCurrency(currentTotals.profit), icon: ArrowUpRight, cardClass: "bg-blue-50 border-blue-100", iconColor: "text-blue-600", iconBg: "bg-blue-100 border-blue-200", tag: "Net Kazanç" },
    { key: 'sessions', label: "Toplam Seans", value: currentTotals.sessions.toLocaleString('tr-TR'), icon: CalendarDays, cardClass: "bg-amber-50 border-amber-100", iconColor: "text-amber-600", iconBg: "bg-amber-100 border-amber-200", tag: "Kullanım" },
  ];

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* 1. TOP KPIS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => (
          <motion.button
            key={kpi.label}
            type="button"
            onClick={() => setKpiModal(kpi.key)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn("p-5 rounded-2xl border shadow-sm group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-left cursor-pointer", kpi.cardClass)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn("w-11 h-11 rounded-2xl border flex items-center justify-center", kpi.iconBg)}>
                 <kpi.icon size={20} className={kpi.iconColor} />
              </div>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <Info size={10} /> Detay
              </span>
            </div>
            <div className="space-y-0.5">
               <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{kpi.label}</p>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</h2>
            </div>
          </motion.button>
        ))}
      </section>

      {/* 2. MAIN TABLE SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
           <div className="flex items-center gap-3">
              <div className="w-1 h-7 bg-slate-900 rounded-full" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Finansal Denetim Listesi</h2>
           </div>
           <button
              onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
              className="min-h-[44px] px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-wide hover:bg-blue-600 transition-colors shadow-sm active:scale-95 flex items-center gap-2 shrink-0"
           >
              <Plus size={15} strokeWidth={2.5} />
              Yeni Kayıt
           </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
           <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Dönem & Şube</th>
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wide text-center">Oturum</th>
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wide text-right">Brüt Ciro</th>
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wide text-right">Gider (Dahil)</th>
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wide text-right">Net Nakit</th>
                       <th className="px-4 py-4"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {initialData.map((row: any, idx: number) => (
                       <motion.tr
                          key={row.id || idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className="group hover:bg-slate-50/50 transition-colors"
                       >
                          <td className="px-6 py-4">
                             <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">{row.month}</span>
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{row.locationName}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-sm font-bold text-slate-700 border border-slate-200/60">{row.sessionCount}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(row.grossRevenue)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className="text-sm font-semibold text-rose-500 tabular-nums">{formatCurrency(row.totalExpense)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className={cn("text-base font-black tabular-nums", row.netCash >= 0 ? "text-emerald-700" : "text-red-600")}>
                                {formatCurrency(row.netCash)}
                             </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                             <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEdit(row)}
                                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                >
                                   <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => handleDelete(row.id)}
                                  disabled={isLoading}
                                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50"
                                >
                                   <Trash2 size={15} />
                                </button>
                             </div>
                          </td>
                       </motion.tr>
                    ))}
                    {initialData.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                           <div className="flex flex-col items-center gap-3">
                              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                                 <FileText size={28} strokeWidth={1.5} />
                              </div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Henüz bir kayıt bulunmuyor.</p>
                           </div>
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>

           <div className="space-y-3 p-4 md:hidden">
              {initialData.map((row: any, idx: number) => (
                <div key={row.id || idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{row.month}</p>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">{row.locationName}</p>
                    </div>
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 shrink-0">{row.sessionCount} seans</span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm border-t border-slate-100 pt-3">
                    <p className="text-slate-500">Brüt Ciro</p>
                    <p className="text-right font-semibold text-slate-900 tabular-nums">{formatCurrency(row.grossRevenue)}</p>
                    <p className="text-slate-500">Toplam Gider</p>
                    <p className="text-right font-semibold text-rose-600 tabular-nums">{formatCurrency(row.totalExpense)}</p>
                    <p className="text-slate-500">Net Nakit</p>
                    <p className={cn("text-right font-bold tabular-nums", row.netCash >= 0 ? "text-emerald-700" : "text-rose-600")}>{formatCurrency(row.netCash)}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => handleEdit(row)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      disabled={isLoading}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}

              {initialData.length === 0 && (
                <div className="py-10 text-center text-sm text-slate-400">Henüz bir kayıt bulunmuyor.</div>
              )}
           </div>
        </div>
      </section>

      {/* KPI Detail Modal */}
      {kpiModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={() => setKpiModal(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full md:max-w-xl max-h-[85vh] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-bold text-slate-900 uppercase text-sm tracking-wider">
                {kpiModal === 'revenue' && 'Toplam Ciro Hesaplama'}
                {kpiModal === 'profit' && 'Net Nakit Akışı Hesaplama'}
                {kpiModal === 'sessions' && 'Toplam Seans Detayı'}
              </h3>
              <button onClick={() => setKpiModal(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {kpiModal === 'revenue' && (
                <>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lokasyon Bazlı Ciro Kırılımı</p>
                  {initialData.map((row: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-slate-700">{row.locationName}</span>
                        <span className="text-[10px] text-slate-400 ml-2">{row.month}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(row.grossRevenue)}</span>
                        <span className="text-[10px] text-slate-400 ml-2">{row.sessionCount} seans × ₺{Math.round(row.grossRevenue / (row.sessionCount || 1))}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-900">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Toplam Ciro</span>
                    <span className="text-lg font-bold text-white tabular-nums">{formatCurrency(currentTotals.revenue)}</span>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      Toplam ciro = Her lokasyonun seans sayısı x seans ücreti (KDV dahil) toplamı. Gelirden KDV düşülmez.
                    </p>
                  </div>
                </>
              )}
              {kpiModal === 'profit' && (
                <>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hesaplama Formülü</p>
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brüt Satış Geliri</span>
                    <span className="font-bold text-emerald-600 tabular-nums">{formatCurrency(currentTotals.revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 border border-slate-100 ml-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">— Toplam Giderler</span>
                    <span className="font-bold text-rose-600 tabular-nums">-{formatCurrency(totalExpenses)}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-900">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">= Net Nakit Akışı</span>
                    <span className="text-lg font-bold text-white tabular-nums">{formatCurrency(currentTotals.profit)}</span>
                  </div>

                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">Lokasyon Bazlı Kırılım</p>
                  {initialData.map((row: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-slate-700">{row.locationName}</span>
                        <span className="text-[10px] text-slate-400 ml-2">{row.month}</span>
                      </div>
                      <span className={cn("text-sm font-bold tabular-nums", row.netCash >= 0 ? "text-emerald-600" : "text-rose-600")}>{formatCurrency(row.netCash)}</span>
                    </div>
                  ))}
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      Net nakit akışı = Brüt ciro — Komisyonlar (%4) — AVM giderleri (kira+KDV+aidat+ciro payı) — Operasyonel giderler.
                      Hissedar başına pay: <b>{formatCurrency(currentTotals.profit / 4)}</b> (4 × %25)
                    </p>
                  </div>
                </>
              )}
              {kpiModal === 'sessions' && (
                <>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lokasyon Bazlı Seans Dağılımı</p>
                  {initialData.map((row: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-slate-700">{row.locationName}</span>
                        <span className="text-[10px] text-slate-400 ml-2">{row.month}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-900 tabular-nums">{row.sessionCount} seans</span>
                        <span className="text-[10px] text-slate-400">
                          {currentTotals.sessions > 0 ? `%${((row.sessionCount / currentTotals.sessions) * 100).toFixed(0)}` : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-900">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Toplam Seans</span>
                    <span className="text-lg font-bold text-white tabular-nums">{currentTotals.sessions.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Seans verileri aylık performans girişlerinden alınır. Günlük ortalama: <b>{initialData.length > 0 ? Math.round(currentTotals.sessions / initialData.length) : 0}</b> seans/kayıt
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. CRUD MODAL */}
      <PremiumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? 'Kayıt Düzenle' : 'Yeni Finansal Kayıt'}
        maxWidth="max-w-xl"
      >
        <MonthlyPerformanceForm
          locations={locations}
          initialData={editingRecord}
          onSuccess={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
        />
      </PremiumModal>

    </div>
  );
}
