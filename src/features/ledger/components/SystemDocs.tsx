'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, HelpCircle, Zap, Calculator, Percent, Info, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQ_DATA = [
  {
    q: "Bilet Fiyatı ve Net Gelir farkı neden oluşuyor?",
    a: "Brüt bilet fiyatı (örn. 300 TL) üzerinden iyzico (%2) ve Nayax (%2) komisyonları otomatik olarak düşülür. Bu, operasyonel netliğin sağlanması ve reel nakit akışının takibi için kritik bir adımdır.",
    icon: <Calculator size={18} style={{ color: '#2F6BFF' }} />
  },
  {
    q: "AVM Ciro Payı %15 nasıl hesaplanıyor?",
    a: "Bazı lokasyonlarda (Mavi Bahçe vb.) ciro üzerinden %15 pay alınmaktadır. Sistem, bu payı partner kar paylaşımından önce düşerek 'Reel Net Kâr'ı hesaplar.",
    icon: <Percent size={18} className="text-emerald-600" />
  },
  {
    q: "Kira KDV Oranı (%) neden her şube için farklı?",
    a: "Lokasyonların fatura türleri (Gerçek şahıs, AVM işletmesi vb.) vergi yükümlülüklerini değiştirir. Tevkifatlı faturalar veya standart %20 KDV girişi bu parametre ile yönetilir.",
    icon: <Zap size={18} className="text-amber-500" />
  },
  {
    q: "Partner Kar Paylaşımı (25%) ne zaman gerçekleşiyor?",
    a: "Tüm sabit giderler (Kira, Aidat, Maaş) ve değişken paylar (Komisyon, AVM Payı) düşüldükten sonra kalan net nakit, dört ortağa eşit olarak (%25) dağıtılır.",
    icon: <BookOpen size={18} style={{ color: '#2F6BFF' }} />
  }
];

export function SystemDocs({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<'faq' | 'glossary'>('faq');

  const filteredFaq = FAQ_DATA.filter(f => 
    f.q.toLowerCase().includes(search.toLowerCase()) || 
    f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 backdrop-blur-md z-[100]"
            style={{ background: 'rgba(30,42,68,0.4)' }}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 bg-white border border-slate-200 rounded-[2.5rem] z-[101] overflow-hidden flex flex-col shadow-[0_30px_60px_rgba(30,42,68,0.15)]"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm" style={{ background: 'rgba(47,107,255,0.05)', borderColor: 'rgba(47,107,255,0.15)' }}>
                  <HelpCircle style={{ color: '#2F6BFF' }} size={24} />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Sistem Dökümantasyonu</h2>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">NextGenBox Intelligence Kurumsal Hafıza</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 rounded-2xl border text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all shadow-sm bg-white border-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
               {/* Sidebar Nav */}
               <div className="w-full md:w-64 border-r border-slate-200 p-6 space-y-2 bg-slate-50/50">
                  <button 
                    onClick={() => setActiveTab('faq')}
                    className={cn("w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'faq' ? "text-white shadow-sm" : "text-slate-500 hover:bg-slate-100")}
                    style={activeTab === 'faq' ? { background: '#1E2A44' } : {}}
                  >Soru & Yanıt</button>
                  <button 
                    onClick={() => setActiveTab('glossary')}
                    className={cn("w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'glossary' ? "text-white shadow-sm" : "text-slate-500 hover:bg-slate-100")}
                    style={activeTab === 'glossary' ? { background: '#1E2A44' } : {}}
                  >Sistem Sözlüğü</button>
               </div>

               {/* Content */}
               <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-white">
                  {activeTab === 'faq' ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="relative group">
                          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                          <input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Soru veya anahtar kelime ara..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 pl-16 pr-6 text-sm text-slate-900 focus:outline-none transition-all placeholder:text-slate-400 focus:bg-white shadow-inner font-medium"
                            style={{ '--tw-border-opacity': '1' } as React.CSSProperties}
                            onFocus={(e) => e.target.style.borderColor = 'rgba(47,107,255,0.4)'}
                            onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                          />
                       </div>

                       <div className="grid grid-cols-1 gap-4">
                          {filteredFaq.map((item, idx) => (
                            <div key={idx} className="p-8 bg-white border border-slate-200 rounded-[24px] hover:shadow-md transition-all group" onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(47,107,255,0.3)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}>
                               <div className="flex items-start gap-5">
                                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 shadow-sm group-hover:scale-110 transition-transform">
                                     {item.icon}
                                  </div>
                                  <div className="space-y-3">
                                     <h3 className="text-base font-bold text-slate-900 tracking-tight">{item.q}</h3>
                                     <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.a}</p>
                                  </div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {[
                            { title: "Net Nakit Akışı", desc: "Tüm operasyonel, sabit ve vergi giderleri düşüldükten sonra elde kalan reel para miktarı." },
                            { title: "Başabaş Noktası (Break-even)", desc: "Giderlerin gelire eşit olduğu, kârın sıfır olduğu minimum seans sayısı." },
                            { title: "Ciro Payı (Revenue Share)", desc: "Şube lokasyonunun brüt cirosu üzerinden AVM yönetimine ödenen değişken pay." },
                            { title: "Marj Verimliliği", desc: "Brüt gelirin yüzde kaçının net kâr olarak kaldığını gösteren verimlilik oranı." }
                          ].map((term, idx) => (
                            <div key={idx} className="p-8 rounded-3xl border border-slate-200 space-y-4 shadow-sm" style={{ background: 'rgba(47,107,255,0.01)' }}>
                               <div className="flex items-center gap-2">
                                  <Info size={14} style={{ color: '#2F6BFF' }} />
                                  <h4 className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#2F6BFF' }}>{term.title}</h4>
                               </div>
                               <p className="text-sm text-slate-600 font-medium leading-relaxed">{term.desc}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 text-center">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">&copy; 2026 NextGen Intelligence System &bull; Version 4.2.0-Elite</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
