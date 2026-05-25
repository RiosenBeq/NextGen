'use server';

import { createClient } from '@/utils/supabase/server';
import { requireProfileAccess } from '@/lib/auth-guards';

/**
 * Audit log'larını listeler. Aktif profilin kayıtlarıyla sınırlıdır.
 */
export async function getAuditLogs() {
  const guard = await requireProfileAccess();
  if (guard.error || !guard.user || !guard.profile) {
    return [];
  }
  const profileId = guard.profile.id;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('AuditLog')
    .select('*')
    .eq('profileId', profileId)
    .order('createdAt', { ascending: false })
    .limit(100);

  if (error) {
    console.error('getAuditLogs error:', error);
    return [];
  }
  return data || [];
}
