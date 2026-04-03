'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, Search, Edit2, Trash2 } from 'lucide-react';
import { InvestmentForm } from './InvestmentForm';
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
      className="premium-card overflow-hidden"
    >
      <div className="p-8 border-b border-white/5 bg-white/[0.02] flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <PiggyBank className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-black text-white tracking-tight leading-none mb-1">Yatırım (CAPEX) Kalemleri</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ayrıntılı Liste</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Yatırım Ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#1a1a22] border border-white/10 rounded-xl text-xs text-white focus:border-white/20 outline-none w-48"
            />
          </div>
          <select 
            value={filterLocation} 
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-4 py-2 bg-[#1a1a22] border border-white/10 rounded-xl text-xs font-black text-zinc-400 uppercase tracking-widest outline-none"
          >
            <option value="ALL">Tüm Lokasyonlar</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1a1a22]/50">
              <th className="px-8 py-5 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5">Yatırım Kalemi</th>
              <th className="px-8 py-5 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5">Lokasyon</th>
              <th className="px-8 py-5 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5">Notlar</th>
              <th className="px-8 py-5 text-[10px] font-black text-emerald-500/50 uppercase tracking-widest border-b border-white/5 text-right">Tutar</th>
              <th className="px-8 py-5 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5 text-center">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center text-zinc-500 text-sm font-bold uppercase tracking-widest">
                  Yatırım kalemi bulunamadı
                </td>
              </tr>
            ) : null}
            {filtered.map((inv) => (
              <tr key={inv.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-5">
                  <p className="text-sm font-black text-zinc-300 group-hover:text-white transition-colors tracking-tight">{inv.description}</p>
                </td>
                <td className="px-8 py-5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{inv.location?.name || 'BELİRTİLMEDİ'}</span>
                </td>
                <td className="px-8 py-5">
                  <p className="text-xs text-zinc-500">{inv.notes || '—'}</p>
                </td>
                <td className="px-8 py-5 text-right font-mono text-sm font-black text-emerald-400">
                  <div className="flex flex-col items-end">
                    <span>₺{inv.totalAmount?.toLocaleString('tr-TR')}</span>
                    {inv.currency !== 'TL' && (
                      <span className="text-[10px] text-zinc-600">({inv.amountWithoutVat?.toLocaleString('tr-TR')} {inv.currency})</span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => setEditingInvestment(inv)}
                      className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(inv.id)}
                      disabled={deletingInvestmentId === inv.id}
                      className={`p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors ${deletingInvestmentId === inv.id ? 'opacity-50' : ''}`}
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
      {editingInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl no-scrollbar">
            <div className="bg-[#111116] rounded-3xl p-6 border border-white/10 shadow-2xl">
                <InvestmentForm 
                  locations={locations} 
                  initialData={{
                    ...editingInvestment, 
                    amount: editingInvestment.amountWithoutVat,
                    locationId: editingInvestment.locationId || ''
                  }} 
                  onClose={() => setEditingInvestment(null)} 
                />
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}
