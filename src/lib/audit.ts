'use server';

import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';

export async function createAuditLog(
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entity: string,
  entityId: string,
  details?: any
) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const { error } = await supabase
      .from('AuditLog')
      .insert({
        id: crypto.randomUUID(),
        action,
        entity,
        entityId,
        details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
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
