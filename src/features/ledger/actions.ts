'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { monthlyPerformanceSchema, MonthlyPerformanceInput, expenseSchema, investmentSchema, locationParamsSchema } from './schema';
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
    const validatedData = expenseSchema.parse(data);
    const amountWithoutVat = Math.max(0, validatedData.amount || 0);
    const vatRate = Math.max(0, Math.min(100, validatedData.vatRate || 0));
    const amountWithVat = amountWithoutVat * (1 + vatRate / 100);

    const supabase = await createClient();

    const { data: record, error } = await supabase
      .from('Expense')
      .insert({
        id: `exp_${crypto.randomUUID()}`,
        locationId: validatedData.locationId || null,
        description: validatedData.description,
        type: validatedData.type,
        amountWithoutVat,
        amountWithVat,
        vatRate,
        isOfficial: validatedData.isOfficial,
        month: validatedData.month || null,
        paidBy: validatedData.paidBy || 'Ortak Hesap',
        categoryId: validatedData.categoryId || null,
      })
      .select()
      .single();

    if (error) throw error;

    if (validatedData.attachmentUrl) {
      await supabase.from('Document').insert({
        fileUrl: validatedData.attachmentUrl,
        fileName: 'Fatura / Belge',
        relatedType: 'expense',
        relatedId: record.id
      });
    }

    await createAuditLog('CREATE', 'Expense', record.id, {
      description: validatedData.description,
      amount: amountWithVat,
      locationId: validatedData.locationId
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
    const validatedData = expenseSchema.parse(data);
    const supabase = await createClient();
    const vatRate = Math.max(0, Math.min(100, validatedData.vatRate || 0));
    const amountWithoutVat = Math.max(0, validatedData.amount || 0);
    const amountWithVat = amountWithoutVat * (1 + vatRate / 100);

    const { data: record, error } = await supabase
      .from('Expense')
      .update({
        locationId: validatedData.locationId || null,
        description: validatedData.description,
        type: validatedData.type,
        amountWithoutVat: amountWithoutVat,
        amountWithVat: amountWithVat,
        vatRate: vatRate,
        isOfficial: validatedData.isOfficial,
        month: validatedData.month || null,
        paidBy: validatedData.paidBy || 'Ortak Hesap',
        categoryId: validatedData.categoryId || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (validatedData.attachmentUrl) {
      await supabase.from('Document').insert({
        fileUrl: validatedData.attachmentUrl,
        fileName: 'Fatura / Belge (Grup)',
        relatedType: 'expense',
        relatedId: id
      });
    }

    await createAuditLog('UPDATE', 'Expense', id, {
      description: validatedData.description,
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
    // 1. Sunucu taraflı güvenli yükleme için Admin yetkisini kullan (Bypass RLS on upload)
    const supabaseUrl = process.env.NEXT_PUBLIC_HESAPSUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return { success: false, error: 'Sistem Hatası: Supabase url veya yetki anahtarı bulunamadı.' };
    }
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const adminSupabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'Dosya seçilmedi.' };

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 15) {
      return { success: false, error: `Dosya boyutu çok büyük (${sizeMB.toFixed(1)}MB). Maksimum 15MB yüklenebilir.` };
    }

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

    // 2. Eksik bucket problemini otomatik çöz: 
    const { data: buckets } = await adminSupabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'documents')) {
       // Bucket yoksa Public olarak hemen yarat
       await adminSupabase.storage.createBucket('documents', { public: true });
    }

    // 3. Dosyayı doğrudan Admin servisi ile yükle (RLS engeline takılmaz)
    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType,
      });

    if (uploadError) {
      console.error("Storage Error:", uploadError);
      return { success: false, error: `Yükleme hatası: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = adminSupabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return { success: true, publicUrl };
  } catch (error: any) {
    console.error("Upload Error:", error);
    return { success: false, error: `Sunucu hatası: ${error.message}` };
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
    revalidatePath('/reports');
    revalidatePath('/finans');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addInvestment(data: any) {
  try {
    const validatedData = investmentSchema.parse(data);
    const amount = Math.max(0, validatedData.amount || 0);
    if (amount <= 0) {
      return { success: false, error: 'Geçerli bir tutar giriniz.' };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('Investment')
      .insert({
        id: `inv_${crypto.randomUUID()}`,
        locationId: validatedData.locationId,
        description: validatedData.description,
        currency: validatedData.currency,
        amountWithoutVat: amount,
        totalAmount: amount,
        notes: validatedData.notes || '',
      });

    if (error) throw error;

    await createAuditLog('CREATE', 'Investment', 'new', { 
      description: validatedData.description, 
      amount: amount 
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
    const validatedData = investmentSchema.parse(data);
    const amount = Math.max(0, validatedData.amount || 0);

    const supabase = await createClient();
    const { error } = await supabase
      .from('Investment')
      .update({
        locationId: validatedData.locationId,
        description: validatedData.description,
        currency: validatedData.currency,
        amountWithoutVat: amount,
        totalAmount: amount,
        notes: validatedData.notes || '',
      })
      .eq('id', id);

    if (error) throw error;

    await createAuditLog('UPDATE', 'Investment', id, { 
      description: validatedData.description, 
      amount: amount 
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
    const validatedData = locationParamsSchema.parse(data);
    
    const fixedRent = Math.max(0, validatedData.fixedRent);
    const duesAmount = Math.max(0, validatedData.duesAmount);
    const revenueShareRate = Math.max(0, Math.min(100, validatedData.revenueShareRate));
    const revenueThreshold = Math.max(0, validatedData.revenueThreshold);
    const rentVatRate = Math.max(0, Math.min(100, validatedData.rentVatRate));

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
    revalidatePath('/reports');
    revalidatePath('/gelir-gider');
    revalidatePath('/finans');
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
    const allowedKeys = [
      'SESSION_PRICE_INCL_VAT', 
      'VAT_RATE', 
      'CORP_TAX_RATE',
      'SETTING_POPUP_POSITION',
      'SETTING_LOG_DETAIL_LEVEL',
      'SETTING_DEFAULT_PAGE',
      'SETTING_ANIMATION_SPEED'
    ];
    if (!allowedKeys.includes(key)) {
      return { success: false, error: 'Geçersiz parametre anahtarı.' };
    }
    const safeValue = parseFloat(String(value));

    // Use Prisma for reliable ID generation and upsert handling
    await prisma.systemParameter.upsert({
      where: { key },
      update: { value: safeValue },
      create: { key, value: safeValue },
    });

    await createAuditLog('UPDATE', 'SystemParameter', key, { newValue: safeValue });
    
    revalidatePath('/settings');
    revalidatePath('/');
    revalidatePath('/reports');
    revalidatePath('/gelir-gider');
    revalidatePath('/finans');
    return { success: true };
  } catch (error: any) {
    console.error("Update System Param Error:", error);
    return { success: false, error: error.message };
  }
}

export async function resetSystemParameters() {
  try {
    const defaults = {
      'SESSION_PRICE_INCL_VAT': 300,
      'VAT_RATE': 20,
      'CORP_TAX_RATE': 25,
      'SETTING_POPUP_POSITION': 0,
      'SETTING_LOG_DETAIL_LEVEL': 0,
      'SETTING_DEFAULT_PAGE': 0,
      'SETTING_ANIMATION_SPEED': 1
    };

    for (const [key, value] of Object.entries(defaults)) {
      await prisma.systemParameter.upsert({
        where: { key },
        update: { value: (value as number) },
        create: { key, value: (value as number) },
      });
    }

    await createAuditLog('UPDATE', 'SystemParameter', 'ALL', 'Ayarlar varsayılana sıfırlandı.');

    revalidatePath('/settings');
    revalidatePath('/');
    revalidatePath('/reports');
    revalidatePath('/gelir-gider');
    revalidatePath('/finans');
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
