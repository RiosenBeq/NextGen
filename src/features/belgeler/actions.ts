'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createAuditLog } from '@/lib/audit';

async function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_HESAPSUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) return null;
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}

export async function uploadDocument(formData: FormData) {
  try {
    const supabase = await createClient();
    const adminSupabase = await getAdminSupabase();
    const file = formData.get('file') as File;
    const relatedType = formData.get('relatedType') as string;
    const relatedId = formData.get('relatedId') as string;

    if (!file || !relatedType || !relatedId) {
      return { success: false, error: 'Dosya, tip ve ilgili kayıt ID gerekli.' };
    }

    // Dosya adını benzersiz yap
    const ext = file.name.split('.').pop();
    const uniqueName = `${relatedType}/${relatedId}/${Date.now()}_${file.name}`;

    // Supabase Storage'a yükle
    const storageClient = adminSupabase || supabase;
    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from('documents')
      .upload(uniqueName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      if (uploadError.message?.toLowerCase().includes('bucket not found')) {
        return { 
          success: false, 
          error: 'Eksik Yapılandırma: Supabase üzerinde "documents" bucket\'ı bulunamadı. Lütfen Storage panelinden bu isimle bir public bucket oluşturun.' 
        };
      }
      throw uploadError;
    }

    // Public URL al
    const { data: { publicUrl } } = storageClient.storage
      .from('documents')
      .getPublicUrl(uniqueName);

    // DB'ye kaydet
    const { error: dbError } = await (adminSupabase || supabase)
      .from('Document')
      .insert({
        id: `doc_${crypto.randomUUID()}`,
        relatedType,
        relatedId,
        fileName: file.name,
        fileUrl: publicUrl,
        fileSize: file.size,
        mimeType: file.type,
      });

    if (dbError) throw dbError;

    await createAuditLog('CREATE', 'Document', relatedId, { 
      fileName: file.name,
      fileType: relatedType 
    });

    revalidatePath('/giderler');
    revalidatePath('/gelir-gider');
    revalidatePath('/belgeler');
    return { success: true };
  } catch (error: any) {
    console.error('Document upload error:', error);
    return { success: false, error: error.message || 'Dosya yüklenemedi.' };
  }
}

export async function getDocuments(relatedType?: string, relatedId?: string) {
  try {
    const supabase = await createClient();
    let query = supabase.from('Document').select('*').order('uploadedAt', { ascending: false });

    if (relatedType) query = query.eq('relatedType', relatedType);
    if (relatedId) query = query.eq('relatedId', relatedId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Document fetch error:', error);
    return [];
  }
}

export async function deleteDocument(id: string) {
  try {
    const supabase = await createClient();
    const adminSupabase = await getAdminSupabase();

    // Önce DB'den dosya URL'sini al
    const dbClient = adminSupabase || supabase;
    const { data: doc } = await dbClient.from('Document').select('fileUrl').eq('id', id).single();

    if (doc?.fileUrl) {
      // Storage'dan sil
      const path = doc.fileUrl.split('/documents/')[1];
      if (path) {
        await (adminSupabase || supabase).storage.from('documents').remove([path]);
      }
    }

    // DB'den sil
    const { error } = await dbClient.from('Document').delete().eq('id', id);
    if (error) throw error;

    revalidatePath('/giderler');
    revalidatePath('/gelir-gider');
    revalidatePath('/belgeler');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
