'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getErrorMessage } from '@/lib/errors';
import { requireProfileAccess } from '@/lib/auth-guards';
import {
  addMonthlyPerformance,
  deleteMonthlyPerformance as deleteMonthlyPerformanceCore,
} from './actions';

function toMonthIdUTC(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function deterministicMonthlyId(locationId: string, month: Date): string {
  return `perf_${toMonthIdUTC(month)}_${locationId}`;
}

export async function upsertDailyPerformance(data: {
  locationId: string;
  date: string;
  sessionCount: number;
  testCount: number;
  extraMetrics?: Record<string, unknown>;
}) {
  try {
    const guard = await requireProfileAccess();
    if (guard.error || !guard.user || !guard.profile) {
      return { success: false, error: guard.error };
    }
    const profileId = guard.profile.id;

    const supabase = await createClient();

    const { data: record, error } = await supabase
      .from('DailyPerformance')
      .upsert({
        id: `daily_${data.locationId}_${data.date.split('T')[0]}`,
        profileId,
        locationId: data.locationId,
        date: data.date,
        sessionCount: data.sessionCount,
        testCount: data.testCount,
        extraMetrics: data.extraMetrics || {},
        updatedAt: new Date().toISOString(),
      }, {
        onConflict: 'locationId,date'
      })
      .select()
      .single();

    if (error) throw error;

    // Recalculate monthly aggregate for this location/month
    await syncMonthlyPerformance(profileId, data.locationId, data.date);

    revalidatePath('/performans');
    revalidatePath('/');
    revalidatePath('/raporlar');
    revalidatePath('/gelir-gider');

    return { success: true, data: record };
  } catch (error) {
    console.error("Daily Performance Error:", error);
    return { success: false, error: getErrorMessage(error, 'Bilinmeyen bir hata oluştu.') };
  }
}

/**
 * Verilen tarihin ait olduğu ayı (UTC) seçer ve DailyPerformance toplamını
 * MonthlyPerformance'a yansıtır. Tarih sınırı UTC üzerinden hesaplanır;
 * sunucu yerel saatinden bağımsızdır.
 */
async function syncMonthlyPerformance(profileId: string, locationId: string, dateStr: string) {
  const supabase = await createClient();
  const reference = new Date(dateStr);
  if (Number.isNaN(reference.getTime())) {
    console.warn('Invalid date passed to syncMonthlyPerformance:', dateStr);
    return;
  }

  const startOfMonth = new Date(Date.UTC(
    reference.getUTCFullYear(), reference.getUTCMonth(), 1, 0, 0, 0, 0
  ));
  const endOfMonth = new Date(Date.UTC(
    reference.getUTCFullYear(), reference.getUTCMonth() + 1, 0, 23, 59, 59, 999
  ));

  const { data: dailies, error } = await supabase
    .from('DailyPerformance')
    .select('sessionCount')
    .eq('profileId', profileId)
    .eq('locationId', locationId)
    .gte('date', startOfMonth.toISOString())
    .lte('date', endOfMonth.toISOString());

  if (error) {
    console.error("Aggregation Error:", error);
    return;
  }

  const totalSessions = (dailies || []).reduce((acc, curr) => acc + (curr.sessionCount || 0), 0);

  const { error: upsertError } = await supabase
    .from('MonthlyPerformance')
    .upsert({
      id: deterministicMonthlyId(locationId, startOfMonth),
      profileId,
      locationId,
      month: startOfMonth.toISOString(),
      sessionCount: totalSessions,
      updatedAt: new Date().toISOString(),
    }, {
      onConflict: 'id'
    });

  if (upsertError) {
    console.error("Monthly Upsert Error:", upsertError);
  }
}

export async function getDailyPerformanceHistory(locationId: string, limit = 30) {
  try {
    const guard = await requireProfileAccess();
    if (guard.error || !guard.profile) return [];
    const profileId = guard.profile.id;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('DailyPerformance')
      .select('*, location:Location(id,name)')
      .eq('profileId', profileId)
      .eq('locationId', locationId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}

/**
 * MonthlyPerformance upsert — `addMonthlyPerformance`'a delege eder.
 * Auth check, audit log ve revalidation'ı tek noktadan tutmak için.
 */
export async function upsertMonthlyPerformance(data: {
  id?: string;
  locationId: string;
  month: string; // ISO string for first day of month
  sessionCount: number;
  extraExpenseAmount?: number;
}) {
  return addMonthlyPerformance({
    locationId: data.locationId,
    month: data.month,
    sessionCount: data.sessionCount,
    extraExpenseAmount: data.extraExpenseAmount,
  });
}

/**
 * MonthlyPerformance silme — ledger/actions.ts içindeki tek otoritatif fonksiyona delege.
 */
export async function deleteMonthlyPerformance(id: string) {
  return deleteMonthlyPerformanceCore(id);
}

export async function deleteDailyPerformance(id: string, locationId: string, dateStr: string) {
  try {
    const guard = await requireProfileAccess();
    if (guard.error || !guard.user || !guard.profile) {
      return { success: false, error: guard.error };
    }
    const profileId = guard.profile.id;

    const supabase = await createClient();
    const { error } = await supabase
      .from('DailyPerformance')
      .delete()
      .eq('id', id)
      .eq('profileId', profileId);
    if (error) throw error;

    // Recalculate month aggregate
    await syncMonthlyPerformance(profileId, locationId, dateStr);

    revalidatePath('/performans');
    revalidatePath('/raporlar');
    revalidatePath('/gelir-gider');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Daily Delete Error:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}
