'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { monthlyPerformanceSchema, MonthlyPerformanceInput } from './schema';
import { createAuditLog } from '@/lib/audit';
import prisma from '@/lib/db';

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
    const vatRate = parseFloat(data.vatRate) || 0;
    const amountWithoutVat = parseFloat(data.amount) || 0;
    const amountWithVat = amountWithoutVat * (1 + vatRate / 100);

    const { data: record, error } = await supabase
      .from('Expense')
      .insert({
        id: `exp_${crypto.randomUUID()}`,
        locationId: data.locationId || null,
        description: data.description,
        type: data.type,
        amountWithoutVat: amountWithoutVat,
        amountWithVat: amountWithVat,
        vatRate: vatRate,
        isOfficial: data.isOfficial === 'true' || data.isOfficial === true,
        month: data.month || null,
        paidBy: data.paidBy || 'Ortak Hesap',
        categoryId: data.categoryId || null,
        attachmentUrl: data.attachmentUrl || null,
      })
      .select()
      .single();

    if (error) throw error;

    await createAuditLog('CREATE', 'Expense', record.id, { 
      description: data.description, 
      amount: amountWithVat,
      locationId: data.locationId 
    });

    revalidatePath('/expenses');
    revalidatePath('/');
    revalidatePath('/gelir-gider');
    return { success: true, record };
  } catch (error: any) {
    console.error("Add Expense Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateExpense(id: string, data: any) {
  try {
    const supabase = await createClient();
    const vatRate = parseFloat(data.vatRate) || 0;
    const amountWithoutVat = parseFloat(data.amount) || 0;
    const amountWithVat = amountWithoutVat * (1 + vatRate / 100);

    const { data: record, error } = await supabase
      .from('Expense')
      .update({
        locationId: data.locationId || null,
        description: data.description,
        type: data.type,
        amountWithoutVat: amountWithoutVat,
        amountWithVat: amountWithVat,
        vatRate: vatRate,
        isOfficial: data.isOfficial === 'true' || data.isOfficial === true,
        month: data.month || null,
        paidBy: data.paidBy || 'Ortak Hesap',
        categoryId: data.categoryId || null,
        attachmentUrl: data.attachmentUrl || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await createAuditLog('UPDATE', 'Expense', id, { 
      description: data.description, 
      amount: amountWithVat 
    });

    revalidatePath('/expenses');
    revalidatePath('/');
    revalidatePath('/gelir-gider');
    return { success: true, record };
  } catch (error: any) {
    console.error("Update Expense Error:", error);
    return { success: false, error: error.message };
  }
}

export async function uploadExpenseAttachment(formData: FormData) {
  try {
    const supabase = await createClient();
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'Dosya seçilmedi.' };

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 15) {
      return { success: false, error: `Dosya boyutu çok büyük (${sizeMB.toFixed(1)}MB). Maksimum 15MB yüklenebilir.` };
    }

    // Determine the correct MIME type
    const allowedTypes: Record<string, string> = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    const mimeType = file.type || 'application/octet-stream';
    const ext = allowedTypes[mimeType] ?? file.name.split('.').pop()?.toLowerCase() ?? 'bin';

    if (!allowedTypes[mimeType]) {
      return { 
        success: false, 
        error: `Desteklenmeyen dosya türü: ${mimeType}. Yalnızca PDF, JPG, PNG kabul edilmektedir.` 
      };
    }

    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `expenses/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType,  // ← Explicitly set content type
      });

    if (uploadError) {
      console.error("Supabase Storage Error:", uploadError);
      const msg = uploadError.message?.toLowerCase() || '';
      if (msg.includes('bucket not found')) {
        return { 
          success: false, 
          error: 'Eksik Yapılandırma: Supabase üzerinde "documents" bucket\'ı bulunamadı. Lütfen Storage panelinden bu isimle bir public bucket oluşturun.' 
        };
      }
      if (msg.includes('security policy') || msg.includes('unauthorized') || msg.includes('new row violates row-level security')) {
        return { 
          success: false, 
          error: 'HATA: "documents" bucket\'ı için yazma izni (RLS Policy) bulunamadı. Lütfen Supabase panelinden anonim kullanıcılar için INSERT/SELECT izinlerini tanımlayın.' 
        };
      }
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return { success: true, publicUrl };
  } catch (error: any) {
    console.error("Upload Error:", error);
    return { success: false, error: `Yükleme hatası: ${error.message}` };
  }
}


export async function deleteExpense(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('Expense').delete().eq('id', id);
    if (error) throw error;
    
    await createAuditLog('DELETE', 'Expense', id);

    revalidatePath('/expenses');
    revalidatePath('/');
    revalidatePath('/gelir-gider');
    return { success: true };
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

    // We don't have the generated record easily from insert without select
    // but the ID prefix is inv_ + uuid which we can pre-generate or extract
    await createAuditLog('CREATE', 'Investment', 'new', { 
      description: data.description, 
      amount: data.amount 
    });

    revalidatePath('/investments');
    revalidatePath('/expenses');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateInvestment(id: string, data: any) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('Investment')
      .update({
        locationId: data.locationId,
        description: data.description,
        currency: data.currency || 'TL',
        amountWithoutVat: data.amount,
        totalAmount: data.amount,
        notes: data.notes || '',
      })
      .eq('id', id);

    if (error) throw error;

    await createAuditLog('UPDATE', 'Investment', id, { 
      description: data.description, 
      amount: data.amount 
    });

    revalidatePath('/investments');
    revalidatePath('/expenses');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteInvestment(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('Investment').delete().eq('id', id);
    if (error) throw error;
    
    await createAuditLog('DELETE', 'Investment', id);

    revalidatePath('/investments');
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
        iyzicoCommissionRate: 2,
        nayaxCommissionRate: 2,
        fixedRent: loc.fixedRent,
        duesAmount: loc.duesAmount,
        revenueShareRate: loc.revenueShareRate || 0,
        investmentAmount: totalInvestment,
      });

      let cumulativeNetCash = 0;
      loc.performances.forEach((perf: any) => {
        const pCalc = calculateMonthlyCashFlow(perf.sessionCount, perf.extraExpenseAmount, {
           sessionPrice: params['SESSION_PRICE_INCL_VAT'] || 300,
           iyzicoCommissionRate: 2,
           nayaxCommissionRate: 2,
           fixedRent: loc.fixedRent,
           duesAmount: loc.duesAmount,
           revenueShareRate: loc.revenueShareRate || 0,
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
    const { data } = await supabase.from('Location').select('*').eq('isActive', true);
    return data || [];
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
}

export async function getSystemParameters() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('SystemParameter').select('*');
    const map: Record<string, any> = {};
    data?.forEach(p => map[p.key] = p.value);
    return map;
  } catch (error) {
    console.error("Error fetching params:", error);
    return {};
  }
}

export async function getKabinRaporSessions(locationId: string, monthStr: string) {
  try {
    const { kabinRapor } = await import('@/lib/kabinRapor');
    const supabase = await createClient();
    const { data: location } = await supabase.from('Location').select('name').eq('id', locationId).single();
    if (!location) throw new Error('Lokasyon bulunamadı');

    const cityName = location.name.split(' ')[0]; // Zafer, Mavi, vb.
    const monthId = monthStr.slice(0, 7);
    const currentMonthId = new Date().toISOString().slice(0, 7);
    
    // API: 'Bu Ay' or 'YYYY-MM'
    const range = monthId === currentMonthId ? 'Bu Ay' : monthId;
    const liveData = await kabinRapor.getCitySplittedData(range as any);
    
    if (!liveData) throw new Error('API verisi alınamadı');
    const cityData = (liveData.cities as any)[cityName];
    const foundSessionCount = cityData?.sessions || 0;
    
    return { success: true, sessions: foundSessionCount };
  } catch (error: any) {
    console.error("fetchKabinError:", error);
    return { success: false, error: error.message };
  }
}

export async function updateSystemParameter(key: string, value: number) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('SystemParameter')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) throw error;
    revalidatePath('/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

