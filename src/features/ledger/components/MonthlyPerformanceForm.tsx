'use client';
import { useRouter } from 'next/navigation';

import React, { useState } from 'react';
import { updateMonthlyPerformance } from '../actions';
import { Loader2, Save, Trash2, AlertCircle } from 'lucide-react';

interface PerformanceFormProps {
  id: string;
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

function toIsoMonth(value: string): string {
  if (!value) return new Date().toISOString();
  if (value.includes('T')) return value;
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value);
  if (!match) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? new Date().toISOString() : fallback.toISOString();
  }
  const [, y, m, d] = match;
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d ?? '01'))).toISOString();
}

export default function MonthlyPerformanceForm({ id, initialData, onClose, onDelete }: PerformanceFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const monthIso = toIsoMonth(initialData.month);
    const data = {
      locationId: 'dummy', // Not used for update but required by Zod schema if not lax
      month: monthIso,
      sessionCount: Number(formData.get('sessions')),
      extraExpenseAmount: Number(formData.get('extraExpense')),
      extraExpenseNotes: formData.get('extraNotes') as string,
    };

    const res = await updateMonthlyPerformance(id, data);
    setIsPending(false);

    if (res.success) {
      onClose();
      router.refresh();
    } else {
      setError(res.error || 'Güncelleme hatası.');
    }
  };

  const inputBase = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Header info card */}
      <div className="rounded-xl bg-slate-50/50 border border-slate-200/50 p-5 space-y-1">
        <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">{initialData.month}</span>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">{initialData.locationName}</h2>
        <p className="text-sm text-slate-500">Aylık performans ve operasyonel veri güncelleme</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm flex items-center gap-2.5">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Aylık Toplam Seans <span className="text-rose-500">*</span>
          </label>
          <input
            name="sessions"
            type="number"
            defaultValue={initialData.sessions}
            required
            className={inputBase}
            placeholder="0"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Ekstra Masraf (₺)</label>
          <input
            name="extraExpense"
            type="number"
            defaultValue={initialData.extraExpense}
            className={inputBase}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Operasyonel Notlar</label>
        <textarea
          name="extraNotes"
          defaultValue={initialData.extraNotes}
          rows={4}
          className={`${inputBase} min-h-[80px] resize-none`}
          placeholder="Bu ay için özel bir durum veya açıklama var mı?"
        />
      </div>

      <div className="pt-6 border-t border-slate-200/70 flex items-center justify-between gap-3">
        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(id)}
            disabled={isPending}
            className="bg-white border border-slate-200 text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Kaydı Sil"
          >
            <Trash2 size={16} />
            Sil
          </button>
        ) : (
          <span />
        )}

        <button
          type="submit"
          disabled={isPending}
          className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Değişiklikleri Kaydet
        </button>
      </div>
    </form>
  );
}
