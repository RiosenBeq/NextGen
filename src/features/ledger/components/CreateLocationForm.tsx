'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLocation } from '../actions';
import { Loader2, Plus, Building2, X } from 'lucide-react';
import { motion } from 'framer-motion';

const inputBase =
  'w-full px-4 py-3 rounded-xl bg-[--bg-elevated] border border-transparent text-[15px] text-[--text] placeholder:text-[--text-tertiary] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors duration-200 min-h-[44px] tabular-nums';

export function CreateLocationForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      name: String(formData.get('name') || ''),
      sessionPrice: Number(formData.get('sessionPrice')),
      fixedRent: Number(formData.get('fixedRent')),
      duesAmount: Number(formData.get('duesAmount')),
      rentVatRate: Number(formData.get('rentVatRate')),
      revenueShareRate: Number(formData.get('revenueShareRate')),
      revenueThreshold: Number(formData.get('revenueThreshold')),
    };

    const result = await createLocation(data);
    setIsSubmitting(false);

    if (result.success) {
      form.reset();
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error || 'AVM oluşturulamadı.');
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="apple-card p-5 sm:p-6 w-full flex items-center gap-3 text-left hover:border-[--accent] transition-colors duration-200 border border-dashed border-[--border]"
      >
        <div className="w-11 h-11 rounded-full bg-[--bg-elevated] flex items-center justify-center text-[--accent]">
          <Plus size={18} strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-[16px] font-semibold text-[--text]">Yeni AVM Ekle</h3>
          <p className="text-[13px] text-[--text-tertiary] mt-0.5">Oturum başı ücret ve finansal parametrelerle yeni bir lokasyon oluşturun.</p>
        </div>
      </button>
    );
  }

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
            <Building2 size={18} strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-[18px] md:text-[20px] font-semibold text-[--text]" style={{ letterSpacing: '-0.014em' }}>Yeni AVM</h3>
            <p className="text-[12px] text-[--text-tertiary] mt-0.5">Tüm değerler daha sonra düzenlenebilir.</p>
          </div>
        </div>
        <button type="button" onClick={() => { setOpen(false); setError(null); }} className="text-[--text-tertiary] hover:text-[--text] transition-colors">
          <X size={20} strokeWidth={1.75} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-[--text]">AVM Adı</label>
          <input name="name" type="text" required className={inputBase} placeholder="Örn. Maltepe Park AVM" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[--text]">Oturum Başı Ücret (₺)</label>
            <input name="sessionPrice" type="number" step="any" defaultValue={300} className={inputBase} placeholder="300" />
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[--text]">Sabit Kira (₺)</label>
            <input name="fixedRent" type="number" step="any" defaultValue={0} className={inputBase} placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[--text]">Aidat / Ortak Gider (₺)</label>
            <input name="duesAmount" type="number" step="any" defaultValue={0} className={inputBase} placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[--text]">Kira KDV Oranı (%)</label>
            <input name="rentVatRate" type="number" step="any" defaultValue={20} className={inputBase} placeholder="20" />
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[--text]">Ciro Payı Oranı (%)</label>
            <input name="revenueShareRate" type="number" step="any" defaultValue={0} className={inputBase} placeholder="0" />
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[--text]">Ciro Eşiği (₺)</label>
            <input name="revenueThreshold" type="number" step="any" defaultValue={0} className={inputBase} placeholder="0.00" />
          </div>
        </div>

        {error && (
          <p className="text-[13px] text-red-500">{error}</p>
        )}

        <div className="pt-6 border-t border-[--border] flex justify-end gap-3">
          <button type="button" onClick={() => { setOpen(false); setError(null); }} className="elite-button-secondary">
            İptal
          </button>
          <button type="submit" disabled={isSubmitting} className="elite-button-primary">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Plus size={16} strokeWidth={1.75} />}
            AVM Oluştur
          </button>
        </div>
      </form>
    </motion.div>
  );
}
