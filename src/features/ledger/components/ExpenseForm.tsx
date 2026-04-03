'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { addExpense, updateExpense } from '../actions';
import { Loader2, Plus, Receipt, User, CheckCircle2, X, Edit, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentUploader from '@/features/documents/components/DocumentUploader';
import { uploadDocument } from '@/features/documents/actions';
import { createAuditLog } from '@/lib/audit';
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

  const { register, handleSubmit, reset } = useForm({
    defaultValues: initialData || {}
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    let result;
    if (initialData?.id) {
      result = await updateExpense(initialData.id, data);
    } else {
      result = await addExpense(data);
    }

    if (result.success && result.record) {
      // Handle file upload if present
      if (data.invoiceFile && data.invoiceFile[0]) {
        const formData = new FormData();
        formData.append('file', data.invoiceFile[0]);
        formData.append('relatedType', 'expense');
        formData.append('relatedId', result.record.id);
        
        const uploadResult = await uploadDocument(formData);
        if (uploadResult.success) {
          await createAuditLog('CREATE', 'Document', result.record.id, { fileName: data.invoiceFile[0].name });
        }
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
    setTimeout(() => setCreatedExpenseId(null), 300); // Give time for animation
  };

  return (
    <div className="space-y-4">
      {!showForm && !initialData ? (
        <button 
          onClick={() => setShowForm(true)}
          className="elite-button-primary flex items-center gap-2"
        >
          <Plus size={16} />
          YENİ GİDER EKLE
        </button>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-10 border-white/10 max-w-4xl bg-slate-900 shadow-[0_0_80px_rgba(0,0,0,0.6)]"
        >
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
              {initialData ? <Edit className="text-rose-500" size={24} /> : <Receipt className="text-rose-500" size={24} />}
              {initialData ? 'Gider Güncelle' : 'Yeni Gider Kaydı'}
            </h3>
            <button onClick={handleClose} type="button" className="p-3 rounded-2xl bg-white/5 border border-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all"><X size={18}/></button>
          </div>

          <AnimatePresence mode="wait">
            {createdExpenseId && !initialData ? (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-3">Gelen Evrak Kaydedildi!</h4>
                <p className="text-[10px] font-black text-zinc-500 mb-10 uppercase tracking-[0.4em] leading-relaxed">Gider kaydı başarılı. Dilerseniz bu işleme ait <br/> faturayı hemen sisteme yükleyebilirsiniz.</p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <DocumentUploader 
                    relatedType="expense" 
                    relatedId={createdExpenseId} 
                    onUploadComplete={handleClose} 
                  />
                  <button 
                    onClick={handleClose}
                    className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    BİTTİ / SONRA EKLE
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form 
                key="step1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit(onSubmit)} 
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-3 lg:col-span-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Harcama / Gider Açıklaması</label>
                    <input {...register('description')} className="elite-input" placeholder="Örn: Elektrik, Personel Yemek, Kira vs." required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2"><User size={12}/> Kim Ödedi?</label>
                    <select {...register('paidBy')} className="elite-input" defaultValue="Ortak Hesap">
                      <option value="Ortak Hesap" className="bg-slate-900">Ortak Hesap</option>
                      <option value="Okan" className="bg-slate-900">Okan</option>
                      <option value="Talha" className="bg-slate-900">Talha</option>
                      <option value="Furkan" className="bg-slate-900">Furkan</option>
                      <option value="Alp" className="bg-slate-900">Alp</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Net Tutar (₺)</label>
                    <input type="number" step="0.01" {...register('amount')} className="elite-input" placeholder="0.00" required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Kategori</label>
                    <select {...register('type')} className="elite-input">
                      <option value="FATURA" className="bg-slate-900">Fatura / Tüketim</option>
                      <option value="MAAS" className="bg-slate-900">Maaş / Personel</option>
                      <option value="KİRA" className="bg-slate-900">Kira / Aidat</option>
                      <option value="PAZARLAMA" className="bg-slate-900">Reklam / Pazarlama</option>
                      <option value="BAKIM" className="bg-slate-900">Bakım / Onarım</option>
                      <option value="DİĞER" className="bg-slate-900">Diğer</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Şube / Lokasyon</label>
                    <select {...register('locationId')} className="elite-input">
                      <option value="" className="bg-slate-900">Genel / Merkez</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id} className="bg-slate-900">{loc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Resmi Kayıt</label>
                    <select {...register('isOfficial')} className="elite-input" defaultValue={initialData ? initialData.isOfficial.toString() : "false"}>
                      <option value="true" className="bg-slate-900">Vergi Usül Kanunu (Resmi)</option>
                      <option value="false" className="bg-slate-900">Kayıt Dışı / KDV'siz</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Paperclip size={12}/> Ek Dosya / Fatura Görüntüsü
                  </label>
                  <div className="flex items-center gap-6 bg-white/[0.02] p-8 rounded-3xl border border-dashed border-white/10 hover:border-emerald-500/30 transition-all group/file">
                    <input 
                      type="file" 
                      {...register('invoiceFile')} 
                      className="text-[10px] font-black text-zinc-500 file:mr-6 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-white file:text-slate-950 hover:file:bg-zinc-200 cursor-pointer w-full"
                    />
                  </div>
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">DESTEKLENEN: JPG, PNG, PDF (MAX 5MB)</p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "elite-button-primary w-full py-5 flex items-center justify-center gap-3 mt-6 text-sm",
                    isSubmitting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (initialData ? <Edit size={20} /> : <Plus size={20} />)}
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
