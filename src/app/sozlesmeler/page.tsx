import { createClient } from '@/utils/supabase/server';
import ContractsClientUI from '@/components/premium/ContractsClientUI';
import { FileText } from 'lucide-react';

export const metadata = {
  title: 'Sözleşmeler — NextGenBox',
};

export default async function SozlesmelerPage() {
  const supabase = await createClient();

  const [{ data: contracts }, { data: locations }] = await Promise.all([
    supabase
      .from('Document')
      .select('id, fileName, fileUrl, relatedId, uploadedAt, createdAt')
      .eq('relatedType', 'contract')
      .order('uploadedAt', { ascending: false }),
    supabase.from('Location').select('id, name').eq('isActive', true).order('name', { ascending: true }),
  ]);

  return (
    <div className="page-wrapper space-y-6 animate-fade-in">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sözleşmeler</h1>
          <p className="text-sm text-slate-500">Lokasyon sözleşmelerinizi yükleyin, görüntüleyin ve yönetin.</p>
        </div>
      </header>

      <ContractsClientUI
        initialContracts={(contracts || []) as Array<{ id: string; fileName: string; fileUrl: string; relatedId: string; uploadedAt?: string; createdAt?: string }>}
        locations={(locations || []) as Array<{ id: string; name: string }>}
      />
    </div>
  );
}
