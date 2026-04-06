'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getNotes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let query = supabase.from('Note').select('*');
  
  if (user) {
    // Filter by the user's specific notes
    query = query.eq('userId', user.id);
  } else {
    // If no user, return nothing or public notes (currently none have userId)
    query = query.is('userId', null);
  }

  const { data, error } = await query.order('createdAt', { ascending: false });

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
  
  const { data, error } = await supabase
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
  const { data, error } = await supabase
    .from('Note')
    .update({ title, content, color, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .eq('userId', user.id)
    .select()
    .single();

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
  
  const { error } = await supabase
    .from('Note')
    .delete()
    .eq('id', id)
    .eq('userId', user.id);

  if (error) {
    console.error('deleteNote error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/notlar');
  revalidatePath('/');
  return { success: true };
}
