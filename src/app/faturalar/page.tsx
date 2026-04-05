import { createClient } from '@/utils/supabase/server';
import { Receipt, FileText, Download, Calendar, MapPin, Search, Grid, Eye } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Faturalar ve Belgeler — NextGenBox',
};

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const supabase = await createClient();

  // Yalnızca belge eklenmiş giderleri getiriyoruz
  const { data: expenses } = await supabase
    .from('Expense')
    .select('*, location:Location(name)')
    .not('attachmentUrl', 'is', null)
    .order('createdAt', { ascending: false });

  const invoices = expenses || [];

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              Belge Arşivi
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Receipt className="w-8 h-8 text-blue-600" />
            E-Faturalar ve Dekontlar
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Sisteme yüklenen tüm gider evrakları, PDF faturalar ve ödeme dekontları.
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex items-center bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-slate-400">Belge Ara...</span>
          </div>
          <div className="flex bg-white border border-slate-200 rounded-xl p-1">
             <button className="px-3 py-1.5 bg-slate-100 rounded-lg text-slate-700"><Grid size={16} /></button>
          </div>
        </div>
      </header>

      {/* Grid of Documents */}
      <section>
         {invoices.length === 0 ? (
           <div className="premium-card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                 <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">Henüz Belge Bulunmuyor</h3>
              <p className="text-sm text-slate-500 mt-1">Gider eklerken yüklediğiniz dekont veya faturalar burada listelenecektir.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {invoices.map((inv: any) => (
                <div key={inv.id} className="premium-card group hover:border-blue-300 transition-all duration-300 overflow-hidden flex flex-col">
                   <div className="h-40 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative group-hover:bg-blue-50/50 transition-colors">
                      {/* Placeholder for Document type logic (image or PDF icon) */}
                      {inv.attachmentUrl?.toLowerCase().includes('.pdf') ? (
                        <div className="flex flex-col items-center gap-3">
                           <FileText className="w-16 h-16 text-blue-400/40 group-hover:text-blue-500/60 transition-colors" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PDF DOKÜMAN</span>
                        </div>
                      ) : (
                        <div className="w-full h-full relative">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img src={inv.attachmentUrl} alt="Belge" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                     )}
                     
                     <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={inv.attachmentUrl} target="_blank" className="p-2 bg-white/90 backdrop-blur rounded-lg text-slate-700 hover:text-blue-600 shadow-sm transition-colors">
                           <Eye size={16} />
                        </Link>
                        <Link href={inv.attachmentUrl} download target="_blank" className="p-2 bg-white/90 backdrop-blur rounded-lg text-slate-700 hover:text-blue-600 shadow-sm transition-colors">
                           <Download size={16} />
                        </Link>
                     </div>
                     
                     {/* Badge for officially billed vs receipt */}
                     <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 rounded bg-white/90 backdrop-blur shadow-sm text-[9px] font-black uppercase text-slate-700 border border-slate-200">
                           {inv.isOfficial ? "RESMİ FATURA" : "DEKONT / FİŞ"}
                        </span>
                     </div>
                   </div>
                   
                   <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1 flex-1">{inv.description}</h4>
                        <span className="font-black text-rose-600 text-sm shrink-0 ml-2">₺{inv.amountWithVat?.toLocaleString('tr-TR')}</span>
                      </div>
                      
                      <div className="space-y-1 mt-auto pt-4">
                         <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                            <MapPin size={12} className="text-slate-400" />
                            {inv.location?.name || 'Genel Merkez'}
                         </div>
                         <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                            <Calendar size={12} className="text-slate-400" />
                            {new Date(inv.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                         </div>
                         <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Ödeyen</span>
                            <span className="text-[10px] uppercase font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{inv.paidBy}</span>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
         )}
      </section>

    </div>
  );
}
