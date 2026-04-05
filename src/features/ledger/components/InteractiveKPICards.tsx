"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, TrendingUp, CreditCard, Wallet, X, Repeat, PiggyBank, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InteractiveKPICards({
  totalRevenue,
  totalExpense,
  totalInvestment,
  totalNetCash,
  expenses,
  allMonthCount = 1
}: {
  totalRevenue: number;
  totalExpense: number;
  totalInvestment: number;
  totalNetCash: number;
  expenses: any[];
  allMonthCount?: number;
}) {
  const absoluteNet = totalNetCash - totalInvestment;
  const isProfitable = absoluteNet >= 0;

  // Amortization (60 months / 5 years linear depreciation)
  const monthlyAmortization = totalInvestment / 60;
  const totalAmortization = monthlyAmortization * allMonthCount;
  const trueNetProfit = totalNetCash - totalAmortization;

  const [isExpenseFlipped, setIsExpenseFlipped] = useState(false);
  const [isInvestmentFlipped, setIsInvestmentFlipped] = useState(false);

  // Son 5 gider
  const topExpenses = [...expenses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 perspective-1000">
      
      {/* 1. Toplam Ciro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="premium-card p-6 stat-card-green group hover:shadow-xl transition-all duration-300"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="w-12 h-12 rounded-2xl border flex items-center justify-center bg-emerald-50 border-emerald-100 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-700">All Time</span>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Toplam Ciro</p>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">₺{totalRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h2>
          <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
             <ArrowUpRight size={12} className="text-emerald-500" />
             Brüt Gelirler
          </p>
        </div>
      </motion.div>

      {/* 2. Toplam Gider (FLIPPABLE) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative h-full"
        style={{ perspective: "1000px" }}
      >
        <motion.div
          className="w-full h-full relative preserve-3d cursor-pointer"
          animate={{ rotateY: isExpenseFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
          onClick={() => setIsExpenseFlipped(!isExpenseFlipped)}
        >
          {/* FRONT FACE */}
          <div className="absolute inset-0 backface-hidden w-full h-full premium-card p-6 stat-card-red group hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-6">
              <div className="relative w-12 h-12 rounded-2xl border flex items-center justify-center bg-red-50 border-red-100 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6 text-red-600" />
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter bg-red-100 text-red-700 flex items-center gap-1">
                Tıkla (Detay) <Repeat size={10} />
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Toplam Gider</p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">₺{totalExpense.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
                 <ArrowUpRight size={12} className="text-red-500" />
                 Tüm Operasyonel Çıkışlar
              </p>
            </div>
          </div>

          {/* BACK FACE */}
          <div className="absolute inset-0 backface-hidden flex flex-col premium-card p-4 border border-rose-200 bg-gradient-to-b from-rose-50 to-white shadow-xl rotate-y-180">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-rose-100 pb-2 mb-2 flex items-center justify-between">
              Son Harcamalar
              <Repeat size={12} className="text-rose-400 opacity-50" />
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {topExpenses.length > 0 ? topExpenses.map(exp => (
                <div key={exp.id} className="flex justify-between items-center text-[10px]">
                  <span className="font-semibold text-slate-600 truncate max-w-[120px]">{exp.description}</span>
                  <span className="font-black text-rose-600">₺{exp.amountWithVat.toLocaleString('tr-TR')}</span>
                </div>
              )) : (
                <div className="text-xs text-slate-400 text-center mt-6">Kayıt bulunamadı.</div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* NEW: 3. Operasyonel Net Gelir */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="premium-card p-6 stat-card-blue group hover:shadow-xl transition-all duration-300"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="w-12 h-12 rounded-2xl border flex items-center justify-center bg-blue-50 border-blue-100 group-hover:scale-110 transition-transform">
            <Wallet className="w-6 h-6 text-blue-600" />
          </div>
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter bg-blue-100 text-blue-700">Operasyonel</span>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Net Kâr (Amortisman Sonrası)</p>
          <h2 className={cn("text-2xl font-black tracking-tighter", trueNetProfit >= 0 ? "text-slate-900" : "text-rose-600")}>
            ₺{trueNetProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </h2>
          <p className="text-[10px] font-semibold text-slate-400 mt-2 flex justify-between items-center bg-slate-50 p-1.5 rounded-lg border border-slate-100 italic">
             <span>Kişi Başı (Net Kâr)</span>
             <span className="font-black text-slate-600">~₺{(trueNetProfit / 4).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
          </p>
        </div>
      </motion.div>

      {/* 4. Toplam Yatırım (FLIPPABLE) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative h-full"
        style={{ perspective: "1000px" }}
      >
        <motion.div
          className="w-full h-full relative preserve-3d cursor-pointer"
          animate={{ rotateY: isInvestmentFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
          onClick={() => setIsInvestmentFlipped(!isInvestmentFlipped)}
        >
          {/* FRONT FACE */}
          <div className="absolute inset-0 backface-hidden w-full h-full premium-card p-6 stat-card-amber group hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl border flex items-center justify-center bg-amber-50 border-amber-100 group-hover:scale-110 transition-transform">
                <Landmark className="w-6 h-6 text-amber-600" />
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter bg-amber-100 text-amber-700 flex items-center gap-1">
                Tıkla (Detay) <Repeat size={10} />
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Toplam Yatırım</p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">₺{totalInvestment.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
                 <ArrowUpRight size={12} className="text-amber-500" />
                 Kabin + Kurulum + Altyapı
              </p>
            </div>
          </div>

          {/* BACK FACE */}
          <div className="absolute inset-0 backface-hidden flex flex-col premium-card p-4 border border-blue-200 bg-gradient-to-b from-blue-50 to-white shadow-xl rotate-y-180">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-blue-100 pb-2 mb-2 flex items-center justify-between">
              Yatırım Dağılımı
              <Repeat size={12} className="text-blue-400 opacity-50" />
            </h3>
            <div className="flex-1 space-y-3 mt-1">
               <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Mavibahçe (İzmir)</span>
                   <span className="text-xs font-bold text-slate-700">2 Adet Kabin</span>
                 </div>
                 <span className="font-black text-blue-600 text-sm">₺491.375</span>
               </div>
               <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Zafer Plaza (Bursa)</span>
                   <span className="text-xs font-bold text-slate-700">1 Adet Kabin</span>
                 </div>
                 <span className="font-black text-blue-600 text-sm">₺349.125</span>
               </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* 4. Toplam Net Durum */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={cn(
          "premium-card p-6 group hover:shadow-xl transition-all duration-300",
          isProfitable ? "stat-card-blue bg-blue-50/20" : "stat-card-red bg-rose-50/20 border-rose-200"
        )}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="w-12 h-12 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-110 duration-300 bg-white shadow-sm">
            <PiggyBank className={cn("w-6 h-6", isProfitable ? "text-blue-600" : "text-rose-600")} />
          </div>
          <span className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter",
            isProfitable ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"
          )}>
            {isProfitable ? "NET KÂR" : "NET ZARAR"}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ROI Durumu</p>
          <h2 className={cn(
            "text-2xl font-black tracking-tighter",
            isProfitable ? "text-blue-700" : "text-rose-600"
          )}>
            {isProfitable ? "+" : ""}
            ₺{absoluteNet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
             Tüm Gelir - Gider - Yatırım
          </p>
        </div>
      </motion.div>

    </section>
  );
}
