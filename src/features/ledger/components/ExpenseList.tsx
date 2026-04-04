'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Edit2, Trash2, Calendar } from 'lucide-react';
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
    if (confirm("Bu gideri silmek istediğinize emin misiniz?")) {
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
      className="premium-card overflow-hidden"
    >
      {/* Filters bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Açıklama ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="elite-input pl-9 py-2 text-sm w-full"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="elite-input py-2 text-xs cursor-pointer w-auto pr-8 appearance-none"
          >
            <option value="ALL">Tüm Kategoriler</option>
            <option value="Operasyonel">Operasyonel</option>
            <option value="Kira">Kira</option>
            <option value="Faturalar">Faturalar</option>
            <option value="Bakım/Onarım">Bakım/Onarım</option>
            <option value="Pazarlama">Pazarlama</option>
            <option value="Ekipman">Ekipman</option>
            <option value="Personel">Personel</option>
            <option value="Diğer">Diğer</option>
          </select>

          <select
            value={filterPaidBy}
            onChange={(e) => setFilterPaidBy(e.target.value)}
            className="elite-input py-2 text-xs cursor-pointer w-auto pr-8 appearance-none"
          >
            <option value="ALL">Tüm Kişiler</option>
            <option value="Ortak Hesap">Ortak Hesap</option>
            <option value="Okan">Okan</option>
            <option value="Talha">Talha</option>
            <option value="Furkan">Furkan</option>
            <option value="Alp">Alp</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table min-w-[720px]">
          <thead>
            <tr>
              <th>Tarih / Açıklama</th>
              <th>Kategori / Şube</th>
              <th>Ödeyen</th>
              <th className="text-center">Belge</th>
              <th className="text-right">KDV</th>
              <th className="text-right">Tutar (KDV Dahil)</th>
              <th className="text-center">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                  Kayıt bulunamadı.
                </td>
              </tr>
            ) : null}
            {filtered.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                <td>
                  <p className="font-medium text-slate-900 text-sm">{exp.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Calendar size={10} />
                    {exp.month ? new Date(exp.month).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) : '—'}
                  </p>
                </td>
                <td>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg">
                    {exp.type}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">{exp.location?.name || 'Genel'}</p>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                      {exp.paidBy?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-700">{exp.paidBy}</span>
                  </div>
                </td>
                <td className="text-center">
                  {exp.attachmentUrl ? (
                    <a
                      href={exp.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-semibold"
                    >
                      <FileText size={13} />
                      Görüntüle
                    </a>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="text-right">
                  <p className="text-xs font-semibold text-slate-700">%{exp.vatRate || 0}</p>
                  <p className="text-[10px] text-slate-400">Net: ₺{(exp.amountWithoutVat || 0).toLocaleString('tr-TR')}</p>
                </td>
                <td className="text-right">
                  <span className="text-sm font-bold text-red-600">
                    ₺{(exp.amountWithVat || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setEditingExpense(exp)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      disabled={deletingExpenseId === exp.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-3">
        <span className="text-xs text-slate-400">{filtered.length} kayıt görüntüleniyor</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Filtrelenmiş Toplam:</span>
          <span className="text-base font-bold text-slate-900">
            ₺{filteredTotal.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
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
    </motion.div>
  );
}
