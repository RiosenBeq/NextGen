import prisma from '@/lib/db';
import { CreditCard, ArrowDownRight } from 'lucide-react';
import { Expense, Investment, Location } from '@prisma/client';

export const metadata = {
  title: 'Giderler & Yatırımlar - NextGenBox',
};

export const dynamic = 'force-dynamic';

type ExpenseWithLocation = Expense & { location: Location | null };
type InvestmentWithLocation = Investment & { location: Location };

export default async function ExpensesPage() {
  const expenses = (await prisma.expense.findMany({
    include: { location: true },
    orderBy: { createdAt: 'desc' }
  })) as any[];

  const investments = (await prisma.investment.findMany({
    include: { location: true },
    orderBy: { createdAt: 'desc' }
  })) as any[];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Gider ve Yatırım İzleme</h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Sisteme entegre tüm operasyonel (aylık/tek seferlik) masrafların ve ilk yatırım harcamalarının takibi.
        </p>
      </div>

      <div className="bg-white border text-gray-900 border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-64 mb-8">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold">Kayıtlı Giderler (Expenses)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-600">
              <tr>
                <th className="px-6 py-4">Gider Adı</th>
                <th className="px-6 py-4">Lokasyon</th>
                <th className="px-6 py-4">Frekans / Ay</th>
                <th className="px-6 py-4 text-center">Resmi? (KDV)</th>
                <th className="px-6 py-4 text-right">Tutar (KDV Hariç)</th>
                <th className="px-6 py-4 text-right text-red-600 font-bold">Toplam Çıkış</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((exp: any) => (
                <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{exp.description}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-semibold">
                      {exp.location?.name || 'Tüm AVM\'ler Ortak'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {exp.type.toUpperCase()} {exp.month ? `(${exp.month})` : ''}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {exp.isOfficial ? <span className="text-blue-600 font-bold">EVET</span> : <span className="text-gray-400">HAYIR</span>}
                  </td>
                  <td className="px-6 py-4 text-right font-mono">₺{exp.amountWithoutVat?.toLocaleString('tr-TR')}</td>
                  <td className="px-6 py-4 text-right font-mono text-red-600 font-semibold">₺{exp.amountWithVat?.toLocaleString('tr-TR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border text-gray-900 border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-64">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold">İlk Yatırımlar (CAPEX)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-600">
              <tr>
                <th className="px-6 py-4">Kalem</th>
                <th className="px-6 py-4">Lokasyon</th>
                <th className="px-6 py-4">Para Birimi / Net</th>
                <th className="px-6 py-4">KDV / Not</th>
                <th className="px-6 py-4 text-right text-orange-600 font-bold">Toplam TL Maliyeti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {investments.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{inv.description}</td>
                  <td className="px-6 py-4 text-gray-600">{inv.location?.name}</td>
                  <td className="px-6 py-4 font-mono font-medium">
                    {inv.amountWithoutVat?.toLocaleString('tr-TR')} {inv.currency}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                    KDV: ₺{inv.vatAmount} <br/> {inv.notes}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-orange-600 font-semibold">₺{inv.totalAmount?.toLocaleString('tr-TR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
