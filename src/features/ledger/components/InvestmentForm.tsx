'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { addInvestment } from '../actions';
import { Loader2, Plus, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  locations: any[];
}

export function InvestmentForm({ locations }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    const result = await addInvestment(data);
    if (result.success) {
      reset();
      setShowForm(false);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {!showForm ? (
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
              <Wallet className="text-indigo-400" size={20} />
              Yatırım & Demirbaş Girişi
            </h3>
            <button onClick={() => setShowForm(false)} className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest">Vazgeç</button>
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
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
              YATIRIMI KAYDET
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
}
