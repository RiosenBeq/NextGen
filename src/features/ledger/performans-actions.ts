'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';


function normalizeMonthInput(monthInput: string) {
  const parsed = new Date(monthInput);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Geçersiz ay bilgisi.');
  }

  const normalized = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1, 0, 0, 0, 0));
  const monthId = `${normalized.getUTCFullYear()}-${String(normalized.getUTCMonth() + 1).padStart(2, '0')}`;

  return {
    normalizedMonth: normalized.toISOString(),
    monthId,
    deterministicId: (locationId: string) => `perf_${monthId}_${locationId}`,
  };
}

export async function upsertDailyPerformance(data: {
  locationId: string;
  date: string;
  sessionCount: number;
  testCount: number;
  extraMetrics?: any;
}) {
  try {
    const supabase = await createClient();
    
    const { data: record, error } = await supabase
      .from('DailyPerformance')
      .upsert({
        id: `daily_${data.locationId}_${data.date.split('T')[0]}`,
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
    await syncMonthlyPerformance(data.locationId, data.date);

    revalidatePath('/performans');
    revalidatePath('/');
    revalidatePath('/raporlar');
    revalidatePath('/gelir-gider');

    return { success: true, data: record };
  } catch (error: any) {
    console.error("Daily Performance Error:", error);
    return { success: false, error: String(error?.message || 'Bilinmeyen bir hata oluştu.') };
  }
}

async function syncMonthlyPerformance(locationId: string, dateStr: string) {
  const supabase = await createClient();
  const date = new Date(dateStr);
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

  // Get all daily entries for this month
  const { data: dailies, error } = await supabase
    .from('DailyPerformance')
    .select('sessionCount')
    .eq('locationId', locationId)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth);

  if (error) {
    console.error("Aggregation Error:", error);
    return;
  }

  const totalSessions = (dailies || []).reduce((acc, curr) => acc + (curr.sessionCount || 0), 0);

  // Update MonthlyPerformance (The Financial Table)
  const { normalizedMonth, deterministicId } = normalizeMonthInput(startOfMonth);

  const { error: upsertError } = await supabase
    .from('MonthlyPerformance')
    .upsert({
      id: deterministicId(locationId),
      locationId: locationId,
      month: normalizedMonth,
      sessionCount: totalSessions,
      updatedAt: new Date().toISOString(),
    }, {
      onConflict: 'id'
    });

  if (upsertError) {
    console.error("Monthly Upsert Error:", upsertError);
  }
}

export async function getDailyPerformanceHistory(locationId?: string, limit = 30) {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('DailyPerformance')
      .select('*, location:Location(id,name)')
      .order('date', { ascending: false })
      .limit(limit);

    if (locationId) {
      query = query.eq('locationId', locationId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}

/**
 * MonthlyPerformance CRUD
 */
export async function upsertMonthlyPerformance(data: {
  id?: string;
  locationId: string;
  month: string; // ISO string for first day of month
  sessionCount: number;
  extraExpenseAmount?: number;
}) {
  try {
    const supabase = await createClient();
    
    const { normalizedMonth, deterministicId } = normalizeMonthInput(data.month);
    const targetId = deterministicId(data.locationId);

    const { data: record, error } = await supabase
      .from('MonthlyPerformance')
      .upsert({
        id: targetId,
        locationId: data.locationId,
        month: normalizedMonth,
        sessionCount: data.sessionCount,
        extraExpenseAmount: data.extraExpenseAmount || 0,
        updatedAt: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/performans');
    revalidatePath('/raporlar');
    revalidatePath('/gelir-gider');
    revalidatePath('/');
    
    return { success: true, data: record };
  } catch (error: any) {
    console.error("Monthly Upsert Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteMonthlyPerformance(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('MonthlyPerformance').delete().eq('id', id);
    if (error) throw error;

    revalidatePath('/performans');
    revalidatePath('/raporlar');
    revalidatePath('/gelir-gider');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Monthly Delete Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * DailyPerformance CRUD
 */
export async function deleteDailyPerformance(id: string, locationId: string, dateStr: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('DailyPerformance').delete().eq('id', id);
    if (error) throw error;

    // Recalculate month aggregate
    await syncMonthlyPerformance(locationId, dateStr);

    revalidatePath('/performans');
    revalidatePath('/raporlar');
    revalidatePath('/gelir-gider');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Daily Delete Error:", error);
    return { success: false, error: error.message };
  }
}
