'use client';

import { useState } from 'react';
import { updateLocationParameters } from '../actions';
import { Loader2, Save, MapPin, Percent, DollarSign, Building } from 'lucide-react';
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-10 bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm rounded-3xl"
    >
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
            <Building size={20} className="text-slate-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{location.name}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{location.id}</p>
          </div>
        </div>
        {success && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
            AYARLAR GÜNCELLENDİ
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <DollarSign size={12} /> Sabit Kira (₺)
            </label>
            <input 
              name="fixedRent" 
              type="number" 
              defaultValue={location.fixedRent} 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none transition-all placeholder:text-slate-400 font-bold text-slate-900 shadow-inner" 
              style={{ '--tw-ring-color': 'rgba(47,107,255,0.2)' } as any}
              placeholder="0.00" 
              onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 4px rgba(47,107,255,0.2)"; e.currentTarget.style.borderColor = "rgba(47,107,255,0.5)"; e.currentTarget.style.backgroundColor = "white"; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.backgroundColor = "#F8FAFC"; }}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Building size={12} /> Aidat / Ortak Gider (₺)
            </label>
            <input 
              name="duesAmount" 
              type="number" 
              defaultValue={location.duesAmount} 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none transition-all placeholder:text-slate-400 font-bold text-slate-900 shadow-inner"
              placeholder="0.00" 
              onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 4px rgba(47,107,255,0.2)"; e.currentTarget.style.borderColor = "rgba(47,107,255,0.5)"; e.currentTarget.style.backgroundColor = "white"; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.backgroundColor = "#F8FAFC"; }}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
               Kira KDV Oranı (%)
            </label>
            <input 
              name="rentVatRate" 
              type="number" 
              defaultValue={location.rentVatRate} 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none transition-all placeholder:text-slate-400 font-bold text-slate-900 shadow-inner" 
              placeholder="20" 
              onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 4px rgba(47,107,255,0.2)"; e.currentTarget.style.borderColor = "rgba(47,107,255,0.5)"; e.currentTarget.style.backgroundColor = "white"; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.backgroundColor = "#F8FAFC"; }}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Percent size={12} /> Ciro Payı Oranı (%)
            </label>
            <input 
              name="revenueShareRate" 
              type="number" 
              defaultValue={location.revenueShareRate} 
              className="w-full px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm outline-none transition-all placeholder:text-emerald-400 font-bold text-emerald-900 shadow-inner focus:bg-white focus:ring-4 focus:border-emerald-400" 
              style={{ '--tw-ring-color': 'rgba(16,185,129,0.2)' } as any}
              placeholder="0" 
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 flex items-center gap-2">
               Ciro Eşiği (₺)
            </label>
            <input 
              name="revenueThreshold" 
              type="number" 
              defaultValue={location.revenueThreshold} 
              className="w-full px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm outline-none transition-all placeholder:text-emerald-400 font-bold text-emerald-900 shadow-inner focus:bg-white focus:ring-4 focus:border-emerald-400" 
              style={{ '--tw-ring-color': 'rgba(16,185,129,0.2)' } as any}
              placeholder="0.00" 
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-5 flex items-center justify-center gap-3 transition-transform active:scale-[0.98] rounded-2xl font-black text-xs tracking-widest text-white shadow-md hover:shadow-lg"
          style={{ background: '#1E2A44' }}
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
          DEĞİŞİKLİKLERİ KAYDET VE UYGULA
        </button>
      </form>
    </motion.div>
  );
}
