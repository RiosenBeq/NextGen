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

const inputBase = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150";

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
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-white border border-slate-200 rounded-2xl p-8 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center text-slate-500">
            <Building size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">{location.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{location.id}</p>
          </div>
        </div>
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Güncellendi
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Sabit Kira (₺)</label>
            <input
              name="fixedRent"
              type="number"
              defaultValue={location.fixedRent}
              className={inputBase}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Aidat / Ortak Gider (₺)</label>
            <input
              name="duesAmount"
              type="number"
              defaultValue={location.duesAmount}
              className={inputBase}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Kira KDV Oranı (%)</label>
            <input
              name="rentVatRate"
              type="number"
              defaultValue={location.rentVatRate}
              className={inputBase}
              placeholder="20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Ciro Payı Oranı (%)</label>
            <input
              name="revenueShareRate"
              type="number"
              defaultValue={location.revenueShareRate}
              className={inputBase}
              placeholder="0"
            />
            <p className="text-xs text-slate-500">Eşik üzerindeki ciroya uygulanır</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Ciro Eşiği (₺)</label>
            <input
              name="revenueThreshold"
              type="number"
              defaultValue={location.revenueThreshold}
              className={inputBase}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200/70 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            Lokasyon Ayarlarını Kaydet
          </button>
        </div>
      </form>
    </motion.div>
  );
}
