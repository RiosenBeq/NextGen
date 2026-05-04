'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { addInvestment, updateInvestment } from '../actions';
import { investmentSchema } from '../schema';
import { Loader2, Plus, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InvestmentFormLocation {
  id: string;
  name: string;
}

type InvestmentFormValues = z.input<typeof investmentSchema>;

interface InvestmentFormInitialData {
  id?: string;
  description?: string;
  locationId?: string | null;
  amount?: number | string;
  currency?: string;
  notes?: string | null;
}

interface Props {
  locations: InvestmentFormLocation[];
  initialData?: InvestmentFormInitialData;
  onClose?: () => void;
}

const inputBase = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150";

export function InvestmentForm({ locations, initialData, onClose }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(!!initialData);

  const { register, handleSubmit, reset } = useForm<InvestmentFormValues>({
    defaultValues: (initialData ?? {}) as Partial<InvestmentFormValues>
  });

  const onSubmit = async (data: InvestmentFormValues) => {
    setIsSubmitting(true);
    let result;
    if (initialData?.id) {
      result = await updateInvestment(initialData.id, data);
    } else {
      result = await addInvestment(data);
    }

    if (result.success && !initialData) {
      reset();
      setShowForm(false);
    } else if (result.success && initialData) {
      if (onClose) onClose();
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (onClose) onClose();
    else setShowForm(false);
  };

  if (!showForm && !initialData) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
      >
        <Plus size={16} />
        Yeni Yatırım (CAPEX) Ekle
      </button>
    );
  }

  const content = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Yatırım Kalemi</label>
          <input
            {...register('description')}
            className={inputBase}
            placeholder="Örn: 5x Yeni Nesil Kabin"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Lokasyon</label>
          <select {...register('locationId')} className={cn(inputBase, "appearance-none cursor-pointer")}>
            <option value="">Lokasyon Seçin</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Tutar</label>
          <input
            type="number"
            step="0.01"
            {...register('amount')}
            className={inputBase}
            placeholder="0.00"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Para Birimi</label>
          <select {...register('currency')} className={cn(inputBase, "appearance-none cursor-pointer")}>
            <option value="TL">Turkish Lira (₺)</option>
            <option value="USD">Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Notlar (Opsiyonel)</label>
          <input type="text" {...register('notes')} className={inputBase} placeholder="..." />
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200/70 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? <Edit size={16} /> : <Plus size={16} />)}
          {initialData ? 'Yatırımı Güncelle' : 'Yatırımı Kaydet'}
        </button>
      </div>
    </form>
  );

  if (initialData) {
    // Inside modal — no extra wrapper
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.08)]"
    >
      {content}
    </motion.div>
  );
}
