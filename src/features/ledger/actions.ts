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

    return { success: true };
  } catch (error: any) {
    console.error("Hata:", error);
    return { success: false, error: String(error?.message || 'Bilinmeyen bir hata oluştu.') };
  }
}

export async function addExpense(data: any) {
  try {
    // Input validation
    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
      return { success: false, error: 'Açıklama alanı zorunludur.' };
    }
    if (!data.type || !['ONE_TIME', 'RECURRING'].includes(data.type)) {
      return { success: false, error: 'Geçersiz ödeme tipi.' };
    }
    const description = data.description.trim().slice(0, 500);

    const supabase = await createClient();
    const vatRate = Math.max(0, Math.min(100, parseFloat(data.vatRate) || 0));
    const amountWithoutVat = Math.max(0, parseFloat(data.amount) || 0);
    const amountWithVat = amountWithoutVat * (1 + vatRate / 100);

    const { data: record, error } = await supabase
      .from('Expense')
      .insert({
        id: `exp_${crypto.randomUUID()}`,
        locationId: data.locationId || null,
        description,
        type: data.type,
        amountWithoutVat,
        amountWithVat,
        vatRate,
        isOfficial: data.isOfficial === 'true' || data.isOfficial === true,
        month: data.month || null,
        paidBy: data.paidBy || 'Ortak Hesap',
        categoryId: data.categoryId || null,
      })
      .select()
      .single();

    if (error) throw error;

    if (data.attachmentUrl) {
      await supabase.from('Document').insert({
        fileUrl: data.attachmentUrl,
        fileName: 'Fatura / Belge',
        relatedType: 'expense',
        relatedId: record.id
      });
    }

    await createAuditLog('CREATE', 'Expense', record.id, {
      description: data.description,
      amount: amountWithVat,
      locationId: data.locationId
    });

    revalidatePath('/expenses');
    revalidatePath('/');
    revalidatePath('/gelir-gider');
    revalidatePath('/reports');
    return { success: true };
  } catch (error: any) {
    console.error("Add Expense Error:", error);
    return { success: false, error: String(error?.message || 'Bilinmeyen bir hata oluştu.') };
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
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (data.attachmentUrl) {
      await supabase.from('Document').insert({
        fileUrl: data.attachmentUrl,
        fileName: 'Fatura / Belge (Grup)',
        relatedType: 'expense',
        relatedId: id
      });
    }

    await createAuditLog('UPDATE', 'Expense', id, {
      description: data.description,
      amount: amountWithVat
    });

    revalidatePath('/expenses');
    revalidatePath('/');
    revalidatePath('/gelir-gider');
    revalidatePath('/reports');
    return { success: true };
  } catch (error: any) {
    console.error("Update Expense Error:", error);
    return { success: false, error: String(error?.message || 'Bilinmeyen bir hata oluştu.') };
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
    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
      return { success: false, error: 'Yatırım açıklaması zorunludur.' };
    }
    if (!data.locationId) {
      return { success: false, error: 'Lokasyon seçimi zorunludur.' };
    }
    const amount = Math.max(0, parseFloat(data.amount) || 0);
    if (amount <= 0) {
      return { success: false, error: 'Geçerli bir tutar giriniz.' };
    }
    const description = data.description.trim().slice(0, 500);
    const currency = ['TL', 'USD', 'EUR'].includes(data.currency) ? data.currency : 'TL';
    const notes = typeof data.notes === 'string' ? data.notes.trim().slice(0, 1000) : '';

    const supabase = await createClient();
    const { error } = await supabase
      .from('Investment')
      .insert({
        id: `inv_${crypto.randomUUID()}`,
        locationId: data.locationId,
        description,
        currency,
        amountWithoutVat: amount,
        totalAmount: amount,
        notes,
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
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Geçersiz yatırım ID.' };
    }
    const amount = Math.max(0, parseFloat(data.amount) || 0);
    const description = (data.description || '').trim().slice(0, 500);
    const currency = ['TL', 'USD', 'EUR'].includes(data.currency) ? data.currency : 'TL';
    const notes = typeof data.notes === 'string' ? data.notes.trim().slice(0, 1000) : '';

    const supabase = await createClient();
    const { error } = await supabase
      .from('Investment')
      .update({
        locationId: data.locationId,
        description,
        currency,
        amountWithoutVat: amount,
        totalAmount: amount,
        notes,
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
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Geçersiz lokasyon ID.' };
    }
    const fixedRent = Math.max(0, parseFloat(data.fixedRent) || 0);
    const duesAmount = Math.max(0, parseFloat(data.duesAmount) || 0);
    const revenueShareRate = Math.max(0, Math.min(100, parseFloat(data.revenueShareRate) || 0));
    const revenueThreshold = Math.max(0, parseFloat(data.revenueThreshold) || 0);
    const rentVatRate = Math.max(0, Math.min(100, parseFloat(data.rentVatRate) || 0));

    const supabase = await createClient();
    const { error } = await supabase
      .from('Location')
      .update({
        fixedRent,
        duesAmount,
        revenueShareRate,
        revenueThreshold,
        rentVatRate,
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
        revenueShareRate: loc.revenueShareRate || 15,
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
           revenueShareRate: loc.revenueShareRate || 15,
           month: perf.month
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

export async function updateSystemParameter(key: string, value: number) {
  try {
    const allowedKeys = ['SESSION_PRICE_INCL_VAT', 'VAT_RATE', 'CORP_TAX_RATE'];
    if (!allowedKeys.includes(key)) {
      return { success: false, error: 'Geçersiz parametre anahtarı.' };
    }
    const safeValue = Math.max(0, parseFloat(String(value)) || 0);

    const supabase = await createClient();
    const { error } = await supabase
      .from('SystemParameter')
      .upsert({ key, value: safeValue }, { onConflict: 'key' });

    if (error) throw error;
    revalidatePath('/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleExpenseSettled(id: string, currentDesc: string) {
  const isSettled = currentDesc.includes('[MAHSUP]');
  const newDesc = isSettled 
    ? currentDesc.replace('[MAHSUP] ', '')
    : `[MAHSUP] ${currentDesc}`;
    
  const supabase = await createClient();
  const { error } = await supabase.from('Expense').update({ description: newDesc }).eq('id', id);
  if (error) return { success: false, error: error.message };
  
  revalidatePath('/expenses');
  return { success: true };
}

export async function autoSettleOldExpenses() {
  const supabase = await createClient();
  const { data: expenses } = await supabase.from('Expense').select('id, description');
  
  if (!expenses) return { success: true };

  let count = 0;
  for (const exp of expenses) {
    const d = exp.description.toLowerCase();
    if (!d.includes('[mahsup]') && !d.includes('eren') && !d.includes('murat')) {
      await supabase.from('Expense').update({ description: `[MAHSUP] ${exp.description}` }).eq('id', exp.id);
      count++;
    }
  }
  revalidatePath('/expenses');
  return { success: true, count };
}
