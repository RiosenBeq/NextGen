'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createAuditLog } from '@/lib/audit';
import { requireProfileAccess } from '@/lib/auth-guards';
import { getErrorMessage } from '@/lib/errors';

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

function sanitizeStorageSegment(input: string) {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

/**
 * Supabase Storage public URL'inden bucket-relative path'i güvenli şekilde çıkarır.
 * URL kötüyse veya bucket farklıysa null döner; storage cleanup sessizce atlanır.
 */
function extractDocumentsStoragePath(publicUrl: string): string | null {
  try {
    const parsed = new URL(publicUrl);
    const marker = '/storage/v1/object/public/documents/';
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    const path = parsed.pathname.slice(idx + marker.length);
    return path || null;
  } catch {
    const fallbackIdx = publicUrl.indexOf('/documents/');
    if (fallbackIdx === -1) return null;
    const path = publicUrl.slice(fallbackIdx + '/documents/'.length);
    return path || null;
  }
}

export async function uploadDocument(formData: FormData) {
  try {
    const guard = await requireProfileAccess();
    if (guard.error || !guard.user || !guard.profile) {
      return { success: false, error: guard.error };
    }
    const profileId = guard.profile.id;

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

    // Generate unique and storage-safe file path
    const sanitizedRelatedType = sanitizeStorageSegment(relatedType) || 'document';
    const sanitizedRelatedId = sanitizeStorageSegment(relatedId) || 'global';
    const extension = ALLOWED_MIME_TYPES[mimeType] || file.name.split('.').pop()?.toLowerCase() || 'bin';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const sanitizedBaseName = sanitizeStorageSegment(baseName) || 'file';
    const uniqueName = `${sanitizedRelatedType}/${sanitizedRelatedId}/${Date.now()}_${sanitizedBaseName}.${extension}`;

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

    // Save to DB — try with new metadata fields (fileSize, mimeType); fallback
    // to minimal payload if the schema-cache doesn't yet know about them.
    const dbClient = adminSupabase || supabase;
    const id = `doc_${crypto.randomUUID()}`;
    const fullPayload = {
      id,
      profileId,
      relatedType,
      relatedId,
      fileName: file.name,
      fileUrl: publicUrl,
      fileSize: file.size,
      mimeType,
    };

    let { error: dbError } = await dbClient.from('Document').insert(fullPayload);

    if (dbError) {
      const msg = (dbError.message || '').toLowerCase();
      const isMissingColumn =
        msg.includes('schema cache') ||
        msg.includes("could not find") ||
        msg.includes('column') && (msg.includes('filesize') || msg.includes('mimetype'));

      if (isMissingColumn) {
        console.warn('Document insert: fileSize/mimeType columns missing, retrying minimal payload', dbError.message);
        const { error: retryError } = await dbClient.from('Document').insert({
          id,
          profileId,
          relatedType,
          relatedId,
          fileName: file.name,
          fileUrl: publicUrl,
        });
        dbError = retryError;
      }
    }

    if (dbError) throw dbError;

    await createAuditLog('CREATE', 'Document', relatedId, {
      fileName: file.name,
      fileType: relatedType,
      uploadedBy: guard.user.id,
    });

    revalidatePath('/giderler');
    revalidatePath('/gelir-gider');
    revalidatePath('/sozlesmeler');
    revalidatePath('/faturalar');
    return { success: true, publicUrl };
  } catch (error) {
    console.error('Document upload error:', error);
    return { success: false, error: getErrorMessage(error, 'Dosya yüklenemedi.') };
  }
}

export async function getDocuments(relatedType?: string, relatedId?: string) {
  try {
    const guard = await requireProfileAccess();
    if (guard.error || !guard.profile) return [];
    const profileId = guard.profile.id;

    const supabase = await createClient();
    let query = supabase
      .from('Document')
      .select('*')
      .eq('profileId', profileId)
      .order('createdAt', { ascending: false });

    if (relatedType) query = query.eq('relatedType', relatedType);
    if (relatedId) query = query.eq('relatedId', relatedId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Document fetch error:', error);
    return [];
  }
}

export async function deleteDocument(id: string) {
  try {
    const guard = await requireProfileAccess();
    if (guard.error || !guard.user || !guard.profile) {
      return { success: false, error: guard.error };
    }
    const profileId = guard.profile.id;

    const adminSupabase = await getAdminSupabase();
    const supabase = await createClient();
    const dbClient = adminSupabase || supabase;

    const { data: doc } = await dbClient
      .from('Document')
      .select('fileUrl')
      .eq('id', id)
      .eq('profileId', profileId)
      .single();

    if (doc?.fileUrl) {
      const storagePath = extractDocumentsStoragePath(doc.fileUrl);
      if (storagePath) {
        const { error: storageError } = await (adminSupabase || supabase)
          .storage.from('documents').remove([storagePath]);
        if (storageError) {
          console.warn('Storage remove warning:', storageError.message);
        }
      }
    }

    const { error } = await dbClient
      .from('Document')
      .delete()
      .eq('id', id)
      .eq('profileId', profileId);
    if (error) throw error;

    await createAuditLog('DELETE', 'Document', id, { deletedBy: guard.user.id });

    revalidatePath('/giderler');
    revalidatePath('/gelir-gider');
    revalidatePath('/sozlesmeler');
    revalidatePath('/faturalar');
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, 'Belge silinemedi.') };
  }
}
