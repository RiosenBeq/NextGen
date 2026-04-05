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
    <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl xl:max-h-[90vh] overflow-y-auto w-full no-scrollbar">
      {/* Premium Gradient Header */}
      <div className="relative px-8 py-10 overflow-hidden flex items-center justify-between border-b border-slate-100" style={{ background: '#1E2A44' }}>
        <div className="absolute -right-20 -top-20 w-60 h-60 blur-[100px] rounded-full" style={{ background: '#2F6BFF', opacity: 0.2 }}></div>
        
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
            <Receipt className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
              {initialData ? 'GİDER GÜNCELLE' : 'YENİ GİDER FİŞİ'}
            </h2>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">OPERASYONEL MALİYET ANALİZİ</p>
          </div>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose} 
            className="relative z-10 w-12 h-12 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all flex items-center justify-center border border-white/10 hover:border-white/20 active:scale-95"
          >
            <X size={20} strokeWidth={3} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-slate-50/50">
        {/* Step 1: Basic Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pl-1">
            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border" style={{ color: '#2F6BFF', background: 'rgba(47,107,255,0.05)', borderColor: 'rgba(47,107,255,0.15)' }}>1</span>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">TEMEL BİLGİLER</h3>
          </div>
          
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">FIŞ AÇIKLAMASI <span className="text-red-500/50">*</span></label>
            <input
              type="text"
              required
              placeholder="Örn: ZAFER PLAZA KAHVE ALIMI..."
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 outline-none transition-all placeholder:text-slate-400 font-bold text-slate-900 uppercase italic tracking-tight shadow-sm"
              style={{ '--tw-ring-color': 'rgba(47,107,255,0.2)' } as any}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">İŞLEM TARİHİ <span className="text-red-500/50">*</span></label>
              <div className="relative group">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors group-focus-within:text-blue-600" />
                <input
                  type="date"
                  required
                  className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 outline-none transition-all font-bold text-slate-900 cursor-pointer shadow-sm"
                  style={{ '--tw-ring-color': 'rgba(47,107,255,0.2)' } as any}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">ŞUBE / LOKASYON</label>
              <div className="relative group">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors group-focus-within:text-blue-600" />
                <select
                  className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer shadow-sm uppercase tracking-tighter"
                  style={{ '--tw-ring-color': 'rgba(47,107,255,0.2)' } as any}
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                >
                  <option value="" className="font-black uppercase text-slate-600">GENEL MERKEZ / TÜM ŞUBELER</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id} className="font-black uppercase">{loc.name.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Financial Details */}
        <div className="space-y-6 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-3 pl-1">
            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border" style={{ color: '#2F6BFF', background: 'rgba(47,107,255,0.05)', borderColor: 'rgba(47,107,255,0.15)' }}>2</span>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">FİNANSAL VERİLER</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 flex justify-between">
                <span>MATRAH (KDV HARİÇ) <span className="text-red-500/50">*</span></span>
              </label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black italic" style={{ color: '#2F6BFF' }}>₺</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  className="w-full pl-10 pr-5 py-4 bg-white border border-slate-200 rounded-2xl text-2xl focus:ring-4 outline-none transition-all font-mono font-black text-slate-900 shadow-sm tracking-tighter"
                  style={{ '--tw-ring-color': 'rgba(47,107,255,0.2)' } as any}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">KDV ORANI</label>
              <div className="relative group">
                <Percent className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors group-focus-within:text-blue-600" />
                <select
                  className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer shadow-sm uppercase tracking-widest"
                  style={{ '--tw-ring-color': 'rgba(47,107,255,0.2)' } as any}
                  value={formData.vatRate}
                  onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
                >
                  <option value="0">%0 VERGİSİZ</option>
                  <option value="1">%1 İNDİRİMLİ</option>
                  <option value="10">%10 HİZMET</option>
                  <option value="20">%20 STANDART</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {amountNum > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="overflow-hidden no-scrollbar"
              >
                <div className="p-6 rounded-[24px] border flex items-center justify-between shadow-sm" style={{ background: 'rgba(47,107,255,0.03)', borderColor: 'rgba(47,107,255,0.1)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm bg-white text-blue-600" style={{ borderColor: 'rgba(47,107,255,0.2)' }}>
                      <CircleDollarSign size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] italic" style={{ color: '#2F6BFF' }}>ÖDENECEK TOPLAM</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-widest">KDV DAHİL NİHAİ TUTAR</p>
                    </div>
                  </div>
                  <span className="text-3xl font-black text-slate-900 tracking-tighter italic drop-shadow-sm">
                    ₺{totalWithVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">ÖDEME TİPİ</label>
              <div className="relative">
                <select
                  className="w-full pl-5 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer shadow-sm uppercase tracking-tight"
                  style={{ '--tw-ring-color': 'rgba(47,107,255,0.2)' } as any}
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {PAYMENT_FREQUENCIES.map(f => (
                    <option key={f.id} value={f.id}>{f.label.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">KATEGORİ</label>
              <div className="relative">
                <select
                  className="w-full pl-5 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer shadow-sm uppercase tracking-tight"
                  style={{ '--tw-ring-color': 'rgba(47,107,255,0.2)' } as any}
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">ÖDEMEYİ YAPAN ANALİZ KAYNAĞI</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { id: 'Ortak Hesap', label: 'ORTAK HESAP' },
                { id: 'Okan', label: 'OKAN' },
                { id: 'Talha', label: 'TALHA' },
                { id: 'Furkan', label: 'FURKAN' },
                { id: 'Alp', label: 'ALP' }
              ].map((partner) => {
                const isSelected = formData.paidBy === partner.id;
                return (
                  <div
                    key={partner.id}
                    onClick={() => setFormData({ ...formData, paidBy: partner.id })}
                    className={cn(
                      "cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all relative overflow-hidden group/item",
                      isSelected 
                        ? "-translate-y-1 border-blue-500 bg-white" 
                        : "border-slate-200 bg-white hover:border-blue-300"
                    )}
                    style={isSelected ? { boxShadow: '0 10px 15px -3px rgba(47,107,255,0.1)' } : {}}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1"
                        >
                          <div className="w-6 h-6 flex items-center justify-center rounded-bl-xl shadow-sm" style={{ background: '#2F6BFF' }}>
                            <CheckCircle2 size={10} className="text-white" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <span className={cn(
                      "text-[10px] font-black tracking-tighter uppercase",
                      isSelected ? "text-slate-900" : "text-slate-500 group-hover/item:text-slate-700 transition-colors"
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
        <div className="space-y-6 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-3 pl-1">
            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border" style={{ color: '#2F6BFF', background: 'rgba(47,107,255,0.05)', borderColor: 'rgba(47,107,255,0.15)' }}>3</span>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">BELGE VE KANIT YÜKLEME</h3>
          </div>
          
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "group relative flex flex-col items-center justify-center p-12 rounded-[32px] border-2 border-dashed transition-all cursor-pointer overflow-hidden shadow-sm",
              file && !fileError
                ? "border-emerald-300 bg-emerald-50"
                : fileError
                ? "border-red-300 bg-red-50"
                : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50"
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
                  className="w-full max-w-sm rounded-[24px] overflow-hidden shadow-lg border border-slate-200 relative z-10"
                >
                  <img src={previewUrl} alt="Fatura Önizleme" className="w-full h-auto object-cover max-h-56" />
                </motion.div>
              ) : file && isPdf && !fileError ? (
                <motion.div
                  key="pdf"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-4 relative z-10"
                >
                  <div className="w-20 h-20 rounded-3xl bg-white border border-emerald-200 shadow-sm flex items-center justify-center text-emerald-600">
                    <FileText size={40} strokeWidth={1} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-slate-900 italic truncate max-w-[200px] uppercase tracking-tighter">{file.name}</p>
                    <p className="text-[9px] font-black text-emerald-600 mt-2 uppercase tracking-[0.2em]">{formatFileSize(file.size)} • PDF AKTİF</p>
                  </div>
                </motion.div>
              ) : fileError ? (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500 shadow-sm">
                    <AlertCircle size={32} />
                  </div>
                  <p className="text-xs font-black text-red-500 uppercase tracking-widest">{fileError}</p>
                  <span className="text-[9px] text-white font-black px-5 py-2 bg-red-500 rounded-full uppercase tracking-widest active:scale-95 transition-all">YENİDEN SEÇ</span>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-5 relative z-10">
                  <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-all duration-500 shadow-sm" style={{ color: "rgba(47,107,255,0.7)" }}>
                    <Upload size={32} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-sm font-black text-slate-700 italic transition-colors uppercase tracking-tight" style={{ color: '#1E2A44' }}>BELGE SÜRÜKLE VEYA SEÇ</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">SİSTEME KANIT EKLE</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {file && !fileError && (
              <button
                type="button"
                onClick={removeFile}
                className="absolute top-6 right-6 p-3 rounded-full bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 shadow-md border border-slate-200 transition-all z-20 active:scale-90"
              >
                <X size={16} strokeWidth={3} />
              </button>
            )}
          </div>

          <AnimatePresence>
            {uploadStatus !== 'idle' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl border bg-white"
                style={{ borderColor: 'rgba(47,107,255,0.2)' }}
              >
                {(uploadStatus === 'compressing' || uploadStatus === 'uploading') && <Loader2 size={18} className="animate-spin" style={{ color: '#2F6BFF' }} />}
                {uploadStatus === 'done' && <CheckCircle2 size={18} className="text-emerald-500" />}
                
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#2F6BFF' }}>
                  {uploadStatus === 'compressing' ? 'GÖRSEL OPTİMİZE EDİLİYOR...' : 
                   uploadStatus === 'uploading' ? 'BULUTA YÜKLENİYOR...' : 'İŞLEM BAŞARILI!'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Actions */}
        <div className="pt-8 border-t border-slate-200 flex items-center justify-end gap-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-8 py-4 rounded-2xl font-black text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all text-[10px] uppercase tracking-[0.2em] italic"
            >
              İPTAL ET
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 md:flex-none uppercase tracking-[0.25em] relative group overflow-hidden text-white rounded-2xl px-12 py-4 font-black text-[11px] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border italic shadow-md hover:shadow-lg active:scale-95"
            style={{ background: '#2F6BFF', borderColor: 'rgba(47,107,255,0.5)' }}
          >
            <span className="relative flex items-center gap-3">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ANALİZ EDİLİYOR...
                </>
              ) : (
                <>
                  {initialData ? 'GÜNCELLEMEYİ KAYDET' : 'GİDERİ VERİTABANINA İŞLE'}
                  <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
