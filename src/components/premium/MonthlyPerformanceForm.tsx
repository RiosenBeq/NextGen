'use client';

import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Activity,
  Save,
  AlertCircle,
  Coins,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { upsertMonthlyPerformance } from '@/features/ledger/performans-actions';

type LocationOption = { id: string; name: string };

type MonthlyPerformanceInitialData = {
  id?: string;
  locationId?: string;
  monthId?: string;
  sessionCount?: number;
  extraExpense?: number;
};

interface MonthlyPerformanceFormProps {
  locations: LocationOption[];
  initialData?: MonthlyPerformanceInitialData | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const inputBase = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150";

export default function MonthlyPerformanceForm({
  locations,
  initialData,
  onSuccess,
  onCancel
}: MonthlyPerformanceFormProps) {
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
    } catch {
      setError('Sistem hatası oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-600 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Lokasyon Seçimi */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Lokasyon</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              required
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              className={cn(inputBase, "pl-10 pr-10 appearance-none cursor-pointer")}
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Dönem Seçimi */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Dönem (Ay)</label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="month"
              required
              value={formData.month.slice(0, 7)}
              onChange={(e) => setFormData({ ...formData, month: `${e.target.value}-01` })}
              className={cn(inputBase, "pl-10")}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Seans Sayısı */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Toplam Seans</label>
          <div className="relative">
            <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="number"
              required
              placeholder="0"
              value={formData.sessionCount || ''}
              onChange={(e) => setFormData({ ...formData, sessionCount: Number(e.target.value) })}
              className={cn(inputBase, "pl-10")}
            />
          </div>
        </div>

        {/* Ekstra Gider */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Ekstra Gider (₺)</label>
          <div className="relative">
            <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="number"
              placeholder="0"
              value={formData.extraExpenseAmount || ''}
              onChange={(e) => setFormData({ ...formData, extraExpenseAmount: Number(e.target.value) })}
              className={cn(inputBase, "pl-10")}
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200/70 flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            İptal
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {initialData ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}
