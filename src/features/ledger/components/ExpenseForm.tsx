'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { addExpense, updateExpense } from '../actions';
import { Loader2, Plus, Receipt, User, CheckCircle2, X, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentUploader from '@/features/documents/components/DocumentUploader';

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

    if (result.success && result.record && !initialData) {
      setCreatedExpenseId(result.record.id);
      reset();
    } else if (result.success && initialData) {
      if (onClose) onClose();
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
          className="premium-card p-8 border-slate-200 max-w-4xl bg-white shadow-xl"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              {initialData ? <Edit className="text-rose-500" size={20} /> : <Receipt className="text-rose-500" size={20} />}
              {initialData ? 'Operasyonel Gider Güncelleme' : 'Operasyonel Gider Girişi'}
            </h3>
            <button onClick={handleClose} type="button" className="text-[10px] p-2 rounded-xl bg-slate-100 font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"><X size={14}/></button>
          </div>

          <AnimatePresence mode="wait">
            {createdExpenseId && !initialData ? (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-10"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Gider Kaydedildi!</h4>
                <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">Bu gidere ait faturayı veya dekontu şimdi ekleyebilirsiniz.</p>
                
                <div className="flex justify-center gap-4">
                  <DocumentUploader 
                    relatedType="expense" 
                    relatedId={createdExpenseId} 
                    onUploadComplete={handleClose} 
                  />
                  <button 
                    onClick={handleClose}
                    className="elite-button-secondary"
                  >
                    Fatura Yok / Sonra
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
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gider Açıklaması</label>
                    <input {...register('description')} className="elite-input bg-white border-slate-200 text-slate-900" placeholder="Örn: Elektrik Faturası, Sigorta vs." required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><User size={12}/> Kim Ödedi?</label>
                    <select {...register('paidBy')} className="elite-input bg-white text-slate-900 border-slate-200" defaultValue="Ortak Hesap">
                      <option value="Ortak Hesap">Ortak Hesap</option>
                      <option value="Okan">Okan</option>
                      <option value="Berk">Berk</option>
                      <option value="Diğer Ortak">Diğer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tutar (₺)</label>
                    <input type="number" step="0.01" {...register('amount')} className="elite-input bg-white border-slate-200 text-slate-900" placeholder="0.00" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</label>
                    <select {...register('type')} className="elite-input bg-white border-slate-200 text-slate-900">
                      <option value="FATURA">Fatura / Tüketim</option>
                      <option value="MAAS">Maaş / Personel</option>
                      <option value="KİRA">Kira / Aidat</option>
                      <option value="PAZARLAMA">Reklam / Pazarlama</option>
                      <option value="BAKIM">Bakım / Onarım</option>
                      <option value="DİĞER">Diğer</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lokasyon</label>
                    <select {...register('locationId')} className="elite-input bg-white border-slate-200 text-slate-900">
                      <option value="">Genel / Merkez</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resmiyet</label>
                    <select {...register('isOfficial')} className="elite-input bg-white border-slate-200 text-slate-900" defaultValue={initialData ? initialData.isOfficial.toString() : "false"}>
                      <option value="true">Resmi (Faturalı)</option>
                      <option value="false">Resmi Olmayan</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="elite-button-primary w-full py-4 flex items-center justify-center gap-2 mt-4 shadow-lg"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData ? <Edit size={18} /> : <Plus size={18} />)}
                  {initialData ? 'GÜNCELLE' : 'İLERİ: FATURA YÜKLE'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
