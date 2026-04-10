'use client';

import { useState } from 'react';
import { updateSystemParameter } from '../actions';
import { Loader2, Save, Settings2, DollarSign, Percent, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  parameters: Record<string, number>;
}

export function SystemParametersForm({ parameters }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const sessionPrice = Number(formData.get('SESSION_PRICE_INCL_VAT'));
    const vatRate = Number(formData.get('VAT_RATE'));
    const corpTax = Number(formData.get('CORP_TAX_RATE'));

    try {
      await updateSystemParameter('SESSION_PRICE_INCL_VAT', sessionPrice);
      await updateSystemParameter('VAT_RATE', vatRate);
      await updateSystemParameter('CORP_TAX_RATE', corpTax);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-1 sm:p-2 space-y-10">
      {/* Refined Header */}
      <section className="relative p-6 sm:p-8 rounded-[32px] bg-slate-900 overflow-hidden shadow-2xl shadow-slate-200">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-white">
          <Settings2 size={120} />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-blue-400">
            <Settings2 size={14} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">SİSTEM YAPILANDIRMASI</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Finansal Parametreler</h2>
          <p className="text-sm text-slate-400 font-medium">Sistem geneli oturum fiyatı ve vergi oranlarını güncelleyin.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
        {/* Session Price */}
        <div className="space-y-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Oturum Fiyatı (₺)</label>
          <div className="relative">
            <DollarSign size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-200" />
            <input 
              name="SESSION_PRICE_INCL_VAT" 
              type="number" 
              step="0.01"
              defaultValue={parameters['SESSION_PRICE_INCL_VAT'] || 300} 
              className="w-full px-0 py-4 bg-transparent border-b border-slate-200 text-3xl font-black text-slate-900 focus:border-blue-500 outline-none transition-all tabular-nums"
              placeholder="0.00" 
            />
          </div>
        </div>

        {/* VAT Rate */}
        <div className="space-y-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Genel KDV Oranı (%)</label>
          <div className="relative">
            <Percent size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-200" />
            <input 
              name="VAT_RATE" 
              type="number" 
              step="0.1"
              defaultValue={parameters['VAT_RATE'] || 0} 
              className="w-full px-0 py-4 bg-transparent border-b border-slate-200 text-3xl font-black text-slate-900 focus:border-blue-500 outline-none transition-all tabular-nums"
              placeholder="0" 
            />
          </div>
        </div>

        {/* Corp Tax Rate */}
        <div className="space-y-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kurumlar Vergisi (%)</label>
          <div className="relative">
            <Percent size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-200" />
            <input 
              name="CORP_TAX_RATE" 
              type="number" 
              step="0.1"
              defaultValue={parameters['CORP_TAX_RATE'] || 0} 
              className="w-full px-0 py-4 bg-transparent border-b border-slate-200 text-3xl font-black text-slate-900 focus:border-blue-500 outline-none transition-all tabular-nums"
              placeholder="0" 
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
        SİSTEM AYARLARINI GÜNCELLE
      </button>
    </form>
  );
}

