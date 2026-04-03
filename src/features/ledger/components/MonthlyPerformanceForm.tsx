'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { monthlyPerformanceSchema, MonthlyPerformanceInput } from '../schema';
import { addMonthlyPerformance } from '../actions';
import { Loader2, Plus } from 'lucide-react';

interface Props {
  locations: { id: string; name: string }[];
}

export function MonthlyPerformanceForm({ locations }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<MonthlyPerformanceInput>({
    resolver: zodResolver(monthlyPerformanceSchema),
    defaultValues: {
      locationId: '',
      month: new Date().toISOString().substring(0, 7) + '-01T00:00:00.000Z', 
      sessionCount: 0,
      extraExpenseAmount: 0,
      extraExpenseNotes: '',
    }
  });

  const onSubmit = async (data: MonthlyPerformanceInput) => {
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    // Ensure date is well-formatted for Prisma matching first of month
    data.month = new Date(data.month).toISOString();

    const result = await addMonthlyPerformance(data);
    
    if (result.success) {
      setSuccessMsg('Aylık performans kaydı başarıyla eklendi.');
      reset();
    } else {
      setErrorMsg(result.error || 'Bilinmeyen bir hata oluştu');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">Aylık Performans Girişi</h2>
      
      {successMsg && (
        <div className="p-4 mb-6 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tesis / AVM</label>
            <select
              {...register('locationId')}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
            >
              <option value="">Seçiniz</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            {errors.locationId && <p className="text-red-500 text-xs">{errors.locationId.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">İlgili Ay (İlk Gün)</label>
            <input
              type="date"
              {...register('month')}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
            />
            {errors.month && <p className="text-red-500 text-xs">{errors.month.message as string}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Oturum Sayısı (Kabinrapor)</label>
          <input
            type="number"
            {...register('sessionCount', { valueAsNumber: true })}
            placeholder="0"
            className="w-full px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-lg font-mono focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all text-gray-900"
          />
          <p className="text-xs text-gray-500">Kabinrapor.com üzerinden aldığınız o ayki toplam seans adedi.</p>
          {errors.sessionCount && <p className="text-red-500 text-xs">{errors.sessionCount.message as string}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Ek Masraf Tutarı (Opsiyonel)</label>
            <input
              type="number"
              {...register('extraExpenseAmount', { valueAsNumber: true })}
              placeholder="0.00"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
            />
            {errors.extraExpenseAmount && <p className="text-red-500 text-xs">{errors.extraExpenseAmount.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Ek Masraf Açıklaması</label>
            <input
              type="text"
              {...register('extraExpenseNotes')}
              placeholder="Gider detayı yazınız..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors focus:ring-4 focus:ring-gray-200 font-medium"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          Performansı Kaydet
        </button>
      </form>
    </div>
  );
}
