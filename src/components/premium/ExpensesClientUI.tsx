'use client';

import React, { useState, useRef } from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  Wallet, 
  Calendar, 
  CreditCard, 
  Activity, 
  Search, 
  Receipt,
  Download,
  Filter as FilterIcon,
  PieChart,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  UploadCloud,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PremiumModal, PremiumDrawer } from './PremiumModal';
import ExpenseForm from '@/features/ledger/components/ExpenseForm';
import PremiumExpenseTable from '@/components/premium/PremiumExpenseTable';
import { uploadExpenseAttachment, updateExpenseAttachment } from '@/features/ledger/actions';

interface ExpensesClientProps {
  expenses: any[];
  locations: any[];
  documents: any[];
  total: number;
  thisMonthTotal: number;
}

export default function ExpensesClientUI({ expenses, locations, documents, total, thisMonthTotal }: ExpensesClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  const handleLateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExpense) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const upload = await uploadExpenseAttachment(formData);
      if (!upload.success || !upload.publicUrl) throw new Error(upload.error || 'Yükleme başarısız');

      const update = await updateExpenseAttachment(selectedExpense.id, upload.publicUrl);
      if (!update.success) throw new Error(update.error);

      alert('Belge başarıyla eklendi.');
      setIsDrawerOpen(false);
      window.location.reload();
    } catch (err: any) {
      alert('Hata: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* 1. HEADER SECTION (Sağlam & Modern) */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-slate-100">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full border border-blue-100 bg-blue-50/50">
            <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
              FİNANSAL YÖNETİM MERKEZİ
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase flex items-center gap-4">
            <Wallet className="w-10 h-10 text-slate-300" />
            Gider Yönetimi
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
            Harcamaları, fatura takibini ve şubeler arası mahsuplaşmaları <span className="font-bold text-slate-800">Gerçek Zamanlı</span> verilerle, elite SaaS arayüzünde yönetin.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
           {/* Mini Stats Card */}
           <div className="flex gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-3xl min-w-[180px] shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bu Ayın Gideri</p>
                 <p className="text-2xl font-black text-slate-900 tabular-nums italic tracking-tighter">{formatCurrency(thisMonthTotal)}</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-3xl min-w-[180px] shadow-xl">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Toplam Hacim</p>
                 <p className="text-2xl font-black text-white tabular-nums italic tracking-tighter">{formatCurrency(total)}</p>
              </div>
           </div>
           
           <button 
             onClick={() => { setEditingExpense(null); setShowForm(true); }}
             className="px-6 py-5 bg-slate-900 text-white rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group"
           >
              <div className="p-1 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                <Plus size={18} strokeWidth={3} />
              </div>
              Yeni Gider Tanımla
           </button>
        </div>
      </header>

      {/* 2. MAIN DATA SECTION */}
      <section className="relative">
           <PremiumExpenseTable 
              expenses={expenses} 
              locations={locations} 
              documents={documents} 
              onView={(exp: any) => { setSelectedExpense(exp); setIsDrawerOpen(true); }}
              onEdit={(exp: any) => { setEditingExpense(exp); setShowForm(true); }}
           />
      </section>

      {/* 3. MODALS & DRAWERS */}
       <PremiumModal 
         isOpen={showForm} 
         onClose={() => { setShowForm(false); setEditingExpense(null); }} 
         title={editingExpense ? "Gider Kaydı Güncelle" : "Gider Kaydı Tanımla"}
         maxWidth="max-w-2xl"
       >
         <ExpenseForm 
           locations={locations} 
           initialData={editingExpense}
           onClose={() => { setShowForm(false); setEditingExpense(null); window.location.reload(); }} 
         />
       </PremiumModal>

      <PremiumDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title="Gider Belgesi & Analizi"
      >
        {selectedExpense && (
          <div className="space-y-10 py-4 animate-in slide-in-from-right-10 duration-500">
             
             {/* Large Amount Display */}
             <div className="p-8 rounded-[40px] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center space-y-2 text-center shadow-inner">
                <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                   <Receipt size={32} className="text-slate-400" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Net Harcama Tutarı</p>
                <p className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter italic">
                   {formatCurrency(selectedExpense.amountWithVat)}
                </p>
                {selectedExpense.vatRate > 0 && (
                   <p className="text-[10px] font-bold text-slate-400 mt-2 bg-white px-3 py-1 rounded-full border border-slate-100">
                      % {selectedExpense.vatRate} KDV Dahil
                   </p>
                )}
             </div>

             {/* Description & Metadata */}
             <div className="space-y-8 px-2">
                <div className="space-y-2">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-50 pb-2 mb-4">Açıklama Detayları</h4>
                   <p className="text-lg font-bold text-slate-900 tracking-tight leading-relaxed italic underline decoration-slate-100 underline-offset-8">
                     "{selectedExpense.description}"
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <DetailRow label="Ödeme Tipi" value={selectedExpense.type === 'RECURRING' ? 'DÜZENLİ (AYLIK)' : 'TEK SEFERLİK'} />
                   <DetailRow label="Fatura Durumu" value={selectedExpense.isOfficial ? 'RESMİ EVRAK' : 'GAYRİ RESMİ'} />
                   <DetailRow label="İlgili Şube" value={selectedExpense.location?.name || 'Tüm Platform'} />
                   <DetailRow label="Tarih" value={new Date(selectedExpense.createdAt).toLocaleString('tr-TR')} />
                </div>
             </div>

             {/* Document/Receipt Section */}
             <div className="space-y-4 px-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-50 pb-2 flex items-center gap-2">
                   <FileText size={14} className="text-blue-500" />
                   BELGE / KANIT DURUMU
                </h4>
                
                {selectedExpense.attachmentUrl ? (
                   <a 
                     href={selectedExpense.attachmentUrl} 
                     target="_blank" 
                     className="block w-full p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-between group shadow-sm transition-all hover:bg-emerald-100/50"
                   >
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-white text-emerald-600 rounded-2xl shadow-sm border border-emerald-100 group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={24} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Belge Mevcut</span>
                            <span className="text-[9px] font-bold text-emerald-600/70 uppercase">Cloud Store'da Güvenli</span>
                         </div>
                      </div>
                      <ChevronRight size={20} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
                   </a>
                ) : (
                   <div className="space-y-4">
                      <div className="flex items-center gap-3 p-5 rounded-3xl bg-rose-50 border border-rose-100">
                         <AlertCircle size={20} className="text-rose-500" />
                         <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Henüz Belge Eklenmedi</span>
                      </div>
                      
                      <input 
                        type="file" 
                        ref={fileRef} 
                        onChange={handleLateUpload} 
                        className="hidden" 
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                      />
                      
                      <button 
                        onClick={() => fileRef.current?.click()}
                        disabled={isUploading}
                        className="w-full flex items-center justify-center gap-4 py-6 rounded-[32px] border-2 border-dashed border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all text-[11px] font-black uppercase tracking-widest italic group"
                      >
                         {isUploading ? (
                           <>
                             <Loader2 size={18} className="animate-spin" />
                             DOSYA BULUT KATMANINA YÜKLENİYOR...
                           </>
                         ) : (
                           <>
                             <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-blue-100 transition-colors">
                                <UploadCloud size={20} />
                             </div>
                             BELGE / FATURA EKLE (PDF/GÖRSEL)
                           </>
                         )}
                      </button>
                   </div>
                )}
             </div>

             <div className="pt-10">
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-5 bg-slate-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all hover:scale-[1.02]"
                >
                  Gider Detaylarını Kapat
                </button>
             </div>
          </div>
        )}
      </PremiumDrawer>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
       <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{label}</span>
       <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">{value}</p>
    </div>
  );
}
