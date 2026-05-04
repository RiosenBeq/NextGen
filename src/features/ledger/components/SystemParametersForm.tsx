'use client';

import { useState } from 'react';
import { updateSystemParameter } from '../actions';
import { Loader2, Save, Settings2, DollarSign, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  parameters: Record<string, number>;
}

const inputBase =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 tabular-nums';

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
      console.error(e);
    }

    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="p-6 md:p-8 bg-white border border-slate-200/70 rounded-2xl"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
            <Settings2 size={20} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Finansal Yapılandırma</h3>
            <p className="text-sm text-slate-500 mt-0.5">Sistem geneli parametreler.</p>
          </div>
        </div>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-600 text-xs font-medium inline-flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Başarıyla güncellendi
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <DollarSign size={14} className="text-slate-400" /> Oturum Fiyatı (₺)
            </label>
            <input
              name="SESSION_PRICE_INCL_VAT"
              type="number"
              defaultValue={parameters['SESSION_PRICE_INCL_VAT'] || 300}
              className={inputBase}
              placeholder="300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Percent size={14} className="text-slate-400" /> Genel KDV Oranı (%)
            </label>
            <input
              name="VAT_RATE"
              type="number"
              defaultValue={parameters['VAT_RATE'] || 0}
              className={inputBase}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Percent size={14} className="text-slate-400" /> Kurumlar Vergisi (%)
            </label>
            <input
              name="CORP_TAX_RATE"
              type="number"
              defaultValue={parameters['CORP_TAX_RATE'] || 0}
              className={inputBase}
              placeholder="0"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200/70 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl font-medium text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            Değişiklikleri kaydet
          </button>
        </div>
      </form>
    </motion.div>
  );
}
