'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { addInvestment, updateInvestment } from '../actions';
import { investmentSchema } from '../schema';
import { Loader2, Plus, Wallet, Edit } from 'lucide-react';
import { motion } from 'framer-motion';

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

  return (
    <div className="space-y-4">
      {!showForm && !initialData ? (
        <button 
          onClick={() => setShowForm(true)}
          className="elite-button-secondary flex items-center gap-2"
        >
          <Plus size={16} />
          YENİ YATIRIM (CAPEX) EKLE
        </button>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-8 border-indigo-500/20"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              {initialData ? <Edit className="text-indigo-400" size={20} /> : <Wallet className="text-indigo-400" size={20} />}
              {initialData ? 'Yatırım Güncelleme' : 'Yatırım & Demirbaş Girişi'}
            </h3>
            <button onClick={handleClose} type="button" className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest">Vazgeç</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Yatırım Kalemi</label>
                <input {...register('description')} className="elite-input" placeholder="Örn: 5x Yeni Nesil Kabin" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Lokasyon</label>
                <select {...register('locationId')} className="elite-input bg-zinc-900/80">
                  <option value="">Lokasyon Seçin</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tutar</label>
                <input type="number" step="0.01" {...register('amount')} className="elite-input" placeholder="0.00" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Para Birimi</label>
                <select {...register('currency')} className="elite-input bg-zinc-900/80">
                  <option value="TL">Turkish Lira (₺)</option>
                  <option value="USD">Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Notlar (Opsiyonel)</label>
                <input type="text" {...register('notes')} className="elite-input" placeholder="..." />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="elite-button-secondary w-full py-4 flex items-center justify-center gap-2 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? <Edit size={16} /> : <Plus size={16} />)}
              {initialData ? 'YATIRIMI GÜNCELLE' : 'YATIRIMI KAYDET'}
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
}
