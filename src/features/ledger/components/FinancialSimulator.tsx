'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, TrendingUp, ArrowRight, X, HelpCircle, Target, Zap, Rocket, Coins, Binary, type LucideIcon } from 'lucide-react';
import { calculateMonthlyCashFlow } from '../calculations';
import { cn } from '@/lib/utils';

interface SimulatorDefaultParams {
  sessionPrice?: number;
  fixedRent?: number;
  duesAmount?: number;
  revenueShareRate?: number;
  investmentAmount?: number;
}

interface Props {
  defaultParams: SimulatorDefaultParams;
}

export default function FinancialSimulator({ defaultParams }: Props) {
  const [sessions, setSessions] = useState(500);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const simulation = useMemo(() => {
    return calculateMonthlyCashFlow(sessions, 0, {
      sessionPrice: defaultParams.sessionPrice || 350,
      iyzicoCommissionRate: 2,
      nayaxCommissionRate: 2,
      fixedRent: defaultParams.fixedRent || 40000,
      duesAmount: defaultParams.duesAmount || 6000,
      revenueShareRate: defaultParams.revenueShareRate || 15,
      investmentAmount: defaultParams.investmentAmount || 350000,
    });
  }, [sessions, defaultParams]);

  const explanations: Record<string, { title: string, icon: LucideIcon, math: string, text: string, details: string, formula: string, breakdown?: { label: string, value: string, color?: string }[] }> = {
    'cashflow': {
       title: 'Net Nakit Akışı',
       icon: Zap,
       math: `₺${simulation.netCash.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`,
       text: `Bu ayki ${sessions} seans beklentisine göre elde edilen net tutar.`,
       details: 'Vergi ve platform kesintileri dahil tüm operasyonel dışa akışların ardından elde edilen gerçek geliri temsil eder.',
       formula: 'Brüt Gelir - (Kira + Aidat + KDV + Komisyon + Ciro Payı)',
       breakdown: [
         { label: 'Brüt Gelir (KDV Dahil)', value: `₺${simulation.grossRevenue.toLocaleString('tr-TR')}`, color: 'text-emerald-600' },
         { label: 'Nayax + iyzico (%4)', value: `-₺${simulation.totalCommission.toLocaleString('tr-TR')}`, color: 'text-rose-600' },
         { label: 'Ham Kira (KDV Hariç)', value: `₺${(defaultParams.fixedRent || 0).toLocaleString('tr-TR')}`, color: 'text-slate-600' },
         { label: 'Kira KDV (%20)', value: `₺${((defaultParams.fixedRent || 0) * 0.2).toLocaleString('tr-TR')}`, color: 'text-slate-600' },
         { label: 'AVM Aidat', value: `₺${(defaultParams.fixedRent ? (defaultParams.duesAmount || 0) : 0).toLocaleString('tr-TR')}`, color: 'text-slate-600' },
         { label: 'Ciro Payı (%15)', value: `-₺${simulation.revenueShare.toLocaleString('tr-TR')}`, color: 'text-rose-600' },
         { label: 'Toplam Giderler', value: `-₺${simulation.totalExpense.toLocaleString('tr-TR')}`, color: 'text-rose-600' },
       ]
    },
    'margin': {
       title: 'Kâr Marjı',
       icon: Target,
       math: `%${simulation.profitMargin.toFixed(1)}`,
       text: 'Net Nakit Akışının, Brüt Gelir içerisindeki yüzdelik payıdır.',
       details: 'İşletme verimliliğini ölçen ana göstergedir. Oranın yüksek olması, operasyonel giderlerin minimize edildiğini gösterir.',
       formula: '(Net Nakit Akışı / Brüt Gelir) × 100'
    },
    'breaven': {
       title: 'Başa Baş Noktası',
       icon: Rocket,
       math: `${simulation.breakEvenSessions} Seans`,
       text: 'Bir takvim ayında zarar durumundan çıkıp kârlılığa geçilmesi için ulaşılması gereken asgari satış adedidir.',
       details: 'Sabit giderlerin toplamının, tek bir seansın net getiri ve katkı payına bölünmesiyle hesaplanır.',
       formula: 'Sabit Giderler ÷ (Birim Fiyat × (1 - Kesintiler))'
    },
    'roi': {
       title: 'Aylık ROI',
       icon: TrendingUp,
       math: `%${simulation.roiPercentage?.toFixed(1) || '0.0'}`,
       text: `Yapılan yatırımın (₺${(defaultParams.investmentAmount || 350000).toLocaleString('tr-TR')}) aylık net kâra oranıdır. Mevcut verilerle yatırımınızın %${(simulation.roiPercentage || 0).toFixed(1)} kısmını her ay geri topluyorsunuz.`,
       details: 'Aylık net kar ile yatırdığınız anaparanın kendini ne kadar sürede telafi edeceğini belirten yatırım getiri oranıdır.',
       formula: '(Aylık Net Nakit / Toplam Yatırım) × 100'
    }
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/70 rounded-2xl p-6 md:p-8">
            <div className="flex justify-between items-end mb-6">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Hedef Seans Sayısı</label>
                <p className="text-xs font-medium text-slate-500">Aylık beklenen müşteri</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-semibold text-slate-900 tracking-tight tabular-nums">{sessions}</span>
                <span className="text-xs font-medium text-slate-500">adet</span>
              </div>
            </div>

            <div className="relative h-10 flex items-center">
              <input
                type="range"
                min="0"
                max="2000"
                step="10"
                value={sessions}
                onChange={(e) => setSessions(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-900"
              />
            </div>

            <div className="flex justify-between text-xs font-medium text-slate-400 tabular-nums mt-2 px-1">
              <span>0</span>
              <span>500</span>
              <span>1.000</span>
              <span>1.500</span>
              <span className="text-slate-500">Kapasite 2.000</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/70 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-4 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 tracking-tight">Ortaklık Hakedişleri</h4>
                <p className="text-xs text-slate-500 mt-0.5">Eşit dağılım modeli (%25)</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {[
                { name: 'Okan', amount: simulation.okanShare },
                { name: 'Talha', amount: simulation.talhaShare },
                { name: 'Furkan', amount: simulation.furkanShare },
                { name: 'Alp', amount: simulation.alpShare },
              ].map((partner) => (
                <div key={partner.name} className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    {partner.name}
                  </span>
                  <span className="text-xl font-semibold text-slate-900 tracking-tight tabular-nums">
                    ₺{partner.amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Net Cash */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={() => setActiveModal('cashflow')}
            className={cn(
              "p-6 rounded-2xl border flex flex-col justify-between transition-colors cursor-pointer group",
              simulation.netCash > 0
                ? "bg-emerald-50 border-emerald-200/70 hover:border-emerald-300/70"
                : "bg-rose-50 border-rose-200/70 hover:border-rose-300/70"
            )}
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Net Nakit Akışı</span>
              <HelpCircle size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <div className="space-y-2">
              <p className={cn("text-3xl font-semibold tracking-tight tabular-nums", simulation.netCash > 0 ? "text-emerald-600" : "text-rose-600")}>
                ₺{simulation.netCash.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </p>
              <div className={cn("flex items-center gap-2", simulation.netCash > 0 ? "text-emerald-600" : "text-rose-600")}>
                <TrendingUp className={cn("w-3.5 h-3.5", simulation.netCash < 0 && "rotate-180")} />
                <span className="text-xs font-medium uppercase tracking-widest">{simulation.netCash > 0 ? "Operasyonel Kâr" : "Operasyonel Zarar"}</span>
              </div>
            </div>
          </motion.div>

          {/* Margin */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05, ease: 'easeOut' }}
            onClick={() => setActiveModal('margin')}
            className="p-6 rounded-2xl bg-white border border-slate-200/70 hover:border-slate-300/70 transition-colors cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Kâr Marjı</span>
              <HelpCircle size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <div>
              <p className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">
                %{simulation.profitMargin.toFixed(1)}
              </p>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-2">Verimlilik Skoru</p>
            </div>
          </motion.div>

          {/* Break Even */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1, ease: 'easeOut' }}
            onClick={() => setActiveModal('breaven')}
            className="p-6 rounded-2xl bg-white border border-slate-200/70 hover:border-slate-300/70 transition-colors cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Başa Baş Noktası</span>
              <HelpCircle size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <div>
              <p className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">
                {simulation.breakEvenSessions}
              </p>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-2 block">Kritik Hedef Seans</span>
            </div>
          </motion.div>

          {/* ROI */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.15, ease: 'easeOut' }}
            onClick={() => setActiveModal('roi')}
            className="p-6 rounded-2xl bg-slate-900 flex flex-col justify-between text-white cursor-pointer relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Rocket size={72} />
            </div>
            <div className="flex justify-between items-start relative z-10">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Aylık ROI</span>
              <HelpCircle size={14} className="text-slate-500" />
            </div>
            <div className="flex items-center justify-between relative z-10 mt-4">
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                %{simulation.roiPercentage?.toFixed(1) || '0.0'}
              </p>
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Info Popups */}
      <AnimatePresence>
        {activeModal && explanations[activeModal] && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-xl h-fit max-h-[90vh] overflow-y-auto bg-white border border-slate-200/70 rounded-2xl shadow-xl z-[101]"
            >
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      {(() => {
                        const Icon = explanations[activeModal].icon;
                        return <Icon size={20} />;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-slate-900">{explanations[activeModal].title}</h3>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-0.5">Matematiksel Projeksiyon</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Current Value Display */}
                  <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-200/70 text-center">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Simülasyon Değeri</p>
                    <p className="text-4xl font-semibold text-slate-900 tracking-tight tabular-nums">
                      {explanations[activeModal].math}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/70">
                      <div className="mt-0.5"><HelpCircle size={16} className="text-blue-600" /></div>
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Basit Anlatım</p>
                        <p className="text-sm text-slate-700 leading-relaxed">&ldquo;{explanations[activeModal].text}&rdquo;</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/70">
                      <div className="mt-0.5"><Binary size={16} className="text-blue-600" /></div>
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Matematiksel Gerçeklik</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{explanations[activeModal].details}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200/70">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Calculator size={12} /> Hesaplama Formülü
                      </p>
                      <code className="text-xs font-medium text-slate-700 tabular-nums">{explanations[activeModal].formula}</code>
                    </div>

                    {/* Breakdown Implementation */}
                    {explanations[activeModal].breakdown && (
                      <div className="p-5 rounded-2xl bg-white border border-slate-200/70 space-y-3">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest text-center border-b border-slate-200/70 pb-3">Stratejik Kalem Kırılımı</p>
                        <div className="space-y-2.5">
                          {explanations[activeModal].breakdown?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className="text-slate-500">{item.label}</span>
                              <span className={cn("font-medium tabular-nums", item.color)}>{item.value}</span>
                            </div>
                          ))}
                        </div>

                        {/* March Exception Notice */}
                        {activeModal === 'cashflow' && (
                          <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200/70 text-xs font-medium text-blue-600 text-center">
                            Mart 2026 için ciro payı muafiyeti uygulanmıştır.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors"
                >
                  Analizi tamamla
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
