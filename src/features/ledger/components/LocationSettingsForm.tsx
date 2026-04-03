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
      className="premium-card p-10 bg-zinc-950/50 border-white/5 hover:border-white/10 transition-all"
    >
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center">
            <Building size={20} className="text-zinc-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tighter uppercase">{location.name}</h3>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{location.id}</p>
          </div>
        </div>
        {success && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
            AYARLAR GÜNCELLENDİ
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <DollarSign size={12} /> Sabit Kira (₺)
            </label>
            <input 
              name="fixedRent" 
              type="number" 
              defaultValue={location.fixedRent} 
              className="elite-input" 
              placeholder="0.00" 
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Building size={12} /> Aidat / Ortak Gider (₺)
            </label>
            <input 
              name="duesAmount" 
              type="number" 
              defaultValue={location.duesAmount} 
              className="elite-input" 
              placeholder="0.00" 
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
               Kira KDV Oranı (%)
            </label>
            <input 
              name="rentVatRate" 
              type="number" 
              defaultValue={location.rentVatRate} 
              className="elite-input" 
              placeholder="20" 
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Percent size={12} /> Ciro Payı Oranı (%)
            </label>
            <input 
              name="revenueShareRate" 
              type="number" 
              defaultValue={location.revenueShareRate} 
              className="elite-input border-emerald-500/20 focus:border-emerald-500/40" 
              placeholder="0" 
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1 flex items-center gap-2">
               Ciro Eşiği (₺)
            </label>
            <input 
              name="revenueThreshold" 
              type="number" 
              defaultValue={location.revenueThreshold} 
              className="elite-input border-emerald-500/20 focus:border-emerald-500/40" 
              placeholder="0.00" 
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="elite-button-primary w-full py-5 flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
          DEĞİŞİKLİKLERİ KAYDET VE UYGULA
        </button>
      </form>
    </motion.div>
  );
}
