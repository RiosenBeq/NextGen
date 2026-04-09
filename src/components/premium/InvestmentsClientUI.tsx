'use client';
import { useRouter } from 'next/navigation';

import React, { useState } from 'react';
import { 
  Briefcase, 
  PiggyBank, 
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  BarChart3, 
  ChevronRight,
  Download,
  Info,
  Activity,
  Box,
  Globe,
  MoreVertical,
  History,
  Filter as FilterIcon,
  ArrowRight,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { InvestmentForm } from '@/features/ledger/components/InvestmentForm';
import { PremiumModal, PremiumDrawer } from './PremiumModal';
import { deleteInvestment } from '@/features/ledger/actions';
import { Edit2, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/useToast';

interface InvestmentsClientProps {
  investments: any[];
  locations: any[];
  total: number;
  count: number;
}

export default function InvestmentsClientUI({ investments, locations, total, count }: InvestmentsClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [editingInvestment, setEditingInvestment] = useState<any>(null);
  const [filterLocation, setFilterLocation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (val: number, currency: string = 'TL') => 
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(val);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu yatırım kaydını kalıcı olarak silmek istediğinize emin misiniz?')) return;
    setIsLoading(true);
    try {
      const res = await deleteInvestment(id);
      if (!res.success) toast.error(res.error);
      else router.refresh();
    } catch (err) {
      toast.error('Silme sırasında hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (inv: any) => {
    setEditingInvestment(inv);
    setShowForm(true);
  };

  const filtered = investments.filter(inv => {
    if (filterLocation !== 'all' && inv.locationId !== filterLocation) return false;
    if (searchQuery && !inv.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* 1. HEADER SECTION */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-slate-100">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full border border-emerald-100 bg-emerald-50/50">
            <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
              CAPITAL EXPENDITURE (CAPEX)
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase flex items-center gap-4">
            <Briefcase className="w-10 h-10 text-slate-300" />
            Yatırım & Demirbaş
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
            Sabit yatırım kalemlerini, yeni nesil kabin alımlarını ve <span className="font-bold text-slate-800 italic underline underline-offset-4 decoration-emerald-200">ROI (Geri Dönüş)</span> sürelerini stratejik olarak yönetin.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
           {/* Mini Stats Card */}
           <div className="flex gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-3xl min-w-[200px] shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <History size={12} /> Amorti Hızı
                 </p>
                 <p className="text-2xl font-black text-slate-900 tabular-nums italic tracking-tighter">Yıllık %12.5</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-3xl min-w-[220px] shadow-xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
                    <PiggyBank size={40} className="text-white" />
                 </div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 relative z-10">Toplam Portföy</p>
                 <p className="text-2xl font-black text-white tabular-nums italic tracking-tighter relative z-10">{formatCurrency(total)}</p>
              </div>
           </div>
           
           <button 
             onClick={() => { setEditingInvestment(null); setShowForm(true); }}
             className="px-6 py-5 bg-emerald-600 text-white rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 group"
           >
              <div className="p-1 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                <Plus size={18} strokeWidth={3} />
              </div>
              Yeni Yatırım Kaydet
           </button>
        </div>
      </header>

      {/* 2. STATS ROW */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <StatCard 
            icon={<Box className="text-indigo-500" />} 
            label="Kayıtlı Demirbaş" 
            value={`${count} Ünite`} 
            sub="Global Operasyonel Envanter" 
         />
         <StatCard 
            icon={<Globe className="text-blue-500" />} 
            label="Aktif Lokasyon" 
            value={`${locations.length} Şube`} 
            sub="Yatırımın Dağıldığı Noktalar" 
         />
         <StatCard 
            icon={<TrendingUp className="text-emerald-500" />} 
            label="Amortisman Rejimi" 
            value="Hızlandırılmış" 
            sub="Vergi Odaklı Muhasebe" 
         />
      </section>

      {/* 3. DATA TABLE SECTION */}
      <section className="space-y-8">
         {/* Filters */}
         <div className="p-1.5 bg-slate-100 border border-slate-200 rounded-[28px] flex flex-col md:flex-row md:items-center gap-3 backdrop-blur-sm shadow-sm">
            <div className="relative flex-1 group">
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <Search size={18} />
               </div>
               <input 
                  type="text" 
                  placeholder="Envanter veya demirbaş ara..." 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-[22px] text-xs font-bold uppercase tracking-widest text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-[22px]">
               <FilterButton active={filterLocation === 'all'} onClick={() => setFilterLocation('all')} label="TÜMÜ" />
               {locations.map(loc => (
                  <FilterButton 
                    key={loc.id} 
                    active={filterLocation === loc.id} 
                    onClick={() => setFilterLocation(loc.id)} 
                    label={loc.name} 
                  />
               ))}
            </div>
         </div>

         {/* Table */}
         <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Yatırım Kalemi / Demirbaş</th>
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Şube</th>
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Tutar</th>
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Tarih</th>
                     <th className="px-8 py-5"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {filtered.map((inv, idx) => (
                     <tr 
                        key={inv.id || idx} 
                        className="group hover:bg-slate-50/30 transition-all cursor-pointer"
                        onClick={() => { setSelectedInvestment(inv); setIsDrawerOpen(true); }}
                     >
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:bg-white border border-transparent group-hover:border-slate-200 group-hover:shadow-sm transition-all">
                                 <Box size={20} />
                              </div>
                              <div className="flex flex-col gap-1">
                                 <span className="text-[13px] font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase italic tracking-tighter decoration-slate-200 underline decoration-1 underline-offset-4">{inv.description}</span>
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{inv.notes || 'EK NOT BULUNMAMAKTA'}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                           <span className="inline-block px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-600 uppercase tracking-widest">{inv.location?.name || 'GENEL'}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex flex-col items-end">
                              <span className="text-sm font-black text-slate-900 tabular-nums italic tracking-tighter">
                                 {formatCurrency(inv.amount || 0, inv.currency)}
                              </span>
                              <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">YATIRIM BEDELİ</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                           <div className="inline-flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 text-slate-400">
                              <History size={12} />
                              <span className="text-[9px] font-bold italic">{new Date(inv.createdAt).toLocaleDateString('tr-TR')}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEdit(inv); }}
                                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all hover:scale-105 active:scale-95 shadow-sm"
                              >
                                 <Edit2 size={16} strokeWidth={2.5} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(inv.id); }}
                                disabled={isLoading}
                                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all hover:scale-105 active:scale-95 shadow-sm"
                              >
                                 <Trash2 size={16} strokeWidth={2.5} />
                              </button>
                              <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center text-white shadow-lg shadow-slate-200 ml-2">
                                 <ArrowRight size={14} strokeWidth={3} />
                              </div>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </section>

      {/* 4. MODALS & DRAWERS */}
      <PremiumModal 
        isOpen={showForm} 
        onClose={() => { setShowForm(false); setEditingInvestment(null); }} 
        title={editingInvestment ? "Yatırım Kaydı Düzenle" : "Yatırım (CAPEX) Kaydı Tanımla"}
        maxWidth="max-w-2xl"
      >
        <InvestmentForm 
          locations={locations} 
          initialData={editingInvestment}
          onClose={() => { setShowForm(false); setEditingInvestment(null); router.refresh(); }} 
        />
      </PremiumModal>

      <PremiumDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title="Yatırım & Demirbaş Analizi"
      >
        {selectedInvestment && (
           <div className="space-y-12 py-6">
              <div className="p-8 rounded-[40px] bg-emerald-600 text-white space-y-6 relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
                    <Briefcase size={120} />
                 </div>
                 <div className="relative space-y-1">
                    <p className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.3em]">Yatırım Portföyü</p>
                    <p className="text-4xl font-black italic tracking-tighter uppercase leading-none">{selectedInvestment.description}</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-8 pt-4 border-t border-white/10">
                    <div className="space-y-1">
                       <p className="text-[9px] font-bold text-emerald-200 uppercase tracking-widest">Total Capex</p>
                       <p className="text-2xl font-black italic tracking-tight">{formatCurrency(selectedInvestment.amount, selectedInvestment.currency)}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[9px] font-bold text-emerald-200 uppercase tracking-widest">Lokasyon</p>
                       <p className="text-2xl font-black italic tracking-tight uppercase">{selectedInvestment.location?.name || 'GENEL'}</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-8 px-2">
                 <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic border-b border-slate-50 pb-2 mb-4">Geri Dönüş & Durum Tarihçesi</h4>
                    <div className="grid grid-cols-2 gap-8">
                       <DetailRow label="Kayıt Tarihi" value={new Date(selectedInvestment.createdAt).toLocaleString('tr-TR')} />
                       <DetailRow label="Demirbaş ID" value={`#CAPEX-${selectedInvestment.id.slice(0, 8).toUpperCase()}`} />
                    </div>
                 </div>

                 {selectedInvestment.notes && (
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 italic font-medium text-slate-600 text-sm leading-relaxed">
                       "{selectedInvestment.notes}"
                    </div>
                 )}
              </div>

              <div className="pt-8 px-2 border-t border-slate-50">
                 <button 
                   onClick={() => setIsDrawerOpen(false)}
                   className="w-full py-5 bg-slate-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all hover:scale-[1.02]"
                 >
                   Yatırım Detaylarını Kapat
                 </button>
              </div>
           </div>
        )}
      </PremiumDrawer>

    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
  return (
    <div className="p-8 rounded-[40px] bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
       <div className="w-14 h-14 rounded-[20px] bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
       <p className="text-3xl font-black text-slate-900 italic tracking-tighter mb-2">{value}</p>
       <p className="text-[10px] font-medium text-slate-400 italic tracking-wide">{sub}</p>
    </div>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
       onClick={onClick}
       className={cn(
          "px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.1em] transition-all",
          active 
             ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
             : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
       )}
    >
       {label}
    </button>
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
