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
      <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <PiggyBank className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 tracking-tight leading-none mb-1">Yatırım (CAPEX) Kalemleri</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ayrıntılı Liste</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Yatırım Ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-slate-300 outline-none w-48 shadow-sm"
            />
          </div>
          <select 
            value={filterLocation} 
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-widest outline-none shadow-sm"
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
            <tr className="bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Yatırım Kalemi</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Lokasyon</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Notlar</th>
              <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-slate-100 text-right">Tutar</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 text-center">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">
                  Yatırım kalemi bulunamadı
                </td>
              </tr>
            ) : null}
            {filtered.map((inv) => (
              <tr key={inv.id} className="group hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5">
                  <p className="text-sm font-black text-slate-700 group-hover:text-slate-950 transition-colors tracking-tight">{inv.description}</p>
                </td>
                <td className="px-8 py-5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inv.location?.name || 'BELİRTİLMEDİ'}</span>
                </td>
                <td className="px-8 py-5">
                  <p className="text-xs text-slate-500 font-medium">{inv.notes || '—'}</p>
                </td>
                <td className="px-8 py-5 text-right font-mono text-sm font-black text-emerald-600">
                  <div className="flex flex-col items-end">
                    <span>₺{inv.totalAmount?.toLocaleString('tr-TR')}</span>
                    {inv.currency !== 'TL' && (
                      <span className="text-[10px] text-slate-400">({inv.amountWithoutVat?.toLocaleString('tr-TR')} {inv.currency})</span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => setEditingInvestment(inv)}
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(inv.id)}
                      disabled={deletingInvestmentId === inv.id}
                      className={`p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all ${deletingInvestmentId === inv.id ? 'opacity-50' : ''}`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg shadow-2xl">
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
      )}
    </motion.section>
  );
}
