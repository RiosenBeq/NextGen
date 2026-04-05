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
      className="p-10 bg-white border border-slate-200 transition-all shadow-sm rounded-3xl"
    >
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center border" style={{ background: 'rgba(47,107,255,0.05)', borderColor: 'rgba(47,107,255,0.15)' }}>
            <Settings2 size={20} style={{ color: '#2F6BFF' }} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Genel Finans Değişkenleri</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SİSTEM PARAMETRELERİ</p>
          </div>
        </div>
        {success && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
            DEĞİŞKENLER GÜNCELLENDİ
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <DollarSign size={12} /> Oturum Fiyatı (₺)
            </label>
            <input 
              name="SESSION_PRICE_INCL_VAT" 
              type="number" 
              defaultValue={parameters['SESSION_PRICE_INCL_VAT'] || 300} 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none transition-all placeholder:text-slate-400 font-bold text-slate-900 shadow-inner" 
              placeholder="300" 
              onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 4px rgba(47,107,255,0.2)"; e.currentTarget.style.borderColor = "rgba(47,107,255,0.5)"; e.currentTarget.style.backgroundColor = "white"; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.backgroundColor = "#F8FAFC"; }}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Percent size={12} /> Genel KDV Oranı (%) 
            </label>
            <input 
              name="VAT_RATE" 
              type="number" 
              defaultValue={parameters['VAT_RATE'] || 0} 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none transition-all placeholder:text-slate-400 font-bold text-slate-900 shadow-inner" 
              placeholder="0" 
              onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 4px rgba(47,107,255,0.2)"; e.currentTarget.style.borderColor = "rgba(47,107,255,0.5)"; e.currentTarget.style.backgroundColor = "white"; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.backgroundColor = "#F8FAFC"; }}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Percent size={12} /> Kurumlar Vergisi (%)
            </label>
            <input 
              name="CORP_TAX_RATE" 
              type="number" 
              defaultValue={parameters['CORP_TAX_RATE'] || 0} 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none transition-all placeholder:text-slate-400 font-bold text-slate-900 shadow-inner" 
              placeholder="0" 
              onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 4px rgba(47,107,255,0.2)"; e.currentTarget.style.borderColor = "rgba(47,107,255,0.5)"; e.currentTarget.style.backgroundColor = "white"; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.backgroundColor = "#F8FAFC"; }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 flex items-center justify-center gap-3 transition-transform active:scale-[0.98] rounded-2xl font-black text-[11px] tracking-[0.2em] shadow-sm uppercase border"
          style={{ background: 'rgba(47,107,255,0.1)', color: '#2F6BFF', borderColor: 'rgba(47,107,255,0.3)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(47,107,255,0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(47,107,255,0.1)'; }}
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
          GENEL PARAMETRELERİ KAYDET
        </button>
      </form>
    </motion.div>
  );
}
