"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, CreditCard, Wallet, Repeat, PiggyBank, Landmark, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumModal } from "@/components/premium/PremiumModal";

const cardBase =
  "apple-card p-6 min-h-[220px] transition-all duration-300";

const eyebrow = "text-[13px] text-[--text-secondary] mt-4";
const valueLg = "text-[24px] md:text-[28px] font-semibold tabular-nums text-[--text] mt-1";

const chip = (tone: "emerald" | "rose" | "blue" | "amber" | "slate") => {
  if (tone === "rose") return "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium bg-[--danger-soft] text-[--danger]";
  if (tone === "blue") return "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium bg-[--accent-soft] text-[--accent]";
  return "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium bg-[--bg-elevated] text-[--text-secondary]";
};

const iconWrap = (tone: "emerald" | "rose" | "blue" | "amber" | "slate") => {
  if (tone === "blue") return "w-10 h-10 rounded-full flex items-center justify-center bg-[--accent-soft] text-[--accent]";
  return "w-10 h-10 rounded-full flex items-center justify-center bg-[--bg-elevated] text-[--text-secondary]";
};

export default function InteractiveKPICards({
  totalRevenue,
  totalExpense,
  totalInvestment,
  investmentBreakdown,
  totalNetCash,
  expenses,
  allMonthCount = 1
}: {
  totalRevenue: number;
  totalExpense: number;
  totalInvestment: number;
  investmentBreakdown: Record<string, number>;
  totalNetCash: number;
  expenses: Array<{ id: string; description: string; amountWithVat: number; createdAt: string }>;
  allMonthCount?: number;
}) {
  const absoluteNet = totalNetCash - totalInvestment;
  const isProfitable = absoluteNet >= 0;
  // Amortization (36 months / 3 years linear depreciation)
  const monthlyAmortization = totalInvestment / 36;
  const totalAmortization = monthlyAmortization * allMonthCount;
  const trueNetProfit = totalNetCash - totalAmortization;

  const [isExpenseFlipped, setIsExpenseFlipped] = useState(false);
  const [isInvestmentFlipped, setIsInvestmentFlipped] = useState(false);
  const [isNetProfitFlipped, setIsNetProfitFlipped] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);

  const investmentRows = Object.entries(investmentBreakdown || {}).sort((a, b) => b[1] - a[1]);

  // Son 5 gider
  const topExpenses = [...expenses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  });

  return (
    <>
    <section className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 perspective-1000">

      {/* 1. Toplam Ciro */}
      <motion.div {...fadeUp(0.05)} className={cardBase}>
        <div className="flex items-start justify-between">
          <div className={iconWrap("emerald")}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className={chip("slate")}>Tüm Zamanlar</span>
        </div>
        <p className={eyebrow}>Toplam Ciro</p>
        <h2 className={valueLg}>₺{totalRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h2>
        <p className="mt-3 text-xs font-medium text-slate-500">Brüt Gelirler</p>
      </motion.div>

      {/* 2. Toplam Gider (FLIPPABLE) */}
      <motion.div
        {...fadeUp(0.1)}
        className="relative min-h-[220px]"
        style={{ perspective: "1000px" }}
      >
        <motion.div
          className="w-full h-full relative preserve-3d cursor-pointer"
          animate={{ rotateY: isExpenseFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          onClick={() => setIsExpenseFlipped(!isExpenseFlipped)}
        >
          {/* FRONT */}
          <div className={cn("absolute inset-0 backface-hidden w-full h-full", cardBase)}>
            <div className="flex items-start justify-between">
              <div className={iconWrap("rose")}>
                <CreditCard className="w-5 h-5" />
              </div>
              <span className={chip("slate")}>
                <Repeat size={11} /> Çevir
              </span>
            </div>
            <p className={eyebrow}>Toplam Gider</p>
            <h2 className={valueLg}>₺{totalExpense.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h2>
            <p className="mt-3 text-xs font-medium text-slate-500">Tüm Operasyonel Çıkışlar</p>
          </div>

          {/* BACK */}
          <div className={cn("absolute inset-0 backface-hidden rotate-y-180 flex flex-col overflow-hidden", cardBase)}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-[13px] text-[--text-secondary]">Güncel Harcamalar</h3>
              <Repeat size={12} strokeWidth={1.75} className="text-[--text-tertiary]" />
            </div>
            <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {topExpenses.length > 0 ? topExpenses.map(exp => (
                <div key={exp.id} className="flex justify-between items-center gap-3 text-sm">
                  <span className="font-medium text-[--text] truncate" style={{ letterSpacing: '-0.005em' }}>{exp.description}</span>
                  <span className="font-medium tabular-nums text-[--text] shrink-0">₺{exp.amountWithVat.toLocaleString('tr-TR')}</span>
                </div>
              )) : (
                <div className="text-[13px] text-[--text-tertiary] text-center mt-6">Kayıt bulunamadı.</div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* 3. Operasyonel Net Gelir */}
      <motion.div {...fadeUp(0.15)} className={cardBase}>
        <div className="flex items-start justify-between">
          <div className={iconWrap("blue")}>
            <Wallet className="w-5 h-5" />
          </div>
          <span className={chip("slate")}>Operasyonel</span>
        </div>
        <p className={eyebrow}>Net Kâr (Amortisman Sonrası)</p>
        <h2 className={cn(valueLg, trueNetProfit < 0 && "text-[--text-secondary]")}>
          ₺{trueNetProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
        </h2>
        <div className="mt-3 flex justify-between items-center rounded-xl bg-slate-50/70 px-3 py-2">
          <span className="text-xs font-medium text-slate-500">Ortak Başı (Net Kâr)</span>
          <span className="text-xs font-semibold tabular-nums text-slate-700">~₺{(trueNetProfit / 4).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
        </div>
      </motion.div>

      {/* 4. Toplam Yatırım (FLIPPABLE + AÇIKLAMA MODAL) */}
      <motion.div
        {...fadeUp(0.2)}
        className="relative min-h-[220px]"
        style={{ perspective: "1000px" }}
      >
        <motion.div
          className="w-full h-full relative preserve-3d cursor-pointer"
          animate={{ rotateY: isInvestmentFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          onClick={() => setIsInvestmentFlipped(!isInvestmentFlipped)}
        >
          {/* FRONT */}
          <div className={cn("absolute inset-0 backface-hidden w-full h-full", cardBase)}>
            <div className="flex items-start justify-between">
              <div className={iconWrap("amber")}>
                <Landmark className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsInvestmentModalOpen(true);
                  }}
                  className={cn(chip("blue"), "hover:bg-blue-100 transition-colors")}
                >
                  Hesaplama <Info size={11} />
                </button>
                <span className={chip("slate")}>
                  <Repeat size={11} /> Çevir
                </span>
              </div>
            </div>
            <p className={eyebrow}>Toplam Yatırım</p>
            <h2 className={valueLg}>₺{totalInvestment.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h2>
            <p className="mt-3 text-xs font-medium text-slate-500">Kabin + Kurulum + Altyapı</p>
          </div>

          {/* BACK */}
          <div className={cn("absolute inset-0 backface-hidden rotate-y-180 flex flex-col overflow-hidden", cardBase)}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-[13px] text-[--text-secondary]">Yatırım Dağılımı</h3>
              <Repeat size={12} strokeWidth={1.75} className="text-[--text-tertiary]" />
            </div>
            <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
               {investmentRows.length > 0 ? (
                 investmentRows.map(([lokasyon, tutar]) => (
                   <div key={lokasyon} className="flex justify-between items-center rounded-xl bg-[--bg-elevated] px-3 py-2">
                     <span className="text-[14px] font-medium text-[--text] truncate" style={{ letterSpacing: '-0.005em' }}>{lokasyon}</span>
                     <span className="text-[14px] font-medium tabular-nums text-[--text] shrink-0">₺{tutar.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                   </div>
                 ))
               ) : (
                 <div className="text-[13px] text-[--text-tertiary] text-center mt-6">Yatırım kaydı bulunamadı.</div>
               )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* 5. Toplam Net Durum (FLIPPABLE) */}
      <motion.div
        {...fadeUp(0.25)}
        className="relative min-h-[220px]"
        style={{ perspective: "1000px" }}
      >
         <motion.div
            className="w-full h-full relative preserve-3d cursor-pointer"
            animate={{ rotateY: isNetProfitFlipped ? 180 : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            onClick={() => setIsNetProfitFlipped(!isNetProfitFlipped)}
         >
            {/* FRONT */}
            <div className={cn("absolute inset-0 backface-hidden w-full h-full", cardBase)}>
              <div className="flex items-start justify-between">
                <div className={iconWrap(isProfitable ? "blue" : "rose")}>
                  <PiggyBank className="w-5 h-5" />
                </div>
                <span className={chip(isProfitable ? "blue" : "rose")}>
                  {isProfitable ? "Kâr" : "Zarar"} <Repeat size={11} />
                </span>
              </div>
              <p className={eyebrow}>Net Nakit Akışı</p>
              <h2 className={cn(
                "text-3xl font-semibold tabular-nums tracking-tight mt-1",
                isProfitable ? "text-[--text]" : "text-[--text-secondary]"
              )}>
                {isProfitable ? "+" : ""}
                ₺{absoluteNet.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </h2>
              <p className="mt-3 text-xs font-medium text-slate-500">Tüm Gelir − Gider − Nakdi Yatırım</p>
            </div>

            {/* BACK */}
            <div className={cn("absolute inset-0 backface-hidden rotate-y-180 flex flex-col overflow-hidden", cardBase)}>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-[13px] text-[--text-secondary]">Sermaye Geri Dönüşü</h3>
                <Repeat size={12} strokeWidth={1.75} className="text-[--text-tertiary]" />
              </div>

              <div className="mt-4 flex-1 space-y-4">
                 <div>
                    <p className="text-[13px] text-[--text-secondary]">ROI Durumu</p>
                    <p className="mt-1 text-[16px] font-medium text-[--text]">36 Ay Hedefi</p>
                 </div>
                 <div className="pt-3 border-t border-[--border]">
                    <p className="text-[13px] text-[--text-secondary]">Aylık Amortisman</p>
                    <p className="mt-1 text-[16px] font-medium tabular-nums text-[--text]">₺{monthlyAmortization.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} <span className="text-[14px] font-normal text-[--text-tertiary]">/ ay</span></p>
                 </div>
              </div>
            </div>
         </motion.div>
      </motion.div>

    </section>

    <PremiumModal
      isOpen={isInvestmentModalOpen}
      onClose={() => setIsInvestmentModalOpen(false)}
      title="Toplam Yatırım Hesaplama Detayı"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 p-1">
        <p className="text-[15px] text-[--text-secondary] leading-relaxed">
          Toplam yatırım, <strong className="font-medium text-[--text]">Investment</strong> kayıtlarındaki <strong className="font-medium text-[--text]">totalAmount</strong> (yoksa amountWithoutVat) alanlarının toplamından hesaplanır.
        </p>
        <div className="rounded-[18px] bg-[--bg-elevated] p-5">
          <p className="text-[13px] text-[--text-secondary]">Toplam Yatırım</p>
          <p className="mt-1 text-[24px] md:text-[28px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.022em' }}>₺{totalInvestment.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="space-y-2 max-h-60 overflow-auto pr-1">
          {investmentRows.map(([lokasyon, tutar]) => (
            <div key={lokasyon} className="flex items-center justify-between rounded-xl border border-[--border] bg-[--surface] px-4 py-3">
              <span className="text-[14px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>{lokasyon}</span>
              <span className="text-[14px] font-medium tabular-nums text-[--text]">₺{tutar.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
            </div>
          ))}
        </div>
      </div>
    </PremiumModal>
    </>
  );
}
