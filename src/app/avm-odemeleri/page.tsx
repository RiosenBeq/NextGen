import { getActiveLocations } from "@/features/ledger/actions";
import AvmPaymentForm from "./AvmPaymentForm";
import { Building2, Info } from "lucide-react";

export const metadata = { title: "AVM Ödemeleri — NextGenBox" };
export const dynamic = "force-dynamic";

export default async function AvmOdemeleriPage() {
  const locations = await getActiveLocations();

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              Tahsilat / Ödeme Girişi
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-600" />
            AVM Kira & Ciro Payı
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Mavibahçe, Zafer Plaza gibi tüm lokasyonların AVM kira, ortak alan aidatı ve ciro payı masraflarını buradan girerek merkezi Giderler sistemine eşzamanlı kaydedin.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
            <AvmPaymentForm locations={locations} />
         </div>
         
         <div className="space-y-6">
            <div className="premium-card p-6 border border-slate-100 bg-indigo-50/50">
               <h3 className="text-[11px] font-black uppercase text-indigo-800 tracking-widest mb-3 flex items-center gap-2">
                 <Info size={14} /> Otomatik Eşleşme
               </h3>
               <p className="text-sm text-slate-600 leading-relaxed font-medium">
                 Buradan girdiğiniz tüm ödemeler otomatik olarak genel "Giderler" ve "Aylık Özet" tablolarına yansır.
                 <br/><br/>
                 Türü "Düzenli" (RECURRING) olarak işaretler ve seçtiğiniz hesap türüne (Örn: Ortak Hesap veya Okan hesapları) göre Cari (Splitwise) sayfasına da borç/alacak olarak düşer.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
