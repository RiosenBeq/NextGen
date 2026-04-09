import { createClient } from '@/utils/supabase/server';
import ContractsClientUI from '@/components/premium/ContractsClientUI';
import { FileText, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sözleşmeler — NextGenBox',
};

export default async function SozlesmelerPage() {
  const supabase = await createClient();

  const [{ data: contracts }, { data: locations }] = await Promise.all([
    supabase
      .from('Document')
      .select('id, fileName, fileUrl, relatedId, createdAt')
      .eq('relatedType', 'contract')
      .order('createdAt', { ascending: false }),
    supabase.from('Location').select('id, name').eq('isActive', true).order('name', { ascending: true }),
  ]);

  return (
    <div className="page-wrapper space-y-6 animate-fade-in">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              Belge Yönetimi
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-slate-900 inline-flex items-center gap-3">
              <FileText className="w-8 h-8 text-slate-400" />
              Sözleşmeler
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl">
              Lokasyon sözleşmelerinizi yükleyin, görüntüleyin ve yönetin. Tüm belgeler güvenli bir şekilde saklanır.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-700">{contracts?.length || 0}</span>
            <span className="text-xs text-slate-500">yüklü belge</span>
          </div>
        </div>
      </section>

      <ContractsClientUI
        initialContracts={(contracts || []) as Array<{ id: string; fileName: string; fileUrl: string; relatedId: string; uploadedAt?: string; createdAt?: string }>}
        locations={(locations || []) as Array<{ id: string; name: string }>}
      />
    </div>
  );
}
