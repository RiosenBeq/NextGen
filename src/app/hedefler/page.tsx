import { createClient } from '@/utils/supabase/server';
import { Target, Trophy, Flame, Zap, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLocationInsights } from '@/features/ledger/actions';

export const metadata = { title: 'Hedefler ve Gamification — NextGenBox' };
export const dynamic = 'force-dynamic';

export default async function TargetsPage() {
  const insights = await getLocationInsights();

  const totalInvestment = insights.reduce((acc, loc) => acc + loc.totalInvestment, 0);
  const totalNetCash = insights.reduce((acc, loc) => acc + loc.cumulativeNetCash, 0);

  // Amortization tracking (Payback)
  const paybackProgress = totalInvestment > 0 ? (totalNetCash / totalInvestment) * 100 : 0;
  const isPaybackComplete = paybackProgress >= 100;
  const paybackPercentage = Math.max(0, Math.min(100, paybackProgress));

  // Monthly Goal Tracking Simulation (Assuming a generic target of 100,000 TL per month for the fleet)
  const monthlyTarget = 100000;
  // Let's get "current month" net cash
  const supabase = await createClient();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  
  // Calculate current month's performances approximate cash
  // To keep it light, we can use the insights logic or do a simple fetch if needed, 
  // but to prevent another huge iteration, we will use a demo calculation or fetch performances of this month.
  const { data: currentPerformances } = await supabase.from('MonthlyPerformance').select('*').like('month', `${currentMonthStr}%`);
  // For the sake of gamification, let's just create a dynamic fun metric if data isn't fully robust, 
  // or use the actual net cash if we can. Since we don't have full expense context easily mapped here without importing heavy logic,
  // we'll fetch just gross revenue of this month as a "Ciro Hedefi" (Revenue Target) instead of Net Profit.
  
  const currentGross = (currentPerformances || []).reduce((acc: number, p: any) => acc + (p.sessionCount * 300), 0);
  const monthlyRevenueTarget = 150000; // 150k TL Ciro Hedefi
  const monthlyProgress = Math.max(0, Math.min(100, (currentGross / monthlyRevenueTarget) * 100));
  
  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 flex items-center gap-1">
              <Trophy size={12} /> Oyunlaştırma
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Target className="w-8 h-8 text-orange-500" />
            Hedefler & Projeksiyon
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Büyük yatırımların geri dönüş sürelerini ve aylık hedeflerini motive edici şekilde takip edin.</p>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PAYBACK TARGET */}
        <div className="premium-card p-8 border-2 border-emerald-100 bg-gradient-to-b from-white to-emerald-50/30">
          <div className="flex justify-between items-start mb-8">
             <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                   <Flame className="text-emerald-500" />
                   Ana Sermaye Amortisi
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">Toplam ₺{totalInvestment.toLocaleString('tr-TR')} yatırımın geri dönüş oranı.</p>
             </div>
             {isPaybackComplete ? (
               <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <CheckCircle2 size={24} />
               </div>
             ) : (
               <div className="text-right">
                  <span className="text-3xl font-black text-emerald-600 tabular-nums">%{paybackPercentage.toFixed(1)}</span>
               </div>
             )}
          </div>

          <div className="space-y-3">
             <div className="h-6 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 ease-out relative"
                  style={{ width: `${paybackPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }} />
                </div>
             </div>
             
             <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>0 ₺</span>
                <span>Yatırım: ₺{totalInvestment.toLocaleString('tr-TR')}</span>
             </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-emerald-100/50 flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 font-black shadow-sm">
                !
             </div>
             <div>
               <p className="text-xs font-bold text-slate-700">Tahmini Kalan Yol</p>
               <p className="text-sm font-black text-emerald-700">₺{Math.max(0, totalInvestment - totalNetCash).toLocaleString('tr-TR')} Net Kâr Kaldı</p>
             </div>
          </div>
        </div>

        {/* MONTHLY REVENUE TARGET */}
        <div className="premium-card p-8 border border-slate-100">
          <div className="flex justify-between items-start mb-8">
             <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                   <Zap className="text-blue-500" />
                   Bu Ayki Ciro Hedefi
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">{new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} dönemi için hedeflenen brüt satış hacmi.</p>
             </div>
             <div className="text-right">
                <span className="text-3xl font-black text-blue-600 tabular-nums">%{monthlyProgress.toFixed(1)}</span>
             </div>
          </div>

          <div className="space-y-3">
             <div className="h-6 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${Math.max(5, monthlyProgress)}%` }} // min 5% so we see something
                >
                   {monthlyProgress > 15 && <span className="text-[10px] text-white font-bold opacity-80">₺{currentGross.toLocaleString('tr-TR')}</span>}
                </div>
             </div>
             
             <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>0 ₺</span>
                <span>Hedef: ₺{monthlyRevenueTarget.toLocaleString('tr-TR')}</span>
             </div>
          </div>

          {/* Stepper milestones */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between relative">
             <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -z-10 -translate-y-1/2" />
             {[
               { p: 25, label: "Isınma" },
               { p: 50, label: "Yarı Yol" },
               { p: 75, label: "İyi Ritit" },
               { p: 100, label: "Kusursuz!" }
             ].map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                   <div className={cn(
                      "w-6 h-6 rounded-full border-4 flex items-center justify-center transition-colors",
                      monthlyProgress >= step.p ? "border-blue-500 bg-white" : "border-slate-200 bg-white"
                   )}>
                      {monthlyProgress >= step.p && <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />}
                   </div>
                   <span className={cn(
                     "text-[9px] uppercase font-black tracking-widest",
                     monthlyProgress >= step.p ? "text-blue-600" : "text-slate-400"
                   )}>{step.label}</span>
                </div>
             ))}
          </div>

        </div>
      </section>

    </div>
  );
}
