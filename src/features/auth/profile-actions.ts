'use server'

import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth-guards';
import { getErrorMessage } from '@/lib/errors';

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2, 'Ad Soyad en az 2 karakter olmalıdır.').max(120, 'Ad Soyad çok uzun.'),
  birthDate: z.string().trim().optional(),
  password: z.string().optional(),
});

/**
 * Mevcut giriş yapmış kullanıcının profil bilgilerini (Metadata) günceller.
 */
export async function updateProfile(data: { fullName: string; birthDate?: string; password?: string }) {
  try {
    const guard = await requireUser();
    if (guard.error || !guard.user) {
      return { success: false, error: guard.error };
    }

    const parsed = profileUpdateSchema.parse(data);

    const supabase = await createClient();

    const payload: {
      data: { full_name: string; birth_date?: string };
      password?: string;
    } = {
      data: {
        full_name: parsed.fullName,
      },
    };

    if (parsed.birthDate) {
      payload.data.birth_date = parsed.birthDate;
    }

    if (parsed.password && parsed.password.trim().length > 0) {
      if (parsed.password.trim().length < 8) {
        return { success: false, error: 'Yeni şifre en az 8 karakter olmalıdır.' };
      }
      payload.password = parsed.password.trim();
    }

    const { data: userData, error } = await supabase.auth.updateUser(payload);
    if (error) throw error;

    revalidatePath('/', 'layout');
    revalidatePath('/ayarlar');
    return { success: true, user: userData.user };
  } catch (error) {
    console.error("Update Profile Error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: getErrorMessage(error, 'Profil güncellenirken bir hata oluştu.') };
  }
}

/**
 * Mevcut kullanıcının detaylarını döner.
 */
export async function getMyProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name || '',
    birthDate: user.user_metadata?.birth_date || '',
    role: user.user_metadata?.role || 'user',
    lastSignIn: user.last_sign_in_at
  };
}
