'use client';

import { useState } from 'react';
import { updateSystemParameter } from '../actions';
import { Loader2, Save, Settings2, DollarSign, Percent } from 'lucide-react';
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
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100">
            <Settings2 size={24} />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Finansal Yapılandırma</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">SİSTEM GENELİ PARAMETRELER</p>
          </div>
        </div>
        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            BAŞARIYLA GÜNCELLENDİ
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
              <DollarSign size={14} className="text-slate-400" /> Oturum Fiyatı (₺)
            </label>
            <input 
              name="SESSION_PRICE_INCL_VAT" 
              type="number" 
              defaultValue={parameters['SESSION_PRICE_INCL_VAT'] || 300} 
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all placeholder:text-slate-300" 
              placeholder="300" 
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
              <Percent size={14} className="text-slate-400" /> Genel KDV Oranı (%) 
            </label>
            <input 
              name="VAT_RATE" 
              type="number" 
              defaultValue={parameters['VAT_RATE'] || 0} 
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all placeholder:text-slate-300" 
              placeholder="0" 
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
              <Percent size={14} className="text-slate-400" /> Kurumlar Vergisi (%)
            </label>
            <input 
              name="CORP_TAX_RATE" 
              type="number" 
              defaultValue={parameters['CORP_TAX_RATE'] || 0} 
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all placeholder:text-slate-300" 
              placeholder="0" 
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-16 flex items-center justify-center gap-3 bg-slate-900 text-white rounded-2xl font-bold text-xs tracking-widest shadow-xl shadow-slate-200 uppercase transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
          DEĞİŞİKLİKLERİ SİSTEME İŞLE
        </button>
      </form>
    </motion.div>
  );
}
