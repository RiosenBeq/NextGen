'use client';

import { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { addExpense, updateExpense } from '../actions';
import { Loader2, Plus, Receipt, User, CheckCircle2, X, Edit, Paperclip, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentUploader from '@/features/documents/components/DocumentUploader';
import { uploadDocument } from '@/features/documents/actions';
import { cn } from '@/lib/utils';

interface Props {
  locations: any[];
  initialData?: any;
  onClose?: () => void;
}

export function ExpenseForm({ locations, initialData, onClose }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(!!initialData);
  const [createdExpenseId, setCreatedExpenseId] = useState<string | null>(null);

  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: initialData ? {
      ...initialData,
      vatRate: initialData.vatRate?.toString() || "0",
      amount: initialData.amountWithoutVat?.toString() || "0"
    } : {
      vatRate: "20",
      isOfficial: "true",
      paidBy: "Ortak Hesap"
    }
  });

  const watchedValues = useWatch({ control });
  
  const liveTotal = useMemo(() => {
    const amount = parseFloat(watchedValues.amount || "0");
    const vatRate = parseFloat(watchedValues.vatRate || "0");
    return amount * (1 + vatRate / 100);
  }, [watchedValues.amount, watchedValues.vatRate]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    let result;
    if (initialData?.id) {
      result = await updateExpense(initialData.id, data);
    } else {
      result = await addExpense(data);
    }

    if (result.success && result.record) {
      if (data.invoiceFile && data.invoiceFile[0]) {
        const formData = new FormData();
        formData.append('file', data.invoiceFile[0]);
        formData.append('relatedType', 'expense');
        formData.append('relatedId', result.record.id);
        await uploadDocument(formData);
      }

      if (!initialData) {
        setCreatedExpenseId(result.record.id);
        reset();
      } else if (onClose) {
        onClose();
      }
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (onClose) onClose();
    else setShowForm(false);
    setTimeout(() => setCreatedExpenseId(null), 300);
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
                <p className="text-xs text-zinc-500 mb-10 font-medium leading-relaxed">Gider kaydı sisteme işlendi. Belge veya fatura görselini <br/> hemen eklemek ister misiniz?</p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <DocumentUploader 
                    relatedType="expense" 
                    relatedId={createdExpenseId} 
                    onUploadComplete={handleClose} 
                  />
                  <button 
                    onClick={handleClose}
                    className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    SONRA EKLE
                  </button>
                </div>
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
                  <div className="flex items-center gap-6 bg-white/[0.01] p-6 rounded-2xl border border-dashed border-white/10 hover:border-rose-500/30 transition-all cursor-pointer">
                    <input 
                      type="file" 
                      {...register('invoiceFile')} 
                      className="text-[10px] font-bold text-zinc-500 h-full w-full cursor-pointer file:cursor-pointer file:mr-6 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-white file:text-black hover:file:bg-zinc-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "elite-button-primary w-full py-5 flex items-center justify-center gap-3 mt-6 text-sm font-bold",
                    isSubmitting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData ? <Edit size={18} /> : <Plus size={18} />)}
                  {initialData ? 'GÜNCELLEMEYİ KAYDET' : 'GİDER KAYDINI TAMAMLA'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

