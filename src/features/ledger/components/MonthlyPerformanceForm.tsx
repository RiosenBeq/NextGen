'use client';

import { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { monthlyPerformanceSchema, MonthlyPerformanceInput } from '../schema';
import { addMonthlyPerformance } from '../actions';
import { calculateMonthlyCashFlow } from '../calculations';
import { Loader2, Plus, TrendingUp, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  locations: any[];
}

export function MonthlyPerformanceForm({ locations }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<MonthlyPerformanceInput>({
    resolver: zodResolver(monthlyPerformanceSchema),
    defaultValues: {
      locationId: '',
      month: new Date().toISOString().substring(0, 7) + '-01T00:00:00.000Z', 
      sessionCount: 0,
      extraExpenseAmount: 0,
      extraExpenseNotes: '',
    }
  });

  const watchedValues = useWatch({ control });

  const livePreview = useMemo(() => {
    const loc = locations.find(l => l.id === watchedValues.locationId);
    if (!loc || !watchedValues.sessionCount) return null;

    // We use a simplified preview calculation here or mock params if they are not passed
    // In a real scenario, we might want to fetch system parameters for the preview too
    return calculateMonthlyCashFlow(
      watchedValues.sessionCount || 0,
      watchedValues.extraExpenseAmount || 0,
      {
        sessionPrice: 300, // Shared defaults
        kdvRate: 20,
        totalCommissionRate: 4,
        alpShareRate: 50,
        ngbShareRate: 50,
        fixedRent: loc.fixedRent || 0,
        duesAmount: loc.duesAmount || 0,
        rentKdvRate: loc.rentVatRate || 20,
        revenueShareRate: loc.revenueShareRate || 0,
        revenueThreshold: loc.revenueThreshold || 0,
        applyRentVat: true,
      }
    );
  }, [watchedValues, locations]);

  const onSubmit = async (data: MonthlyPerformanceInput) => {
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    data.month = new Date(data.month).toISOString();
    const result = await addMonthlyPerformance(data);
    if (result.success) {
      setSuccessMsg('Aylık performans başarıyla işlendi.');
      reset();
      setTimeout(() => setSuccessMsg(''), 5000);
    } else {
      setErrorMsg(result.error || 'İşlem başarısız');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-7 premium-card p-8 lg:p-10"
      >
        <header className="mb-10">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-2">Performans Kaydı</h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">Kabinrapor verilerini sisteme aktarın</p>
        </header>
        
        <AnimatePresence>
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 mb-8 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-500/20"
            >
              ✓ {successMsg}
            </motion.div>
          )}
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 mb-8 bg-rose-500/10 text-rose-400 rounded-xl text-xs font-black uppercase tracking-widest border border-rose-500/20"
            >
              ⚠ {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Lokasyon / AVM</label>
              <select {...register('locationId')} className="elite-input appearance-none bg-zinc-900/80">
                <option value="" className="bg-zinc-950">Lokasyon Seçin</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-zinc-950">{loc.name}</option>
                ))}
              </select>
              {errors.locationId && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-tight">{errors.locationId.message as string}</p>}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Dönem (Ay)</label>
              <input type="date" {...register('month')} className="elite-input bg-zinc-900/80 [color-scheme:dark]" />
              {errors.month && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-tight">{errors.month.message as string}</p>}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Toplam Oturum Adedi</label>
            <div className="relative">
              <input
                type="number"
                {...register('sessionCount', { valueAsNumber: true })}
                placeholder="0"
                className="elite-input text-2xl font-black py-6 border-emerald-500/20 focus:border-emerald-500/40 bg-zinc-900/80"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
            {errors.sessionCount && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-tight">{errors.sessionCount.message as string}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Ekstra Gider (₺)</label>
              <input
                type="number"
                {...register('extraExpenseAmount', { valueAsNumber: true })}
                placeholder="0.00"
                step="0.01"
                className="elite-input"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Gider Açıklaması</label>
              <input type="text" {...register('extraExpenseNotes')} placeholder="Örn: Kabin Tamiri" className="elite-input" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="elite-button-primary w-full py-5 flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            <span className="relative z-10">Kaydı Onayla ve Gönder</span>
          </button>
        </form>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-5 space-y-6"
      >
        <div className="premium-card p-10 bg-gradient-to-br from-zinc-900 to-black relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Info size={120} strokeWidth={1} />
          </div>
          
          <h3 className="text-xl font-black text-white tracking-tighter mb-8 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Anlık Projeksiyon
          </h3>

          <div className="space-y-10">
            {livePreview ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tahmini Brüt Gelir</p>
                   <p className="text-3xl font-black text-white">₺{livePreview.grossRevenue.toLocaleString('tr-TR')}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Tahmini Gider</p>
                    <p className="text-lg font-black text-white">₺{livePreview.totalExpense.toLocaleString('tr-TR')}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Tahmini Net Kar</p>
                    <p className="text-lg font-black text-white">₺{livePreview.netCash.toLocaleString('tr-TR')}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                   <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4">Pay Analizi</p>
                   <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-zinc-400">Partner (Alp %50)</span>
                        <span className="text-sm font-black text-white">₺{livePreview.alpShare.toLocaleString('tr-TR')}</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="w-1/2 h-full bg-emerald-500" />
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-zinc-400">NextGenBox (%50)</span>
                        <span className="text-sm font-black text-white">₺{livePreview.ngbShare.toLocaleString('tr-TR')}</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="w-1/2 h-full bg-indigo-500" />
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-4 opacity-30">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-500 mx-auto animate-spin-slow flex items-center justify-center">
                   <TrendingUp className="text-zinc-500" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest">Veri bekleniyor...</p>
              </div>
            )}
          </div>
        </div>

        <div className="premium-card p-8 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
             <Info className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-300 leading-relaxed">
              Hesaplamalar, lokasyon bazlı tanımlanmış <span className="text-indigo-400">Sabit Kira</span>, <span className="text-indigo-400">Aidat</span> ve <span className="text-indigo-400">Ciro Payı</span> eşiklerine göre anlık yapılmaktadır.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
