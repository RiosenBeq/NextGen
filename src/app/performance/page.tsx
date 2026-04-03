import { MonthlyPerformanceForm } from '@/features/ledger/components/MonthlyPerformanceForm';
import { getActiveLocations } from '@/features/ledger/actions';

export const metadata = {
  title: 'Aylık Performans Girişi - NextGenBox',
};

export default async function PerformancePage() {
  const locations = await getActiveLocations();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 border-b pb-4">Aylık Performans</h1>
        <p className="mt-4 text-sm text-gray-600">Kabinrapor.com üzerindeki aylık oturum değerlerini girerek sistem üzerinde net kâr ve komisyon hesaplamalarını tetikleyin.</p>
      </div>

      <MonthlyPerformanceForm locations={locations.map(l => ({ id: l.id, name: l.name }))} />
    </div>
  );
}
