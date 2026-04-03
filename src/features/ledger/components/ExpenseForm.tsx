'use client';

import { useState, useRef } from 'react';
import { addExpense, updateExpense, uploadExpenseAttachment } from '../actions';
import { compressImage } from '@/lib/image-utils';
import { Loader2, Upload, X, FileText, Image as ImageIcon, Receipt, Calendar, MapPin, Tag, Percent } from 'lucide-react';
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
          throw new Error(uploadResult.error || 'Dosya yükleme hatası');
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

      alert(initialData?.id ? 'Gider güncellendi.' : 'Gider başarıyla eklendi.');
      
      if (onClose) {
        onClose();
        window.location.reload();
      } else {
        // Reset only if creating new
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
      className="premium-card p-8 bg-zinc-950/40 border-white/5"
    >
      <header className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
          <Receipt className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight italic">Gider Kaydı</h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Yeni harcama ve fatura girişi</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Tag size={12} className="text-zinc-600" />
              Açıklama *
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Elektrik faturası, Temizlik malzemeleri..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Amount and VAT */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <span className="text-zinc-600 text-xs">₺</span>
                Tutar (Net) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all font-mono font-bold"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Percent size={12} className="text-zinc-600" />
                KDV (%)
              </label>
              <select
                className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium appearance-none"
                value={formData.vatRate}
                onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
              >
                <option value="0" className="bg-zinc-900">%0</option>
                <option value="10" className="bg-zinc-900">%10</option>
                <option value="20" className="bg-zinc-900">%20</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={12} className="text-zinc-600" />
              Lokasyon *
            </label>
            <select
              required
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium appearance-none"
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
            >
              <option value="" className="bg-zinc-900">Seçiniz...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id} className="bg-zinc-900">{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} className="text-zinc-600" />
              Tarih
            </label>
            <input
              type="date"
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
        </div>

        {/* File Upload Section */}
        <div className="pt-4">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-4">
             Fatura / Belge Eki (Opsiyonel)
          </label>
          
          <div 
             onClick={() => fileInputRef.current?.click()}
             className={cn(
               "relative group cursor-pointer border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center gap-4 overflow-hidden min-h-[140px]",
               previewUrl || file ? "border-indigo-500/30 bg-indigo-500/5" : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]"
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
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="relative w-full max-w-[200px] h-[120px] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                >
                   <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="text-white w-6 h-6" />
                   </div>
                </motion.div>
              ) : file && isPdf ? (
                <motion.div 
                   key="pdf"
                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                   className="flex flex-col items-center gap-3 text-emerald-400"
                >
                   <FileText size={48} className="drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                   <span className="text-xs font-bold uppercase tracking-widest max-w-[200px] truncate">{file.name}</span>
                </motion.div>
              ) : (
                <motion.div 
                   key="empty"
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                   className="flex flex-col items-center gap-2 text-zinc-500 group-hover:text-zinc-300 transition-colors"
                >
                   <Upload size={32} />
                   <span className="text-xs font-bold uppercase tracking-widest">Dosya Seç (PDF, JPG, PNG)</span>
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
                className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 text-white hover:bg-rose-500 transition-colors z-20"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl py-4 font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(79,70,229,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Upload size={18} />
                Gideri Sisteme Kaydet
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-zinc-600 mt-4 font-medium italic">
            * İşlem yaptığınızda tüm ortaklar bilgilendirilir.
          </p>
        </div>
      </form>
    </motion.div>
  );
}
