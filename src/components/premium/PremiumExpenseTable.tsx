'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter as FilterIcon, 
  ChevronRight, 
  MoreHorizontal, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Calendar,
  Building2,
  MoreVertical,
  X,
  FileText,
  User,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { deleteExpense, toggleExpenseSettled } from '@/features/ledger/actions';
import { Edit2 } from 'lucide-react';

interface PremiumExpenseTableProps {
  expenses: any[];
  locations: any[];
  documents: any[];
  onView: (exp: any) => void;
  onEdit: (exp: any) => void;
}

export default function PremiumExpenseTable({ expenses, locations, documents, onView, onEdit }: PremiumExpenseTableProps) {
  const [filterType, setFilterType] = useState('ALL');
  const [filterLocation, setFilterLocation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  const filtered = expenses.filter((exp) => {
    if (filterType !== 'ALL' && exp.type !== filterType) return false;
    if (filterLocation !== 'all' && exp.locationId !== filterLocation) return false;
    if (searchQuery && !exp.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bu harcama kaydını veri tabanından kalıcı olarak silmek istediğinize emin misiniz?")) {
      setDeletingId(id);
      await deleteExpense(id);
      window.location.reload();
    }
  };

  const handleToggleSettled = async (id: string, currentDesc: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleExpenseSettled(id, currentDesc);
    window.location.reload();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. FILTERS TOOLBAR (PREMIUM BLUR STYLE) */}
      <div className="p-1.5 bg-slate-100 border border-slate-200 rounded-[28px] flex flex-col md:flex-row md:items-center gap-3 backdrop-blur-sm shadow-sm">
         
         {/* Search Box */}
         <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
               <Search size={18} />
            </div>
            <input 
               type="text" 
               placeholder="Gider açıklaması veya kayıt no ara..." 
               className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-[22px] text-xs font-bold uppercase tracking-widest text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>

         {/* Location Filter */}
         <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-[22px] overflow-hidden">
            <FilterButton 
               active={filterLocation === 'all'} 
               onClick={() => setFilterLocation('all')} 
               label="TÜM ŞUBELER" 
            />
            {locations.map(loc => (
              <FilterButton 
                 key={loc.id} 
                 active={filterLocation === loc.id} 
                 onClick={() => setFilterLocation(loc.id)} 
                 label={loc.name} 
              />
            ))}
         </div>

         {/* Type Filter */}
         <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-[22px]">
            <FilterButton 
               active={filterType === 'ALL'} 
               onClick={() => setFilterType('ALL')} 
               label="TÜM TÜRLER" 
            />
            <FilterButton 
               active={filterType === 'RECURRING'} 
               onClick={() => setFilterType('RECURRING')} 
               label="AYLIK" 
            />
            <FilterButton 
               active={filterType === 'ONE_TIME'} 
               onClick={() => setFilterType('ONE_TIME')} 
               label="TEK SEFER" 
            />
         </div>
      </div>

      {/* 2. DATA TABLE (ELITE STYLE) */}
      <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Harcama & Kategori</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Ödeyen / Mahsup</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Tutar</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Durum</th>
                  <th className="px-8 py-5"></th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {filtered.map((exp, idx) => (
                  <tr 
                     key={exp.id || idx} 
                     className="group hover:bg-slate-50/30 transition-all cursor-pointer relative"
                     onClick={() => onView(exp)}
                  >
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                           <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-slate-100 group-hover:bg-white border border-transparent group-hover:border-slate-200 group-hover:shadow-sm",
                              exp.type === 'RECURRING' ? "text-blue-500" : "text-slate-400"
                           )}>
                              {exp.type === 'RECURRING' ? <Calendar size={20} /> : <Receipt size={20} />}
                           </div>
                           <div className="flex flex-col gap-1">
                              <span className="text-[13px] font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase italic tracking-tighter decoration-slate-200 underline decoration-1 underline-offset-4">{exp.description}</span>
                              <div className="flex items-center gap-2">
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{exp.location?.name || 'GENEL'}</span>
                                 <span className="w-1 h-1 rounded-full bg-slate-200" />
                                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">{exp.categoryId || 'GENEL GİDER'}</span>
                              </div>
                           </div>
                        </div>
                     </td>
                     
                     <td className="px-8 py-6 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                           <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                              <User size={10} className="text-slate-400" />
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{exp.paidBy || 'ORTAK'}</span>
                           </div>
                           {exp.description.includes('[MAHSUP]') && (
                             <div className="flex items-center gap-1 text-emerald-600">
                                <CheckCircle2 size={10} />
                                <span className="text-[8px] font-black uppercase">Tamamlandı</span>
                             </div>
                           )}
                        </div>
                     </td>

                     <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end">
                           <span className="text-sm font-black text-slate-900 tabular-nums italic tracking-tighter">
                              {formatCurrency(exp.amountWithVat)}
                           </span>
                           <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">KDV Dahil</span>
                        </div>
                     </td>

                     <td className="px-8 py-6 text-center">
                        <StatusBadge isOfficial={exp.isOfficial} />
                     </td>

                     <td className="px-8 py-6 text-right">
                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                               onClick={(e) => { e.stopPropagation(); onEdit(exp); }}
                               className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all hover:scale-105 active:scale-95 shadow-sm"
                            >
                               <Edit2 size={16} strokeWidth={2.5} />
                            </button>
                            <button 
                               onClick={(e) => handleToggleSettled(exp.id, exp.description, e)}
                               title={exp.description.includes('[MAHSUP]') ? "Mahsup Kaldır" : "Mahsup Olarak İşaretle"}
                               className={cn(
                                  "p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 shadow-sm",
                                  exp.description.includes('[MAHSUP]') ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                               )}
                            >
                               <CheckCircle2 size={16} strokeWidth={2.5} />
                            </button>
                            <button 
                               onClick={(e) => handleDelete(exp.id, e)}
                               className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 border border-slate-100 hover:border-rose-100 transition-all hover:scale-105 active:scale-95 shadow-sm"
                            >
                               <Trash2 size={16} strokeWidth={2.5} />
                            </button>
                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200 ml-2">
                               <ChevronRight size={14} strokeWidth={3} />
                            </div>
                         </div>
                     </td>
                  </tr>
               ))}
               {filtered.length === 0 && (
                  <tr>
                     <td colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                           <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200">
                              <FileText size={32} />
                           </div>
                           <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] italic">Aranan kriterlere uygun harcama kaydı bulunamadı.</p>
                        </div>
                     </td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>
      
      {/* 3. PAGINATION PLACEHOLDER/TOTALS */}
      <div className="flex items-center justify-between px-8 text-slate-400">
         <p className="text-[10px] font-black uppercase tracking-[0.3em]">TOPLAM {filtered.length} KAYIT</p>
         <div className="flex items-center gap-1.5 font-black italic tracking-tighter text-slate-900">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest not-italic font-bold">Filtrelenmiş Toplam:</span>
            <span className="text-lg">{formatCurrency(filtered.reduce((s, e) => s + (e.amountWithVat || 0), 0))}</span>
         </div>
      </div>
    </div>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
       onClick={onClick}
       className={cn(
          "px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.1em] transition-all",
          active 
             ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
             : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
       )}
    >
       {label}
    </button>
  );
}

function StatusBadge({ isOfficial }: { isOfficial: boolean }) {
  if (isOfficial) {
     return (
       <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-[9px] font-black uppercase tracking-widest italic shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Fatura/E-Arşiv
       </div>
     );
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest italic opacity-60">
       Nakit/Belgesiz
    </div>
  );
}
