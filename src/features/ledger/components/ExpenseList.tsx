'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Edit2, Trash2, Calendar, Filter, ChevronDown, CheckCircle2 } from 'lucide-react';
import ExpenseForm from './ExpenseForm';
import { deleteExpense, toggleExpenseSettled } from '../actions';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  type: 'ONE_TIME' | 'RECURRING'; // Type-safe for localization
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
    'Operasyonel': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Kira': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Faturalar': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'Bakım/Onarım': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Pazarlama': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Ekipman': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'Personel': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'Diğer': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  return map[category] || map['Diğer'];
};

export default function ExpenseList({ initialExpenses, documents, locations }: Props) {
  const [filterType, setFilterType] = useState('ALL');
  const [filterPaidBy, setFilterPaidBy] = useState('ALL');
  const [filterSettled, setFilterSettled] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const expenseMap = initialExpenses.map((exp) => ({
    ...exp,
    documents: documents.filter(d => d.relatedId === exp.id),
    paidBy: exp.paidBy || 'Ortak Hesap',
    isSettled: exp.description.includes('[MAHSUP]'),
  }));

  const filtered = expenseMap.filter((exp) => {
    if (filterType !== 'ALL' && exp.type !== filterType) return false;
    if (filterPaidBy !== 'ALL' && exp.paidBy !== filterPaidBy) return false;
    if (searchQuery && !exp.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    if (filterSettled === 'SETTLED' && !exp.isSettled) return false;
    if (filterSettled === 'ACTIVE' && exp.isSettled) return false;
    
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

  const handleToggleSettled = async (exp: any) => {
    setSettlingId(exp.id);
    await toggleExpenseSettled(exp.id, exp.description);
    window.location.reload();
  };

  const filteredTotal = filtered.reduce((acc, curr) => acc + (curr.amountWithVat || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card bg-white/[0.03] backdrop-blur-3xl overflow-hidden shadow-2xl border border-white/10 rounded-[32px]"
    >
      {/* Filters Toolbar */}
      <div className="p-8 border-b border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white/[0.01]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
            <Filter className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight italic uppercase">Kayıtlı Giderler</h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Toplam {filtered.length} işlem analiz ediliyor</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-1 xl:justify-end">
          <div className="relative w-full md:max-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Gider açıklaması ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600 shadow-inner text-white font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-slate-300 uppercase tracking-widest cursor-pointer appearance-none shadow-inner focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
              >
                <option value="ALL" className="bg-[#07090e]">TÜM KATEGORİLER</option>
                <option value="Operasyonel" className="bg-[#07090e]">OPERASYONEL</option>
                <option value="Kira" className="bg-[#07090e]">KİRA</option>
                <option value="Faturalar" className="bg-[#07090e]">FATURALAR</option>
                <option value="Bakım/Onarım" className="bg-[#07090e]">BAKIM/ONARIM</option>
                <option value="Pazarlama" className="bg-[#07090e]">PAZARLAMA</option>
                <option value="Ekipman" className="bg-[#07090e]">EKİPMAN</option>
                <option value="Personel" className="bg-[#07090e]">PERSONEL</option>
                <option value="Diğer" className="bg-[#07090e]">DİĞER</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filterPaidBy}
                onChange={(e) => setFilterPaidBy(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-slate-300 uppercase tracking-widest cursor-pointer appearance-none shadow-inner focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
              >
                <option value="ALL" className="bg-[#07090e]">TÜM ÖDEYENLER</option>
                <option value="Ortak Hesap" className="bg-[#07090e]">ORTAK HESAP</option>
                <option value="Okan" className="bg-[#07090e]">OKAN</option>
                <option value="Talha" className="bg-[#07090e]">TALHA</option>
                <option value="Furkan" className="bg-[#07090e]">FURKAN</option>
                <option value="Alp" className="bg-[#07090e]">ALP</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filterSettled}
                onChange={(e) => setFilterSettled(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-slate-300 uppercase tracking-widest cursor-pointer appearance-none shadow-inner focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
              >
                <option value="ALL" className="bg-[#07090e]">TÜM MAHSUPLAR</option>
                <option value="ACTIVE" className="bg-[#07090e]">BEKLEYENLER</option>
                <option value="SETTLED" className="bg-[#07090e]">ÖDENENLER</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
              <th className="px-8 py-5 whitespace-nowrap">Açıklama & Takvim</th>
              <th className="px-8 py-5 whitespace-nowrap">Kategori & Tip</th>
              <th className="px-8 py-5 whitespace-nowrap">Ödeme Kaynağı</th>
              <th className="px-8 py-5 whitespace-nowrap text-center">Mahsup Durumu</th>
              <th className="px-8 py-5 whitespace-nowrap text-center">Evrak</th>
              <th className="px-8 py-5 whitespace-nowrap text-right">Vergi Verisi</th>
              <th className="px-8 py-5 whitespace-nowrap text-right text-blue-400">Net Tutar</th>
              <th className="px-8 py-5 whitespace-nowrap text-center w-24">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-24 text-slate-600 gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <Search className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest italic">Analiz edilecek veri bulunamadı.</p>
                  </div>
                </td>
              </tr>
            ) : null}
            {filtered.map((exp) => (
              <tr key={exp.id} className="hover:bg-white/[0.02] transition-all group/row">
                <td className="px-8 py-6">
                  <p className="font-black text-white text-sm tracking-tight truncate max-w-xs uppercase italic" title={exp.description}>
                    {exp.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Calendar className="w-3 h-3 text-blue-500/50" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {exp.month ? new Date(exp.month).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TİRAJSIZ'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col items-start gap-1.5 animate-in slide-in-from-left-2 duration-300">
                    <span className="text-[10px] font-black text-slate-100 uppercase tracking-tighter">
                      {exp.location?.name || 'GENEL MERKEZ'}
                    </span>
                    <span className={cn(
                      "text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-[0.2em] shadow-sm",
                      getCategoryColor(exp.type === 'RECURRING' ? 'Kira' : 'Operasyonel') // Logic adjustment if needed
                    )}>
                      {exp.type === 'RECURRING' ? 'DÜZENLİ' : 'TEK SEFERLİK'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white shadow-xl shrink-0 italic">
                       {exp.paidBy?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-200 uppercase tracking-tighter">{exp.paidBy}</span>
                      {exp.description.includes('[MAHSUP]') && (
                        <span className="text-[8px] text-emerald-500 font-black italic uppercase tracking-[0.1em] mt-0.5">
                           SİSTEMDEN DÜŞÜLDÜ
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <button 
                    disabled={settlingId === exp.id}
                    onClick={() => handleToggleSettled(exp)}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest shadow-xl",
                      exp.description.includes('[MAHSUP]') 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" 
                        : "bg-white/5 border-white/10 text-slate-500 hover:text-white"
                    )}
                  >
                     {settlingId === exp.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                     ) : exp.description.includes('[MAHSUP]') ? (
                        <><CheckCircle2 className="w-4 h-4 shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> MAHSUP EDİLDİ</>
                     ) : (
                        <><div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600" /> BEKLEMEDE</>
                     )}
                  </button>
                </td>
                <td className="px-8 py-6 text-center">
                  {exp.attachmentUrl || (exp.documents && exp.documents.length > 0) ? (
                    <a
                      href={exp.attachmentUrl || (exp.documents ? exp.documents[0].fileUrl : '#')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 transition-all text-[9px] font-black uppercase tracking-widest shadow-xl"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      BELGE ONAYLI
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-600 text-[9px] font-black uppercase tracking-widest italic">
                      <FileText className="w-3.5 h-3.5 opacity-30" />
                      BELGE YOK
                    </span>
                  )}
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="inline-flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">%{(exp.vatRate || 0).toLocaleString('tr-TR')} KDV</span>
                    <p className="text-[10px] text-slate-600 font-bold mt-1">
                      MATRAH: ₺{(exp.amountWithoutVat || 0).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-black text-white tracking-tighter italic">
                      ₺{(exp.amountWithVat || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mt-0.5 animate-pulse">KESİN TUTAR</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover/row:opacity-100 transition-all transform translate-x-1 group-hover/row:translate-x-0">
                    <button
                      onClick={() => setEditingExpense(exp)}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/20 active:scale-95"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      disabled={deletingExpenseId === exp.id}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 active:scale-95"
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
      <div className="px-8 py-6 bg-white/[0.01] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">VERİ AKIŞI AKTİF</span>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">KORUMALI SİSTEM</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">FİLTRELENMİŞ ANALİZ TOPLAMI:</span>
          <span className="text-3xl font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
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
