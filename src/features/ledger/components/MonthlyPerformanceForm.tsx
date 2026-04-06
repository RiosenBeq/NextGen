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
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      
      {/* Header Info */}
      <div className="p-6 rounded-[32px] bg-slate-900 text-white space-y-1 relative overflow-hidden shadow-xl">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <Save size={80} />
         </div>
         <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">{initialData.month}</p>
         <p className="text-xl font-black italic tracking-tighter uppercase">{initialData.locationName}</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-black uppercase tracking-widest flex items-center gap-3 italic">
           <AlertCircle size={16} />
           {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Aylık Toplam Seans</label>
           <input 
             name="sessions" 
             type="number" 
             defaultValue={initialData.sessions}
             required
             className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-lg font-black italic tracking-tighter text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-inner"
           />
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Ekstra Masraf (₺)</label>
           <input 
             name="extraExpense" 
             type="number" 
             defaultValue={initialData.extraExpense}
             className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-lg font-black italic tracking-tighter text-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-50 focus:border-rose-500 transition-all shadow-inner"
           />
        </div>
      </div>

      <div className="space-y-2">
         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Operasyonal Notlar</label>
         <textarea 
           name="extraNotes" 
           defaultValue={initialData.extraNotes}
           rows={4}
           className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-bold italic tracking-tight text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-inner resize-none"
           placeholder="Bu ay için özel bir durum var mı?"
         />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <button 
          type="submit"
          disabled={isPending}
          className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          VERİLERİ GÜNCELLE
        </button>

        {onDelete && (
          <button 
            type="button"
            onClick={() => onDelete(id)}
            disabled={isPending}
            className="px-8 py-5 bg-white border border-slate-200 text-rose-500 rounded-[24px] text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-rose-50 hover:border-rose-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </form>
  );
}
