'use server';

import { createClient } from '@/utils/supabase/server';
import { requireUser } from '@/lib/auth-guards';

/**
 * Audit log'larını listeler. Hassas operasyonel veri içerdiği için
 * sadece oturum açmış kullanıcılara görünür; superadmin olmayanlara
 * detayların açılmasını UI tarafı (settings.SETTING_LOG_DETAIL_LEVEL) yönetir.
 */
export async function getAuditLogs() {
  const guard = await requireUser();
  if (guard.error || !guard.user) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('AuditLog')
    .select('*')
    .order('createdAt', { ascending: false })
    .limit(100);

  if (error) {
    console.error('getAuditLogs error:', error);
    return [];
  }
  return data || [];
}
