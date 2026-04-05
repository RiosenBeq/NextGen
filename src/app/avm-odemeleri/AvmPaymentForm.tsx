"use client";

import { useState, useRef } from "react";
import { addExpense, uploadExpenseAttachment } from "@/features/ledger/actions";
import { CreditCard, Landmark, Check, AlertTriangle, Building2, Upload } from "lucide-react";
import { motion } from "framer-motion";

export default function AvmPaymentForm({ locations }: { locations: any[] }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    locationId: "",
    category: "Sabit Kira",
    amount: "",
    month: new Date().toISOString().slice(0, 7),
    paidBy: "Ortak Hesap",
    description: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadingState, setUploadingState] = useState(false);

  const categories = [
    { id: "Sabit Kira", label: "Sabit Kira", desc: "Aylık standart kira faturası" },
    { id: "AVM Aidat", label: "AVM Aidat", desc: "Aylık aidat / ortak alan gideri" },
    { id: "Ciro Payı", label: "Ciro Payı", desc: "Kirayı aşan ciro üzerinden ödenen ek pay" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!formData.locationId || !formData.amount) {
        throw new Error("Lütfen tutar ve lokasyon giriniz.");
      }

      let attachmentUrl = null;
      if (file) {
        setUploadingState(true);
        const fd = new FormData();
        fd.append("file", file);
        const fileRes = await uploadExpenseAttachment(fd);
        if (!fileRes.success) throw new Error(fileRes.error);
        attachmentUrl = fileRes.publicUrl;
        setUploadingState(false);
      }

      const res = await addExpense({
        ...formData,
        description: `[${formData.category}] ${formData.description}`,
        type: "RECURRING",
        isOfficial: true,
        attachmentUrl,
        vatRate: formData.category === "AVM Aidat" ? 0 : 20, // Aidat is typically 0% VAT, Rent is 20%. User can modify description but backend expects standard structure
      });

      if (!res.success) throw new Error(res.error);

      setSuccess(true);
      setFormData({ ...formData, amount: "", description: "" });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-card p-6 border border-slate-100 bg-white max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Category selector */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-3 block">Ödeme Türü (Kategori)</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             {categories.map(cat => (
               <div 
                  key={cat.id} 
                  onClick={() => setFormData({...formData, category: cat.id})}
                  className={`p-3 rounded-xl border border-2 cursor-pointer transition-all ${
                     formData.category === cat.id ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-slate-100 bg-slate-50 hover:bg-slate-100/80"
                  }`}
               >
                 <div className="flex items-center gap-2 mb-1">
                   <div className={`w-3 h-3 rounded-full ${formData.category === cat.id ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                   <span className="font-bold text-slate-800 text-sm">{cat.label}</span>
                 </div>
                 <p className="text-[10px] text-slate-500 leading-tight">{cat.desc}</p>
               </div>
             ))}
          </div>
        </div>

        {/* Amount & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
             <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest block">Ödenen Tutar (₺)</label>
             <input
               type="number"
               required
               step="0.01"
               value={formData.amount}
               onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
               className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg focus:ring-2 focus:ring-indigo-500"
               placeholder="Örn: 35000"
             />
           </div>
           
           <div className="space-y-2">
             <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest block">Lokasyon</label>
             <select
                required
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500 appearance-none"
             >
                <option value="" disabled>Lokasyon Seçin</option>
                {locations.map((loc: any) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
             </select>
           </div>
        </div>

        {/* Month & Payer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
             <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest block">Hangi Ay?</label>
             <input
               type="month"
               required
               value={formData.month}
               onChange={(e) => setFormData({ ...formData, month: e.target.value })}
               className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500"
             />
           </div>

           <div className="space-y-2">
             <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest block">Ödemeyi Yapan Hesap</label>
             <select
                required
                value={formData.paidBy}
                onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700 appearance-none drop-shadow-sm"
             >
                <option value="Ortak Hesap">Ortak Hesap</option>
                <option value="Okan">Okan</option>
                <option value="Talha">Talha</option>
                <option value="Furkan">Furkan</option>
                <option value="Alp">Alp</option>
             </select>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
             <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest block">Ek Not / Fatura Detayı</label>
             <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="Örn: Şubat dönemi ek elektrik zammı ile birlikte ödendi."
             />
           </div>
           
           <div className="space-y-2">
             <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest block">
               Belge Ekle (Fatura / Dekont) <span className="text-slate-400 font-medium normal-case tracking-normal ml-1">(Opsiyonel)</span>
             </label>
             <div className="relative">
                <input
                   type="file"
                   ref={fileInputRef}
                   accept=".pdf,image/*"
                   onChange={(e) => setFile(e.target.files?.[0] || null)}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className={`w-full px-4 py-2 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-colors ${file ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                   <Upload size={16} />
                   <span className="text-sm font-semibold truncate max-w-[200px]">
                      {file ? file.name : "Belge Seçin (PDF/JPG)"}
                   </span>
                </div>
             </div>
           </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 border border-red-100">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || success || uploadingState}
          className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {loading ? (
            <div className="flex items-center gap-2">
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               {uploadingState ? "Belge Yükleniyor..." : "İşleniyor..."}
            </div>
          ) : success ? (
            <><Check size={20} /> Kaydedildi ve Giderlere İşlendi</>
          ) : (
             <><Building2 size={20} /> AVM Ödemesini Onayla</>
          )}
        </button>
      </form>
    </div>
  );
}
