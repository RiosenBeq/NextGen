import { FinanceCalculator } from '@/lib/calculations';
import { kabinRapor, CabinData } from '@/lib/kabinRapor';
import { FINANCIAL_CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function FinansalTablo() {
  let cabins: CabinData[] = [];
  try {
    cabins = await kabinRapor.getCabins();
  } catch (error) {
    console.error("Finansal veriler için kabin bilgisi alınamadı:", error);
  }

  const summary = FinanceCalculator.summarizeKabinPerformance(cabins);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Finansal <span className="text-blue-600">Durum Özeti</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Excel tablosundaki hesaplamalar ve KabinRapor canlı verileriyle harmanlanmış mali tablo.
          </p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-sm font-bold text-gray-700">Canlı Veri Bağlantısı</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Aylık Sabit Gider</p>
          <p className="text-3xl font-black text-slate-900">₺{summary.fixedCosts.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-gray-400 mt-2">Kira(KDVli) + Aidat + Personel</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Net Gelir / Oturum</p>
          <p className="text-3xl font-black text-emerald-600">₺{Math.round(summary.netRevenuePerSession).toLocaleString('tr-TR')}</p>
          <p className="text-xs text-gray-400 mt-2">Tüm kesintiler sonrası</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Aylık Başa Baş</p>
          <p className="text-3xl font-black text-blue-600">{summary.breakEvenSessionsPerMonth} <span className="text-sm font-bold">Oturum</span></p>
          <p className="text-xs text-gray-400 mt-2">Gelir = Gider noktası</p>
        </div>
        <div className={`p-8 rounded-[2rem] border shadow-sm transition-shadow ${summary.isProfitable ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Aylık Tahmini Kâr</p>
          <p className={`text-3xl font-black ${summary.isProfitable ? 'text-emerald-700' : 'text-red-700'}`}>
            ₺{Math.round(summary.netProfit).toLocaleString('tr-TR')}
          </p>
          <p className="text-xs text-gray-500 mt-2">Vergi ve giderler sonrası</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detaylı Gider Tablosu */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-6">Aylık Sabit Giderler</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-600">Zafer Plaza Kira (KDV Dahil)</span>
                <span className="text-[10px] text-gray-400 font-medium">Birim: ₺{FINANCIAL_CONFIG.SABIT_MALIYETLER.ZAFER_PLAZA.KIRA.toLocaleString()} + %20 KDV</span>
              </div>
              <span className="font-black text-slate-900">₺{(FINANCIAL_CONFIG.SABIT_MALIYETLER.ZAFER_PLAZA.KIRA * 1.2).toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <span className="text-sm font-bold text-gray-600">Zafer Plaza Aidat</span>
              <span className="font-black text-slate-900">₺{FINANCIAL_CONFIG.SABIT_MALIYETLER.ZAFER_PLAZA.AIDAT.toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-600">Mavibahçe Kira (KDV Dahil)</span>
                <span className="text-[10px] text-gray-400 font-medium">Birim: ₺{FINANCIAL_CONFIG.SABIT_MALIYETLER.MAVIBAHCE.KIRA.toLocaleString()} + %20 KDV</span>
              </div>
              <span className="font-black text-slate-900">₺{(FINANCIAL_CONFIG.SABIT_MALIYETLER.MAVIBAHCE.KIRA * 1.2).toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <span className="text-sm font-bold text-gray-600">Mavibahçe Aidat</span>
              <span className="font-black text-slate-900">₺{FINANCIAL_CONFIG.SABIT_MALIYETLER.MAVIBAHCE.AIDAT.toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between items-center p-4 border-t-2 border-dashed border-gray-100 pt-6 mt-6">
              <span className="text-base font-black text-slate-900">TOPLAM SABİT</span>
              <span className="text-lg font-black text-blue-600">₺{summary.fixedCosts.toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </div>

        {/* Kar/Zarar Senaryosu */}
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <h3 className="text-xl font-black mb-6">İstatistiki Başabaş ve Ciro Payı Analizi</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Aylık Toplam Oturum</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tahmini Brüt Ciro</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ciro Payı Gideri</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Net Kâr (Vergi Sonrası)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[200, 300, 400, 500, 600, 700].map((sessions) => {
                  const gross = sessions * 350; // Ortalama 350 TL seans ücreti
                  
                  // Basit eşik kontrolü (Toplam ciro üzerinden)
                  const totalThreshold = FINANCIAL_CONFIG.SABIT_MALIYETLER.ZAFER_PLAZA.CIRO_ESIK + FINANCIAL_CONFIG.SABIT_MALIYETLER.MAVIBAHCE.CIRO_ESIK;
                  const ciroPayi = gross > totalThreshold ? (gross - totalThreshold) * 0.15 : 0;
                  
                  const netRevenue = sessions * 240; 
                  const profit = (netRevenue - summary.fixedCosts - ciroPayi) * 0.80; // %20 vergi sonrası
                  
                  return (
                    <tr key={sessions} className="group/row hover:bg-white/5 transition-colors">
                      <td className="py-4 font-black">{sessions} Oturum</td>
                      <td className="py-4 text-slate-400">₺{gross.toLocaleString('tr-TR')}</td>
                      <td className="py-4 text-red-400 font-bold">₺{ciroPayi.toLocaleString('tr-TR')}</td>
                      <td className={`py-4 font-black ${profit > 0 ? 'text-emerald-400' : 'text-red-600'}`}>
                        ₺{Math.round(profit).toLocaleString('tr-TR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-8 text-xs text-slate-500 italic">
            * Hesaplamalar %15 komisyon ve %20 KDV düşüldükten sonraki net gelir üzerinden yapılmıştır.
          </p>
        </div>
      </div>
    </div>
  );
}
