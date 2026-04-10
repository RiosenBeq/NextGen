'use client';

import { useState } from 'react';
import { updateLocationParameters } from '../actions';
import { Loader2, Save, MapPin, Percent, DollarSign, Building, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  location: any;
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
    <form onSubmit={handleSubmit} className="p-1 sm:p-2 space-y-10">
      {/* Refined Header */}
      <section className="relative p-6 sm:p-8 rounded-[32px] bg-slate-900 overflow-hidden shadow-2xl shadow-slate-200">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-white">
          <Building size={120} />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-blue-400">
            <MapPin size={14} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">KONUM PARAMETRELERİ</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">{location.name}</h2>
          <p className="text-sm text-slate-400 font-medium">Bu lokasyona özel kira, aidat ve ciro payı ayarları.</p>
        </div>

        {success && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute bottom-6 right-6 px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg"
          >
            <Zap size={14} />
            BAŞARIYLA GÜNCELLENDİ
          </motion.div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        {/* Fixed Rent */}
        <div className="space-y-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sabit Kira (₺)</label>
          <div className="relative">
            <DollarSign size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-200" />
            <input 
              name="fixedRent" 
              type="number" 
              step="0.01"
              defaultValue={location.fixedRent} 
              className="w-full px-0 py-4 bg-transparent border-b border-slate-200 text-3xl font-black text-slate-900 focus:border-blue-500 outline-none transition-all tabular-nums"
              placeholder="0.00" 
            />
          </div>
        </div>

        {/* Dues */}
        <div className="space-y-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Aidat / Ortak Gider (₺)</label>
          <div className="relative">
            <Building size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-200" />
            <input 
              name="duesAmount" 
              type="number" 
              step="0.01"
              defaultValue={location.duesAmount} 
              className="w-full px-0 py-4 bg-transparent border-b border-slate-200 text-3xl font-black text-slate-900 focus:border-blue-500 outline-none transition-all tabular-nums"
              placeholder="0.00" 
            />
          </div>
        </div>

        {/* VAT Rate */}
        <div className="space-y-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kira KDV Oranı (%)</label>
          <div className="relative">
            <Percent size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-200" />
            <input 
              name="rentVatRate" 
              type="number" 
              defaultValue={location.rentVatRate} 
              className="w-full px-0 py-4 bg-transparent border-b border-slate-200 text-3xl font-black text-slate-900 focus:border-blue-500 outline-none transition-all tabular-nums"
              placeholder="20" 
            />
          </div>
        </div>

        {/* Revenue Share Rate */}
        <div className="space-y-4">
          <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest ml-1">Ciro Payı Oranı (%)</label>
          <div className="relative">
            <Percent size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-emerald-200" />
            <input 
              name="revenueShareRate" 
              type="number" 
              step="0.1"
              defaultValue={location.revenueShareRate} 
              className="w-full px-0 py-4 bg-transparent border-b border-emerald-200 text-3xl font-black text-emerald-600 focus:border-emerald-500 outline-none transition-all tabular-nums"
              placeholder="0" 
            />
          </div>
        </div>

        {/* Revenue Threshold */}
        <div className="space-y-4 md:col-span-2">
          <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest ml-1">Ciro Eşiği (₺) - Bu tutar geçilirse ciro payı uygulanır</label>
          <div className="relative">
            <Zap size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-emerald-200" />
            <input 
              name="revenueThreshold" 
              type="number" 
              step="0.01"
              defaultValue={location.revenueThreshold} 
              className="w-full px-0 py-4 bg-transparent border-b border-emerald-200 text-4xl font-black text-emerald-700 focus:border-emerald-500 outline-none transition-all tabular-nums"
              placeholder="0.00" 
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-[24px] text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        LOKASYON AYARLARINI GÜNCELLE
      </button>
    </form>
  );
}

