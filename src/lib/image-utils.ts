/**
 * Native Client-side Image Compression Utility
 * Uses the Canvas API to resize and compress images before upload.
 * Supports JPEG and PNG. PDFs are passed through unchanged.
 */

const MAX_DIMENSION = 1024;  // px — max width or height
const JPEG_QUALITY = 0.78;   // ~78% JPEG quality
const MAX_FILE_SIZE_MB = 10; // absolute hard limit

export async function compressImage(file: File, maxDimension = MAX_DIMENSION, quality = JPEG_QUALITY): Promise<File> {
  // Validate file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_FILE_SIZE_MB) {
    throw new Error(`Dosya boyutu çok büyük (${sizeMB.toFixed(1)}MB). Maksimum ${MAX_FILE_SIZE_MB}MB yüklenebilir.`);
  }

  // Only compress image types
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    throw new Error('Yalnızca görsel dosyalar sıkıştırılabilir.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down proportionally
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context mevcut değil'));
          return;
        }

        // White background for transparent PNGs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Return a proper File object with correct name + MIME type
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '') + '_compressed.jpg',
                { type: 'image/jpeg', lastModified: Date.now() }
              );
              resolve(compressedFile);
            } else {
              reject(new Error('Görsel sıkıştırılamadı (Canvas toBlob başarısız)'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Görsel yüklenemedi'));
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
  });
}

/**
 * Returns human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
