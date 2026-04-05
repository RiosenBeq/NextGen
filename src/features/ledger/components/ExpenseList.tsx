'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Edit2, Trash2, Calendar, Filter, ChevronDown, CheckCircle2 } from 'lucide-react';
import ExpenseForm from './ExpenseForm';
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
  location?: { id: string; name: string } | null;
  paidBy?: string;
  documents?: any[];
}

interface Props {
  initialExpenses: Expense[];
  documents: any[];
  locations: any[];
}

// Renk haritası (kategorilere göre etiket renkleri)
const getCategoryColor = (category: string) => {
  const map: Record<string, string> = {
    'Operasyonel': 'bg-blue-50 text-blue-700 border-blue-200',
    'Kira': 'bg-purple-50 text-purple-700 border-purple-200',
    'Faturalar': 'bg-rose-50 text-rose-700 border-rose-200',
    'Bakım/Onarım': 'bg-amber-50 text-amber-700 border-amber-200',
    'Pazarlama': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Ekipman': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Personel': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Diğer': 'bg-slate-50 text-slate-700 border-slate-200',
  };
  return map[category] || map['Diğer'];
};

export default function ExpenseList({ initialExpenses, documents, locations }: Props) {
  const [filterType, setFilterType] = useState('ALL');
  const [filterPaidBy, setFilterPaidBy] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  const expenseMap = initialExpenses.map((exp) => ({
    ...exp,
    documents: documents.filter(d => d.relatedId === exp.id),
    paidBy: exp.paidBy || 'Ortak Hesap',
  }));

  const filtered = expenseMap.filter((exp) => {
    if (filterType !== 'ALL' && exp.type !== filterType) return false;
    if (filterPaidBy !== 'ALL' && exp.paidBy !== filterPaidBy) return false;
    if (searchQuery && !exp.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (confirm("Bu gideri silmek istediğinize emin misiniz? (Bu işlem geri alınamaz)")) {
      setDeletingExpenseId(id);
      await deleteExpense(id);
      window.location.reload();
      setDeletingExpenseId(null);
    }
  };

  const filteredTotal = filtered.reduce((acc, curr) => acc + (curr.amountWithVat || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card bg-white overflow-hidden shadow-xl shadow-slate-200/40 border border-slate-200/60"
    >
      {/* Filters Toolbar */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <Filter className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Kayıtlı Giderler</h2>
            <p className="text-[11px] text-slate-500 font-medium">Toplam {filtered.length} işlem listeleniyor</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 md:justify-end">
          <div className="relative w-full sm:max-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Açıklama, not vb. ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full sm:w-auto pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer appearance-none shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              >
                <option value="ALL">Kategori: Tümü</option>
                <option value="Operasyonel">Operasyonel</option>
                <option value="Kira">Kira</option>
                <option value="Faturalar">Faturalar</option>
                <option value="Bakım/Onarım">Bakım/Onarım</option>
                <option value="Pazarlama">Pazarlama</option>
                <option value="Ekipman">Ekipman</option>
                <option value="Personel">Personel</option>
                <option value="Diğer">Diğer</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative w-full sm:w-auto">
              <select
                value={filterPaidBy}
                onChange={(e) => setFilterPaidBy(e.target.value)}
                className="w-full sm:w-auto pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer appearance-none shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              >
                <option value="ALL">Ödeyen: Tümü</option>
                <option value="Ortak Hesap">Ortak Hesap</option>
                <option value="Okan">Okan</option>
                <option value="Talha">Talha</option>
                <option value="Furkan">Furkan</option>
                <option value="Alp">Alp</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              <th className="px-6 py-4 whitespace-nowrap">Açıklama / Tarih</th>
              <th className="px-6 py-4 whitespace-nowrap">Kategori / Şube</th>
              <th className="px-6 py-4 whitespace-nowrap">Ödeme Kaynağı</th>
              <th className="px-6 py-4 whitespace-nowrap text-center">Belge Durumu</th>
              <th className="px-6 py-4 whitespace-nowrap text-right">Vergi (KDV)</th>
              <th className="px-6 py-4 whitespace-nowrap text-right">Net Tutar</th>
              <th className="px-6 py-4 whitespace-nowrap text-center w-24">Aksiyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                    <Search className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium">Seçili kriterlerde kayıt bulunamadı.</p>
                  </div>
                </td>
              </tr>
            ) : null}
            {filtered.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors group">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900 text-sm max-w-xs truncate" title={exp.description}>
                    {exp.description}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {exp.month ? new Date(exp.month).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirtilmemiş'}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-start gap-1.5">
                    <span className={cn(
                      "text-[10px] items-center font-bold px-2 py-0.5 rounded-md border",
                      getCategoryColor(exp.type)
                    )}>
                      {exp.type}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {exp.location?.name || 'Genel Merkez'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700 shadow-sm shrink-0">
                      {exp.paidBy?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{exp.paidBy}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {exp.attachmentUrl ? (
                    <a
                      href={exp.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors text-[11px] font-bold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Belge Ekli
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 text-[11px] font-bold">
                      <FileText className="w-3.5 h-3.5 opacity-50" />
                      Eksik
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-600">%{(exp.vatRate || 0).toLocaleString('tr-TR')}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    Matrah: ₺{(exp.amountWithoutVat || 0).toLocaleString('tr-TR')}
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-slate-900 tracking-tight">
                      ₺{(exp.amountWithVat || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">KDV Dahil</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingExpense(exp)}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      disabled={deletingExpenseId === exp.id}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm disabled:opacity-50"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Bar */}
      <div className="px-6 py-5 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Canlı Senkronizasyon</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Seçili Toplam:</span>
          <span className="text-2xl font-black text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            ₺{filteredTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Edit Modal Override */}
      <AnimatePresence>
        {editingExpense && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingExpense(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-[5vh] md:top-[10vh] mx-auto z-[101] max-w-2xl max-h-[85vh] overflow-y-auto no-scrollbar rounded-2xl shadow-2xl"
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
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
