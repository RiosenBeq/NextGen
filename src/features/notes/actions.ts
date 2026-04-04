'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getNotes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('Note')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('getNotes error:', error);
    return [];
  }
  return data || [];
}

export async function addNote(title: string, content: string = '', color: string = 'blue') {
  const supabase = await createClient();
  const id = `note_${crypto.randomUUID()}`;
  
  const { data, error } = await supabase
    .from('Note')
    .insert([{ id, title, content, color, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
    .select()
    .single();

  if (error) {
    console.error('addNote error details:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/notes');
  revalidatePath('/');
  return { success: true, note: data };
}

export async function updateNote(id: string | number, title: string, content: string = '', color: string = 'blue') {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('Note')
    .update({ title, content, color })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateNote error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/notes');
  revalidatePath('/');
  return { success: true, note: data };
}

export async function deleteNote(id: string | number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('Note')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('deleteNote error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/notes');
  revalidatePath('/');
  return { success: true };
}
