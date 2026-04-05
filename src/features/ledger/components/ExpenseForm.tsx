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
  { id: 'rent', label: 'Kira' },
  { id: 'utilities', label: 'Faturalar' },
  { id: 'maintenance', label: 'Bakım/Onarım' },
  { id: 'marketing', label: 'Pazarlama' },
  { id: 'equipment', label: 'Ekipman' },
  { id: 'operational', label: 'Operasyonel' },
  { id: 'other', label: 'Diğer' },
];

const PAYMENT_FREQUENCIES = [
  { id: 'ONE_TIME', label: 'Tek Seferlik (Bakım, Alım vb.)' },
  { id: 'RECURRING', label: 'Tekrarlayan (Kira, İnternet vb.)' },
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
      alert('Lütfen açıklama ve tutar alanlarını doldurun.');
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
    <div className="bg-white rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-900/5">
      {/* Premium Gradient Header */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 overflow-hidden flex items-center justify-between">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 blur-3xl rounded-full"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center shadow-inner">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {initialData ? 'Gideri Güncelle' : 'Yeni Gider Fişi İşle'}
            </h2>
            <p className="text-blue-100 text-sm font-medium opacity-90 mt-0.5">Operasyonel maliyetlerinizi kaydedin.</p>
          </div>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose} 
            className="relative z-10 w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 text-white/70 hover:text-white transition-all flex items-center justify-center backdrop-blur-sm shadow-sm"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* Step 1: Basic Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">1. Temel Bilgiler</h3>
          
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-700 ml-1">Kısa Açıklama veya Fiş Başlığı <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              placeholder="Örn: Zafer Plaza Kahve Alımı, Aylık SuperBox Faturası..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700 ml-1">Tarih <span className="text-red-500">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 cursor-pointer"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700 ml-1">Şube / Lokasyon</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 appearance-none cursor-pointer"
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                >
                  <option value="">Merkez / Tüm Şubeler (Genel)</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Financial Details */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">2. Finansal Detaylar</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700 ml-1 flex justify-between">
                <span>Net Tutar (KDV Hariç) <span className="text-red-500">*</span></span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₺</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-mono font-bold text-slate-900"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700 ml-1">KDV Oranı</label>
              <div className="relative">
                <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 appearance-none cursor-pointer"
                  value={formData.vatRate}
                  onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
                >
                  <option value="0">%0 Vergisiz/KDV'siz</option>
                  <option value="1">%1 İndirimli Pırlanta/Gıda vb.</option>
                  <option value="10">%10 Hizmet / Gıda</option>
                  <option value="20">%20 Standart KDV</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {amountNum > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <CircleDollarSign size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">KDV Dahil Toplam</p>
                      <p className="text-xs text-indigo-500 font-medium mt-0.5">Ödenecek Nihai Tutar</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-indigo-700 tracking-tight">
                    ₺{totalWithVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700 ml-1">Ödeme Tipi & Sıklığı</label>
              <div className="relative">
                <select
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 appearance-none cursor-pointer"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {PAYMENT_FREQUENCIES.map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700 ml-1">Gider Kategorisi</label>
              <div className="relative">
                <select
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 appearance-none cursor-pointer"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Paid By Selector (Shareholders) */}
          <div className="space-y-3 mt-2">
            <label className="text-[13px] font-semibold text-slate-700 ml-1">Ödemeyi Yapan (Kaynak)</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { id: 'Ortak Hesap', label: 'Ortak Hesap' },
                { id: 'Okan', label: 'Okan' },
                { id: 'Talha', label: 'Talha' },
                { id: 'Furkan', label: 'Furkan' },
                { id: 'Alp', label: 'Alp' }
              ].map((partner) => {
                const isSelected = formData.paidBy === partner.id;
                return (
                  <div
                    key={partner.id}
                    onClick={() => setFormData({ ...formData, paidBy: partner.id })}
                    className={cn(
                      "cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all relative overflow-hidden",
                      isSelected 
                        ? "border-blue-500 bg-blue-50/50 shadow-sm" 
                        : "border-slate-100 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-200"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 text-blue-500">
                        <CheckCircle2 size={14} className="fill-blue-100" />
                      </div>
                    )}
                    <span className={cn(
                      "text-sm font-bold",
                      isSelected ? "text-blue-700" : "text-slate-700"
                    )}>
                      {partner.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 3: Evrak ve Belge */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">3. Belge Yükleme (Opsiyonel)</h3>
          
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden text-center",
              file && !fileError
                ? "border-emerald-400 bg-emerald-50/50"
                : fileError
                ? "border-red-400 bg-red-50/50"
                : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
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
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full max-w-sm rounded-xl overflow-hidden shadow-lg border-2 border-white relative z-10"
                >
                  <img src={previewUrl} alt="Fatura Önizleme" className="w-full h-auto object-cover max-h-48" />
                </motion.div>
              ) : file && isPdf && !fileError ? (
                <motion.div
                  key="pdf"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-3 relative z-10"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white border border-emerald-200 shadow-sm flex items-center justify-center text-emerald-500">
                    <FileText size={32} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 max-w-xs">{file.name}</p>
                    <p className="text-[11px] font-semibold text-emerald-600 mt-1 uppercase tracking-widest">{formatFileSize(file.size)} • PDF BELGESİ</p>
                  </div>
                </motion.div>
              ) : fileError ? (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 relative z-10">
                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                    <AlertCircle size={28} />
                  </div>
                  <p className="text-sm font-bold text-red-600 max-w-sm">{fileError}</p>
                  <span className="text-xs text-red-400 font-medium px-4 py-2 bg-red-100 rounded-full">Yeni belge seç</span>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:text-blue-500 group-hover:border-blue-200 transition-all duration-300">
                    <Upload size={28} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-slate-700 group-hover:text-blue-700 transition-colors">Fatura Görüntüsü Yükle</p>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Sürükle bırak veya gözat</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {file && !fileError && (
              <button
                type="button"
                onClick={removeFile}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/90 backdrop-blur text-slate-500 hover:text-red-500 hover:bg-red-50 shadow-sm border border-slate-200 transition-all z-20"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Upload loading state indicator */}
          <AnimatePresence>
            {uploadStatus !== 'idle' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50/80 border border-blue-100/80 backdrop-blur-sm"
              >
                {(uploadStatus === 'compressing' || uploadStatus === 'uploading') && <Loader2 size={16} className="text-blue-600 animate-spin" />}
                {uploadStatus === 'done' && <CheckCircle2 size={16} className="text-emerald-500" />}
                
                <span className="text-sm font-semibold text-blue-800">
                  {uploadStatus === 'compressing' ? 'Görsel optimize ediliyor...' : 
                   uploadStatus === 'uploading' ? 'Merkeze yükleniyor...' : 'Veritabanına eklendi!'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Actions */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm"
            >
              Vazgeç
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 md:flex-none uppercase tracking-wider relative group overflow-hidden bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl px-8 py-3.5 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700"
          >
            <span className="absolute w-0 h-0 transition-all duration-300 ease-out bg-white rounded-full group-hover:w-32 group-hover:h-32 opacity-10"></span>
            <span className="relative flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  {initialData ? 'Gideri Güncelle' : 'Gideri Kaydet'}
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
