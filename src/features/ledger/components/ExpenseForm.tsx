'use client';

import { useState, useRef } from 'react';
import { addExpense, updateExpense, uploadExpenseAttachment } from '../actions';
import { compressImage, formatFileSize } from '@/lib/image-utils';
import { 
  Loader2, Upload, X, FileText, Image as ImageIcon, Receipt, 
  Calendar, MapPin, Tag, Percent, ChevronDown, CheckCircle2, AlertCircle, CircleDollarSign, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const EXPENSE_CATEGORIES = [
  { id: 'rent', label: 'KİRA GİDERİ' },
  { id: 'utilities', label: 'FATURA & KURUMSAL' },
  { id: 'maintenance', label: 'BAKIM & ONARIM' },
  { id: 'marketing', label: 'PAZARLAMA & REKLAM' },
  { id: 'equipment', label: 'EKİPMAN ALIMI' },
  { id: 'operational', label: 'GÜNLÜK OPERASYON' },
  { id: 'other', label: 'DİĞER' },
];

const PAYMENT_FREQUENCIES = [
  { id: 'ONE_TIME', label: 'TEK SEFERLİK İŞLEM' },
  { id: 'RECURRING', label: 'DÜZENLİ ÖDEME (Aylık)' },
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
      alert('Sisteme kayıt yapabilmek için açıklama ve matrah bilgilerini eksiksiz girmelisiniz.');
      return;
    }

    setLoading(true);
    try {
      let attachmentUrl = initialData?.attachmentUrl || '';

      if (file) {
        let fileToUpload: File = file;

        if (!isPdf) {
          setUploadStatus('compressing');
          try {
            fileToUpload = await compressImage(file);
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
        categoryId: formData.categoryId,
        paidBy: formData.paidBy,
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
          type: 'ONE_TIME',
          categoryId: 'operational',
          locationId: '',
          paidBy: 'Ortak Hesap',
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
    <div className="bg-white rounded-2xl overflow-hidden w-full">
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700 border border-slate-200">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {initialData ? 'Gideri Güncelle' : 'Yeni Gider Kaydı'}
            </h2>
            <p className="text-xs text-slate-500">Operasyonel maliyet ve fiş girişi</p>
          </div>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center border border-slate-100"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-6">
        {/* Step 1: Basic Info */}
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-slate-700">Temel Bilgiler</h3>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">İşlem Açıklaması <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              placeholder="Örn: Kırtasiye alımı, Tamir masrafı..."
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-900"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">İşlem Tarihi <span className="text-rose-500">*</span></label>
              <div className="relative group">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors group-focus-within:text-blue-600" />
                <input
                  type="date"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-900 cursor-pointer"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">Lokasyon</label>
              <div className="relative group">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors group-focus-within:text-blue-600" />
                <select
                  className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-900 appearance-none cursor-pointer"
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                >
                  <option value="">Genel / Tüm Şubeler</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Financial Details */}
        <div className="space-y-6 pt-8 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">02</div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">MİKTAR & KDV</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">Matrah (KDV Hariç) <span className="text-rose-500">*</span></label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-blue-600 text-lg">₺</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-mono font-bold text-slate-900 shadow-sm tracking-tight"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">KDV Oranı</label>
              <div className="relative group">
                <Percent className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer shadow-sm"
                  value={formData.vatRate}
                  onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
                >
                  <option value="0">%0 Vergisiz</option>
                  <option value="1">%1 İndirimli</option>
                  <option value="10">%10 Hizmet</option>
                  <option value="20">%20 Standart</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {amountNum > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="p-6 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-200 overflow-hidden relative group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                  <CircleDollarSign size={80} />
                </div>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100">Ödenecek Toplam (KDV DAHİL)</p>
                    <p className="text-xs font-medium text-blue-100/80 mt-0.5">Nihai işlem maliyeti</p>
                  </div>
                  <span className="text-3xl font-bold tracking-tighter italic">
                    ₺{totalWithVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">Ödeme Tipi</label>
              <div className="relative">
                <select
                  className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer shadow-sm"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {PAYMENT_FREQUENCIES.map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">Kategori</label>
              <div className="relative">
                <select
                  className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer shadow-sm"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">Ödemeyi Yapan</label>
            <div className="flex flex-wrap gap-2">
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
                    className={cn(
                      "px-5 py-3 rounded-xl border-2 text-sm font-bold transition-all active:scale-95",
                      isSelected 
                        ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200" 
                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {partner.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 3: Evrak ve Belge */}
        <div className="space-y-6 pt-8 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">03</div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">BELGE YÜKLEME</h3>
          </div>
          
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "group relative flex flex-col items-center justify-center p-12 rounded-[32px] border-2 border-dashed transition-all cursor-pointer overflow-hidden backdrop-blur-sm",
              file && !fileError
                ? "border-emerald-200 bg-emerald-50/30"
                : fileError
                ? "border-rose-200 bg-rose-50/30"
                : "border-slate-200 bg-slate-50/30 hover:border-blue-300 hover:bg-blue-50/30"
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
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl border border-white relative z-10"
                >
                  <img src={previewUrl} alt="Fatura Önizleme" className="w-full h-auto object-cover max-h-48" />
                </motion.div>
              ) : file && isPdf && !fileError ? (
                <motion.div
                  key="pdf"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-4 relative z-10"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white border border-emerald-100 shadow-sm flex items-center justify-center text-emerald-500">
                    <FileText size={32} strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-widest">{formatFileSize(file.size)} • PDF HAZIR</p>
                  </div>
                </motion.div>
              ) : fileError ? (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 relative z-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                    <AlertCircle size={24} />
                  </div>
                  <p className="text-sm font-bold text-rose-600">{fileError}</p>
                  <span className="text-[10px] font-bold text-white px-4 py-2 bg-rose-500 rounded-xl">Tekrar Dene</span>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:text-blue-500 transition-all duration-500 shadow-sm">
                    <Upload size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-600 transition-colors">Belge veya Fotoğraf Yükleyin</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">PDF, JPG, PNG (Maks 15MB)</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {file && !fileError && (
              <button
                type="button"
                onClick={removeFile}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-rose-500 shadow-sm border border-slate-100 transition-all z-20 flex items-center justify-center"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <AnimatePresence>
            {uploadStatus !== 'idle' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-white border border-slate-100 shadow-sm"
              >
                {(uploadStatus === 'compressing' || uploadStatus === 'uploading') && <Loader2 size={16} className="animate-spin text-blue-600" />}
                {uploadStatus === 'done' && <CheckCircle2 size={16} className="text-emerald-500" />}
                <span className="text-xs font-bold text-slate-600">
                  {uploadStatus === 'compressing' ? 'Görsel optimize ediliyor...' : 
                   uploadStatus === 'uploading' ? 'Buluta yükleniyor...' : 'Yükleme başarılı!'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Actions */}
        <div className="pt-8 border-t border-slate-100 flex items-center justify-end gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-4 rounded-2xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
            >
              Vazgeç
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 md:flex-none relative group overflow-hidden bg-blue-600 text-white rounded-2xl px-10 py-4 font-bold text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                İşleniyor...
              </>
            ) : (
              <>
                {initialData ? 'Değişiklikleri Kaydet' : 'Kaydı Tamamla'}
                <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
