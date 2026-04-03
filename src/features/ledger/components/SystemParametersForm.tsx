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
      className="premium-card p-10 bg-indigo-950/10 border-indigo-500/20 hover:border-indigo-500/30 transition-all"
    >
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Settings2 size={20} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tighter uppercase">Genel Finans Değişkenleri</h3>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">SİSTEM PARAMETRELERİ</p>
          </div>
        </div>
        {success && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
            DEĞİŞKENLER GÜNCELLENDİ
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <DollarSign size={12} /> Oturum Fiyatı (₺)
            </label>
            <input 
              name="SESSION_PRICE_INCL_VAT" 
              type="number" 
              defaultValue={parameters['SESSION_PRICE_INCL_VAT'] || 300} 
              className="elite-input" 
              placeholder="300" 
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Percent size={12} /> Genel KDV Oranı (%) 
            </label>
            <input 
              name="VAT_RATE" 
              type="number" 
              defaultValue={parameters['VAT_RATE'] || 0} 
              className="elite-input" 
              placeholder="0" 
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Percent size={12} /> Kurumlar Vergisi (%)
            </label>
            <input 
              name="CORP_TAX_RATE" 
              type="number" 
              defaultValue={parameters['CORP_TAX_RATE'] || 0} 
              className="elite-input" 
              placeholder="0" 
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="elite-button-secondary w-full py-5 flex items-center justify-center gap-3 transition-transform active:scale-[0.98] border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
          GENEL PARAMETRELERİ KAYDET
        </button>
      </form>
    </motion.div>
  );
}
