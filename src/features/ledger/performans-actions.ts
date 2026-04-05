'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createAuditLog } from '@/lib/audit';

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
  const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const deterministicId = `perf_${monthId}_${locationId}`;

  const { error: upsertError } = await supabase
    .from('MonthlyPerformance')
    .upsert({
      id: deterministicId,
      locationId: locationId,
      month: startOfMonth,
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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('DailyPerformance')
      .select('*')
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
