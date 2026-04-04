'use client';

import { useState, useRef } from 'react';
import { addExpense, updateExpense, uploadExpenseAttachment } from '../actions';
import { compressImage, formatFileSize } from '@/lib/image-utils';
import { 
  Loader2, Upload, X, FileText, Image as ImageIcon, Receipt, 
  Calendar, MapPin, Tag, Percent, ChevronDown, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const EXPENSE_TYPES = [
  'Operasyonel', 'Kira', 'Faturalar', 'Bakım/Onarım',
  'Pazarlama', 'Ekipman', 'Personel', 'Diğer'
];

export default function ExpenseForm({ 
  locations, 
  initialData, 
  onClose 
}: { 
  locations: any[], 
  initialData?: any,
  onClose?: () => void
}) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [fileError, setFileError] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'compressing' | 'uploading' | 'done'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    description: initialData?.description || '',
    amount: initialData?.amount || '',
    vatRate: initialData?.vatRate?.toString() || '20',
    type: initialData?.type || 'Operasyonel',
    locationId: initialData?.locationId || '',
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
      alert('Lütfen açıklama ve tutar alanlarını doldurun.');
      return;
    }

    setLoading(true);
    try {
      let attachmentUrl = initialData?.attachmentUrl || '';

      if (file) {
        let fileToUpload: File = file;

        // Compress images (not PDFs)
        if (!isPdf) {
          setUploadStatus('compressing');
          try {
            fileToUpload = await compressImage(file);
            console.log(`Compressed: ${formatFileSize(file.size)} → ${formatFileSize(fileToUpload.size)}`);
          } catch (compErr: any) {
            console.warn("Compression failed, uploading original:", compErr.message);
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
        month: new Date(formData.date).toISOString()
      };

      const result = initialData?.id 
        ? await updateExpense(initialData.id, payload)
        : await addExpense(payload);

      if (!result.success) throw new Error(result.error);

      if (onClose) {
        onClose();
        window.location.reload(); 
      } else {
        setFormData({
          description: '',
          amount: '',
          vatRate: '20',
          type: 'Operasyonel',
          locationId: '',
          date: new Date().toISOString().split('T')[0]
        });
        setFile(null);
        setPreviewUrl(null);
        setUploadStatus('idle');
        window.location.reload();
      }
    } catch (err: any) {
      console.error(err);
      alert('Hata: ' + err.message);
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

  return (
    <div className="premium-card bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {initialData ? 'Gideri Düzenle' : 'Yeni Gider Ekle'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Tüm * alanları zorunludur</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Row 1: Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Tag size={12} className="text-slate-400" />
            Açıklama *
          </label>
          <input
            type="text"
            required
            placeholder="Örn: Zafer Plaza Elektrik Faturası"
            className="elite-input"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Row 2: Amount + VAT */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <span className="text-green-600 font-bold">₺</span>
              Net Tutar *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              className="elite-input font-mono"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Percent size={12} className="text-slate-400" />
              KDV Oranı
            </label>
            <div className="relative">
              <select
                className="elite-input appearance-none cursor-pointer pr-8"
                value={formData.vatRate}
                onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
              >
                <option value="0">%0 — KDV'siz</option>
                <option value="10">%10 — Hizmet</option>
                <option value="20">%20 — Standart</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* VAT Total Preview */}
        {amountNum > 0 && (
          <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">KDV Dahil Toplam:</span>
            <span className="text-sm font-bold text-blue-700">
              ₺{totalWithVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Row 3: Location + Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <MapPin size={12} className="text-slate-400" />
              Şube / Lokasyon *
            </label>
            <div className="relative">
              <select
                required
                className="elite-input appearance-none cursor-pointer pr-8"
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              >
                <option value="">Şube Seçin...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Tag size={12} className="text-slate-400" />
              Gider Türü
            </label>
            <div className="relative">
              <select
                className="elite-input appearance-none cursor-pointer pr-8"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {EXPENSE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Calendar size={12} className="text-slate-400" />
            İşlem Tarihi
          </label>
          <input
            type="date"
            className="elite-input cursor-pointer"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 block">
            Fatura / Makbuz Eki
            <span className="ml-2 font-normal text-slate-400">PDF, JPG veya PNG (Maks. 15MB)</span>
          </label>

          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative cursor-pointer border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center gap-3 text-center",
              file && !fileError
                ? "border-green-300 bg-green-50"
                : fileError
                ? "border-red-300 bg-red-50"
                : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50"
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
            />

            <AnimatePresence mode="wait">
              {previewUrl && !fileError ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-[200px] aspect-video rounded-lg overflow-hidden shadow border border-green-200"
                >
                  <img src={previewUrl} alt="Önizleme" className="w-full h-full object-cover" />
                </motion.div>
              ) : file && isPdf && !fileError ? (
                <motion.div
                  key="pdf"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-2 text-green-700"
                >
                  <div className="w-14 h-14 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center">
                    <FileText size={28} className="text-green-600" />
                  </div>
                  <p className="text-xs font-semibold max-w-[200px] truncate">{file.name}</p>
                  <p className="text-[10px] text-green-600">{formatFileSize(file.size)} • PDF</p>
                </motion.div>
              ) : fileError ? (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                  <AlertCircle size={28} className="text-red-500" />
                  <p className="text-xs font-semibold text-red-700 max-w-xs">{fileError}</p>
                  <p className="text-[11px] text-red-500">Tekrar seçmek için tıklayın</p>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2 text-slate-400">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                    <Upload size={22} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Dosya seçin veya sürükleyin</p>
                    <p className="text-xs text-slate-400 mt-0.5">PDF, JPG, PNG — maks. 15MB</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {file && !fileError && (
              <button
                type="button"
                onClick={removeFile}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm z-10"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Upload status */}
          {uploadStatus !== 'idle' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
              {uploadStatus === 'compressing' && <Loader2 size={14} className="text-blue-500 animate-spin" />}
              {uploadStatus === 'uploading' && <Loader2 size={14} className="text-blue-500 animate-spin" />}
              {uploadStatus === 'done' && <CheckCircle2 size={14} className="text-green-500" />}
              <span className="text-xs text-blue-700">
                {uploadStatus === 'compressing' ? 'Görsel sıkıştırılıyor...' : 
                 uploadStatus === 'uploading' ? 'Yükleniyor...' : 'Yükleme tamamlandı!'}
              </span>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] text-white rounded-xl py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploadStatus === 'compressing' ? 'Dosya Hazırlanıyor...' : 
                 uploadStatus === 'uploading' ? 'Yükleniyor...' : 'Kaydediliyor...'}
              </>
            ) : (
              <>
                <CheckCircle2 size={17} />
                {initialData ? 'Değişiklikleri Kaydet' : 'Gideri Kaydet'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
