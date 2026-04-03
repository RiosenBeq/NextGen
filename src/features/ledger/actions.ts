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
        id: `perf_${crypto.randomUUID()}`,
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
    revalidatePath('/');
    revalidatePath('/reports');
    
    return { success: true, record };
  } catch (error: any) {
    console.error("Hata:", error);
    return { success: false, error: error.message || "Bilinmeyen bir hata oluştu." };
  }
}

export async function addExpense(data: any) {
  try {
    const supabase = await createClient();
    const { data: record, error } = await supabase
      .from('Expense')
      .insert({
        id: `exp_${crypto.randomUUID()}`,
        locationId: data.locationId || null,
        description: data.description,
        type: data.type,
        amountWithoutVat: data.amount,
        amountWithVat: data.amount, // VAT calculation can be added here
        isOfficial: data.isOfficial || false,
        month: data.month || null,
        paidBy: data.paidBy || 'Ortak Hesap',
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/expenses');
    revalidatePath('/');
    return { success: true, record };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addInvestment(data: any) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('Investment')
      .insert({
        id: `inv_${crypto.randomUUID()}`,
        locationId: data.locationId,
        description: data.description,
        currency: data.currency || 'TL',
        amountWithoutVat: data.amount,
        totalAmount: data.amount,
        notes: data.notes || '',
      });

    if (error) throw error;
    revalidatePath('/expenses');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateLocationParameters(id: string, data: any) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('Location')
      .update({
        fixedRent: data.fixedRent,
        duesAmount: data.duesAmount,
        revenueShareRate: data.revenueShareRate,
        revenueThreshold: data.revenueThreshold,
        rentVatRate: data.rentVatRate,
      })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

import { calculateMonthlyCashFlow } from './calculations';

export async function getLocationInsights() {
  try {
    const supabase = await createClient();
    
    const { data: locations, error } = await supabase
      .from('Location')
      .select(`
        *,
        performances:MonthlyPerformance(*),
        investments:Investment(*)
      `)
      .eq('isActive', true);

    if (error) throw error;

    const params = await getSystemParameters();

    const insights = (locations || []).map(loc => {
      const totalInvestment = loc.investments.reduce((acc: number, inv: any) => acc + (inv.totalAmount || 0), 0);
      
      const totalSessions = loc.performances.reduce((acc: number, perf: any) => acc + (perf.sessionCount || 0), 0);
      const totalExtraExpense = loc.performances.reduce((acc: number, perf: any) => acc + (perf.extraExpenseAmount || 0), 0);
      const avgSessions = loc.performances.length > 0 ? totalSessions / loc.performances.length : 0;
      const avgExtraExpense = loc.performances.length > 0 ? totalExtraExpense / loc.performances.length : 0;

      const calc = calculateMonthlyCashFlow(avgSessions, avgExtraExpense, {
        sessionPrice: params['SESSION_PRICE_INCL_VAT'] || 300,
        kdvRate: params['VAT_RATE'] || 20,
        iyzicoCommissionRate: 2,
        nayaxCommissionRate: 2,
        fixedRent: loc.fixedRent,
        duesAmount: loc.duesAmount,
        rentKdvRate: loc.rentVatRate,
        revenueShareRate: loc.revenueShareRate || 0,
        revenueThreshold: loc.revenueThreshold || 0,
        applyRentVat: true,
        investmentAmount: totalInvestment,
      });

      let cumulativeNetCash = 0;
      loc.performances.forEach((perf: any) => {
        const pCalc = calculateMonthlyCashFlow(perf.sessionCount, perf.extraExpenseAmount, {
           sessionPrice: params['SESSION_PRICE_INCL_VAT'] || 300,
           kdvRate: params['VAT_RATE'] || 20,
           iyzicoCommissionRate: 2,
           nayaxCommissionRate: 2,
           fixedRent: loc.fixedRent,
           duesAmount: loc.duesAmount,
           rentKdvRate: loc.rentVatRate,
           revenueShareRate: loc.revenueShareRate || 0,
           revenueThreshold: loc.revenueThreshold || 0,
           applyRentVat: true,
        });
        cumulativeNetCash += pCalc.netCash;
      });

      return {
        id: loc.id,
        name: loc.name,
        totalInvestment,
        cumulativeNetCash,
        roi: totalInvestment > 0 ? (cumulativeNetCash / totalInvestment) * 100 : 0,
        breakEvenSessions: calc.breakEvenSessions,
        profitMargin: calc.profitMargin,
        currentMonthlyProfit: calc.netCash,
        isProfitable: calc.isProfitable,
        paybackProgress: totalInvestment > 0 ? Math.min((cumulativeNetCash / totalInvestment) * 100, 100) : 0,
        estimatedPaybackMonths: calc.netCash > 0 ? Math.ceil(totalInvestment / calc.netCash) : Infinity,
        okanShare: calc.okanShare,
        talhaShare: calc.talhaShare,
        furkanShare: calc.furkanShare,
        alpShare: calc.alpShare,
      };
    });

    return insights;
  } catch (error) {
    console.error("Error generating insights:", error);
    return [];
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
