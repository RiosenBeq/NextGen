'use client';

import React, { useState } from 'react';
import { updateMonthlyPerformance } from '../actions';
import { Loader2, Save, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function MonthlyPerformanceForm({ id, initialData, onClose, onDelete }: PerformanceFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      locationId: 'dummy', // Not used for update but required by Zod schema if not lax
      month: initialData.month,
      sessionCount: Number(formData.get('sessions')),
      extraExpenseAmount: Number(formData.get('extraExpense')),
      extraExpenseNotes: formData.get('extraNotes') as string,
    };

    const res = await updateMonthlyPerformance(id, data);
    setIsPending(false);

    if (res.success) {
      onClose();
      window.location.reload();
    } else {
      setError(res.error || 'Güncelleme hatası.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* Refined "Airy" Header Info */}
      <div className="p-8 rounded-3xl bg-blue-50 border border-blue-100/50 space-y-2 relative overflow-hidden shadow-sm">
         <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-600">
            <Save size={100} />
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{initialData.month}</span>
         </div>
         <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{initialData.locationName}</h2>
         <p className="text-sm text-slate-400 font-medium italic">Aylık performans ve operasyonel veri güncelleme</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-widest flex items-center gap-3 shadow-sm">
           <AlertCircle size={18} />
           {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
           <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">Aylık Toplam Seans <span className="text-rose-500">*</span></label>
           <input 
             name="sessions" 
             type="number" 
             defaultValue={initialData.sessions}
             required
             className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-bold tracking-tight text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm"
             placeholder="0"
           />
        </div>

        <div className="space-y-3">
           <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">Ekstra Masraf (₺)</label>
           <input 
             name="extraExpense" 
             type="number" 
             defaultValue={initialData.extraExpense}
             className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-bold tracking-tight text-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-500 transition-all shadow-sm"
             placeholder="0.00"
           />
        </div>
      </div>

      <div className="space-y-3">
         <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">Operasyonel Notlar</label>
         <textarea 
           name="extraNotes" 
           defaultValue={initialData.extraNotes}
           rows={4}
           className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold tracking-tight text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm resize-none"
           placeholder="Bu ay için özel bir durum veya açıklama var mı?"
         />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <button 
          type="submit"
          disabled={isPending}
          className="flex-1 py-5 bg-slate-900 text-white rounded-2xl text-sm font-bold uppercase tracking-widest shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Değişiklikleri Kaydet
        </button>

        {onDelete && (
          <button 
            type="button"
            onClick={() => onDelete(id)}
            disabled={isPending}
            className="w-full sm:w-16 py-5 bg-white border border-slate-200 text-slate-400 rounded-2xl transition-all hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 active:scale-95 disabled:opacity-50 flex items-center justify-center"
            title="Kaydı Sil"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>
    </form>
  );
}
