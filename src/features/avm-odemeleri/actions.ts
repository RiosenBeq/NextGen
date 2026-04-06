'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export async function createAvmInvoice(formData: FormData) {
  try {
    const supabase = await createClient();

    const locationId = String(formData.get('locationId') || '').trim();
    const invoiceType = String(formData.get('invoiceType') || '').trim();
    const amount = Number(formData.get('amount') || 0);
    const invoiceDate = String(formData.get('invoiceDate') || '').trim();
    const dueDate = String(formData.get('dueDate') || '').trim();
    const notes = String(formData.get('notes') || '').trim();
    const file = formData.get('file') as File | null;

    if (!invoiceType || !invoiceDate || !amount || amount <= 0) {
      return { success: false, error: 'Fatura tipi, fatura tarihi ve tutar zorunludur.' };
    }

    let attachmentUrl: string | null = null;

    if (file && file.size > 0) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return { success: false, error: 'Sadece PDF, JPG, PNG veya WEBP dosyası yükleyebilirsiniz.' };
      }

      const path = `avm-invoices/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        if (uploadError.message?.toLowerCase().includes('bucket not found')) {
          return {
            success: false,
            error: 'Supabase üzerinde documents bucket bulunamadı. Lütfen bucket oluşturun.',
          };
        }
        return { success: false, error: uploadError.message };
      }

      const { data } = supabase.storage.from('documents').getPublicUrl(path);
      attachmentUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from('AvmInvoice')
      .insert({
        id: `avm_${crypto.randomUUID()}`,
        locationId: locationId || null,
        invoiceType,
        amount,
        invoiceDate,
        dueDate: dueDate || null,
        notes: notes || null,
        attachmentUrl,
      });

    if (error) return { success: false, error: error.message };

    revalidatePath('/avm-odemeleri');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kayıt sırasında hata oluştu.';
    return { success: false, error: message };
  }
}

export async function toggleAvmInvoicePayment(id: string, isPaid: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('AvmInvoice')
    .update({
      isPaid: !isPaid,
      paidAt: isPaid ? null : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/avm-odemeleri');
  return { success: true };
}
