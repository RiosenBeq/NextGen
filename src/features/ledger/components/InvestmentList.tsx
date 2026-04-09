'use client';
import { useRouter } from 'next/navigation';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, Search, Edit2, Trash2 } from 'lucide-react';
import { InvestmentForm } from './InvestmentForm';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { deleteInvestment } from '../actions';

interface Location {
  id: string;
  name: string;
}

interface Investment {
  id: string;
  description: string;
  currency: string;
  amountWithoutVat: number;
  totalAmount: number;
  notes?: string;
  locationId?: string;
  location?: Location | null;
  createdAt: string;
}

interface Props {
  initialInvestments: Investment[];
  locations: any[];
}

export default function InvestmentList({ initialInvestments, locations }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [deletingInvestmentId, setDeletingInvestmentId] = useState<string | null>(null);

  const filtered = initialInvestments.filter((inv) => {
    if (filterLocation !== 'ALL' && inv.locationId !== filterLocation) return false;
    if (searchQuery && !inv.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (confirm("Bu yatırım kalemini silmek istediğinize emin misiniz?")) {
      setDeletingInvestmentId(id);
      await deleteInvestment(id);
      setDeletingInvestmentId(null);
    }
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card overflow-hidden bg-slate-900/40 border-white/5"
    >
      <div className="p-8 border-b border-white/5 bg-white/[0.02] flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/5">
            <PiggyBank className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">Yatırım (CAPEX) Kalemleri</h3>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Demirbaş ve Altyapı Yatırımları</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group/search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within/search:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Yatırım Ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="elite-input pl-11 py-2.5 w-56 text-xs"
            />
          </div>
          <select 
            value={filterLocation} 
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-zinc-400 uppercase tracking-widest outline-none hover:bg-white/10 transition-colors"
          >
            <option value="ALL" className="bg-slate-950">Tüm Lokasyonlar</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id} className="bg-slate-950">{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02]">
              <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/10">Yatırım Kalemi</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/10">Lokasyon</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/10">Notlar</th>
              <th className="px-8 py-6 text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/10 text-right">Tutar</th>
              <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/10 text-center">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-zinc-600 text-xs font-black uppercase tracking-[0.3em]">
                  Yatırım kalemi bulunamadı
                </td>
              </tr>
            ) : null}
            {filtered.map((inv) => (
              <tr key={inv.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-6">
                  <p className="text-sm font-black text-zinc-200 group-hover:text-white transition-colors tracking-tight">{inv.description}</p>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{inv.location?.name || 'BELİRTİLMEDİ'}</span>
                </td>
                <td className="px-8 py-6">
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-xs">{inv.notes || '—'}</p>
                </td>
                <td className="px-8 py-6 text-right font-black text-base text-indigo-400 tracking-tighter">
                  <div className="flex flex-col items-end">
                    <span>₺{inv.totalAmount?.toLocaleString('tr-TR')}</span>
                    {inv.currency !== 'TL' && (
                      <span className="text-[10px] font-bold text-zinc-600">({inv.amountWithoutVat?.toLocaleString('tr-TR')} {inv.currency})</span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button 
                      onClick={() => setEditingInvestment(inv)}
                      className="p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-400/10 transition-all border border-white/5"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(inv.id)}
                      disabled={deletingInvestmentId === inv.id}
                      className={`p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 transition-all border border-white/5 ${deletingInvestmentId === inv.id ? 'opacity-30 cursor-not-allowed' : ''}`}
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

      {/* Edit Modal Refactored */}
      <PremiumModal
        isOpen={!!editingInvestment}
        onClose={() => setEditingInvestment(null)}
        maxWidth="max-w-2xl"
        title="Yatırım Kalemini Düzenle"
      >
        <div className="p-8">
          {editingInvestment && (
            <InvestmentForm 
              locations={locations} 
              initialData={{
                ...editingInvestment, 
                amount: editingInvestment.amountWithoutVat,
                locationId: editingInvestment.locationId || ''
              }} 
              onClose={() => setEditingInvestment(null)} 
            />
          )}
        </div>
      </PremiumModal>
    </motion.section>
  );
}

