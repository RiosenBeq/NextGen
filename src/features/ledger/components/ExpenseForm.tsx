'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { addExpense } from '../actions';
import { Loader2, Plus, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  locations: any[];
}

export function ExpenseForm({ locations }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    const result = await addExpense(data);
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
          className="elite-button-primary flex items-center gap-2"
        >
          <Plus size={16} />
          YENİ GİDER EKLE
        </button>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-8 border-emerald-500/20"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Receipt className="text-emerald-500" size={20} />
              Operasyonel Gider Girişi
            </h3>
            <button onClick={() => setShowForm(false)} className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest">Vazgeç</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Gider Açıklaması</label>
                <input {...register('description')} className="elite-input" placeholder="Örn: Elektrik Faturası" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Lokasyon</label>
                <select {...register('locationId')} className="elite-input bg-zinc-900/80">
                  <option value="">Genel / Merkez</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tutar (₺)</label>
                <input type="number" step="0.01" {...register('amount')} className="elite-input" placeholder="0.00" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Kategori</label>
                <select {...register('type')} className="elite-input bg-zinc-900/80">
                  <option value="FATURA">Fatura</option>
                  <option value="MAAS">Maaş / Personel</option>
                  <option value="KİRA">Kira / Aidat</option>
                  <option value="PAZARLAMA">Pazarlama</option>
                  <option value="DİĞER">Diğer</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Resmiyet</label>
                <select {...register('isOfficial')} className="elite-input bg-zinc-900/80">
                  <option value="true">Resmi (Faturalı)</option>
                  <option value="false">Resmi Olmayan</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="elite-button-primary w-full py-4 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
              GİDERİ KAYDET
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
}
