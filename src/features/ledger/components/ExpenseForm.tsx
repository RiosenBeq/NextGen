'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { addExpense, updateExpense, uploadExpenseAttachment } from '../actions';
import { compressImage, formatFileSize } from '@/lib/image-utils';
import { 
  Loader2, Upload, X, FileText, Receipt, 
  Calendar, MapPin, Percent, ChevronDown, CheckCircle2, AlertCircle, CircleDollarSign, ArrowRight
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
  const router = useRouter();
  const { toast } = useToast();
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
    isOfficial: initialData?.isOfficial ?? (parseFloat(initialData?.vatRate || '20') > 0),
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
      setFileError(`Desteklenmeyen format. Lütfen PDF veya Görsel yükleyin.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setFileError(`Dosya çok büyük (Maks 15MB).`);
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
      toast.error('Lütfen zorunlu alanları doldurun.');
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
          } catch (compErr) {
            fileToUpload = file;
          }
        }
        
        setUploadStatus('uploading');
        const uploadFormData = new FormData();
        uploadFormData.append('file', fileToUpload);
        const uploadResult = await uploadExpenseAttachment(uploadFormData);
        if (!uploadResult.success || !uploadResult.publicUrl) throw new Error(uploadResult.error);
        attachmentUrl = uploadResult.publicUrl;
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

      toast.success(initialData ? 'Kayıt güncellendi.' : 'Harcama kaydedildi.');
      if (onClose) onClose();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
      setUploadStatus('idle');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-10">
      {/* Financial Hero Section */}
      <section className="relative p-6 sm:p-8 rounded-[32px] bg-slate-900 overflow-hidden shadow-2xl shadow-slate-200">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <CircleDollarSign size={80} className="text-white" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">MATRAH (KDV HARİÇ)</label>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-light text-slate-500">₺</span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full bg-transparent border-none p-0 text-4xl sm:text-5xl font-black text-white focus:ring-0 placeholder:text-slate-800 tabular-nums outline-none"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-8 pt-6 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                <Percent size={14} />
              </div>
              <select
                className="bg-transparent border-none text-sm font-bold text-white focus:ring-0 appearance-none cursor-pointer pr-6"
                style={{ backgroundImage: 'none' }}
                value={formData.vatRate}
                onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
              >
                <option value="0" className="bg-slate-900">%0 KDV</option>
                <option value="1" className="bg-slate-900">%1 KDV</option>
                <option value="10" className="bg-slate-900">%10 KDV</option>
                <option value="20" className="bg-slate-900">%20 KDV</option>
              </select>
            </div>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">TOPLAM:</div>
              <div className="text-xl font-bold text-blue-400 tabular-nums">
                ₺{totalWithVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Basic Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="md:col-span-2 space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">İşlem Açıklaması</label>
          <input
            type="text"
            required
            placeholder="Örn: Ofis malzemeleri, internet faturası..."
            className="w-full px-0 py-3 bg-transparent border-b border-slate-200 text-lg font-medium text-slate-900 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">İşlem Tarihi</label>
          <div className="relative">
            <Calendar className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              required
              className="w-full px-0 py-3 bg-transparent border-b border-slate-200 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Lokasyon</label>
          <div className="relative">
            <MapPin className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              className="w-full px-0 py-3 bg-transparent border-b border-slate-200 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
            >
              <option value="">Genel / Tüm Şubeler</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <div className="space-y-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kategori & Tip</label>
          <div className="space-y-3">
            <div className="group relative">
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-200 outline-none transition-all appearance-none cursor-pointer"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                {EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-600 transition-colors pointer-events-none" />
            </div>
            
            <div className="group relative">
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-200 outline-none transition-all appearance-none cursor-pointer"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {PAYMENT_FREQUENCIES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-600 transition-colors pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Evrak & Ödeme</label>
          <div className="space-y-3">
            {/* isOfficial Toggle */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isOfficial: !formData.isOfficial })}
              className={cn(
                "w-full px-4 py-3 rounded-xl border flex items-center justify-between transition-all group",
                formData.isOfficial 
                  ? "bg-blue-50/50 border-blue-100 text-blue-700" 
                  : "bg-slate-50/50 border-slate-100 text-slate-500 hover:border-slate-200"
              )}
            >
              <span className="text-xs font-bold">Resmi İşlem / Fatura</span>
              <div className={cn(
                "w-7 h-4 rounded-full relative transition-colors p-0.5",
                formData.isOfficial ? "bg-blue-500" : "bg-slate-300"
              )}>
                <div className={cn(
                  "w-3 h-3 bg-white rounded-full transition-transform",
                  formData.isOfficial ? "translate-x-3" : "translate-x-0"
                )} />
              </div>
            </button>

            {/* Paid By */}
            <div className="group relative">
               <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-200 outline-none transition-all appearance-none cursor-pointer"
                value={formData.paidBy}
                onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
              >
                {['Ortak Hesap', 'Okan', 'Talha', 'Furkan', 'Alp'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Area */}
      <div className="pt-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "group relative p-8 rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all cursor-pointer overflow-hidden bg-slate-50 hover:bg-white",
            file && !fileError ? "border-blue-200 bg-blue-50/20" : "border-slate-100 hover:border-blue-200"
          )}
        >
          <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} />
          
          <AnimatePresence mode="wait">
            {previewUrl && !fileError ? (
              <motion.div key="preview" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-[200px] h-32 rounded-xl border border-slate-100 overflow-hidden shadow-sm shadow-blue-100">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </motion.div>
            ) : file && isPdf ? (
              <motion.div key="pdf" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <FileText size={20} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-800">{file.name}</p>
                  <p className="text-[10px] font-bold text-blue-600 mt-0.5 uppercase tracking-widest">{formatFileSize(file.size)}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:border-blue-100 transition-all">
                  <Upload size={18} />
                </div>
                <p className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-widest">DOSYA VEYA FOTOĞRAF EKLE</p>
              </motion.div>
            )}
          </AnimatePresence>

          {file && (
             <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm"
            >
              <X size={14} />
            </button>
          )}

          {uploadStatus !== 'idle' && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] flex items-center justify-center">
              <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-slate-900 shadow-xl">
                <Loader2 size={16} className="animate-spin text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">
                  {uploadStatus === 'compressing' ? 'Optimize Ediliyor' : 'Buluta Yükleniyor'}
                </span>
              </div>
            </div>
          )}
        </div>
        {fileError && <p className="mt-3 text-[10px] font-bold text-rose-500 uppercase tracking-widest text-center">{fileError}</p>}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-4">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-8 py-5 rounded-2xl text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors active:scale-95 disabled:opacity-50"
          >
            Vazgeç
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
          {initialData ? 'KAYDI GÜNCELLE' : 'HARCAMAYI KAYDET'}
        </button>
      </div>
    </form>
  );
}

