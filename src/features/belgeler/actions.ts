'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createAuditLog } from '@/lib/audit';

async function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_HESAPSUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY – uploads will use the regular client and may fail due to RLS.');
    return null;
  }
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_FILE_SIZE_MB = 15;

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

    // File size validation
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      return {
        success: false,
        error: `Dosya boyutu çok büyük (${sizeMB.toFixed(1)}MB). Maksimum ${MAX_FILE_SIZE_MB}MB yüklenebilir.`,
      };
    }

    // File type validation
    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      return {
        success: false,
        error: `Desteklenmeyen dosya türü: ${mimeType}. Yalnızca PDF, JPG, PNG ve WebP kabul edilmektedir.`,
      };
    }

    const storageClient = adminSupabase || supabase;

    // Auto-create bucket if it doesn't exist
    try {
      const { data: buckets } = await storageClient.storage.listBuckets();
      if (!buckets?.find((b: { name: string }) => b.name === 'documents')) {
        await storageClient.storage.createBucket('documents', { public: true });
      }
    } catch (bucketErr) {
      console.warn('Bucket check/create warning:', bucketErr);
    }

    // Generate unique file path
    const uniqueName = `${relatedType}/${relatedId}/${Date.now()}_${file.name}`;

    // Upload to Supabase Storage with contentType
    const { error: uploadError } = await storageClient.storage
      .from('documents')
      .upload(uniqueName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { success: false, error: `Yükleme hatası: ${uploadError.message}` };
    }

    // Get public URL
    const { data: { publicUrl } } = storageClient.storage
      .from('documents')
      .getPublicUrl(uniqueName);

    // Save to DB
    const { error: dbError } = await (adminSupabase || supabase)
      .from('Document')
      .insert({
        id: `doc_${crypto.randomUUID()}`,
        relatedType,
        relatedId,
        fileName: file.name,
        fileUrl: publicUrl,
      });

    if (dbError) {
      // Clean up orphaned storage file
      await storageClient.storage.from('documents').remove([uniqueName]);
      throw dbError;
    }

    await createAuditLog('CREATE', 'Document', relatedId, {
      fileName: file.name,
      fileType: relatedType
    });

    revalidatePath('/giderler');
    revalidatePath('/gelir-gider');
    revalidatePath('/sozlesmeler');
    revalidatePath('/faturalar');
    return { success: true, publicUrl };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Dosya yüklenemedi.';
    console.error('Document upload error:', error);
    return { success: false, error: message };
  }
}

export async function getDocuments(relatedType?: string, relatedId?: string) {
  try {
    const supabase = await createClient();
    let query = supabase.from('Document').select('*').order('createdAt', { ascending: false });

    if (relatedType) query = query.eq('relatedType', relatedType);
    if (relatedId) query = query.eq('relatedId', relatedId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error: unknown) {
    console.error('Document fetch error:', error);
    return [];
  }
}

export async function deleteDocument(id: string) {
  try {
    const adminSupabase = await getAdminSupabase();
    const supabase = await createClient();
    const dbClient = adminSupabase || supabase;

    // Get file URL from DB first
    const { data: doc, error: fetchError } = await dbClient.from('Document').select('fileUrl').eq('id', id).single();
    if (fetchError) {
      console.warn('Document fetch warning:', fetchError.message);
    }

    if (doc?.fileUrl) {
      // Delete from storage
      const path = doc.fileUrl.split('/documents/')[1];
      if (path) {
        await (adminSupabase || supabase).storage.from('documents').remove([path]);
      }
    }

    // Delete from DB
    const { error } = await dbClient.from('Document').delete().eq('id', id);
    if (error) throw error;

    revalidatePath('/giderler');
    revalidatePath('/gelir-gider');
    revalidatePath('/sozlesmeler');
    revalidatePath('/faturalar');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Belge silinemedi.';
    return { success: false, error: message };
  }
}
