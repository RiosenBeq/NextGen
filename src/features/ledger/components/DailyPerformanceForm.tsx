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

const inputBase = "w-full px-4 py-3 rounded-xl bg-[--bg-elevated] border border-transparent text-[15px] text-[--text] placeholder:text-[--text-tertiary] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors duration-200 min-h-[44px]";

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
    <div className="p-5 md:p-6">
      <div className="mb-6">
        <p className="apple-eyebrow">Günlük Giriş</p>
        <h2 className="apple-title-1 mt-2">Performans Verisi</h2>
        {selectedLocationName && (
          <p className="mt-3 inline-flex items-center chip">
            {selectedLocationName}
          </p>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[--text]">Lokasyon</label>
            <select
              {...form.register('locationId')}
              className={cn(
                inputBase,
                "appearance-none cursor-pointer",
                form.formState.errors.locationId && "border-[--danger]"
              )}
            >
              <option value="">Seçiniz…</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            {form.formState.errors.locationId && (
              <p className="text-[12px] text-[--danger] mt-1">{form.formState.errors.locationId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[--text]">Tarih</label>
            <input
              type="date"
              {...form.register('date')}
              className={inputBase}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[--text]">Oturum Sayısı</label>
            <div className="relative">
              <input
                type="number"
                {...form.register('sessionCount')}
                className={cn(inputBase, "pr-16")}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[--text-tertiary]">seans</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[--text]">Test Sayısı</label>
            <div className="relative">
              <input
                type="number"
                {...form.register('testCount')}
                className={cn(inputBase, "pr-16")}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[--text-tertiary]">test</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[--border]">
          <button
            type="button"
            onClick={() => setShowExtra(!showExtra)}
            className="flex items-center gap-2 text-[14px] font-medium text-[--text-secondary] hover:text-[--text] transition-colors"
          >
            <Plus className={cn("w-4 h-4 transition-transform duration-200", showExtra && "rotate-45")} strokeWidth={1.75} />
            Notlar Ekle
          </button>

          <AnimatePresence>
            {showExtra && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="mt-4 space-y-2"
              >
                <label className="text-[13px] font-medium text-[--text] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[--text-tertiary]" strokeWidth={1.75} /> Notlar
                </label>
                <textarea
                  {...form.register('notes')}
                  placeholder="Günün notunu giriniz…"
                  className={`${inputBase} min-h-[80px] resize-none`}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pt-6 border-t border-[--border] flex items-center justify-end gap-3">
          {onCancel && (
            <button type="button" onClick={onCancel} className="elite-button-secondary">
              Vazgeç
            </button>
          )}
          <button type="submit" disabled={loading} className="elite-button-primary">
            {loading ? <TrendingUp className="w-4 h-4 animate-pulse" strokeWidth={1.75} /> : <Save size={16} strokeWidth={1.75} />}
            {loading ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
