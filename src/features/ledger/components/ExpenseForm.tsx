'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { addExpense } from '../actions';
import { Loader2, Plus, Receipt, User, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentUploader from '@/features/documents/components/DocumentUploader';

interface Props {
  locations: any[];
}

export function ExpenseForm({ locations }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [createdExpenseId, setCreatedExpenseId] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    const result = await addExpense(data);
    if (result.success && result.record) {
      setCreatedExpenseId(result.record.id);
      reset();
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setShowForm(false);
    setTimeout(() => setCreatedExpenseId(null), 300); // Give time for animation
  };

  return (
    <div className="space-y-4">
      {!showForm ? (
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
          className="premium-card p-8 border-emerald-500/20 max-w-4xl"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Receipt className="text-emerald-500" size={20} />
              Operasyonel Gider Girişi
            </h3>
            <button onClick={handleClose} className="text-[10px] p-2 rounded-xl bg-white/5 font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-colors"><X size={14}/></button>
          </div>

          <AnimatePresence mode="wait">
            {createdExpenseId ? (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-10"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Gider Kaydedildi!</h4>
                <p className="text-xs font-bold text-zinc-500 mb-8 uppercase tracking-widest">Bu gidere ait faturayı veya dekontu şimdi ekleyebilirsiniz.</p>
                
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
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Gider Açıklaması</label>
                    <input {...register('description')} className="elite-input" placeholder="Örn: Elektrik Faturası, Sigorta vs." required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1"><User size={12}/> Kim Ödedi?</label>
                    <select {...register('paidBy')} className="elite-input bg-[#1a1a22] text-white" defaultValue="Ortak Hesap">
                      <option value="Ortak Hesap">Ortak Hesap</option>
                      <option value="Okan">Okan</option>
                      <option value="Berk">Berk</option>
                      <option value="Diğer Ortak">Diğer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tutar (₺)</label>
                    <input type="number" step="0.01" {...register('amount')} className="elite-input" placeholder="0.00" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Kategori</label>
                    <select {...register('type')} className="elite-input bg-[#1a1a22]">
                      <option value="FATURA">Fatura / Tüketim</option>
                      <option value="MAAS">Maaş / Personel</option>
                      <option value="KİRA">Kira / Aidat</option>
                      <option value="PAZARLAMA">Reklam / Pazarlama</option>
                      <option value="BAKIM">Bakım / Onarım</option>
                      <option value="DİĞER">Diğer</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Lokasyon</label>
                    <select {...register('locationId')} className="elite-input bg-[#1a1a22]">
                      <option value="">Genel / Merkez</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Resmiyet</label>
                    <select {...register('isOfficial')} className="elite-input bg-[#1a1a22]">
                      <option value="true">Resmi (Faturalı)</option>
                      <option value="false">Resmi Olmayan</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="elite-button-primary w-full py-4 flex items-center justify-center gap-2 mt-4 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus size={18} />}
                  İLERİ: FATURA YÜKLE
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
