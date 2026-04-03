import prisma from '@/lib/db';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';

export const metadata = {
  title: 'Özet (Dashboard) - NextGenBox',
};

export default async function DashboardPage() {
  const performances = await prisma.monthlyPerformance.findMany({
    include: { location: true },
    orderBy: { month: 'desc' }
  });

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
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-gray-900">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Finansal Özet (YTD)</h1>
        <p className="mt-2 text-sm text-gray-600">Sistemdeki tüm lokasyonların kümülatif durumu.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Toplam Brüt Ciro</p>
          <p className="text-3xl font-bold mt-2">₺{totalRevenue.toLocaleString('tr-TR')}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Toplam Kesilen Komisyon</p>
          <p className="text-3xl font-bold mt-2 text-red-600">₺{totalCommission.toLocaleString('tr-TR')}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Kümülatif Net Nakit (Serbest Giriş)</p>
          <p className="text-3xl font-bold mt-2 text-green-600">₺{totalNetCash.toLocaleString('tr-TR')}</p>
        </div>
      </div>
    </div>
  );
}
