'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { avmPaymentSchema } from './schema';
import { createAuditLog } from '@/lib/audit';
import { requireProfileAccess } from '@/lib/auth-guards';
import { getErrorMessage } from '@/lib/errors';

export async function addAvmPayment(data: unknown) {
  try {
    const guard = await requireProfileAccess();
    if (guard.error || !guard.user || !guard.profile) {
      return { success: false, error: guard.error };
    }
    const profileId = guard.profile.id;

    const validated = avmPaymentSchema.parse(data);
    const amount = Math.max(0, validated.amount || 0);

    if (amount <= 0) {
      return { success: false, error: 'Geçerli bir tutar giriniz.' };
    }

    const supabase = await createClient();

    const { error } = await supabase.from('AvmPayment').insert({
      id: `avm_${crypto.randomUUID()}`,
      profileId,
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
      createdBy: guard.user.id,
    });

    revalidatePath('/avm-odemeleri');
    return { success: true };
  } catch (error) {
    console.error('Add AvmPayment Error:', error);
    return { success: false, error: getErrorMessage(error, 'Bilinmeyen bir hata oluştu.') };
  }
}

export async function updateAvmPayment(id: string, data: unknown) {
  try {
    const guard = await requireProfileAccess();
    if (guard.error || !guard.user || !guard.profile) {
      return { success: false, error: guard.error };
    }
    const profileId = guard.profile.id;

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
      .eq('id', id)
      .eq('profileId', profileId);

    if (error) throw error;

    await createAuditLog('UPDATE', 'AvmPayment', id, {
      paymentType: validated.paymentType,
      amount,
      updatedBy: guard.user.id,
    });

    revalidatePath('/avm-odemeleri');
    return { success: true };
  } catch (error) {
    console.error('Update AvmPayment Error:', error);
    return { success: false, error: getErrorMessage(error, 'Güncelleme hatası.') };
  }
}

export async function toggleAvmPaymentPaid(id: string, currentlyPaid: boolean) {
  try {
    const guard = await requireProfileAccess();
    if (guard.error || !guard.user || !guard.profile) {
      return { success: false, error: guard.error };
    }
    const profileId = guard.profile.id;

    if (!id) return { success: false, error: 'Geçersiz kayıt ID.' };

    const supabase = await createClient();

    const newPaid = !currentlyPaid;
    const { error } = await supabase
      .from('AvmPayment')
      .update({
        isPaid: newPaid,
        paidAt: newPaid ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('profileId', profileId);

    if (error) throw error;

    await createAuditLog('UPDATE', 'AvmPayment', id, {
      action: newPaid ? 'MARK_PAID' : 'MARK_UNPAID',
      by: guard.user.id,
    });

    revalidatePath('/avm-odemeleri');
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, 'Durum güncellenemedi.') };
  }
}

export async function deleteAvmPayment(id: string) {
  try {
    const guard = await requireProfileAccess();
    if (guard.error || !guard.user || !guard.profile) {
      return { success: false, error: guard.error };
    }
    const profileId = guard.profile.id;

    if (!id) return { success: false, error: 'Geçersiz kayıt ID.' };

    const supabase = await createClient();
    const { error } = await supabase
      .from('AvmPayment')
      .delete()
      .eq('id', id)
      .eq('profileId', profileId);

    if (error) throw error;

    await createAuditLog('DELETE', 'AvmPayment', id, { deletedBy: guard.user.id });

    revalidatePath('/avm-odemeleri');
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, 'Silme işlemi başarısız.') };
  }
}
