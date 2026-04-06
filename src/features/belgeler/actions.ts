'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createAuditLog } from '@/lib/audit';

export async function uploadDocument(formData: FormData) {
  try {
    const supabase = await createClient();
    const file = formData.get('file') as File;
    const relatedType = formData.get('relatedType') as string;
    const relatedId = formData.get('relatedId') as string;

    if (!file || !relatedType || !relatedId) {
      return { success: false, error: 'Dosya, tip ve ilgili kayıt ID gerekli.' };
    }

    // Dosya adını benzersiz yap
    const uniqueName = `${relatedType}/${relatedId}/${Date.now()}_${file.name}`;

    // Supabase Storage'a yükle
    const { error: uploadError } = await supabase.storage
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
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(uniqueName);

    // DB'ye kaydet
    const basePayload = {
      id: `doc_${crypto.randomUUID()}`,
      relatedType,
      relatedId,
      fileName: file.name,
      fileUrl: publicUrl,
    };

    const { error: dbError } = await supabase
      .from('Document')
      .insert({
        ...basePayload,
        fileSize: file.size,
        mimeType: file.type,
      });

    if (dbError) {
      const schemaCacheError = dbError.message?.toLowerCase().includes('schema cache');
      const missingColumnError = dbError.message?.toLowerCase().includes('filesize')
        || dbError.message?.toLowerCase().includes('mimetype');

      if (schemaCacheError || missingColumnError) {
        const { error: fallbackError } = await supabase
          .from('Document')
          .insert(basePayload);

        if (fallbackError) throw fallbackError;
      } else {
        throw dbError;
      }
    }

    await createAuditLog('CREATE', 'Document', relatedId, { 
      fileName: file.name,
      fileType: relatedType 
    });

    revalidatePath('/giderler');
    revalidatePath('/gelir-gider');
    revalidatePath('/belgeler');
    revalidatePath('/avm-odemeleri');
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

    // Önce DB'den dosya URL'sini al
    const { data: doc } = await supabase.from('Document').select('fileUrl').eq('id', id).single();

    if (doc?.fileUrl) {
      // Storage'dan sil
      const path = doc.fileUrl.split('/documents/')[1];
      if (path) {
        await supabase.storage.from('documents').remove([path]);
      }
    }

    // DB'den sil
    const { error } = await supabase.from('Document').delete().eq('id', id);
    if (error) throw error;

    revalidatePath('/giderler');
    revalidatePath('/gelir-gider');
    revalidatePath('/belgeler');
    revalidatePath('/avm-odemeleri');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
