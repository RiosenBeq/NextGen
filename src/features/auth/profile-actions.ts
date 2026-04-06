'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Mevcut giriş yapmış kullanıcının profil bilgilerini (Metadata) günceller.
 */
export async function updateProfile(data: { fullName: string; birthDate?: string; password?: string }) {
  try {
    const supabase = await createClient();

    const payload: {
      data: { full_name: string; birth_date?: string };
      password?: string;
    } = {
      data: {
        full_name: data.fullName,
      },
    };

    if (data.birthDate) {
      payload.data.birth_date = data.birthDate;
    }

    if (data.password && data.password.trim().length > 0) {
      if (data.password.trim().length < 8) {
        return { success: false, error: 'Yeni şifre en az 8 karakter olmalıdır.' };
      }
      payload.password = data.password.trim();
    }

    const { data: userData, error } = await supabase.auth.updateUser(payload);
    if (error) throw error;

    revalidatePath('/', 'layout');
    revalidatePath('/ayarlar');
    return { success: true, user: userData.user };
  } catch (error: unknown) {
    console.error("Update Profile Error:", error);
    const message = error instanceof Error ? error.message : 'Profil güncellenirken bir hata oluştu.';
    return { success: false, error: message };
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
