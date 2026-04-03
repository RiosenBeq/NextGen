'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownRight, Search, FileText, User, MoreVertical, Edit2, Trash2, Calendar, Tag, Percent } from 'lucide-react';
import DocumentViewer from '@/features/documents/components/DocumentViewer';
import { ExpenseForm } from './ExpenseForm';
import { deleteExpense } from '../actions';
import { cn } from '@/lib/utils';

interface Expense {
  id: string;
  description: string;
  type: string;
  month?: string;
  isOfficial: boolean;
  vatRate: number;
  amountWithoutVat: number;
  amountWithVat: number;
  attachmentUrl?: string | null;
  location?: { id: string, name: string } | null;
  paidBy?: string;
  documents?: any[];
}

interface Props {
  initialExpenses: Expense[];
  documents: any[];
  locations: any[];
}

export default function ExpenseList({ initialExpenses, documents, locations }: Props) {
  const [filterType, setFilterType] = useState('ALL');
  const [filterPaidBy, setFilterPaidBy] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  const expenseMap = initialExpenses.map((exp) => {
    return {
      ...exp,
      documents: documents.filter(d => d.relatedId === exp.id),
      paidBy: exp.paidBy || 'Ortak Hesap',
    };
  });

  const filtered = expenseMap.filter((exp) => {
    if (filterType !== 'ALL' && exp.type !== filterType) return false;
    if (filterPaidBy !== 'ALL' && exp.paidBy !== filterPaidBy) return false;
    if (searchQuery && !exp.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (confirm("Bu gideri silmek istediğinize emin misiniz?")) {
      setDeletingExpenseId(id);
      await deleteExpense(id);
      setDeletingExpenseId(null);
    }
  };

  const filteredTotal = filtered.reduce((acc, curr) => acc + (curr.amountWithVat || 0), 0);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card overflow-hidden bg-white/[0.01] border-white/[0.05]"
    >
      <div className="p-6 md:p-8 border-b border-white/[0.05] flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/10 flex items-center justify-center text-rose-400">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">İşlem Listesi</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tüm operasyonel gider kayıtları</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Gider açıklaması..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="elite-input pl-11 py-2.5 w-64 text-xs bg-white/[0.02]"
            />
          </div>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs font-bold text-zinc-400 outline-none hover:bg-white/[0.06] transition-colors"
          >
            <option value="ALL">Kategoriler</option>
            <option value="FATURA">Fatura</option>
            <option value="MAAS">Maaş</option>
            <option value="KİRA">Kira</option>
            <option value="PAZARLAMA">Reklam</option>
            <option value="BAKIM">Bakım</option>
            <option value="DİĞER">Diğer</option>
          </select>
          <select 
            value={filterPaidBy} 
            onChange={(e) => setFilterPaidBy(e.target.value)}
            className="px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs font-bold text-zinc-400 outline-none hover:bg-white/[0.06] transition-colors"
          >
            <option value="ALL">Kişiler</option>
            <option value="Ortak Hesap">Ortak Hesap</option>
            <option value="Okan">Okan</option>
            <option value="Talha">Talha</option>
            <option value="Furkan">Furkan</option>
            <option value="Alp">Alp</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.01]">
              <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.05]">Tarih / Açıklama</th>
              <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.05]">Şube</th>
              <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.05]">Ödeyen</th>
              <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.05] text-center">Resmi Durum</th>
              <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.05] text-center">Belge</th>
              <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.05] text-right">KDV</th>
              <th className="px-8 py-5 text-[10px] font-bold text-rose-400 uppercase tracking-widest border-b border-white/[0.05] text-right">Tutar (Brüt)</th>
              <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/[0.05] text-center">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-8 py-20 text-center text-zinc-600 text-xs font-medium tracking-wide">
                  Herhangi bir kayıt bulunamadı.
                </td>
              </tr>
            ) : null}
            {filtered.map((exp) => (
              <tr key={exp.id} className="group hover:bg-white/[0.01] transition-colors">
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-white tracking-tight">{exp.description}</span>
                    <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1.5">
                       <Calendar size={10} /> {new Date(exp.month || 0).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{exp.type}</span>
                    <span className="text-xs font-medium text-zinc-300">
                      {exp.location?.name || 'Genel Merkez'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                       {exp.paidBy?.[0]}
                    </div>
                    <span className="text-xs font-medium text-zinc-300">{exp.paidBy}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded border tracking-widest uppercase",
                      exp.isOfficial ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : "text-zinc-500 border-white/5 bg-white/5"
                    )}>
                      {exp.isOfficial ? 'RESMİ' : 'GAYRİ RESMİ'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                   {exp.attachmentUrl ? (
                     <a 
                       href={exp.attachmentUrl} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all group"
                     >
                        <FileText size={14} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">FATURA</span>
                     </a>
                   ) : (
                     <span className="text-[10px] font-bold text-zinc-700 tracking-widest uppercase">YOK</span>
                   )}
                </td>
                <td className="px-8 py-6 text-right">
                   <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold text-zinc-500">%{exp.vatRate || 0} KDV</span>
                      <span className="text-[11px] font-medium text-zinc-500 italic">Net: ₺{exp.amountWithoutVat?.toLocaleString('tr-TR')}</span>
                   </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <span className="text-base font-bold text-rose-500 tracking-tight">
                    ₺{exp.amountWithVat?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => setEditingExpense(exp)}
                      className="p-2 rounded-xl bg-white/[0.03] text-zinc-500 hover:text-indigo-400 hover:bg-indigo-400/10 transition-all border border-white/[0.05]"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(exp.id)}
                      disabled={deletingExpenseId === exp.id}
                      className="p-2 rounded-xl bg-white/[0.03] text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 transition-all border border-white/[0.05]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dynamic Summary Footer */}
      <div className="p-8 bg-white/[0.01] border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="text-zinc-500 text-xs font-medium"> Toplam {filtered.length} gider kaydı görüntüleniyor.</div>
         <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">FİLTRELENEN BRÜT TOPLAM</span>
               <span className="text-3xl font-bold text-white tracking-tighter italic">₺{filteredTotal.toLocaleString('tr-TR')}</span>
            </div>
         </div>
      </div>

      <AnimatePresence>
        {editingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl"
            >
              <ExpenseForm 
                locations={locations} 
                initialData={{
                  ...editingExpense,
                  amount: editingExpense.amountWithoutVat 
                }} 
                onClose={() => setEditingExpense(null)} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

