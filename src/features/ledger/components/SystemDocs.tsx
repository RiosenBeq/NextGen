'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, HelpCircle, ChevronRight, Zap, Calculator, Percent, Info, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQ_DATA = [
  {
    q: "Bilet Fiyatı ve Net Gelir farkı neden oluşuyor?",
    a: "Brüt bilet fiyatı (örn. 300 TL) üzerinden iyzico (%2) ve Nayax (%2) komisyonları otomatik olarak düşülür. Bu, operasyonel netliğin sağlanması ve reel nakit akışının takibi için kritik bir adımdır.",
    icon: <Calculator size={18} className="text-indigo-400" />
  },
  {
    q: "AVM Ciro Payı %15 nasıl hesaplanıyor?",
    a: "Bazı lokasyonlarda (Mavi Bahçe vb.) ciro üzerinden %15 pay alınmaktadır. Sistem, bu payı partner kar paylaşımından önce düşerek 'Reel Net Kâr'ı hesaplar.",
    icon: <Percent size={18} className="text-emerald-400" />
  },
  {
    q: "Kira KDV Oranı (%) neden her şube için farklı?",
    a: "Lokasyonların fatura türleri (Gerçek şahıs, AVM işletmesi vb.) vergi yükümlülüklerini değiştirir. Tevkifatlı faturalar veya standart %20 KDV girişi bu parametre ile yönetilir.",
    icon: <Zap size={18} className="text-amber-400" />
  },
  {
    q: "Partner Kar Paylaşımı (25%) ne zaman gerçekleşiyor?",
    a: "Tüm sabit giderler (Kira, Aidat, Maaş) ve değişken paylar (Komisyon, AVM Payı) düşüldükten sonra kalan net nakit, dört ortağa eşit olarak (%25) dağıtılır.",
    icon: <BookOpen size={18} className="text-indigo-400" />
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 bg-zinc-950 border border-white/10 rounded-[2.5rem] z-[101] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <HelpCircle className="text-indigo-400" size={24} />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Sistem Dökümantasyonu</h2>
                   <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">NextGenBox Intelligence Knowledge Base</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 rounded-2xl bg-white/5 text-zinc-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
               {/* Sidebar Nav */}
               <div className="w-full md:w-64 border-r border-white/5 p-6 space-y-2 bg-white/[0.005]">
                  <button 
                    onClick={() => setActiveTab('faq')}
                    className={cn("w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'faq' ? "bg-white text-black" : "text-zinc-500 hover:bg-white/5")}
                  >Soru & Yanıt</button>
                  <button 
                    onClick={() => setActiveTab('glossary')}
                    className={cn("w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'glossary' ? "bg-white text-black" : "text-zinc-500 hover:bg-white/5")}
                  >Sistem Sözlüğü</button>
               </div>

               {/* Content */}
               <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                  {activeTab === 'faq' ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="relative group">
                          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                          <input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Soru veya anahtar kelime ara..."
                            className="w-full bg-white/[0.02] border border-white/5 rounded-3xl py-5 pl-16 pr-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                          />
                       </div>

                       <div className="grid grid-cols-1 gap-4">
                          {filteredFaq.map((item, idx) => (
                            <div key={idx} className="premium-card p-8 bg-white/[0.01] border hover:border-indigo-500/30 transition-all group">
                               <div className="flex items-start gap-5">
                                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
                                     {item.icon}
                                  </div>
                                  <div className="space-y-3">
                                     <h3 className="text-base font-bold text-white tracking-tight">{item.q}</h3>
                                     <p className="text-sm text-zinc-500 leading-relaxed font-medium">{item.a}</p>
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
                            <div key={idx} className="p-8 rounded-3xl bg-indigo-500/[0.02] border border-white/5 space-y-4">
                               <div className="flex items-center gap-2">
                                  <Info size={14} className="text-indigo-400" />
                                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{term.title}</h4>
                               </div>
                               <p className="text-sm text-zinc-400 font-medium leading-relaxed">{term.desc}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/20 text-center">
               <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em]">&copy; 2026 NextGen Intelligence System &bull; Version 4.2.0-Elite</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
