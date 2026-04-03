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
      className="premium-card overflow-hidden"
    >
      <div className="p-8 border-b border-white/5 bg-white/[0.02] flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="font-black text-white tracking-tight leading-none mb-1">Operasyonel Giderler</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ayrıntılı Liste ve Fatura Görüntüleme</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Gider Ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#1a1a22] border border-white/10 rounded-xl text-xs text-white focus:border-white/20 outline-none w-48"
            />
          </div>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-[#1a1a22] border border-white/10 rounded-xl text-xs font-black text-zinc-400 uppercase tracking-widest outline-none"
          >
            <option value="ALL">Tüm Tipler</option>
            <option value="FATURA">Fatura / Tüketim</option>
            <option value="MAAS">Maaş / Personel</option>
            <option value="KİRA">Kira / Aidat</option>
            <option value="PAZARLAMA">Reklam / Pazarlama</option>
            <option value="BAKIM">Bakım / Onarım</option>
            <option value="DİĞER">Diğer</option>
          </select>
          <select 
            value={filterPaidBy} 
            onChange={(e) => setFilterPaidBy(e.target.value)}
            className="px-4 py-2 bg-[#1a1a22] border border-white/10 rounded-xl text-xs font-black text-zinc-400 uppercase tracking-widest outline-none"
          >
            <option value="ALL">Tüm Kişiler</option>
            <option value="Ortak Hesap">Ortak Hesap</option>
            <option value="Okan">Okan</option>
            <option value="Berk">Berk</option>
            <option value="Diğer Ortak">Diğer</option>
          </select>
        </div>
      </div>

      {/* Filtered Total (dynamic) */}
      <div className="px-8 py-3 bg-white/[0.01] border-b border-white/[0.03] flex justify-end">
        <div className="text-right">
          <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase mr-3">Görüntülenen Toplam:</span>
          <span className="text-lg font-black text-rose-500 tracking-tighter">₺{filteredTotal.toLocaleString('tr-TR')}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1a1a22]/50">
              <th className="px-8 py-5 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5">Gider Adı</th>
              <th className="px-8 py-5 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5">Tip / Lokasyon</th>
              <th className="px-8 py-5 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5">Kim Ödedi?</th>
              <th className="px-8 py-5 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5 text-center">Fatura/Belge</th>
              <th className="px-8 py-5 text-[10px] font-black text-rose-500/50 uppercase tracking-widest border-b border-white/5 text-right">Tutar</th>
              <th className="px-8 py-5 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5 text-center">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center text-zinc-500 text-sm font-bold uppercase tracking-widest">
                  Gider bulunamadı
                </td>
              </tr>
            ) : null}
            {filtered.map((exp) => (
              <tr key={exp.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-5">
                  <p className="text-sm font-black text-zinc-300 group-hover:text-white transition-colors tracking-tight">{exp.description}</p>
                </td>
                <td className="px-8 py-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">{exp.type}</span>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                      {exp.location?.name || 'GENEL'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 w-max">
                     <User size={12}/> {exp.paidBy}
                  </span>
                </td>
                <td className="px-8 py-5 text-center">
                  {exp.documents && exp.documents.length > 0 ? (
                    <div className="flex justify-center">
                      <DocumentViewer documents={exp.documents} />
                    </div>
                  ) : (
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">—</span>
                  )}
                </td>
                <td className="px-8 py-5 text-right font-mono text-sm font-black text-rose-400">
                  ₺{exp.amountWithVat?.toLocaleString('tr-TR')}
                </td>
                <td className="px-8 py-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => setEditingExpense(exp)}
                      className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(exp.id)}
                      disabled={deletingExpenseId === exp.id}
                      className={`p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors ${deletingExpenseId === exp.id ? 'opacity-50' : ''}`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl no-scrollbar">
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
