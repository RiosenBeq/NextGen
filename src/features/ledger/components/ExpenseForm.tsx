'use client';

import { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { addExpense, updateExpense, uploadExpenseAttachment } from '../actions';
import { Loader2, Plus, Receipt, User, CheckCircle2, X, Edit, Paperclip, Calculator, Image as ImageIcon, Trash2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/image-utils';

interface Props {
  locations: any[];
  initialData?: any;
  onClose?: () => void;
}

export function ExpenseForm({ locations, initialData, onClose }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(!!initialData);
  const [createdExpenseId, setCreatedExpenseId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(initialData?.attachmentUrl || null);
  const [isCompressing, setIsCompressing] = useState(false);

  const { register, handleSubmit, reset, control, setValue } = useForm({
    defaultValues: initialData ? {
      ...initialData,
      vatRate: initialData.vatRate?.toString() || "0",
      amount: initialData.amountWithoutVat?.toString() || "0"
    } : {
      vatRate: "20",
      isOfficial: "true",
      paidBy: "Ortak Hesap",
      type: "FATURA"
    }
  });

  const watchedValues = useWatch({ control });
  
  const liveTotal = useMemo(() => {
    const amount = parseFloat(watchedValues.amount || "0");
    const vatRate = parseFloat(watchedValues.vatRate || "0");
    return amount * (1 + vatRate / 100);
  }, [watchedValues.amount, watchedValues.vatRate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setValue('invoiceFile', null);
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    let attachmentUrl = initialData?.attachmentUrl || null;

    // Handle File Upload with Compression
    if (selectedFile) {
      setIsCompressing(true);
      try {
        const compressedBlob = await compressImage(selectedFile, 1200, 0.7);
        const compressedFile = new File([compressedBlob], selectedFile.name, { type: 'image/jpeg' });
        
        const formData = new FormData();
        formData.append('file', compressedFile);
        
        const uploadResult = await uploadExpenseAttachment(formData);
        if (uploadResult.success) {
          attachmentUrl = uploadResult.publicUrl;
        }
      } catch (err) {
        console.error("Compression/Upload Error:", err);
      } finally {
        setIsCompressing(false);
      }
    } else if (filePreview === null) {
      attachmentUrl = null; // Map explicitly removed
    }

    const payload = { ...data, attachmentUrl };
    
    let result;
    if (initialData?.id) {
      result = await updateExpense(initialData.id, payload);
    } else {
      result = await addExpense(payload);
    }

    if (result.success && result.record) {
      if (!initialData) {
        setCreatedExpenseId(result.record.id);
        reset();
        setSelectedFile(null);
        setFilePreview(null);
      } else if (onClose) {
        onClose();
      }
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (onClose) onClose();
    else setShowForm(false);
    setTimeout(() => {
      setCreatedExpenseId(null);
      setSelectedFile(null);
      setFilePreview(null);
    }, 300);
  };

  return (
    <div className="space-y-4">
      {!showForm && !initialData ? (
        <button 
          onClick={() => setShowForm(true)}
          className="elite-button-primary flex items-center gap-2 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform" />
          YENİ GİDER EKLE
        </button>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="premium-card p-10 border-white/10 max-w-4xl bg-[#09090b] shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
        >
          {/* Subtle Accent Background */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 blur-[100px] rounded-full" />
          
          <div className="flex justify-between items-center mb-10 relative z-10">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
              {initialData ? <Edit className="text-rose-500" size={24} /> : <Receipt className="text-rose-500" size={24} />}
              {initialData ? 'Gider Güncelle' : 'Yeni Gider Kaydı'}
            </h3>
            <button onClick={handleClose} type="button" className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all"><X size={18}/></button>
          </div>

          <AnimatePresence mode="wait">
            {createdExpenseId && !initialData ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 relative z-10"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h4 className="text-3xl font-bold text-white tracking-tight mb-3 uppercase">Başarıyla Kaydedildi!</h4>
                <p className="text-xs text-zinc-500 mb-10 font-medium leading-relaxed">Gider kaydı sisteme işlendi.</p>
                
                <button 
                  onClick={handleClose}
                  className="px-8 py-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all"
                >
                  TAMAMLA
                </button>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit(onSubmit)} 
                className="space-y-8 relative z-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-3 lg:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Gider Açıklaması</label>
                    <input {...register('description')} className="elite-input" placeholder="Örn: Elektrik, Personel Yemek, Kira..." required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><User size={12}/> Ödeyen Kişi</label>
                    <select {...register('paidBy')} className="elite-input">
                      <option value="Ortak Hesap" className="bg-zinc-950">Ortak Hesap</option>
                      <option value="Okan" className="bg-zinc-950">Okan</option>
                      <option value="Talha" className="bg-zinc-950">Talha</option>
                      <option value="Furkan" className="bg-zinc-950">Furkan</option>
                      <option value="Alp" className="bg-zinc-950">Alp</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Net Tutar (₺)</label>
                    <input type="number" step="0.01" {...register('amount')} className="elite-input" placeholder="0.00" required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">KDV Oranı (%)</label>
                    <select {...register('vatRate')} className="elite-input">
                      <option value="0" className="bg-zinc-950">%0 (Muaf)</option>
                      <option value="1" className="bg-zinc-950">%1</option>
                      <option value="10" className="bg-zinc-950">%10</option>
                      <option value="20" className="bg-zinc-950">%20</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Kategori</label>
                    <select {...register('type')} className="elite-input">
                      <option value="FATURA" className="bg-zinc-950">Fatura / Tüketim</option>
                      <option value="MAAS" className="bg-zinc-950">Maaş / Personel</option>
                      <option value="KİRA" className="bg-zinc-950">Kira / Aidat</option>
                      <option value="PAZARLAMA" className="bg-zinc-950">Reklam / Pazarlama</option>
                      <option value="BAKIM" className="bg-zinc-950">Bakım / Onarım</option>
                      <option value="DİĞER" className="bg-zinc-950">Diğer</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Resmi Durum</label>
                    <select {...register('isOfficial')} className="elite-input">
                      <option value="true" className="bg-zinc-950">Faturadır (Resmi)</option>
                      <option value="false" className="bg-zinc-950">Fiş / Kayıt Dışı</option>
                    </select>
                  </div>
                </div>

                {/* Sub-Total Calculation Preview */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                         <Calculator size={20} />
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Hesaplanan Toplam Gider</p>
                         <p className="text-xl font-bold text-white tracking-tight">₺{liveTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-[10px] text-zinc-500 ml-1">(KDV Dahil)</span></p>
                      </div>
                   </div>
                   
                   <div className="space-y-3 lg:w-1/3">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Lokasyon</label>
                    <select {...register('locationId')} className="elite-input bg-zinc-950/50">
                      <option value="" className="bg-zinc-950">Genel / Merkez</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id} className="bg-zinc-950">{loc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Paperclip size={12}/> Belge / Fatura (Opsiyonel)
                  </label>
                  
                  {!filePreview ? (
                    <div className="group relative flex flex-col items-center justify-center bg-white/[0.01] p-10 rounded-2xl border border-dashed border-white/10 hover:border-rose-500/30 transition-all cursor-pointer">
                      <ImageIcon className="w-8 h-8 text-zinc-700 group-hover:text-rose-500/50 mb-3 transition-colors" />
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fatura Görseli Yükle</p>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 flex items-center justify-center aspect-[16/9] max-h-48">
                       <img src={filePreview} alt="Invoice Preview" className="h-full w-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                       <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                          <button 
                            type="button" 
                            onClick={removeFile}
                            className="p-3 rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                          <a 
                            href={filePreview} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-3 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition-all"
                          >
                            <Download size={20} />
                          </a>
                       </div>
                       <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-black/60 rounded-lg text-[9px] font-black text-white uppercase tracking-widest backdrop-blur-md">Görsel Seçildi</span>
                       </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isCompressing}
                  className={cn(
                    "elite-button-primary w-full py-5 flex items-center justify-center gap-3 mt-6 text-sm font-bold",
                    (isSubmitting || isCompressing) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSubmitting || isCompressing ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData ? <Edit size={18} /> : <Plus size={18} />)}
                  {isCompressing ? 'GÖRSEL SIKIŞTIRILIYOR...' : (isSubmitting ? 'KAYDEDİLİYOR...' : (initialData ? 'GÜNCELLEMEYİ KAYDET' : 'GİDER KAYDINI TAMAMLA'))}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

