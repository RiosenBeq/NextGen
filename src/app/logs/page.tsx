import prisma from '@/lib/db';
import { 
  Activity, Calendar, Clock, MapPin, User, Info, 
  PlusCircle, Edit, Trash2, ArrowRightCircle
} from 'lucide-react';

export const metadata = {
  title: 'İşlem Günlükleri (Audit Logs) - NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
  // Fetch logs directly with raw query since types might not be generated
  const logs = await prisma.$queryRawUnsafe<any[]>(
    'SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 100'
  );

  const timeFormatter = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateFormatter = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-200 pb-10">
        <div className="space-y-4">
           <div className="flex items-center gap-3 text-slate-400">
             <Activity size={20} />
             <span className="text-[11px] font-black tracking-[0.4em] uppercase">Sistem Güvenlik & Denetim</span>
           </div>
           <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-tight">
             İşlem Günlükleri
           </h1>
           <p className="text-slate-500 font-medium text-sm md:text-base max-w-2xl">
             Sistem üzerindeki tüm ekleme, silme ve güncelleme işlemleri IP bazlı olarak kayıt altına alınmaktadır.
           </p>
        </div>
      </header>

      <div className="premium-card overflow-hidden bg-white border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">İşlem</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Kayıt Türü & ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">IP Adresi</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Detaylar</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Zaman Damgası</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">
                    Kayıtlı işlem gunluğu bulunamadı.
                  </td>
                </tr>
              ) : null}
              {logs.map((log) => {
                const dateObj = new Date(log.createdAt);
                return (
                  <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <ActionIcon action={log.action} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{log.entity}</span>
                        <span className="text-[9px] font-bold text-slate-400 font-mono">#{log.entityId}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1 rounded-full w-max">
                        <MapPin size={10} className="text-slate-400" />
                        <span className="text-[10px] font-black font-mono">{log.ipAddress}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[10px] font-medium text-slate-500 max-w-sm truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                        {log.details || '—'}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 text-slate-900 font-black text-xs">
                          <Clock size={12} className="text-slate-400" />
                          {timeFormatter.format(dateObj)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          {dateFormatter.format(dateObj)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ActionIcon({ action }: { action: string }) {
  if (action === 'CREATE') return <PlusCircle size={16} className="text-emerald-500" />;
  if (action === 'UPDATE') return <Edit size={16} className="text-amber-500" />;
  if (action === 'DELETE') return <Trash2 size={16} className="text-rose-500" />;
  return <ArrowRightCircle size={16} className="text-slate-400" />;
}

function getActionColor(action: string) {
  if (action === 'CREATE') return 'text-emerald-600';
  if (action === 'UPDATE') return 'text-amber-600';
  if (action === 'DELETE') return 'text-rose-600';
  return 'text-slate-600';
}
