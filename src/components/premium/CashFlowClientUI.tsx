'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  FileText,
  TrendingUp,
  ArrowUpRight,
  CalendarDays
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PremiumModal } from './PremiumModal';
import MonthlyPerformanceForm from './MonthlyPerformanceForm';
import { deleteMonthlyPerformance } from '@/features/ledger/performans-actions';
import { toast } from '@/hooks/useToast';

type LocationOption = { id: string; name: string };

type CashFlowRow = {
  id: string;
  month?: string;
  locationName?: string;
  locationId?: string;
  sessionCount: number;
  grossRevenue: number;
  totalExpense: number;
  netCash: number;
};

interface CashFlowClientUIProps {
  locations: LocationOption[];
  initialData: CashFlowRow[];
  filterLocation: string;
}

export default function CashFlowClientUI({
  locations,
  initialData,
}: CashFlowClientUIProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CashFlowRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu finansal kaydı silmek istediğinize emin misiniz?')) return;

    setIsLoading(true);
    try {
      const res = await deleteMonthlyPerformance(id);
      if (!res.success) toast.error(res.error ?? '');
    } catch {
      toast.error('Silme sırasında hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (record: CashFlowRow) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const currentTotals = {
    revenue: initialData.reduce((s, r) => s + (r.grossRevenue || 0), 0),
    profit: initialData.reduce((s, r) => s + (r.netCash || 0), 0),
    sessions: initialData.reduce((s, r) => s + (r.sessionCount || 0), 0),
  };

  const kpis = [
    { label: "Toplam Ciro", value: formatCurrency(currentTotals.revenue), icon: TrendingUp, cardClass: "bg-emerald-50 border-emerald-100", iconColor: "text-emerald-600", iconBg: "bg-emerald-100 border-emerald-200", tag: "Hacim" },
    { label: "Net Nakit Akışı", value: formatCurrency(currentTotals.profit), icon: ArrowUpRight, cardClass: "bg-blue-50 border-blue-100", iconColor: "text-blue-600", iconBg: "bg-blue-100 border-blue-200", tag: "Net Kazanç" },
    { label: "Toplam Seans", value: currentTotals.sessions.toLocaleString('tr-TR'), icon: CalendarDays, cardClass: "bg-amber-50 border-amber-100", iconColor: "text-amber-600", iconBg: "bg-amber-100 border-amber-200", tag: "Kullanım" },
  ];

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* 1. TOP KPIS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div 
            key={kpi.label} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: idx * 0.1 }}
            className={cn("p-6 rounded-[32px] border shadow-sm group hover:shadow-xl transition-all duration-500", kpi.cardClass)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner", kpi.iconBg)}>
                 <kpi.icon size={24} className={kpi.iconColor} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/50 px-3 py-1 rounded-xl border border-white shadow-sm">{kpi.tag}</span>
            </div>
            <div className="space-y-1">
               <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">{kpi.label}</p>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">{kpi.value}</h2>
            </div>
          </motion.div>
        ))}
      </section>

      {/* 2. MAIN TABLE SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-slate-900 rounded-full" />
              <h2 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase">Finansal Denetim Listesi</h2>
           </div>
           <button 
              onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
              className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all hover:scale-[1.02] shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-2"
           >
              <Plus size={16} strokeWidth={3} />
              Yeni Kayıt
           </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-2xl">
           <div className="hidden md:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dönem & Şube</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Oturum</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Brüt Ciro</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gider (Dahil)</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Nakit</th>
                       <th className="px-8 py-5"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {initialData.map((row, idx) => (
                       <motion.tr
                          key={row.id || idx}
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          transition={{ delay: idx * 0.03 }}
                          className="group hover:bg-slate-50/50 transition-all"
                       >
                          <td className="px-8 py-6">
                             <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-900 italic tracking-tight uppercase underline decoration-slate-200 underline-offset-4 decoration-1">{row.month}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{row.locationName}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                             <span className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-black text-slate-700 italic tracking-tight border border-slate-200/50">{row.sessionCount}</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <span className="text-sm font-black text-slate-900 italic tracking-tighter">{formatCurrency(row.grossRevenue)}</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <span className="text-sm font-bold text-rose-500 italic tracking-tighter">{formatCurrency(row.totalExpense)}</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <span className={cn("text-lg font-black italic tracking-tighter", row.netCash >= 0 ? "text-emerald-700" : "text-red-600")}>
                                {formatCurrency(row.netCash)}
                             </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleEdit(row)}
                                  className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
                                >
                                   <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(row.id)}
                                  disabled={isLoading}
                                  className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm active:scale-95"
                                >
                                   <Trash2 size={16} />
                                </button>
                             </div>
                          </td>
                       </motion.tr>
                    ))}
                    {initialData.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-24 text-center">
                           <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                                 <FileText size={32} strokeWidth={1.5} />
                              </div>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Henüz bir kayıt bulunmuyor.</p>
                           </div>
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>

           <div className="space-y-3 p-4 md:hidden">
              {initialData.map((row, idx) => (
                <div key={row.id || idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{row.month}</p>
                      <p className="text-sm font-semibold text-slate-900">{row.locationName}</p>
                    </div>
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700">{row.sessionCount} seans</span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <p className="text-slate-500">Brüt Ciro</p>
                    <p className="text-right font-semibold text-slate-900">{formatCurrency(row.grossRevenue)}</p>
                    <p className="text-slate-500">Toplam Gider</p>
                    <p className="text-right font-semibold text-rose-600">{formatCurrency(row.totalExpense)}</p>
                    <p className="text-slate-500">Net Nakit</p>
                    <p className={cn("text-right font-bold", row.netCash >= 0 ? "text-emerald-700" : "text-rose-600")}>{formatCurrency(row.netCash)}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button onClick={() => handleEdit(row)} className="rounded-lg border border-slate-200 p-2 text-slate-500">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(row.id)} disabled={isLoading} className="rounded-lg border border-slate-200 p-2 text-slate-500 disabled:opacity-50">
                      <Trash2 size={14} />
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
