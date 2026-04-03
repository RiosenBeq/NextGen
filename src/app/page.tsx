import prisma from '@/lib/db';
import { calculateMonthlyCashFlow } from '@/features/ledger/calculations';
import { TrendingUp, CreditCard, Wallet, Activity } from 'lucide-react';

export const metadata = {
  title: 'Özet (Dashboard) - NextGenBox',
};

export const dynamic = 'force-dynamic';

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
  let recentSessions = 0;

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Finansal Özet (YTD)</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">Tüm AVM'lerin kümülatif nakit durumu ve hesaplamaları.</p>
        </div>
        <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-semibold text-gray-700">Sistem Aktif</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">+12%</span>
          </div>
          <div className="mt-6">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Küm. Brüt Ciro</p>
            <p className="text-3xl font-black mt-1 text-gray-900">₺{totalRevenue.toLocaleString('tr-TR')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">İyzico/Nayax Kesinti</p>
            <p className="text-3xl font-black mt-1 text-red-600">₺{totalCommission.toLocaleString('tr-TR')}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl shadow-xl flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 blur-[2px]">
            <Wallet className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6 relative z-10">
            <p className="text-sm font-bold text-gray-300 uppercase tracking-wider">Küm. Net Nakit (Serbest)</p>
            <p className="text-3xl font-black mt-1 text-white">₺{totalNetCash.toLocaleString('tr-TR')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Aktif Oturum Sayısı</p>
            <p className="text-3xl font-black mt-1 text-gray-900">{recentSessions.toLocaleString('tr-TR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
