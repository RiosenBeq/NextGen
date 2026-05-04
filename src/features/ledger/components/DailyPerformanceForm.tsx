'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus, Save, TrendingUp, MessageSquare
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { upsertDailyPerformance } from '../performans-actions';
import { toast } from '@/hooks/useToast';

const performanceSchema = z.object({
  locationId: z.string().min(1, 'Lokasyon seçiniz'),
  date: z.string().min(1, 'Tarih seçiniz'),
  sessionCount: z.coerce.number().min(0, 'Geçersiz sayı'),
  testCount: z.coerce.number().min(0, 'Geçersiz sayı'),
  notes: z.string().optional(),
});

type PerformanceFormInput = z.input<typeof performanceSchema>;
type PerformanceFormValues = z.output<typeof performanceSchema>;

interface LocationOption {
  id: string;
  name: string;
}

interface DailyPerformanceInitialData {
  locationId?: string;
  date?: string | Date;
  sessionCount?: number;
  testCount?: number;
  extraMetrics?: { notlar?: string } | null;
}

interface DailyPerformanceFormProps {
  locations: LocationOption[];
  initialData?: DailyPerformanceInitialData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const inputBase = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150";

export default function DailyPerformanceForm({ locations, initialData, onSuccess, onCancel }: DailyPerformanceFormProps) {
  const [loading, setLoading] = useState(false);
  const [showExtra, setShowExtra] = useState(!!initialData?.extraMetrics?.notlar);

  const form = useForm<PerformanceFormInput, unknown, PerformanceFormValues>({
    resolver: zodResolver(performanceSchema),
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
      const extraMetrics: Record<string, string> = {};
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
        toast.error(res.error || 'İşlem sırasında bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8">
      <div className="mb-6 space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Günlük Performans Girişi</h2>
        <p className="text-sm text-slate-500">Sistemi manuel verilerle besle</p>
        {selectedLocationName && (
          <p className="mt-2 inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            Şube: {selectedLocationName}
          </p>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Lokasyon</label>
            <select
              {...form.register('locationId')}
              className={cn(
                inputBase,
                "appearance-none cursor-pointer",
                form.formState.errors.locationId && "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
              )}
            >
              <option value="">Seçiniz...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            {form.formState.errors.locationId && (
              <p className="text-xs text-rose-600 mt-1">{form.formState.errors.locationId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Tarih</label>
            <input
              type="date"
              {...form.register('date')}
              className={inputBase}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Oturum Sayısı</label>
            <div className="relative">
              <input
                type="number"
                {...form.register('sessionCount')}
                className={cn(inputBase, "pr-16")}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">Seans</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Test Sayısı</label>
            <div className="relative">
              <input
                type="number"
                {...form.register('testCount')}
                className={cn(inputBase, "pr-16")}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">Test</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200/70">
          <button
            type="button"
            onClick={() => setShowExtra(!showExtra)}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
          >
            <Plus className={cn("w-4 h-4 transition-transform duration-150", showExtra && "rotate-45")} />
            Notlar Ekle
          </button>

          <AnimatePresence>
            {showExtra && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="mt-4 space-y-1.5"
              >
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400" /> Notlar
                </label>
                <textarea
                  {...form.register('notes')}
                  placeholder="Günün notunu giriniz..."
                  className={`${inputBase} min-h-[80px] resize-none`}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pt-6 border-t border-slate-200/70 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
            >
              Vazgeç
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <TrendingUp className="w-4 h-4 animate-pulse" />
            ) : (
              <Save size={16} />
            )}
            {loading ? 'Kaydediliyor...' : 'Veriyi Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
