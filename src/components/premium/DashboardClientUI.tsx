'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  ChevronRight, 
  Wallet, 
  Receipt,
  FileText,
  TrendingUp,
  TrendingDown,
  BrainCircuit,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  Calendar,
  PieChart,
  Activity,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PremiumModal, PremiumDrawer } from './PremiumModal';
import ExpenseForm from '@/features/ledger/components/ExpenseForm';
import { PremiumFlipCard } from './PremiumFlipCard';
import AIFinancialAnalyst from './AIFinancialAnalyst';

interface DashboardProps {
  stats: {
    revenue: number;
    expense: number;
    profit: number;
    roi: number;
    sessions: number;
    monthlyGrowth: number;
  };
  recentExpenses: any[];
  locations: any[];
  categories: any[];
  chartData?: { month: string, revenue: number, profit: number }[];
}

export default function DashboardClientUI({ stats, recentExpenses, locations, categories, chartData = [] }: DashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* 1. TOP SECTION: SUMMAY CARDS (3D FLIP STYLE) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Revenue Card */}
        <PremiumFlipCard 
           title="Brüt Ciro" 
           value={formatCurrency(stats.revenue)} 
           subValue="Aylık Toplam Hacim"
           trend={{ value: "+12.4%", isPositive: true }}
           color="emerald"
           icon={<TrendingUp className="w-5 h-5" />}
           backContent={
             <div className="space-y-4">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic text-center">HAFTALIK VERİMLİLİK</p>
                   <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Haftalık Ort.</span>
                      <span className="text-sm font-black italic text-emerald-400">{formatCurrency(stats.revenue / 4)}</span>
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500">
                      <span>Hedef %85</span>
                      <span>Büyüme Endeksi</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                   </div>
                </div>
             </div>
           }
        />

        {/* Expense Card */}
        <PremiumFlipCard 
           title="Operasyonel Gider" 
           value={formatCurrency(stats.expense)} 
           subValue="Yönetilebilir Maliyet"
           trend={{ value: "-2.1%", isPositive: false }}
           color="rose"
           icon={<TrendingDown className="w-5 h-5" />}
           backContent={
             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic text-center">GİDER KIRILIMI</p>
                <div className="grid grid-cols-2 gap-2">
                   <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sabit</p>
                      <p className="text-[11px] font-black text-white italic tracking-tight">%60</p>
                   </div>
                   <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Değişken</p>
                      <p className="text-[11px] font-black text-rose-400 italic tracking-tight">%40</p>
                   </div>
                </div>
                <p className="text-[9px] text-slate-400 font-medium italic text-center">Gider kalemleri projeksiyona göre %12 daha düşük seyrediyor.</p>
             </div>
           }
        />

        {/* Profit Card */}
        <PremiumFlipCard 
           title="Net Kâr (P&L)" 
           value={formatCurrency(stats.profit)} 
           subValue="Net İşletme Kazancı"
           trend={{ value: "+8.1%", isPositive: true }}
           color="blue"
           icon={<Wallet className="w-5 h-5" />}
           backContent={
             <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic text-center">KÂR PAYI DAĞILIMI</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                   <div className="flex justify-between border-b border-white/5 py-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Okan</span>
                      <span className="text-[10px] font-black text-white italic">%25</span>
                   </div>
                   <div className="flex justify-between border-b border-white/5 py-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Talha</span>
                      <span className="text-[10px] font-black text-white italic">%25</span>
                   </div>
                   <div className="flex justify-between border-b border-white/5 py-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Furkan</span>
                      <span className="text-[10px] font-black text-white italic">%25</span>
                   </div>
                   <div className="flex justify-between border-b border-white/5 py-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Alp</span>
                      <span className="text-[10px] font-black text-white italic">%25</span>
                   </div>
                </div>
             </div>
           }
        />

        {/* ROI / Performance Card */}
        <PremiumFlipCard 
           title="Verimlilik Skoru" 
           value={`%${stats.roi.toFixed(1)}`} 
           subValue="Yatırım Verimliliği"
           trend={{ value: "+0.4%", isPositive: true }}
           color="amber"
           icon={<Target className="w-5 h-5" />}
           backContent={
             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic text-center">PERFORMANS SKORU</p>
                <div className="grid grid-cols-2 gap-2">
                   <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Oturum</p>
                      <p className="text-sm font-black text-white italic tracking-tight">{stats.sessions}</p>
                   </div>
                   <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Büyüme</p>
                      <p className="text-sm font-black text-emerald-400 italic tracking-tight">+{stats.monthlyGrowth}%</p>
                   </div>
                </div>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] pt-1 text-center">Optimum bölgeye ulaşıldı.</p>
             </div>
           }
        />
      </section>
      
      {/* 1.5 VISUAL ANALYTICS: TREND CHART */}
      <section className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="space-y-1">
               <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest italic">
                  <Activity size={12} className="animate-pulse" />
                  Trend Analizi
               </div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Finansal Dinamikler</h2>
            </div>
            
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Brüt Ciro</span>
               </div>
               <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Net Kâr (P&L)</span>
               </div>
            </div>
         </div>

         <div className="h-[300px] w-full relative">
            <PremiumTrendChart data={chartData} />
         </div>
         
         <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Gerçekleşen aylık kümülatif performans verileri</p>
            <div className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest italic group cursor-pointer">
               Detaylı Raporu Gör
               <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
         </div>
      </section>

      {/* 2. AI FINANCIAL ANALYST (STRATEGIC OVERVIEW) */}
      <section className="mt-6">
          <AIFinancialAnalyst />
      </section>

      {/* 3. RECENT TRANSACTIONS TABLE (VERCEL STYLE) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
           <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                 <Receipt className="w-5 h-5 text-slate-400" />
                 Son Finansal Kayıtlar
              </h2>
              <p className="text-sm text-slate-500 font-medium">Platform genelindeki son 10 harcama verisi.</p>
           </div>
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all hover:scale-[1.02] shadow-lg shadow-slate-200"
              >
                 <Plus size={16} />
                 Yeni Gider
              </button>
           </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Açıklama & Kategori</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Tutar</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Durum</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tarih</th>
                    <th className="px-6 py-4"></th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {recentExpenses.map((exp, idx) => (
                    <tr 
                       key={exp.id || idx} 
                       className="group hover:bg-slate-50/50 transition-all cursor-pointer"
                       onClick={() => { setSelectedExpense(exp); setIsDrawerOpen(true); }}
                    >
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white transition-colors">
                                <FileIcon type={exp.type} />
                             </div>
                             <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight italic underline decoration-slate-200 underline-offset-4 decoration-1">{exp.description}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{exp.location?.name || 'Tümü'}</span>
                                   <span className="w-1 h-1 rounded-full bg-slate-200" />
                                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">{exp.category?.name || 'Genel'}</span>
                                </div>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5 text-right font-mono text-sm tabular-nums font-bold text-slate-900 tracking-tighter">
                          {formatCurrency(exp.amountWithVat)}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <StatusBadge isOfficial={exp.isOfficial} />
                       </td>
                       <td className="px-12 py-5">
                          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                             {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '-'}
                          </span>
                       </td>
                       <td className="px-6 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all shadow-sm">
                             <ChevronRight size={16} />
                          </button>
                       </td>
                    </tr>
                 ))}
                 {recentExpenses.length === 0 && (
                   <tr>
                     <td colSpan={5} className="py-20 text-center text-slate-400 font-medium">Bize ait kayıt bulunmuyor.</td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      </section>

      {/* 3. NEW EXPENSE MODAL */}
      <PremiumModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Yeni Finansal Gider Tanımla"
        maxWidth="max-w-xl"
      >
        <ExpenseForm 
          locations={locations} 
          onClose={() => { setIsModalOpen(false); window.location.reload(); }} 
        />
      </PremiumModal>

      {/* 4. DETAIL DRAWER (SLIDE OVER) */}
      <PremiumDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title="Gider Detayı"
      >
        {selectedExpense && (
          <div className="space-y-10 py-4 animate-in slide-in-from-right-10 duration-500">
             <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Ödeme Tutarı</p>
                <p className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter italic">
                  {formatCurrency(selectedExpense.amountWithVat)}
                </p>
             </div>

             <div className="space-y-6">
                <DetailRow label="Açıklama" value={selectedExpense.description} />
                <DetailRow label="Ödeme Tipi" value={selectedExpense.type === 'RECURRING' ? 'Mükerrer (Aylık)' : 'Tek Seferlik'} />
                <DetailRow label="Vergi Durumu" value={selectedExpense.isOfficial ? 'Resmi (Fatura Var)' : 'Gayri Resmi (Elden / Nakit)'} />
                <DetailRow label="KDV Dahil Mi?" value={`%${selectedExpense.vatRate || 0} Oranında Dahil`} />
                <DetailRow label="Lokasyon" value={selectedExpense.location?.name || 'Tümü'} />
                <DetailRow label="Kategori" value={selectedExpense.category?.name || 'Genel'} />
                <DetailRow label="Kayıt Tarihi" value={new Date(selectedExpense.createdAt).toLocaleString('tr-TR')} />
             </div>

             <div className="pt-10 border-t border-slate-50">
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all hover:scale-[1.02]"
                >
                  Pencereyi Kapat
                </button>
             </div>
          </div>
        )}
      </PremiumDrawer>

    </div>
  );
}

/* HELPER COMPONENTS */

function StatCard({ title, value, subtitle, trend, isPositive, icon, highlight = false }: any) {
  return (
    <div className={cn(
      "bg-white border border-slate-200 p-7 rounded-[32px] space-y-4 shadow-sm transition-all hover:shadow-md hover:border-slate-300 group",
      highlight && "ring-1 ring-blue-500/20 border-blue-500/30"
    )}>
      <div className="flex items-center justify-between">
         <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 transition-colors group-hover:bg-white shadow-inner">
            {icon}
         </div>
         <div className={cn(
           "flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight",
           isPositive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
         )}>
           {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
           {trend}
         </div>
      </div>
      <div className="space-y-1">
         <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h4>
         <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter italic">{value}</p>
      </div>
      <p className="text-[10px] text-slate-400 font-medium italic underline decoration-slate-100 underline-offset-4">{subtitle}</p>
    </div>
  );
}

function FileIcon({ type }: { type: string }) {
  if (type === 'RECURRING') return <Calendar className="w-5 h-5 text-indigo-500" />;
  return <TrendingDown className="w-5 h-5 text-slate-400" />;
}

function StatusBadge({ isOfficial }: { isOfficial: boolean }) {
  if (isOfficial) {
     return (
       <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest italic">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Resmi
       </div>
     );
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest italic">
       Gayri Resmi
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-1">
       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
       <p className="text-sm font-bold text-slate-900 tracking-tight leading-relaxed">{value}</p>
    </div>
  );
}

function PremiumTrendChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
         <BarChart3 size={40} strokeWidth={1} />
         <p className="text-[10px] font-black uppercase tracking-widest italic">YETERLİ VERİ TOPLANAMADI</p>
      </div>
    )
  }

  const padding = 40;
  const height = 300;
  const width = 1000; // Refers to SVG coordinate space
  const maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.profit)), 1) * 1.2;

  const points = data.map((d, i) => ({
    x: padding + (i * (width - 2 * padding) / (data.length - 1 || 1)),
    revY: height - padding - (d.revenue / maxVal * (height - 2 * padding)),
    proY: height - padding - (d.profit / maxVal * (height - 2 * padding)),
  }));

  const revPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.revY}`).join(' ');
  const proPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.proY}`).join(' ');
  
  const revArea = revPath + ` L ${points[points.length-1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  const proArea = proPath + ` L ${points[points.length-1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
      {/* Grids */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <line 
          key={i} 
          x1={padding} y1={padding + p * (height - 2 * padding)} 
          x2={width - padding} y2={padding + p * (height - 2 * padding)} 
          stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" 
        />
      ))}

      {/* Areas */}
      <motion.path 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 0.1 }} 
        transition={{ duration: 1 }}
        d={revArea} fill="url(#revGradient)" 
      />
      <motion.path 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 0.2 }} 
        transition={{ duration: 1, delay: 0.2 }}
        d={proArea} fill="url(#proGradient)" 
      />

      {/* Lines */}
      <motion.path 
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} 
        transition={{ duration: 2, ease: "easeInOut" }}
        d={revPath} fill="none" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" 
      />
      <motion.path 
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} 
        transition={{ duration: 2, delay: 0.3, ease: "easeInOut" }}
        d={proPath} fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" 
      />

      {/* Points */}
      {points.map((p, i) => (
        <React.Fragment key={i}>
          <motion.circle 
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.5 + i * 0.1 }}
            cx={p.x} cy={p.revY} r="6" fill="#2563EB" stroke="white" strokeWidth="3" 
            className="drop-shadow-lg"
          />
          <motion.circle 
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.8 + i * 0.1 }}
            cx={p.x} cy={p.proY} r="6" fill="#10B981" stroke="white" strokeWidth="3" 
            className="drop-shadow-lg"
          />
          
          {/* Month Labels */}
          <text 
            x={p.x} y={height - 5} 
            textAnchor="middle" fill="#94A3B8" 
            className="text-[12px] font-black uppercase tracking-tighter italic"
          >
            {data[i].month}
          </text>
        </React.Fragment>
      ))}

      <defs>
        <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="proGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BarChart3(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
  )
}
