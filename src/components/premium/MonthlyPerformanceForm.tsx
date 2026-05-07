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

const inputBase = "w-full px-4 py-3 rounded-xl bg-[--bg-elevated] border border-transparent text-[15px] text-[--text] placeholder:text-[--text-tertiary] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors duration-200 min-h-[44px]";

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
        <div className="p-4 bg-[--danger-soft] rounded-xl flex items-center gap-2.5 text-[--danger] text-[14px]">
          <AlertCircle size={16} strokeWidth={1.75} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-[--text]">Lokasyon</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[--text-tertiary]" size={16} strokeWidth={1.75} />
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
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-tertiary] pointer-events-none" strokeWidth={1.75} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-medium text-[--text]">Dönem (Ay)</label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[--text-tertiary]" size={16} strokeWidth={1.75} />
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
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-[--text]">Toplam Seans</label>
          <div className="relative">
            <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[--text-tertiary]" size={16} strokeWidth={1.75} />
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

        <div className="space-y-2">
          <label className="text-[13px] font-medium text-[--text]">Ekstra Gider (₺)</label>
          <div className="relative">
            <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[--text-tertiary]" size={16} strokeWidth={1.75} />
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

      <div className="pt-6 border-t border-[--border] flex items-center justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="elite-button-secondary">
            İptal
          </button>
        )}
        <button type="submit" disabled={isLoading} className="elite-button-primary">
          {isLoading ? <Loader2 size={16} className="animate-spin" strokeWidth={2} /> : <Save size={16} strokeWidth={1.75} />}
          {initialData ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}
