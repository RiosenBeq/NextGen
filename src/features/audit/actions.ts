'use server';

import { createClient } from '@/utils/supabase/server';

export async function getAuditLogs() {
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
