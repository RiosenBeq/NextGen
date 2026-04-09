'use client';
import { useRouter } from 'next/navigation';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Edit2, Trash2, Calendar, Filter, ChevronDown, CheckCircle2 } from 'lucide-react';
import ExpenseForm from './ExpenseForm';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { deleteExpense, toggleExpenseSettled } from '../actions';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  type: 'ONE_TIME' | 'RECURRING'; 
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

const getCategoryColor = (category: string) => {
  const map: Record<string, string> = {
    'Operasyonel': 'bg-blue-50 text-blue-700 border-blue-200',
    'Kira': 'bg-purple-50 text-purple-700 border-purple-200',
    'Faturalar': 'bg-rose-50 text-rose-700 border-rose-200',
    'Bakım/Onarım': 'bg-amber-50 text-amber-700 border-amber-200',
    'Pazarlama': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Ekipman': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Personel': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Diğer': 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return map[category] || map['Diğer'];
};

export default function ExpenseList({ initialExpenses, documents, locations }: Props) {
  const router = useRouter();
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
      router.refresh();
      setDeletingExpenseId(null);
    }
  };

  const handleToggleSettled = async (exp: any) => {
    setSettlingId(exp.id);
    await toggleExpenseSettled(exp.id, exp.description);
    router.refresh();
  };

  const filteredTotal = filtered.reduce((acc, curr) => acc + (curr.amountWithVat || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card bg-white overflow-hidden shadow-xl border border-slate-200 rounded-[32px]"
    >
      {/* Filters Toolbar */}
      <div className="p-8 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <Filter className="w-6 h-6" style={{ color: '#2F6BFF' }} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight italic uppercase">Kayıtlı Giderler</h2>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Toplam {filtered.length} işlem analiz ediliyor</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-1 xl:justify-end">
          <div className="relative w-full md:max-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Gider açıklaması ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 outline-none transition-all placeholder:text-slate-400 shadow-sm text-slate-900 font-medium"
              style={{ '--tw-ring-color': 'rgba(47,107,255,0.2)' } as any}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-700 uppercase tracking-widest cursor-pointer appearance-none shadow-sm focus:ring-4 outline-none transition-all"
                style={{ '--tw-ring-color': 'rgba(47,107,255,0.2)' } as any}
              >
                <option value="ALL">TÜM KATEGORİLER</option>
                <option value="Operasyonel">OPERASYONEL</option>
                <option value="Kira">KİRA</option>
                <option value="Faturalar">FATURALAR</option>
                <option value="Bakım/Onarım">BAKIM/ONARIM</option>
                <option value="Pazarlama">PAZARLAMA</option>
                <option value="Ekipman">EKİPMAN</option>
                <option value="Personel">PERSONEL</option>
                <option value="Diğer">DİĞER</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filterPaidBy}
                onChange={(e) => setFilterPaidBy(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-700 uppercase tracking-widest cursor-pointer appearance-none shadow-sm focus:ring-4 outline-none transition-all"
                style={{ '--tw-ring-color': 'rgba(47,107,255,0.2)' } as any}
              >
                <option value="ALL">TÜM ÖDEYENLER</option>
                <option value="Ortak Hesap">ORTAK HESAP</option>
                <option value="Okan">OKAN</option>
                <option value="Talha">TALHA</option>
                <option value="Furkan">FURKAN</option>
                <option value="Alp">ALP</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filterSettled}
                onChange={(e) => setFilterSettled(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-700 uppercase tracking-widest cursor-pointer appearance-none shadow-sm focus:ring-4 outline-none transition-all"
                style={{ '--tw-ring-color': 'rgba(47,107,255,0.2)' } as any}
              >
                <option value="ALL">TÜMÜ</option>
                <option value="ACTIVE">BEKLEYEN</option>
                <option value="SETTLED">MAHSUP EDİLDİ</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
              <th className="px-8 py-5 whitespace-nowrap">Açıklama & Takvim</th>
              <th className="px-8 py-5 whitespace-nowrap">Kategori & Tip</th>
              <th className="px-8 py-5 whitespace-nowrap">Ödeme Kaynağı</th>
              <th className="px-8 py-5 whitespace-nowrap text-center">Mahsup Durumu</th>
              <th className="px-8 py-5 whitespace-nowrap text-center">Evrak</th>
              <th className="px-8 py-5 whitespace-nowrap text-right">Vergi Verisi</th>
              <th className="px-8 py-5 whitespace-nowrap text-right" style={{ color: '#2F6BFF' }}>Net Tutar</th>
              <th className="px-8 py-5 whitespace-nowrap text-center w-24">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <Search className="w-8 h-8 opacity-40" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest italic">Analiz edilecek veri bulunamadı.</p>
                  </div>
                </td>
              </tr>
            ) : null}
            {filtered.map((exp) => (
              <tr key={exp.id} className="hover:bg-blue-50/50 transition-all duration-300 group/row border-l-4 border-transparent hover:border-blue-500">
                <td className="px-8 py-6">
                  <p className="font-black text-slate-900 text-sm tracking-tight truncate max-w-[200px] xl:max-w-xs uppercase italic" title={exp.description}>
                    {exp.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Calendar className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {exp.month ? new Date(exp.month).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TİRAJSIZ'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col items-start gap-1.5 animate-in slide-in-from-left-2 duration-300">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">
                      {exp.location?.name || 'GENEL MERKEZ'}
                    </span>
                    <span className={cn(
                      "text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-[0.2em] shadow-sm",
                      getCategoryColor(exp.type === 'RECURRING' ? 'Kira' : 'Operasyonel')
                    )}>
                      {exp.type === 'RECURRING' ? 'DÜZENLİ' : 'TEK SEFERLİK'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm shrink-0 italic">
                       {exp.paidBy?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">{exp.paidBy}</span>
                      {exp.description.includes('[MAHSUP]') && (
                        <span className="text-[8px] text-emerald-600 font-black italic uppercase tracking-[0.1em] mt-0.5">
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
                      "inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest shadow-sm",
                      exp.description.includes('[MAHSUP]') 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100" 
                        : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                     {settlingId === exp.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                     ) : exp.description.includes('[MAHSUP]') ? (
                        <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> MAHSUP EDİLDİ</>
                     ) : (
                        <><div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" /> BEKLEMEDE</>
                     )}
                  </button>
                </td>
                <td className="px-8 py-6 text-center">
                  {exp.attachmentUrl || (exp.documents && exp.documents.length > 0) ? (
                    <a
                      href={exp.attachmentUrl || (exp.documents ? exp.documents[0].fileUrl : '#')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      BELGE ONAYLI
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-[9px] font-black uppercase tracking-widest italic">
                      <FileText className="w-3.5 h-3.5 opacity-50" />
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
                    <span className="text-lg font-black text-slate-900 tracking-tighter italic">
                      ₺{(exp.amountWithVat || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] mt-0.5" style={{ color: '#2F6BFF' }}>KESİN TUTAR</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover/row:opacity-100 transition-all transform translate-x-1 group-hover/row:translate-x-0">
                    <button
                      onClick={() => setEditingExpense(exp)}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent active:scale-95"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      disabled={deletingExpenseId === exp.id}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent active:scale-95"
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
      <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">VERİ AKIŞI AKTİF</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">KORUMALI SİSTEM</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">FİLTRELENMİŞ ANALİZ TOPLAMI:</span>
          <span className="text-2xl font-black italic tracking-tighter" style={{ color: '#1E2A44' }}>
            ₺{filteredTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <PremiumModal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        maxWidth="max-w-3xl"
        title="Gider Kaydını Düzenle"
      >
        <div className="p-8">
          {editingExpense && (
            <ExpenseForm
              locations={locations}
              initialData={{
                ...editingExpense,
                amount: editingExpense.amountWithoutVat
              }}
              onClose={() => setEditingExpense(null)}
            />
          )}
        </div>
      </PremiumModal>
    </motion.div>
  );
}
