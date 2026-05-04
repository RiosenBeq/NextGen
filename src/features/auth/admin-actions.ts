'use server'

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/lib/audit';
import { getErrorMessage } from '@/lib/errors';

const supabaseAdminOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
};

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_HESAPSUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase admin credentials eksik.');
  }

  return createClient(supabaseUrl, supabaseServiceKey, supabaseAdminOptions);
}

const newUserSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır."),
  role: z.enum(['superadmin', 'user']).default('user'),
  fullName: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır.").optional()
});
type NewUserInput = z.input<typeof newUserSchema>;

const updateUserSchema = z.object({
  userId: z.string().min(1, 'Kullanıcı ID zorunludur.'),
  role: z.enum(['superadmin', 'user']),
  fullName: z.string().min(2, 'Ad Soyad en az 2 karakter olmalıdır.'),
});
type UpdateUserInput = z.input<typeof updateUserSchema>;

/**
 * Yeni bir kullanıcı oluşturur (Sadece Super Admin yetkisi gerektirir)
 * Bu metod, işlemi gerçekleştiren admin kullanıcısının session'unu kapatmadan yeni kullanıcı açabilmesini sağlar.
 */
export async function createSystemUser(data: NewUserInput) {
  try {
    const validatedData = newUserSchema.parse(data);

    // TODO: Gerçekte caller'ın admin olup olmadığını kontrol eden bir Middleware mekanizmasına ek olarak buradan da kontrol edilebilir.

    const adminAuthClient = getAdminClient();
    
    // Auth admin api üzerinden kullanıcı yarat
    const { data: userData, error } = await adminAuthClient.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Şifre onaysız direkt aktif olsun
      user_metadata: {
        role: validatedData.role,
        full_name: validatedData.fullName || ''
      }
    });

    if (error) {
      throw error;
    }

    await createAuditLog('CREATE', 'AuthUser', userData?.user?.id || 'new', { 
      email: validatedData.email, 
      role: validatedData.role 
    });

    revalidatePath('/kullanicilar');
    return { success: true, user: { id: userData.user.id, email: userData.user.email } };
  } catch (error) {
    console.error("Create User Error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: getErrorMessage(error, 'Bilinmeyen bir hata oluştu.') };
  }
}

/**
 * Sistemdeki tüm kullanıcıları listeler (Yalnızca Admin)
 */
export async function getSystemUsers() {
  try {
    const adminAuthClient = getAdminClient();
    const { data, error } = await adminAuthClient.auth.admin.listUsers();
    
    if (error) throw error;
    
    return data.users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.user_metadata?.role || 'user',
      fullName: u.user_metadata?.full_name || '-',
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at
    }));
  } catch (error) {
    console.error("List Users Error:", error);
    return [];
  }
}

/**
 * Bir kullanıcıyı siler
 */
export async function deleteSystemUser(userId: string) {
  try {
    const adminAuthClient = getAdminClient();
    const { error } = await adminAuthClient.auth.admin.deleteUser(userId);
    
    if (error) throw error;

    await createAuditLog('DELETE', 'AuthUser', userId);

    revalidatePath('/kullanicilar');
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateSystemUserAccess(data: UpdateUserInput) {
  try {
    const validatedData = updateUserSchema.parse(data);
    const adminAuthClient = getAdminClient();

    const { data: userData, error: getUserError } = await adminAuthClient.auth.admin.getUserById(validatedData.userId);
    if (getUserError) throw getUserError;

    const currentMetadata = userData.user?.user_metadata || {};
    const { error: updateError } = await adminAuthClient.auth.admin.updateUserById(validatedData.userId, {
      user_metadata: {
        ...currentMetadata,
        role: validatedData.role,
        full_name: validatedData.fullName,
      },
    });

    if (updateError) throw updateError;

    await createAuditLog('UPDATE', 'AuthUser', validatedData.userId, {
      role: validatedData.role,
      fullName: validatedData.fullName,
      action: 'UPDATE_ACCESS_PROFILE',
    });

    revalidatePath('/ayarlar');
    revalidatePath('/kullanicilar');

    return { success: true };
  } catch (error) {
    console.error('Update User Access Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: getErrorMessage(error, 'Kullanıcı güncellenemedi.') };
  }
}
