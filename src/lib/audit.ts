'use server';

import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import { resolveActiveProfile } from '@/lib/profile-context';

export async function createAuditLog(
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entity: string,
  entityId: string,
  details?: unknown,
  status: 'SUCCESS' | 'ERROR' = 'SUCCESS'
) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const resolution = await resolveActiveProfile();
    const profileId = resolution.profile?.id;
    if (!profileId) {
      // Aktif profil yoksa audit log atlanır (geçersiz tenant durumu)
      return;
    }

    // Get current user if available
    const { data: { user } } = await supabase.auth.getUser();
    const userDisplay = user ? user.email : 'Sistem / Anonim';

    // Format descriptive details
    let descriptiveDetails = '';
    const actionText = action === 'CREATE' ? 'eklendi' : action === 'UPDATE' ? 'güncellendi' : 'silindi';
    const statusText = status === 'SUCCESS' ? 'BAŞARILI' : 'HATALI';

    if (typeof details === 'object' && details !== null) {
      // If it's an object, we can extract some key info for the readable string
      const detailsObj = details as Record<string, unknown>;
      const mainInfo = detailsObj.description || detailsObj.name || detailsObj.title || entityId;
      descriptiveDetails = `${userDisplay} tarafından ${entity} (${mainInfo}) ${actionText}. Sonuç: ${statusText}.`;

      // Keep the full object as well for technical tracking
      descriptiveDetails += ` | Veri: ${JSON.stringify(details)}`;
    } else {
      descriptiveDetails = `${userDisplay} tarafından ${entity} (${entityId}) ${actionText}. Sonuç: ${statusText}. ${details ? String(details) : ''}`;
    }

    const { error } = await supabase
      .from('AuditLog')
      .insert({
        id: crypto.randomUUID(),
        profileId,
        action,
        entity,
        entityId,
        details: descriptiveDetails,
        ipAddress,
        userAgent,
        createdAt: new Date().toISOString()
      });

    if (error) {
      console.error('Supabase Audit Log Error:', error);
    }
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

