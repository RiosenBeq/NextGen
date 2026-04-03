import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { TrendingUp, CreditCard, Wallet, Activity, ArrowUpRight, ArrowDownRight, Percent } from 'lucide-react';
import * as motion from "framer-motion/client";

export const metadata = {
  title: 'Özet (Dashboard) - NextGenBox',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: performances } = await supabase
    .from('MonthlyPerformance')
    .select('*, location:Location(*)')
    .order('month', { ascending: false });

  const DEFAULT_PARAMS = {
    sessionPrice: 300,
    kdvRate: 20,
    totalCommissionRate: 4,
    alpShareRate: 50,
    ngbShareRate: 50,
  };

  let totalRevenue = 0;
  let totalNetCash = 0;
  let totalCommission = 0;
  let recentSessions = 0;

  if (performances) {
    for (const perf of performances) {
      const calc = calculateMonthlyCashFlow(
        perf.sessionCount,
        perf.extraExpenseAmount,
        {
          ...DEFAULT_PARAMS,
          fixedRent: perf.location.fixedRent,
          duesAmount: perf.location.duesAmount,
          rentKdvRate: perf.location.rentVatRate,
        }
      );
      totalRevenue += calc.grossRevenue;
      totalNetCash += calc.netCash;
      totalCommission += calc.totalCommission;
      recentSessions += perf.sessionCount;
    }
  }

  const kpis = [
    { 
      label: "KÜMÜLATİF BRÜT CİRO", 
      value: `₺${totalRevenue.toLocaleString('tr-TR')}`, 
      icon: TrendingUp, 
      color: "text-emerald-400", 
      bg: "bg-emerald-500/10",
      trend: "+12.5%",
      positive: true
    },
    { 
      label: "KOMİSYON / GİDERLER", 
      value: `₺${totalCommission.toLocaleString('tr-TR')}`, 
      icon: CreditCard, 
      color: "text-rose-400", 
      bg: "bg-rose-500/10",
      trend: "-2.1%",
      positive: false
    },
    { 
      label: "KÜMÜLATİF NET NAKİT", 
      value: `₺${totalNetCash.toLocaleString('tr-TR')}`, 
      icon: Wallet, 
      color: "text-cyan-400", 
      bg: "bg-cyan-500/10",
      trend: "+8.4%",
      positive: true
    },
    { 
      label: "TOPLAM OTURUM", 
      value: recentSessions.toLocaleString('tr-TR'), 
      icon: Activity, 
      color: "text-indigo-400", 
      bg: "bg-indigo-500/10",
      trend: "+5.2%",
      positive: true
    },
  ];

  return (
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <span className="w-8 h-[2px] bg-emerald-500 rounded-full"></span>
            <span className="text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase">
              Financial Overview
            </span>
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter heading-elite leading-tight">
            YTD Operasyonel<br/>Performans
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-6 py-3 rounded-2xl glass border border-white/5 flex items-center gap-4 shadow-xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Güncel Durum</span>
              <span className="text-sm font-black text-emerald-400">AKTİF VERİ AKIŞI</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="premium-card p-8 group relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500 pointer-events-none">
              <kpi.icon size={160} strokeWidth={1} />
            </div>

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className={`p-4 rounded-2xl ${kpi.bg}`}>
                <kpi.icon className={`w-7 h-7 ${kpi.color}`} />
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${
                kpi.positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                {kpi.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.trend}
              </div>
            </div>

            <div className="relative z-10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">{kpi.label}</p>
              <p className="text-3xl font-black tracking-tight text-white group-hover:scale-[1.02] transition-transform origin-left">
                {kpi.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-8 premium-card p-10 min-h-[400px] flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tighter mb-1">Gelir Dağılım Analizi</h3>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest tracking-widest">Aylık Kümülatif Trendler</p>
            </div>
            <button className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
              DETAYLI RAPOR
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center border-y border-white/[0.03] my-8 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent pointer-events-none"></div>
            <p className="text-zinc-600 font-bold text-sm tracking-widest uppercase animate-pulse">Grafik Verisi Hazırlanıyor</p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-500 uppercase">Verimlilik</p>
              <p className="text-xl font-bold text-emerald-400 font-mono">82%</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-500 uppercase">Büyüme</p>
              <p className="text-xl font-bold text-cyan-400 font-mono">+14.2%</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-500 uppercase">Kapasite</p>
              <p className="text-xl font-bold text-indigo-400 font-mono">1,240</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-4 space-y-8"
        >
          <div className="premium-card p-10 bg-gradient-to-br from-zinc-900 to-black overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent)] pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
                <Percent className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tighter mb-4">Pay Alokasyonu</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <span>ALP SHARE</span>
                    <span className="text-white">50%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "50%" }}
                      transition={{ duration: 1, delay: 0.8 }}
                      className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    ></motion.div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <span>NGB REVENUE</span>
                    <span className="text-white">50%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "50%" }}
                      transition={{ duration: 1, delay: 1 }}
                      className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    ></motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="premium-card p-10 flex flex-col justify-center items-center text-center">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Sistem Durumu</p>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-800"></div>
                ))}
              </div>
              <span className="text-xs font-bold text-white tracking-tight underline cursor-pointer hover:text-emerald-400 transition-colors">Yöneticileri Görüntüle</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
