import { createClient } from '@/utils/supabase/server';

/**
 * Sunucu eylemlerinde (Server Actions) kimlik ve yetki doğrulaması için yardımcılar.
 * Tüm fonksiyonlar oturum açmamış / yetkisiz isteklerde fırlatma yerine
 * `{ user, error }` döndürür; çağıran kod gerekirse erken çıkar.
 */

type AuthRole = 'superadmin' | 'user';

export interface AuthGuardResult {
  user: {
    id: string;
    email?: string;
    role: AuthRole;
    fullName?: string;
  } | null;
  error?: string;
}

/**
 * Oturum açmış olan kullanıcıyı döndürür. Oturum yoksa `error` ile null user.
 */
export async function requireUser(): Promise<AuthGuardResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return { user: null, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };
  }

  const role: AuthRole = data.user.user_metadata?.role === 'superadmin' ? 'superadmin' : 'user';
  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      role,
      fullName: data.user.user_metadata?.full_name as string | undefined,
    },
  };
}

/**
 * Sadece `superadmin` rolüne izin verir. Diğer her durumda hata döner.
 */
export async function requireSuperAdmin(): Promise<AuthGuardResult> {
  const result = await requireUser();
  if (result.error || !result.user) return result;

  if (result.user.role !== 'superadmin') {
    return { user: null, error: 'Bu işlem için yetkiniz bulunmuyor.' };
  }

  return result;
}
