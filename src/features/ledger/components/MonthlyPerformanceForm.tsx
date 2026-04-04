'use client';

import { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { monthlyPerformanceSchema, MonthlyPerformanceInput } from '../schema';
import { addMonthlyPerformance } from '../actions';
import { calculateMonthlyCashFlow } from '../calculations';
import { Loader2, Plus, TrendingUp, Info, CheckCircle2, Zap, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getKabinRaporSessions } from '../actions';

interface Props {
  locations: any[];
  sessionPrice: number;
}

export function MonthlyPerformanceForm({ locations, sessionPrice }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

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

    return calculateMonthlyCashFlow(
      watchedValues.sessionCount || 0,
      watchedValues.extraExpenseAmount || 0,
      {
        sessionPrice,
        iyzicoCommissionRate: 2,
        nayaxCommissionRate: 2,
        fixedRent: loc.fixedRent || 0,
        duesAmount: loc.duesAmount || 0,
        revenueShareRate: loc.revenueShareRate || 0,
      }
    );
  }, [watchedValues, locations]);

  const handleSync = async () => {
    const locId = watchedValues.locationId;
    const month = watchedValues.month;
    
    if (!locId || !month) {
      setErrorMsg('Lütfen önce lokasyon ve dönemi seçin.');
      return;
    }

    setIsSyncing(true);
    setErrorMsg('');
    try {
      const result = await getKabinRaporSessions(locId, month);
      if (result.success) {
        reset({ ...watchedValues as any, sessionCount: result.sessions });
        setSuccessMsg(`KabinRapor verisi başarıyla çekildi: ${result.sessions} seans`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setErrorMsg(`API Hatası: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const onSubmit = async (data: MonthlyPerformanceInput) => {
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    const result = await addMonthlyPerformance({
      ...data,
      month: new Date(data.month as string).toISOString()
    } as any);
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-7 premium-card p-6 lg:p-8"
      >
        <header className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Performans Kaydı</h2>
          <p className="text-xs text-slate-400">KabinRapor verilerini sisteme aktarın</p>
        </header>
        
        <AnimatePresence>
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 mb-6 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200 flex items-center gap-2"
            >
              <CheckCircle2 size={14} />
              {successMsg}
            </motion.div>
          )}
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 mb-6 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-200"
            >
              ⚠ {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Lokasyon / AVM</label>
              <select {...register('locationId')} className="elite-input appearance-none cursor-pointer">
                <option value="">Lokasyon Seçin</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              {errors.locationId && <p className="text-red-500 text-xs">{errors.locationId.message as string}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Dönem (Ay)</label>
              <input type="date" {...register('month')} className="elite-input cursor-pointer" />
              {errors.month && <p className="text-red-500 text-xs">{errors.month.message as string}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600">Toplam Oturum Adedi</label>
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 transition-colors disabled:opacity-50"
              >
                {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                Canlı Veriden Doldur
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                {...register('sessionCount', { valueAsNumber: true })}
                placeholder="0"
                className="elite-input text-xl font-bold py-4"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            {errors.sessionCount && <p className="text-red-500 text-xs">{errors.sessionCount.message as string}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Ekstra Gider (₺)</label>
              <input
                type="number"
                {...register('extraExpenseAmount', { valueAsNumber: true })}
                placeholder="0.00"
                step="0.01"
                className="elite-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Gider Açıklaması</label>
              <input type="text" {...register('extraExpenseNotes')} placeholder="Örn: Kabin Tamiri" className="elite-input" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="elite-button-primary w-full py-3.5 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Kaydı Onayla ve Gönder
          </button>
        </form>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        className="lg:col-span-5 space-y-5"
      >
        {/* Live Preview */}
        <div className="premium-card p-6 relative overflow-hidden">
          <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Anlık Projeksiyon
          </h3>

          <div className="space-y-6">
            {livePreview ? (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-1">
                   <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Tahmini Brüt Gelir</p>
                   <p className="text-2xl font-bold text-slate-900">₺{livePreview.grossRevenue.toLocaleString('tr-TR')}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-[9px] font-semibold text-red-500 uppercase tracking-wide mb-1">Tahmini Gider</p>
                    <p className="text-base font-bold text-slate-900">₺{livePreview.totalExpense.toLocaleString('tr-TR')}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">Tahmini Net</p>
                    <p className="text-base font-bold text-slate-900">₺{livePreview.netCash.toLocaleString('tr-TR')}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                   <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Pay Analizi (%25)</p>
                   <div className="space-y-2">
                      {[
                        { name: 'Okan', amount: livePreview.okanShare },
                        { name: 'Talha', amount: livePreview.talhaShare },
                        { name: 'Furkan', amount: livePreview.furkanShare },
                        { name: 'Alp', amount: livePreview.alpShare },
                      ].map((partner) => (
                        <div key={partner.name} className="flex justify-between items-center">
                          <span className="text-xs font-medium text-slate-500">{partner.name}</span>
                          <span className="text-sm font-bold text-slate-800">₺{partner.amount.toLocaleString('tr-TR')}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-200 mx-auto flex items-center justify-center">
                   <TrendingUp className="text-slate-300" size={20} />
                </div>
                <p className="text-xs text-slate-400">Lokasyon ve oturum sayısı girin</p>
              </div>
            )}
          </div>
        </div>

        <div className="premium-card p-5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
             <Info className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hesaplamalar, lokasyon bazlı tanımlanmış <span className="text-blue-600 font-semibold">Sabit Kira</span>, <span className="text-blue-600 font-semibold">Aidat</span> ve <span className="text-blue-600 font-semibold">Ciro Payı</span> eşiklerine göre anlık yapılmaktadır.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
