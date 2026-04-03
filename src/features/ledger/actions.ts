'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { monthlyPerformanceSchema, MonthlyPerformanceInput } from './schema';

export async function addMonthlyPerformance(data: MonthlyPerformanceInput) {
  try {
    const supabase = await createClient();
    const validatedData = monthlyPerformanceSchema.parse(data);

    const { data: record, error } = await supabase
      .from('MonthlyPerformance')
      .insert({
        locationId: validatedData.locationId,
        month: new Date(validatedData.month).toISOString(),
        sessionCount: validatedData.sessionCount,
        extraExpenseAmount: validatedData.extraExpenseAmount || 0,
        extraExpenseNotes: validatedData.extraExpenseNotes,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/performance');
    revalidatePath('/dashboard');
    
    return { success: true, record };
  } catch (error: any) {
    console.error("Hata:", error);
    return { success: false, error: error.message || "Bilinmeyen bir hata oluştu." };
  }
}

export async function getActiveLocations() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('Location')
      .select('*')
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
}

export async function getSystemParameters() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('SystemParameter')
      .select('key, value');

    if (error) throw error;

    const map: Record<string, number> = {};
    for (const p of (data || [])) {
      map[p.key] = p.value;
    }
    return map;
  } catch (error) {
    console.error("Error fetching params:", error);
    return {};
  }
}
