'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Mevcut giriş yapmış kullanıcının profil bilgilerini (Metadata) günceller.
 */
export async function updateProfile(data: { fullName: string }) {
  try {
    const supabase = await createClient();
    
    // Auth metadata güncelleme
    const { data: userData, error } = await supabase.auth.updateUser({
      data: { full_name: data.fullName }
    });

    if (error) throw error;

    revalidatePath('/', 'layout');
    return { success: true, user: userData.user };
  } catch (error: any) {
    console.error("Update Profile Error:", error);
    return { success: false, error: error.message || 'Profil güncellenirken bir hata oluştu.' };
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
    role: user.user_metadata?.role || 'user',
    lastSignIn: user.last_sign_in_at
  };
}
