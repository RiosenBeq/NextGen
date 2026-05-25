'use server';

import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { loginSchema, type LoginFormState } from '@/lib/auth-schemas';
import { getErrorMessage } from '@/lib/errors';
import { requireUser } from '@/lib/auth-guards';

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Ad soyad en az 2 karakter olmalıdır.').max(120, 'Ad soyad çok uzun.'),
});

export async function login(
  state: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  // 1. Validate form fields with Zod
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  // 2. Authenticate with Supabase
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Map Supabase error messages to Turkish
    let message = 'Giriş sırasında bir hata oluştu.';
    const code = error.message?.toLowerCase() || '';

    if (code.includes('invalid login credentials') || code.includes('invalid_credentials')) {
      message = 'E-posta veya şifre hatalı.';
    } else if (code.includes('email not confirmed')) {
      message = 'E-posta adresiniz doğrulanmamış.';
    } else if (code.includes('too many requests') || code.includes('rate_limit')) {
      message = 'Çok fazla deneme yaptınız. Lütfen biraz bekleyin.';
    }

    return { message };
  }

  // 3. Redirect to dashboard on success
  redirect('/');
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function updateProfile(formData: FormData) {
  try {
    const guard = await requireUser();
    if (guard.error || !guard.user) {
      return { success: false, error: guard.error };
    }

    const parsed = updateProfileSchema.parse({
      fullName: formData.get('fullName')?.toString() || '',
    });

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: parsed.fullName }
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: getErrorMessage(error, 'Profil güncellenirken bir hata oluştu.') };
  }
}
