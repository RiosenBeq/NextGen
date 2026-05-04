'use client';

import { useState } from 'react';
import { updateLocationParameters } from '../actions';
import { Loader2, Save, Percent, DollarSign, Building } from 'lucide-react';
import { motion } from 'framer-motion';

interface LocationSettingsLocation {
  id: string;
  name: string;
  fixedRent?: number;
  duesAmount?: number;
  revenueShareRate?: number;
  revenueThreshold?: number;
  rentVatRate?: number;
}

interface Props {
  location: LocationSettingsLocation;
}

export function LocationSettingsForm({ location }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const data = {
      fixedRent: Number(formData.get('fixedRent')),
      duesAmount: Number(formData.get('duesAmount')),
      revenueShareRate: Number(formData.get('revenueShareRate')),
      revenueThreshold: Number(formData.get('revenueThreshold')),
      rentVatRate: Number(formData.get('rentVatRate')),
    };

    const result = await updateLocationParameters(location.id, data);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setIsSubmitting(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 bg-white border border-slate-200 shadow-sm rounded-[32px] overflow-hidden"
    >
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Building size={24} />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{location.name}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{location.id}</p>
          </div>
        </div>
        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            GÜNCELLENDİ
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
              <DollarSign size={14} className="text-slate-400" /> Sabit Kira (₺)
            </label>
            <input 
              name="fixedRent" 
              type="number" 
              defaultValue={location.fixedRent} 
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all placeholder:text-slate-300" 
              placeholder="0.00" 
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
              <Building size={14} className="text-slate-400" /> Aidat / Ortak Gider (₺)
            </label>
            <input 
              name="duesAmount" 
              type="number" 
              defaultValue={location.duesAmount} 
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all placeholder:text-slate-300"
              placeholder="0.00" 
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
              Kira KDV Oranı (%)
            </label>
            <input 
              name="rentVatRate" 
              type="number" 
              defaultValue={location.rentVatRate} 
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all placeholder:text-slate-300" 
              placeholder="20" 
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest pl-1 flex items-center gap-2">
              <Percent size={14} /> Ciro Payı Oranı (%)
            </label>
            <input 
              name="revenueShareRate" 
              type="number" 
              defaultValue={location.revenueShareRate} 
              className="w-full px-5 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-sm font-bold text-emerald-900 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all placeholder:text-emerald-300" 
              placeholder="0" 
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest pl-1">
              Ciro Eşiği (₺)
            </label>
            <input 
              name="revenueThreshold" 
              type="number" 
              defaultValue={location.revenueThreshold} 
              className="w-full px-5 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-sm font-bold text-emerald-900 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all placeholder:text-emerald-300" 
              placeholder="0.00" 
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-16 flex items-center justify-center gap-3 bg-slate-900 text-white rounded-2xl font-bold text-xs tracking-widest shadow-xl shadow-slate-200 uppercase transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
          LOKASYON AYARLARINI KAYDET
        </button>
      </form>
    </motion.div>
  );
}
