'use client';

import { useState } from 'react';
import { updateSystemParameter } from '../actions';
import { Loader2, Save, Settings2, DollarSign, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  parameters: Record<string, number>;
}

const inputBase =
  'w-full px-4 py-3 rounded-xl bg-[--bg-elevated] border border-transparent text-[15px] text-[--text] placeholder:text-[--text-tertiary] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors duration-200 tabular-nums min-h-[44px]';

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
      className="apple-card p-5 sm:p-6 md:p-8"
    >
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <p className="apple-eyebrow flex items-center gap-2">
            <Settings2 size={14} strokeWidth={1.75} /> Finans
          </p>
          <h3 className="apple-title-1 mt-2">Finansal Yapılandırma</h3>
          <p className="text-[14px] text-[--text-secondary] mt-2">Sistem geneli parametreler.</p>
        </div>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="chip-accent inline-flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[--accent]" />
            Güncellendi
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[--text] flex items-center gap-2">
              <DollarSign size={14} strokeWidth={1.75} className="text-[--text-tertiary]" /> Oturum Fiyatı (₺)
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
            <label className="text-[13px] font-medium text-[--text] flex items-center gap-2">
              <Percent size={14} strokeWidth={1.75} className="text-[--text-tertiary]" /> Genel KDV Oranı (%)
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
            <label className="text-[13px] font-medium text-[--text] flex items-center gap-2">
              <Percent size={14} strokeWidth={1.75} className="text-[--text-tertiary]" /> Kurumlar Vergisi (%)
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

        <div className="pt-6 border-t border-[--border] flex justify-end">
          <button type="submit" disabled={isSubmitting} className="elite-button-primary">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Save size={16} strokeWidth={1.75} />}
            Kaydet
          </button>
        </div>
      </form>
    </motion.div>
  );
}
