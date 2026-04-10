'use client'

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Save, Calendar as CalendarIcon, 
  Settings, TrendingUp, Beaker, 
  MessageSquare, ChevronDown, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { upsertDailyPerformance } from '../performans-actions';

const performanceSchema = z.object({
  locationId: z.string().min(1, 'Lokasyon seçiniz'),
  date: z.string().min(1, 'Tarih seçiniz'),
  sessionCount: z.coerce.number().min(0, 'Geçersiz sayı'),
  testCount: z.coerce.number().min(0, 'Geçersiz sayı'),
  notes: z.string().optional(),
});

type PerformanceFormValues = z.infer<typeof performanceSchema>;

interface DailyPerformanceFormProps {
  locations: any[];
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DailyPerformanceForm({ locations, initialData, onSuccess, onCancel }: DailyPerformanceFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showExtra, setShowExtra] = useState(!!initialData?.extraMetrics?.notlar);

  const form = useForm<PerformanceFormValues>({
    resolver: zodResolver(performanceSchema) as any,
    defaultValues: {
      locationId: initialData?.locationId || '',
      date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      sessionCount: initialData?.sessionCount || 0,
      testCount: initialData?.testCount || 0,
      notes: initialData?.extraMetrics?.notlar || '',
    },
  });

  const selectedLocationId = form.watch('locationId');
  const selectedLocationName = locations.find((loc) => loc.id === selectedLocationId)?.name;

  const onSubmit = async (values: PerformanceFormValues) => {
    setLoading(true);
    try {
      const extraMetrics: Record<string, any> = {};
      if (values.notes) extraMetrics['notlar'] = values.notes;

      const res = await upsertDailyPerformance({
        ...values,
        date: new Date(values.date).toISOString(),
        extraMetrics,
      });

      if (res.success) {
        toast.success('Performans verisi kaydedildi.');
        onSuccess?.();
      } else {
        toast.error(res.error || 'Bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-10">
      {/* Premium Header Card */}
      <section className="relative p-6 sm:p-8 rounded-[32px] bg-slate-900 overflow-hidden shadow-2xl shadow-slate-200">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-white">
          <TrendingUp size={120} />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-blue-400">
            <TrendingUp size={14} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">PERFORMANS GİRİŞİ</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Günlük Veri Girişi</h2>
          <p className="text-sm text-slate-400 font-medium">Şube bazlı günlük seans ve test sayılarını kaydedin.</p>
        </div>
      </section>

      {/* Main Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Lokasyon Seçimi</label>
          <div className="relative group">
            <Settings className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              {...form.register('locationId')}
              className="w-full px-0 py-3 bg-transparent border-b border-slate-200 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Lokasyon Seçiniz...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          {form.formState.errors.locationId && (
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mt-1">{form.formState.errors.locationId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">İşlem Tarihi</label>
          <div className="relative group">
            <CalendarIcon className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              {...form.register('date')}
              className="w-full px-0 py-3 bg-transparent border-b border-slate-200 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Oturum Sayısı (Seans)</label>
          <div className="relative">
            <TrendingUp size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="number"
              {...form.register('sessionCount')}
              className="w-full px-0 py-4 bg-transparent border-b border-slate-200 text-4xl font-black text-slate-900 focus:border-blue-500 outline-none transition-all tabular-nums"
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Test Sayısı</label>
          <div className="relative">
            <Beaker size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="number"
              {...form.register('testCount')}
              className="w-full px-0 py-4 bg-transparent border-b border-slate-200 text-4xl font-black text-slate-900 focus:border-blue-500 outline-none transition-all tabular-nums"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Notes Area */}
      <div className="space-y-4">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Günün Notları (Opsiyonel)</label>
        <textarea
          {...form.register('notes')}
          rows={3}
          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all resize-none"
          placeholder="Bugüne dair özel notlarınız..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-8 py-5 rounded-2xl text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors active:scale-95 disabled:opacity-50"
        >
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-[24px] text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          VERİYİ SİSTEME KAYDET
        </button>
      </div>
    </form>
  );
}



