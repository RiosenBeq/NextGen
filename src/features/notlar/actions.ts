'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireProfileAccess } from '@/lib/auth-guards';

function userIdColumnMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const message = 'message' in error && typeof (error as { message?: unknown }).message === 'string'
    ? (error as { message: string }).message
    : '';
  return message.includes("Could not find the 'userId' column of 'Note'");
}

export async function getNotes() {
  const guard = await requireProfileAccess();
  if (guard.error || !guard.user || !guard.profile) return [];
  const profileId = guard.profile.id;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('Note')
    .select('*')
    .eq('profileId', profileId)
    .eq('userId', guard.user.id)
    .order('createdAt', { ascending: false });

  if (error && userIdColumnMissing(error)) {
    console.warn('Note.userId kolonu yok — şema migrate edilmeli. Boş liste döndürülüyor.');
    return [];
  }

  if (error) {
    console.error('getNotes error:', error);
    return [];
  }
  return data || [];
}

export async function addNote(title: string, content: string = '', color: string = 'blue') {
  const guard = await requireProfileAccess();
  if (guard.error || !guard.user || !guard.profile) {
    return { success: false, error: guard.error ?? 'Oturum bulunamadı.' };
  }
  const profileId = guard.profile.id;

  const supabase = await createClient();
  const id = `note_${crypto.randomUUID()}`;

  const { data, error } = await supabase
    .from('Note')
    .insert([{
      id,
      profileId,
      userId: guard.user.id,
      title,
      content,
      color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }])
    .select()
    .single();

  if (error && userIdColumnMissing(error)) {
    return { success: false, error: 'Sistem güncellemesi gerekiyor: Note.userId kolonu eksik.' };
  }

  if (error) {
    console.error('addNote error details:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/notlar');
  revalidatePath('/');
  return { success: true, note: data };
}

export async function updateNote(id: string | number, title: string, content: string = '', color: string = 'blue') {
  const guard = await requireProfileAccess();
  if (guard.error || !guard.user || !guard.profile) {
    return { success: false, error: guard.error ?? 'Oturum bulunamadı.' };
  }
  const profileId = guard.profile.id;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('Note')
    .update({ title, content, color, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .eq('profileId', profileId)
    .eq('userId', guard.user.id)
    .select()
    .single();

  if (error && userIdColumnMissing(error)) {
    return { success: false, error: 'Sistem güncellemesi gerekiyor: Note.userId kolonu eksik.' };
  }

  if (error) {
    console.error('updateNote error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/notlar');
  revalidatePath('/');
  return { success: true, note: data };
}

export async function deleteNote(id: string | number) {
  const guard = await requireProfileAccess();
  if (guard.error || !guard.user || !guard.profile) {
    return { success: false, error: guard.error ?? 'Oturum bulunamadı.' };
  }
  const profileId = guard.profile.id;

  const supabase = await createClient();

  const { error } = await supabase
    .from('Note')
    .delete()
    .eq('id', id)
    .eq('profileId', profileId)
    .eq('userId', guard.user.id);

  if (error && userIdColumnMissing(error)) {
    return { success: false, error: 'Sistem güncellemesi gerekiyor: Note.userId kolonu eksik.' };
  }

  if (error) {
    console.error('deleteNote error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/notlar');
  revalidatePath('/');
  return { success: true };
}
