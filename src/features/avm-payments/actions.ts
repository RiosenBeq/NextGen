'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { avmPaymentSchema } from './schema';
import { createAuditLog } from '@/lib/audit';

export async function addAvmPayment(data: unknown) {
  try {
    const validated = avmPaymentSchema.parse(data);
    const amount = Math.max(0, validated.amount || 0);

    if (amount <= 0) {
      return { success: false, error: 'Geçerli bir tutar giriniz.' };
    }

    const supabase = await createClient();

    const { error } = await supabase.from('AvmPayment').insert({
      id: `avm_${crypto.randomUUID()}`,
      locationId: validated.locationId,
      month: validated.month,
      paymentType: validated.paymentType,
      description: validated.description || null,
      amount,
      isPaid: false,
    });

    if (error) throw error;

    await createAuditLog('CREATE', 'AvmPayment', 'new', {
      paymentType: validated.paymentType,
      month: validated.month,
      amount,
    });

    revalidatePath('/avm-odemeleri');
    revalidatePath('/aylik-ozet');
    revalidatePath('/raporlar');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.';
    console.error('Add AvmPayment Error:', error);
    return { success: false, error: message };
  }
}

export async function updateAvmPayment(
  id: string,
  data: unknown
) {
  try {
    if (!id) return { success: false, error: 'Geçersiz kayıt ID.' };

    const validated = avmPaymentSchema.parse(data);
    const amount = Math.max(0, validated.amount || 0);

    const supabase = await createClient();

    const { error } = await supabase
      .from('AvmPayment')
      .update({
        locationId: validated.locationId,
        month: validated.month,
        paymentType: validated.paymentType,
        description: validated.description || null,
        amount,
      })
      .eq('id', id);

    if (error) throw error;

    await createAuditLog('UPDATE', 'AvmPayment', id, {
      paymentType: validated.paymentType,
      amount,
    });

    revalidatePath('/avm-odemeleri');
    revalidatePath('/aylik-ozet');
    revalidatePath('/raporlar');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Güncelleme hatası.';
    console.error('Update AvmPayment Error:', error);
    return { success: false, error: message };
  }
}

export async function toggleAvmPaymentPaid(id: string, currentlyPaid: boolean) {
  try {
    if (!id) return { success: false, error: 'Geçersiz kayıt ID.' };

    const supabase = await createClient();

    const newPaid = !currentlyPaid;
    const { error } = await supabase
      .from('AvmPayment')
      .update({
        isPaid: newPaid,
        paidAt: newPaid ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (error) throw error;

    await createAuditLog('UPDATE', 'AvmPayment', id, {
      action: newPaid ? 'MARK_PAID' : 'MARK_UNPAID',
    });

    revalidatePath('/avm-odemeleri');
    revalidatePath('/aylik-ozet');
    revalidatePath('/raporlar');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Durum güncellenemedi.';
    return { success: false, error: message };
  }
}

export async function deleteAvmPayment(id: string) {
  try {
    if (!id) return { success: false, error: 'Geçersiz kayıt ID.' };

    const supabase = await createClient();
    const { error } = await supabase.from('AvmPayment').delete().eq('id', id);

    if (error) throw error;

    await createAuditLog('DELETE', 'AvmPayment', id);

    revalidatePath('/avm-odemeleri');
    revalidatePath('/aylik-ozet');
    revalidatePath('/raporlar');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Silme işlemi başarısız.';
    return { success: false, error: message };
  }
}
