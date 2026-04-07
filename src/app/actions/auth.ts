'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { loginSchema, type LoginFormState } from '@/lib/auth-schemas';

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
    const fullName = formData.get('fullName')?.toString() || '';
    if (fullName.trim().length < 2) {
      return { success: false, error: 'Ad soyad alanı çok kısa.' };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    });

    if (error) throw error;
    
    // Yalnızca başarılı olursa layout'u revalidate et
    // redirect değil, çünkü modal ClientSide kapanacak
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Profil güncellenirken bir hata oluştu.' };
  }
}
