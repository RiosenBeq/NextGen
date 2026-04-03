import { createClient } from '@/utils/supabase/server';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';

export const metadata = {
  title: 'Nakit Akış Raporu - NextGenBox',
};

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const supabase = await createClient();

  // Prisma: prisma.monthlyPerformance.findMany({ include: { location: true }, orderBy: { month: 'desc' } })
  const { data: performances } = await supabase
    .from('MonthlyPerformance')
    .select('*, location:Location(*)')
    .order('month', { ascending: false });

  // MVP Mock parameters since SystemParameter isn't fully seeded yet.
  const DEFAULT_PARAMS = {
    sessionPrice: 300,
    kdvRate: 20,
    totalCommissionRate: 4, // 2% + 2%
    alpShareRate: 50,
    ngbShareRate: 50,
  };

  const processedData = (performances || []).map((perf: any) => {
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

    const perfDate = new Date(perf.month);

    return {
      id: perf.id,
      month: perfDate.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }),
      locationName: perf.location.name,
      sessionCount: perf.sessionCount,
      grossRevenue: calc.grossRevenue,
      totalExpense: calc.totalExpense,
      netCash: calc.netCash,
      alpShare: calc.alpShare,
      ngbShare: calc.ngbShare,
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Nakit Akış Raporu</h1>
        <p className="mt-2 text-sm text-gray-600">Aylık net nakit giriş-çıkışları ve partner payı dağılımları.</p>
      </div>

      <div className="bg-white border text-gray-900 border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-64">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-600">
              <tr>
                <th className="px-6 py-4">Ay / Lokasyon</th>
                <th className="px-6 py-4 text-right">Oturum</th>
                <th className="px-6 py-4 text-right">Brüt Gelir</th>
                <th className="px-6 py-4 text-right text-red-600">Giderler</th>
                <th className="px-6 py-4 text-right text-green-700">Net Nakit</th>
                <th className="px-6 py-4 text-right text-blue-700">Alp Payı</th>
                <th className="px-6 py-4 text-right text-purple-700">NextGenBox Payı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {processedData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    Henüz kayıt girilmemiş. Lütfen Performans Girişi ekranından güncel oturum verisini ekleyin.
                  </td>
                </tr>
              )}
              {processedData.map((row: any) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex flex-col">
                      <span>{row.month}</span>
                      <span className="text-xs text-gray-500 font-normal">{row.locationName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono">{row.sessionCount}</td>
                  <td className="px-6 py-4 text-right font-mono">₺{row.grossRevenue.toLocaleString('tr-TR')}</td>
                  <td className="px-6 py-4 text-right font-mono text-red-600">-₺{row.totalExpense.toLocaleString('tr-TR')}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-green-700">₺{row.netCash.toLocaleString('tr-TR')}</td>
                  <td className="px-6 py-4 text-right font-mono text-blue-700">₺{row.alpShare.toLocaleString('tr-TR')}</td>
                  <td className="px-6 py-4 text-right font-mono text-purple-700">₺{row.ngbShare.toLocaleString('tr-TR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
