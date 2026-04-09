'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Activity, 
  Plus, 
  Save, 
  Trash2, 
  AlertCircle,
  Coins
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { upsertMonthlyPerformance } from '@/features/ledger/performans-actions';

interface MonthlyPerformanceFormProps {
  locations: any[];
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MonthlyPerformanceForm({ 
  locations, 
  initialData, 
  onSuccess, 
  onCancel 
}: MonthlyPerformanceFormProps) {
  const toSafeNumber = (value: string, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const [formData, setFormData] = useState({
    id: initialData?.id || undefined,
    locationId: initialData?.locationId || (locations.length > 0 ? locations[0].id : ''),
    month: initialData?.monthId ? `${initialData.monthId}-01` : new Date().toISOString().split('T')[0],
    sessionCount: initialData?.sessionCount || 0,
    extraExpenseAmount: initialData?.extraExpense || 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const resp = await upsertMonthlyPerformance({
        id: formData.id,
        locationId: formData.locationId,
        month: new Date(formData.month).toISOString(),
        sessionCount: Number(formData.sessionCount),
        extraExpenseAmount: Number(formData.extraExpenseAmount),
      });

      if (resp.success) {
        onSuccess?.();
      } else {
        setError(resp.error || 'Kayıt sırasında bir hata oluştu.');
      }
    } catch (err) {
      setError('Sistem hatası oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium animate-shake">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lokasyon Seçimi */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lokasyon</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              required
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dönem Seçimi */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dönem (Ay)</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="month"
              required
              value={formData.month.slice(0, 7)}
              onChange={(e) => setFormData({ ...formData, month: `${e.target.value}-01` })}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Seans Sayısı */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Toplam Seans</label>
          <div className="relative">
            <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="number"
              required
              placeholder="0"
              value={String(formData.sessionCount)}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onChange={(e) => setFormData({ ...formData, sessionCount: Math.max(0, Math.trunc(toSafeNumber(e.target.value, 0))) })}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Ekstra Gider */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ekstra Gider (₺)</label>
          <div className="relative">
            <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="number"
              placeholder="0"
              value={String(formData.extraExpenseAmount)}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onChange={(e) => setFormData({ ...formData, extraExpenseAmount: Math.max(0, toSafeNumber(e.target.value, 0)) })}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all active:scale-95"
          >
            İptal
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-2",
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600 hover:shadow-blue-200"
          )}
        >
          {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
          {initialData ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}
