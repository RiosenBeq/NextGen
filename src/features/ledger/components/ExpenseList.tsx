'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, Search, FileText, User, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import DocumentViewer from '@/features/documents/components/DocumentViewer';
import { ExpenseForm } from './ExpenseForm';
import { deleteExpense } from '../actions';

interface Expense {
  id: string;
  description: string;
  type: string;
  month?: string;
  isOfficial: boolean;
  amountWithVat: number;
  location?: { id: string, name: string } | null;
  paidBy?: string;
  documents?: any[]; // if fetched
}

interface Props {
  initialExpenses: Expense[];
  documents: any[]; // all documents related to expenses
  locations: any[];
}

export default function ExpenseList({ initialExpenses, documents, locations }: Props) {
  const [filterType, setFilterType] = useState('ALL');
  const [filterPaidBy, setFilterPaidBy] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // Map documents to expenses
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
    if (confirm("Bu gideri silmek istediğinize emin misiniz? Fatura kalıcı olarak silinecektir.")) {
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
      className="premium-card overflow-hidden bg-slate-900/40 border-white/5"
    >
      <div className="p-8 border-b border-white/5 bg-white/[0.02] flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-lg shadow-rose-500/5">
            <ArrowDownRight className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">Operasyonel Giderler</h3>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Resmi Kayıtlar ve Fatura Takibi</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group/search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within/search:text-emerald-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Gider Ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="elite-input pl-11 py-2.5 w-56 text-xs"
            />
          </div>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-zinc-400 uppercase tracking-widest outline-none hover:bg-white/10 transition-colors"
          >
            <option value="ALL" className="bg-slate-950">Tüm Tipler</option>
            <option value="FATURA" className="bg-slate-950">Fatura / Tüketim</option>
            <option value="MAAS" className="bg-slate-950">Maaş / Personel</option>
            <option value="KİRA" className="bg-slate-950">Kira / Aidat</option>
            <option value="PAZARLAMA" className="bg-slate-950">Reklam / Pazarlama</option>
            <option value="BAKIM" className="bg-slate-950">Bakım / Onarım</option>
            <option value="DİĞER" className="bg-slate-950">Diğer</option>
          </select>
          <select 
            value={filterPaidBy} 
            onChange={(e) => setFilterPaidBy(e.target.value)}
            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-zinc-400 uppercase tracking-widest outline-none hover:bg-white/10 transition-colors"
          >
            <option value="ALL" className="bg-slate-950">Tüm Kişiler</option>
            <option value="Ortak Hesap" className="bg-slate-950">Ortak Hesap</option>
            <option value="Okan" className="bg-slate-950">Okan</option>
            <option value="Berk" className="bg-slate-950">Berk</option>
            <option value="Diğer Ortak" className="bg-slate-950">Diğer</option>
          </select>
        </div>
      </div>

      {/* Filtered Total (dynamic) */}
      <div className="px-8 py-4 bg-white/[0.01] border-b border-white/5 flex justify-end items-center gap-4">
        <span className="text-[10px] font-black tracking-[0.3em] text-zinc-600 uppercase">FİLTRELENEN TOPLAM</span>
        <span className="text-2xl font-black text-rose-500 tracking-tighter">₺{filteredTotal.toLocaleString('tr-TR')}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02]">
              <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/10">Açıklama</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/10">Kategori / Şube</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/10">Ödeme</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/10 text-center">Belge</th>
              <th className="px-8 py-6 text-[10px] font-black text-rose-400 uppercase tracking-widest border-b border-white/10 text-right">Tutar</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/10 text-center">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center text-zinc-600 text-xs font-black uppercase tracking-[0.3em]">
                  Herhangi bir gider kaydı bulunamadı.
                </td>
              </tr>
            ) : null}
            {filtered.map((exp) => (
              <tr key={exp.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-6">
                  <p className="text-sm font-black text-zinc-200 group-hover:text-white transition-colors tracking-tight">{exp.description}</p>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{exp.type}</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {exp.location?.name || 'GENEL MERKEZ'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 w-max shadow-inner">
                     <User size={10}/> {exp.paidBy}
                  </span>
                </td>
                <td className="px-8 py-6 text-center">
                  {exp.documents && exp.documents.length > 0 ? (
                    <div className="flex justify-center scale-90">
                      <DocumentViewer documents={exp.documents} />
                    </div>
                  ) : (
                    <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest group-hover:text-zinc-600 transition-colors italic">KAYIT YOK</span>
                  )}
                </td>
                <td className="px-8 py-6 text-right font-black text-base text-rose-500 tracking-tighter">
                  ₺{exp.amountWithVat?.toLocaleString('tr-TR')}
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button 
                      onClick={() => setEditingExpense(exp)}
                      className="p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all border border-white/5"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(exp.id)}
                      disabled={deletingExpenseId === exp.id}
                      className={`p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 transition-all border border-white/5 ${deletingExpenseId === exp.id ? 'opacity-30 cursor-not-allowed' : ''}`}
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

      {/* Edit Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in fade-in zoom-in duration-300">
          <div className="w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden border border-white/10">
            <ExpenseForm 
              locations={locations} 
              initialData={{
                ...editingExpense, 
                amount: editingExpense.amountWithVat, // Map for initial values match
                locationId: editingExpense.location?.id || ''
              }} 
              onClose={() => setEditingExpense(null)} 
            />
          </div>
        </div>
      )}
    </motion.section>
  );
}
