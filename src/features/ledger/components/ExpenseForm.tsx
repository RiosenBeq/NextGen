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
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/5 selection:bg-blue-500/30">
      {/* Premium Gradient Header */}
      <div className="relative bg-gradient-to-br from-blue-600/20 to-indigo-700/20 px-8 py-10 overflow-hidden flex items-center justify-between border-b border-white/5 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-blue-500/10 blur-[100px] rounded-full"></div>
        
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
            <Receipt className="w-7 h-7 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
              {initialData ? 'GİDER GÜNCELLE' : 'YENİ GİDER FİŞİ'}
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">OPERASYONEL MALİYET ANALİZİ</p>
          </div>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose} 
            className="relative z-10 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center backdrop-blur-sm border border-white/5 hover:border-white/20 active:scale-95"
          >
            <X size={20} strokeWidth={3} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-black/20">
        {/* Step 1: Basic Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pl-1">
            <span className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-400 border border-blue-500/30">1</span>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">TEMEL BİLGİLER</h3>
          </div>
          
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">FIŞ AÇIKLAMASI <span className="text-red-500/50">*</span></label>
            <input
              type="text"
              required
              placeholder="Örn: ZAFER PLAZA KAHVE ALIMI..."
              className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:bg-white/[0.08] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600 font-bold text-white uppercase italic tracking-tight shadow-inner"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">İŞLEM TARİHİ <span className="text-red-500/50">*</span></label>
              <div className="relative group">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="date"
                  required
                  className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:bg-white/[0.08] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-bold text-white cursor-pointer shadow-inner [color-scheme:dark]"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">ŞUBE / LOKASYON</label>
              <div className="relative group">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-focus-within:text-blue-400 transition-colors" />
                <select
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:bg-white/[0.08] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-bold text-white appearance-none cursor-pointer shadow-inner uppercase tracking-tighter"
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                >
                  <option value="" className="bg-[#0f1117] font-black uppercase text-slate-300">GENEL MERKEZ / TÜM ŞUBELER</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id} className="bg-[#0f1117] font-black uppercase">{loc.name.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Financial Details */}
        <div className="space-y-6 pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 pl-1">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 border border-indigo-500/30">2</span>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">FİNANSAL VERİLER</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                <span>MATRAH (KDV HARİÇ) <span className="text-red-500/50">*</span></span>
              </label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 font-black italic">₺</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  className="w-full pl-10 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-2xl focus:bg-white/[0.08] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-mono font-black text-white shadow-inner tracking-tighter"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">KDV ORANI</label>
              <div className="relative group">
                <Percent className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-focus-within:text-blue-400 transition-colors" />
                <select
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:bg-white/[0.08] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-bold text-white appearance-none cursor-pointer shadow-inner uppercase tracking-widest"
                  value={formData.vatRate}
                  onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
                >
                  <option value="0" className="bg-[#0f1117]">%0 VERGİSİZ</option>
                  <option value="1" className="bg-[#0f1117]">%1 İNDİRİMLİ</option>
                  <option value="10" className="bg-[#0f1117]">%10 HİZMET</option>
                  <option value="20" className="bg-[#0f1117]">%20 STANDART</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
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
                <div className="p-6 rounded-[24px] bg-gradient-to-br from-blue-600/10 to-indigo-600/5 border border-blue-500/20 flex items-center justify-between shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                      <CircleDollarSign size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] italic">ÖDENECEK TOPLAM</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-widest">KDV DAHİL NİHAİ TUTAR</p>
                    </div>
                  </div>
                  <span className="text-3xl font-black text-white tracking-tighter italic drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                    ₺{totalWithVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">ÖDEME TİPİ</label>
              <div className="relative">
                <select
                  className="w-full pl-5 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:bg-white/[0.08] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-bold text-white appearance-none cursor-pointer shadow-inner uppercase tracking-tight"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {PAYMENT_FREQUENCIES.map(f => (
                    <option key={f.id} value={f.id} className="bg-[#0f1117]">{f.label.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">KATEGORİ</label>
              <div className="relative">
                <select
                  className="w-full pl-5 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:bg-white/[0.08] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-bold text-white appearance-none cursor-pointer shadow-inner uppercase tracking-tight"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#0f1117]">{c.label.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">ÖDEMEYİ YAPAN ANALİZ KAYNAĞI</label>
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
                        ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]" 
                        : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1"
                        >
                          <div className="w-6 h-6 bg-blue-500 flex items-center justify-center rounded-bl-xl">
                            <CheckCircle2 size={10} className="text-white" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <span className={cn(
                      "text-[10px] font-black tracking-tighter uppercase",
                      isSelected ? "text-white" : "text-slate-500 group-hover/item:text-slate-300 transition-colors"
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
        <div className="space-y-6 pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 pl-1">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-[10px] font-black text-emerald-400 border border-emerald-500/30">3</span>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">BELGE VE KANIT YÜKLEME</h3>
          </div>
          
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "group relative flex flex-col items-center justify-center p-12 rounded-[32px] border-2 border-dashed transition-all cursor-pointer overflow-hidden shadow-inner",
              file && !fileError
                ? "border-emerald-500/30 bg-emerald-500/5 shadow-[inset_0_0_40px_rgba(16,185,129,0.05)]"
                : fileError
                ? "border-red-500/30 bg-red-500/5 shadow-[inset_0_0_40px_rgba(239,68,68,0.05)]"
                : "border-white/10 bg-white/[0.02] hover:border-blue-500/30 hover:bg-blue-500/5"
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
                  className="w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border-4 border-white/10 relative z-10"
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
                  <div className="w-20 h-20 rounded-3xl bg-white/5 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)] flex items-center justify-center text-emerald-400">
                    <FileText size={40} strokeWidth={1} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-white italic truncate max-w-[200px] uppercase tracking-tighter">{file.name}</p>
                    <p className="text-[9px] font-black text-emerald-500 mt-2 uppercase tracking-[0.2em]">{formatFileSize(file.size)} • PDF AKTİF</p>
                  </div>
                </motion.div>
              ) : fileError ? (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                    <AlertCircle size={32} />
                  </div>
                  <p className="text-xs font-black text-red-500 uppercase tracking-widest">{fileError}</p>
                  <span className="text-[9px] text-white font-black px-5 py-2 bg-red-500 rounded-full uppercase tracking-widest active:scale-95 transition-all">YENİDEN SEÇ</span>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-5 relative z-10">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:scale-110 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all duration-500 shadow-xl">
                    <Upload size={32} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-sm font-black text-white italic group-hover:text-blue-400 transition-colors uppercase tracking-tight">BELGE SÜRÜKLE VEYA SEÇ</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">SİSTEME KANIT EKLE</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {file && !fileError && (
              <button
                type="button"
                onClick={removeFile}
                className="absolute top-6 right-6 p-3 rounded-full bg-black/40 hover:bg-black/60 text-slate-400 hover:text-white backdrop-blur shadow-xl border border-white/10 transition-all z-20 active:scale-90"
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
                className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-xl"
              >
                {(uploadStatus === 'compressing' || uploadStatus === 'uploading') && <Loader2 size={18} className="text-blue-400 animate-spin" />}
                {uploadStatus === 'done' && <CheckCircle2 size={18} className="text-emerald-400" />}
                
                <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">
                  {uploadStatus === 'compressing' ? 'GÖRSEL OPTİMİZE EDİLİYOR...' : 
                   uploadStatus === 'uploading' ? 'BULUTA YÜKLENİYOR...' : 'İŞLEM BAŞARILI!'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Actions */}
        <div className="pt-8 border-t border-white/5 flex items-center justify-end gap-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-8 py-4 rounded-2xl font-black text-slate-500 hover:text-white hover:bg-white/5 transition-all text-[10px] uppercase tracking-[0.2em] italic"
            >
              İPTAL ET
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 md:flex-none uppercase tracking-[0.25em] relative group overflow-hidden bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white rounded-2xl px-12 py-4 font-black text-[11px] transition-all flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed border border-blue-400/30 italic"
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
