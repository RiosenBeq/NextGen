'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, Save, Calendar as CalendarIcon, 
  Settings, TrendingUp, Beaker, 
  MessageSquare, Trash2, ChevronDown
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
        form.reset({
          ...values,
          sessionCount: 0,
          testCount: 0,
          notes: '',
        });
        onSuccess?.();
      } else {
        alert(res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-card p-6 border border-slate-200 bg-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Günlük Performans Girişi</h2>
          <p className="text-xs text-slate-500 font-medium italic">Sistemi manuel verilerle besle</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" /> Lokasyon
            </label>
            <select
              {...form.register('locationId')}
              className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all outline-none appearance-none"
            >
              <option value="">Seçiniz...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            {form.formState.errors.locationId && (
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">{form.formState.errors.locationId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <CalendarIcon className="w-3.5 h-3.5" /> Tarih
            </label>
            <input
              type="date"
              {...form.register('date')}
              className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> Oturum Sayısı
            </label>
            <div className="relative">
              <input
                type="number"
                {...form.register('sessionCount')}
                className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">Seans</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <Beaker className="w-3.5 h-3.5" /> Test Sayısı
            </label>
            <div className="relative">
              <input
                type="number"
                {...form.register('testCount')}
                className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">Test</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 mt-4">
           <button 
             type="button" 
             onClick={() => setShowExtra(!showExtra)}
             className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
           >
             <Plus className={cn("w-3.5 h-3.5 transition-transform", showExtra ? "rotate-45" : "0")} />
             Notlar Ekle
           </button>

           <AnimatePresence>
             {showExtra && (
               <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" /> Notlar
                    </label>
                    <textarea
                      {...form.register('notes')}
                      placeholder="Günün notunu giriniz..."
                      className="w-full h-20 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:border-blue-400 transition-all outline-none resize-none"
                    />
                  </div>
               </div>
             )}
           </AnimatePresence>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full h-12 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-lg shadow-slate-200 flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98]",
            loading && "opacity-70 cursor-not-allowed"
          )}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save size={18} />
              Veriyi Kaydet
            </>
          )}
        </button>
      </form>
    </div>
  );
}


