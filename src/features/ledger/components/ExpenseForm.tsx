'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { useState, useRef } from 'react';
import { addExpense, updateExpense, uploadExpenseAttachment } from '../actions';
import { compressImage, formatFileSize } from '@/lib/image-utils';
import {
  Loader2, Upload, X, FileText,
  Calendar, MapPin, Percent, ChevronDown, CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/errors';

const EXPENSE_CATEGORIES = [
  { id: 'rent', label: 'Kira Gideri' },
  { id: 'utilities', label: 'Fatura & Kurumsal' },
  { id: 'maintenance', label: 'Bakım & Onarım' },
  { id: 'marketing', label: 'Pazarlama & Reklam' },
  { id: 'equipment', label: 'Ekipman Alımı' },
  { id: 'operational', label: 'Günlük Operasyon' },
  { id: 'other', label: 'Diğer' },
];

const PAYMENT_FREQUENCIES = [
  { id: 'ONE_TIME', label: 'Tek Seferlik İşlem' },
  { id: 'RECURRING', label: 'Düzenli Ödeme (Aylık)' },
];

interface ExpenseFormLocation {
  id: string;
  name: string;
}

interface ExpenseFormInitialData {
  id?: string;
  description?: string;
  amountWithoutVat?: number | string;
  amount?: number | string;
  vatRate?: number | string;
  type?: 'ONE_TIME' | 'RECURRING';
  categoryId?: string | null;
  locationId?: string | null;
  paidBy?: string;
  date?: string | Date;
  attachmentUrl?: string | null;
}

export default function ExpenseForm({
  locations,
  initialData,
  onClose
}: {
  locations: ExpenseFormLocation[],
  initialData?: ExpenseFormInitialData | null,
  onClose?: () => void
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [fileError, setFileError] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'compressing' | 'uploading' | 'done'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    description: initialData?.description || '',
    amount: initialData?.amountWithoutVat?.toString() || initialData?.amount?.toString() || '',
    vatRate: initialData?.vatRate?.toString() || '20',
    type: initialData?.type || 'ONE_TIME',
    categoryId: initialData?.categoryId || 'operational',
    locationId: initialData?.locationId || '',
    paidBy: initialData?.paidBy || 'Ortak Hesap',
    date: initialData?.date
      ? new Date(initialData.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  });

  const amountNum = parseFloat(formData.amount) || 0;
  const vatNum = parseFloat(formData.vatRate) || 0;
  const totalWithVat = amountNum * (1 + vatNum / 100);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(selectedFile.type)) {
      setFileError(`Desteklenmeyen format: ${selectedFile.type || 'bilinmiyor'}. Lütfen PDF, JPG veya PNG yükleyin.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const sizeMB = selectedFile.size / (1024 * 1024);
    if (sizeMB > 15) {
      setFileError(`Dosya çok büyük (${sizeMB.toFixed(1)}MB). Maksimum 15MB yüklenebilir.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFile(selectedFile);
    const pdfFile = selectedFile.type === 'application/pdf';
    setIsPdf(pdfFile);

    if (!pdfFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) {
      toast.error('Sisteme kayıt yapabilmek için açıklama ve matrah bilgilerini eksiksiz girmelisiniz.');
      return;
    }

    setLoading(true);
    try {
      let attachmentUrl: string | null = initialData?.attachmentUrl || null;

      if (file) {
        let fileToUpload: File = file;

        if (!isPdf) {
          setUploadStatus('compressing');
          try {
            fileToUpload = await compressImage(file);
          } catch (compErr) {
            console.warn("Compression failed, uploading original:", getErrorMessage(compErr));
            fileToUpload = file;
          }
        }

        setUploadStatus('uploading');
        const uploadFormData = new FormData();
        uploadFormData.append('file', fileToUpload);

        const uploadResult = await uploadExpenseAttachment(uploadFormData);
        if (!uploadResult.success || !uploadResult.publicUrl) {
          throw new Error(uploadResult.error || 'Dosya yükleme başarısız.');
        }
        attachmentUrl = uploadResult.publicUrl;
        setUploadStatus('done');
      }

      const payload = {
        ...formData,
        locationId: formData.locationId === '' ? null : formData.locationId,
        attachmentUrl,
        categoryId: formData.categoryId,
        paidBy: formData.paidBy,
        isOfficial: Boolean(attachmentUrl),
        month: new Date(formData.date).toISOString()
      };

      const result = initialData?.id
        ? await updateExpense(initialData.id, payload)
        : await addExpense(payload);

      if (!result.success) throw new Error(result.error);

      if (onClose) {
        onClose();
        router.refresh();
      } else {
        setFormData({
          description: '',
          amount: '',
          vatRate: '20',
          type: 'ONE_TIME',
          categoryId: 'operational',
          locationId: '',
          paidBy: 'Ortak Hesap',
          date: new Date().toISOString().split('T')[0]
        });
        setFile(null);
        setPreviewUrl(null);
        setUploadStatus('idle');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error('Hata: ' + getErrorMessage(err));
    } finally {
      setLoading(false);
      setUploadStatus('idle');
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPreviewUrl(null);
    setIsPdf(false);
    setFileError('');
    setUploadStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const inputBase = "w-full px-4 py-3 rounded-xl bg-[--bg-elevated] border border-transparent text-[15px] text-[--text] placeholder:text-[--text-tertiary] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors duration-200 min-h-[44px]";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section: Temel Bilgiler */}
      <section className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-[--text]">
            İşlem Açıklaması <span className="text-[--danger]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Örn: Kırtasiye alımı, Tamir masrafı..."
            className={inputBase}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[--text]">
              İşlem Tarihi <span className="text-[--danger]">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                required
                className={cn(inputBase, "pl-10")}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[--text]">Lokasyon</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                className={cn(inputBase, "pl-10 pr-10 appearance-none cursor-pointer")}
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              >
                <option value="">Genel / Tüm Şubeler</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Section: Miktar & KDV */}
      <section className="space-y-5 pt-6 border-t border-[--border]">
        <div>
          <p className="apple-eyebrow">Tutar</p>
          <h3 className="apple-title-2 mt-1">Miktar & KDV</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[--text]">
              Matrah (KDV Hariç) <span className="text-[--danger]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₺</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                className={cn(inputBase, "pl-8")}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[--text]">KDV Oranı</label>
            <div className="relative">
              <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                className={cn(inputBase, "pl-10 pr-10 appearance-none cursor-pointer")}
                value={formData.vatRate}
                onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
              >
                <option value="0">%0 Vergisiz</option>
                <option value="1">%1 İndirimli</option>
                <option value="10">%10 Hizmet</option>
                <option value="20">%20 Standart</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {amountNum > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-[18px] bg-[--bg-elevated] p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-[13px] text-[--text-secondary]">Ödenecek Toplam (KDV Dahil)</p>
                <p className="text-[12px] text-[--text-tertiary] mt-0.5">Nihai işlem maliyeti</p>
              </div>
              <span className="text-[22px] md:text-[24px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.022em' }}>
                ₺{totalWithVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[--text]">Ödeme Tipi</label>
            <div className="relative">
              <select
                className={cn(inputBase, "pr-10 appearance-none cursor-pointer")}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'ONE_TIME' | 'RECURRING' })}
              >
                {PAYMENT_FREQUENCIES.map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[--text]">Kategori</label>
            <div className="relative">
              <select
                className={cn(inputBase, "pr-10 appearance-none cursor-pointer")}
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-medium text-[--text]">Ödemeyi Yapan</label>
          <div className="sui-chip-group">
            {[
              { id: 'Ortak Hesap', label: 'Ortak Hesap' },
              { id: 'Okan', label: 'Okan' },
              { id: 'Talha', label: 'Talha' },
              { id: 'Furkan', label: 'Furkan' },
              { id: 'Alp', label: 'Alp' }
            ].map((partner) => {
              const isSelected = formData.paidBy === partner.id;
              return (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, paidBy: partner.id })}
                  className={cn('sui-chip', isSelected && 'sui-chip--active')}
                >
                  {partner.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section: Belge Yükleme */}
      <section className="space-y-4 pt-6 border-t border-[--border]">
        <div>
          <p className="apple-eyebrow">Belge</p>
          <h3 className="apple-title-2 mt-1">Belge Yükleme</h3>
          <p className="text-[13px] text-[--text-tertiary] mt-1">Fatura veya makbuz dosyasını ekleyin (opsiyonel)</p>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "group relative flex flex-col items-center justify-center p-8 rounded-[18px] border border-dashed transition-colors duration-200 cursor-pointer",
            file && !fileError
              ? "border-[--accent] bg-[--accent-soft]"
              : fileError
              ? "border-[--danger] bg-[--danger-soft]"
              : "border-[--border-strong] bg-[--bg-elevated] hover:border-[--text-tertiary]"
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
          />

          <AnimatePresence mode="popLayout">
            {previewUrl && !fileError ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full max-w-sm rounded-xl overflow-hidden border border-slate-200 bg-white relative z-10"
              >
                <Image
                  src={previewUrl}
                  alt="Fatura Önizleme"
                  width={400}
                  height={300}
                  unoptimized
                  className="w-full h-auto object-cover max-h-48"
                />
              </motion.div>
            ) : file && isPdf && !fileError ? (
              <motion.div
                key="pdf"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col items-center gap-3 relative z-10"
              >
                <div className="w-12 h-12 rounded-full bg-[--surface] flex items-center justify-center text-[--accent]">
                  <FileText size={22} strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-medium text-[--text] truncate max-w-[240px]" style={{ letterSpacing: '-0.005em' }}>{file.name}</p>
                  <p className="text-[12px] text-[--accent] mt-0.5">{formatFileSize(file.size)} · PDF hazır</p>
                </div>
              </motion.div>
            ) : fileError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col items-center gap-3 relative z-10 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-[--surface] flex items-center justify-center text-[--danger]">
                  <AlertCircle size={20} strokeWidth={1.75} />
                </div>
                <p className="text-[13px] text-[--danger]">{fileError}</p>
                <span className="text-[13px] font-medium text-[--text-secondary]">Tekrar denemek için tıklayın</span>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col items-center gap-3 relative z-10"
              >
                <div className="w-12 h-12 rounded-full bg-[--surface] flex items-center justify-center text-[--text-tertiary] transition-colors group-hover:text-[--text]">
                  <Upload size={20} strokeWidth={1.75} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>Belge veya fotoğraf yükleyin</p>
                  <p className="text-[12px] text-[--text-tertiary] mt-0.5">PDF · JPG · PNG · Maks 15MB</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {file && !fileError && (
            <button
              type="button"
              onClick={removeFile}
              aria-label="Dosyayı kaldır"
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[--surface] text-[--text-tertiary] hover:text-[--danger] border border-[--border] transition-colors z-20 flex items-center justify-center"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          )}
        </div>

        <AnimatePresence>
          {uploadStatus !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[--bg-elevated]"
            >
              {(uploadStatus === 'compressing' || uploadStatus === 'uploading') && (
                <Loader2 size={14} className="animate-spin text-[--accent]" />
              )}
              {uploadStatus === 'done' && <CheckCircle2 size={14} strokeWidth={1.75} className="text-[--accent]" />}
              <span className="text-[13px] text-[--text-secondary]">
                {uploadStatus === 'compressing' ? 'Görsel optimize ediliyor...' :
                 uploadStatus === 'uploading' ? 'Buluta yükleniyor...' : 'Yükleme başarılı!'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Footer */}
      <div className="pt-6 border-t border-[--border] flex items-center justify-end gap-3">
        {onClose && (
          <button type="button" onClick={onClose} disabled={loading} className="elite-button-secondary">
            Vazgeç
          </button>
        )}
        <button type="submit" disabled={loading} className="elite-button-primary">
          {loading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
          {loading ? 'İşleniyor…' : initialData ? 'Değişiklikleri Kaydet' : 'Kaydı Tamamla'}
        </button>
      </div>
    </form>
  );
}
