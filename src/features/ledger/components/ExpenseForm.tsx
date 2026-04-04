'use client';

import { useState, useRef } from 'react';
import { addExpense, updateExpense, uploadExpenseAttachment } from '../actions';
import { compressImage } from '@/lib/image-utils';
import { Loader2, Upload, X, FileText, Image as ImageIcon, Receipt, Calendar, MapPin, Tag, Percent, ChevronDown, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    description: initialData?.description || '',
    amount: initialData?.amount || '',
    vatRate: initialData?.vatRate?.toString() || '20',
    type: initialData?.type || 'Operasyonel',
    locationId: initialData?.locationId || '',
    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const isPdfFile = selectedFile.type === 'application/pdf';
      setIsPdf(isPdfFile);

      if (isPdfFile) {
        setPreviewUrl(null);
      } else {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.locationId || !formData.amount || !formData.description) {
      alert('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      let attachmentUrl = initialData?.attachmentUrl || '';

      if (file) {
        let fileToUpload: File | Blob = file;
        if (!isPdf) {
          try {
            const compressed = await compressImage(file);
            fileToUpload = compressed;
          } catch (e) {
            console.warn("Compression failed, uploading original:", e);
          }
        }
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', fileToUpload);
        
        const uploadResult = await uploadExpenseAttachment(uploadFormData);
        if (!uploadResult.success || !uploadResult.publicUrl) {
          // MORE ROBUST ERROR MESSAGE AS REQUESTED
          throw new Error(uploadResult.error || 'Dosya yükleme hatası. Supabase "documents" bucket ayarlarını kontrol edin.');
        }
        attachmentUrl = uploadResult.publicUrl;
      }

      const payload = {
        ...formData,
        attachmentUrl,
        month: new Date(formData.date).toISOString()
      };

      const result = initialData?.id 
        ? await updateExpense(initialData.id, payload)
        : await addExpense(payload);

      if (!result.success) throw new Error(result.error);

      if (onClose) {
        onClose();
        // Use standard navigation to refresh state instead of full reload if possible
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
        window.location.reload();
      }
    } catch (err: any) {
      console.error(err);
      alert('Hata: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card p-6 md:p-10 bg-zinc-950/40 border-white/5 shadow-2xl relative overflow-hidden"
    >
      {/* Decorative Gradient Overlay */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />

      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
             <Receipt className="w-7 h-7 text-white" />
           </div>
           <div>
             <h2 className="text-2xl font-black text-white tracking-tight italic">Gider Sisteme Kaydet</h2>
             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">Harclama Verisi & Fatura Arşivi</p>
           </div>
        </div>
        
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        )}
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Description */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Tag size={12} className="text-indigo-400" />
              Açıklama / Harcama Kalemi *
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Ege Perla Elektrik, Ofis Malzemeleri..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all font-bold"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Amount and VAT */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <span className="text-emerald-400 font-black">₺</span>
                Net Tutar *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all font-mono font-bold"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Percent size={12} className="text-indigo-400" />
                KDV Oranı
              </label>
              <div className="relative group">
                <select
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all font-bold appearance-none cursor-pointer"
                  value={formData.vatRate}
                  onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
                >
                  <option value="0" className="bg-zinc-900">%0 (KDV'siz)</option>
                  <option value="10" className="bg-zinc-900">%10 (Hizmet)</option>
                  <option value="20" className="bg-zinc-900">%20 (Standart)</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 group-hover:text-indigo-400 transition-colors">
                   <ChevronDown size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={12} className="text-indigo-400" />
              Şube / Lokasyon Seçimi *
            </label>
            <div className="relative group">
              <select
                required
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all font-bold appearance-none cursor-pointer"
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              >
                <option value="" className="bg-zinc-900">Şube Seçiniz...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id} className="bg-zinc-900">{loc.name}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 group-hover:text-indigo-400 transition-colors">
                 <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} className="text-indigo-400" />
              İşlem Tarihi
            </label>
            <input
              type="date"
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all font-bold cursor-pointer"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
        </div>

        {/* File Upload Section - MOBILE FRIENDLY BIG BUTTON */}
        <div className="pt-6">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-4">
             Fatura veya Makbuz Eki (PDF / Görsel)
          </label>
          
          <div 
             onClick={() => fileInputRef.current?.click()}
             className={cn(
               "relative group cursor-pointer border-2 border-dashed rounded-[2.5rem] p-10 transition-all flex flex-col items-center justify-center gap-5 overflow-hidden",
               previewUrl || file ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-white/[0.01] hover:border-indigo-500/30 hover:bg-white/[0.03]"
             )}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />

            <AnimatePresence mode="wait">
              {previewUrl ? (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full max-w-[280px] aspect-video rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10"
                >
                   <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="text-white w-8 h-8 mb-2" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">GÖRSELİ DEĞİŞTİR</span>
                   </div>
                </motion.div>
              ) : file && isPdf ? (
                <motion.div 
                   key="pdf"
                   initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                   className="flex flex-col items-center gap-4 text-emerald-400"
                >
                   <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <FileText size={40} className="drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                   </div>
                   <div className="text-center">
                     <p className="text-xs font-black uppercase tracking-widest max-w-[250px] truncate mb-1">{file.name}</p>
                     <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">PDF DÖKÜMANI HAZIR</p>
                   </div>
                </motion.div>
              ) : (
                <motion.div 
                   key="empty"
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                   className="flex flex-col items-center gap-4 text-zinc-500 group-hover:text-indigo-400 transition-all"
                >
                   <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:shadow-2xl transition-all">
                      <Upload size={32} />
                   </div>
                   <div className="text-center">
                      <span className="text-xs font-black uppercase tracking-widest block mb-2">BELGE YÜKLE VEYA FOTOĞRAF ÇEK</span>
                      <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.2em]">MAX 10MB • PDF, JPG, PNG</span>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            {file && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-6 right-6 p-3 rounded-2xl bg-black/80 text-white hover:bg-rose-500 transition-all z-20 shadow-xl border border-white/10"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-3xl py-5 font-black uppercase tracking-[0.3em] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <ShieldCheck size={20} className="text-indigo-200" />
                Gideri Finansal Arşive Kaydet
              </>
            )}
          </button>
          
          <div className="mt-6 flex items-center justify-center gap-8">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest italic">Şifreli Bağlantı</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest italic">Yedekli Kayıt</span>
             </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
