'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { addInvestment, updateInvestment } from '../actions';
import { Loader2, Save, Wallet, Trash2, ChevronDown, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface Props {
  locations: any[];
  initialData?: any;
  onClose?: () => void;
}

export function InvestmentForm({ locations, initialData, onClose }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: initialData || {
      currency: 'TL',
    }
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      let result;
      if (initialData?.id) {
        result = await updateInvestment(initialData.id, data);
      } else {
        result = await addInvestment(data);
      }

      if (result.success) {
        toast.success(initialData ? 'Yatırım güncellendi.' : 'Yatırım kaydedildi.');
        if (onClose) onClose();
      } else {
        toast.error(result.error || 'İşlem başarısız.');
      }
    } catch (err) {
      toast.error('Beklenmeyen bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-10">
      {/* Premium Header Card */}
      <section className="relative p-6 sm:p-8 rounded-[32px] bg-slate-900 overflow-hidden shadow-2xl shadow-slate-200">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-white">
          <Wallet size={120} />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-indigo-400">
            <Wallet size={14} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">YATIRIM & CAPEX</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {initialData ? 'Yatırım Güncelle' : 'Yatırım Kaydedin'}
          </h2>
          <p className="text-sm text-slate-400 font-medium">Demirbaş alımı ve büyük ölçekli yatırım girişleri.</p>
        </div>
      </section>

      {/* Main Details */}
      <div className="space-y-8">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Yatırım Kalemi (Açıklama)</label>
          <input 
            {...register('description')} 
            required
            placeholder="Örn: Sunucu alımı, yeni şube tadilatı..."
            className="w-full px-0 py-3 bg-transparent border-b border-slate-200 text-lg font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Lokasyon</label>
            <div className="relative">
              <select 
                {...register('locationId')} 
                className="w-full px-0 py-3 bg-transparent border-b border-slate-200 text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Lokasyon Seçin</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Para Birimi</label>
            <div className="relative">
              <Globe size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select 
                {...register('currency')} 
                className="w-full px-0 py-3 bg-transparent border-b border-slate-200 text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="TL">Türk Lirası (₺)</option>
                <option value="USD">Amerikan Doları ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Amount Hero */}
      <div className="space-y-4">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Yatırım Tutarı</label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            {...register('amount')}
            required
            className="w-full px-0 py-4 bg-transparent border-b border-slate-200 text-5xl font-black text-slate-900 focus:border-indigo-500 outline-none transition-all tabular-nums"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Notlar (Opsiyonel)</label>
        <textarea 
          {...register('notes')} 
          rows={3}
          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-semibold text-slate-700 focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all resize-none"
          placeholder="Yatırıma dair detaylar..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-4">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-8 py-5 rounded-2xl text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors active:scale-95 disabled:opacity-50"
          >
            Vazgeç
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {initialData ? 'YATIRIMI GÜNCELLE' : 'YATIRIMI KAYDET'}
        </button>
      </div>
    </form>
  );
}

