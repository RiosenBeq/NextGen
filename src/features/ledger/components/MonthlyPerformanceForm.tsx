'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { upsertMonthlyPerformance } from '@/features/ledger/performans-actions';
import { Loader2, Save, Trash2, Calendar, Activity, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceFormProps {
  id: string;
  locationId: string;
  initialData: {
    sessions: number;
    extraExpense: number;
    extraNotes: string;
    month: string;
    locationName: string;
  };
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
}

export default function MonthlyPerformanceForm({ id, locationId, initialData, onClose, onDelete }: PerformanceFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const monthForUpsert = initialData.month.length === 7
      ? `${initialData.month}-01T00:00:00.000Z`
      : initialData.month;

    const res = await upsertMonthlyPerformance({
      locationId,
      month: monthForUpsert,
      sessionCount: Number(formData.get('sessions')),
      extraExpenseAmount: Number(formData.get('extraExpense')),
    });
    setIsPending(false);

    if (res.success) {
      onClose();
      router.refresh();
    } else {
      setError(res.error || 'Güncelleme hatası.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-10">
      {/* Refined Header */}
      <section className="relative p-6 sm:p-8 rounded-[32px] bg-slate-900 overflow-hidden shadow-2xl shadow-slate-200">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-white">
          <Activity size={120} />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-blue-400">
            <Calendar size={14} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{initialData.month}</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">{initialData.locationName}</h2>
          <p className="text-sm text-slate-400 font-medium">Aylık performans verilerini güncelleyin.</p>
        </div>
      </section>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
          <Zap size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Toplam Seans Adedi</label>
          <div className="relative">
            <input 
              name="sessions" 
              type="number" 
              defaultValue={initialData.sessions}
              required
              className="w-full px-0 py-4 bg-transparent border-b border-slate-200 text-3xl font-black text-slate-900 focus:border-blue-500 outline-none transition-all tabular-nums"
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ekstra Operasyonel Gider (₺)</label>
          <div className="relative">
            <input 
              name="extraExpense" 
              type="number" 
              step="0.01"
              defaultValue={initialData.extraExpense}
              className="w-full px-0 py-4 bg-transparent border-b border-slate-200 text-3xl font-black text-rose-600 focus:border-rose-500 outline-none transition-all tabular-nums"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Operasyonel Notlar</label>
        <textarea 
          name="extraNotes" 
          defaultValue={initialData.extraNotes}
          rows={3}
          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all resize-none"
          placeholder="İsteğe bağlı döküm veya notlar..."
        />
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button 
          type="submit"
          disabled={isPending}
          className="flex-1 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          DEĞİŞİKLİKLERİ KAYDET
        </button>

        {onDelete && (
          <button 
            type="button"
            onClick={() => onDelete(id)}
            disabled={isPending}
            className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-[24px] transition-all hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 active:scale-95 disabled:opacity-50 flex items-center justify-center"
            title="Kaydı Sil"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>
    </form>
  );
}

