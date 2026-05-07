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

const inputBase = "w-full px-4 py-3 rounded-xl bg-[--bg-elevated] border border-transparent text-[15px] text-[--text] placeholder:text-[--text-tertiary] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors duration-200 min-h-[44px]";

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
      <button onClick={() => setShowForm(true)} className="elite-button-secondary">
        <Plus size={16} strokeWidth={1.75} />
        Yeni Yatırım Ekle
      </button>
    );
  }

  const content = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-[--text]">Yatırım Kalemi</label>
          <input
            {...register('description')}
            className={inputBase}
            placeholder="Örn: 5x Yeni Nesil Kabin"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-[--text]">Lokasyon</label>
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
          <label className="text-[13px] font-medium text-[--text]">Tutar</label>
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
          <label className="text-[13px] font-medium text-[--text]">Para Birimi</label>
          <select {...register('currency')} className={cn(inputBase, "appearance-none cursor-pointer")}>
            <option value="TRY">Türk Lirası (₺)</option>
            <option value="USD">Dolar ($)</option>
            <option value="EUR">Euro (€)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-[--text]">Notlar (Opsiyonel)</label>
          <input type="text" {...register('notes')} className={inputBase} placeholder="..." />
        </div>
      </div>

      <div className="pt-6 border-t border-[--border] flex items-center justify-end gap-3">
        <button type="button" onClick={handleClose} disabled={isSubmitting} className="elite-button-secondary">
          Vazgeç
        </button>
        <button type="submit" disabled={isSubmitting} className="elite-button-primary">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : (initialData ? <Edit size={16} strokeWidth={1.75} /> : <Plus size={16} strokeWidth={1.75} />)}
          {initialData ? 'Güncelle' : 'Kaydet'}
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="apple-card p-6"
    >
      {content}
    </motion.div>
  );
}
