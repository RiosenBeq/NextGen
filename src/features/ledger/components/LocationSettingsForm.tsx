'use client';

import { useState } from 'react';
import { updateLocationParameters } from '../actions';
import { Loader2, Save, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const inputBase = "w-full px-4 py-3 rounded-xl bg-[--bg-elevated] border border-transparent text-[15px] text-[--text] placeholder:text-[--text-tertiary] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors duration-200 min-h-[44px] tabular-nums";

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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="apple-card p-5 sm:p-6 md:p-8"
    >
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[--bg-elevated] flex items-center justify-center text-[--text-secondary]">
            <Building size={18} strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-[18px] md:text-[20px] font-semibold text-[--text]" style={{ letterSpacing: '-0.014em' }}>{location.name}</h3>
            <p className="text-[12px] text-[--text-tertiary] mt-0.5 tabular-nums">{location.id}</p>
          </div>
        </div>
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="chip-accent inline-flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[--accent]" />
              Güncellendi
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[--text]">Sabit Kira (₺)</label>
            <input
              name="fixedRent"
              type="number"
              defaultValue={location.fixedRent}
              className={inputBase}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[--text]">Aidat / Ortak Gider (₺)</label>
            <input
              name="duesAmount"
              type="number"
              defaultValue={location.duesAmount}
              className={inputBase}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[--text]">Kira KDV Oranı (%)</label>
            <input
              name="rentVatRate"
              type="number"
              defaultValue={location.rentVatRate}
              className={inputBase}
              placeholder="20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[--text]">Ciro Payı Oranı (%)</label>
            <input
              name="revenueShareRate"
              type="number"
              defaultValue={location.revenueShareRate}
              className={inputBase}
              placeholder="0"
            />
            <p className="text-[12px] text-[--text-tertiary]">Eşik üzerindeki ciroya uygulanır</p>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[--text]">Ciro Eşiği (₺)</label>
            <input
              name="revenueThreshold"
              type="number"
              defaultValue={location.revenueThreshold}
              className={inputBase}
              placeholder="0.00"
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
