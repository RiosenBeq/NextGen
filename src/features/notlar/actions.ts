'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

function userIdColumnMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  // Supabase PostgrestError'larında message özelliği var ama prototype Error değil.
  const message = 'message' in error && typeof (error as { message?: unknown }).message === 'string'
    ? (error as { message: string }).message
    : '';
  return message.includes("Could not find the 'userId' column of 'Note'");
}

export async function getNotes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase.from('Note').select('*');
  if (user) query = query.eq('userId', user.id);

  let { data, error } = await query.order('createdAt', { ascending: false });

  // Eski şemalarda userId kolonu yoksa fallback
  if (error && userIdColumnMissing(error)) {
    const fallback = await supabase
      .from('Note')
      .select('*')
      .order('createdAt', { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error('getNotes error:', error);
    return [];
  }
  return data || [];
}

export async function addNote(title: string, content: string = '', color: string = 'blue') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };
  }
  const id = `note_${crypto.randomUUID()}`;
  
  let { data, error } = await supabase
    .from('Note')
    .insert([{ 
      id, 
      userId: user.id,
      title, 
      content, 
      color, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    }])
    .select()
    .single();

  if (error && userIdColumnMissing(error)) {
    const fallback = await supabase
      .from('Note')
      .insert([{
        id,
        title,
        content,
        color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }])
      .select()
      .single();
    data = fallback.data;
    error = fallback.error;
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };
  }
  
  // Ensure we only update notes that belong to the user
  let { data, error } = await supabase
    .from('Note')
    .update({ title, content, color, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .eq('userId', user.id)
    .select()
    .single();

  if (error && userIdColumnMissing(error)) {
    const fallback = await supabase
      .from('Note')
      .update({ title, content, color, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    data = fallback.data;
    error = fallback.error;
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };
  }
  
  let { error } = await supabase
    .from('Note')
    .delete()
    .eq('id', id)
    .eq('userId', user.id);

  if (error && userIdColumnMissing(error)) {
    const fallback = await supabase
      .from('Note')
      .delete()
      .eq('id', id);
    error = fallback.error;
  }

  if (error) {
    console.error('deleteNote error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/notlar');
  revalidatePath('/');
  return { success: true };
}
