'use client';
import { useMemo, useState } from 'react';
import { Search, Calendar, FilterX, Clock3, Globe, Database, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/SettingsProvider';

type LogKaydi = {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | string;
  entity: string;
  entityId: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

const ISLEM_ETIKETLERI = {
  CREATE: { ad: 'Oluşturma', sinif: 'bg-emerald-50 border-emerald-200 text-emerald-700', ikon: Database },
  UPDATE: { ad: 'Güncelleme', sinif: 'bg-blue-50 border-blue-200 text-blue-700', ikon: Pencil },
  DELETE: { ad: 'Silme', sinif: 'bg-rose-50 border-rose-200 text-rose-700', ikon: Trash2 },
};

function detayAyir(detay: string | null) {
  if (!detay) return { ozet: '-', teknik: null as string | null };
  if (!detay.includes('| Veri:')) return { ozet: detay, teknik: null as string | null };
  const [ozet, teknik] = detay.split('| Veri:');
  return { ozet: ozet.trim(), teknik: teknik.trim() };
}

export default function GunluklerClientUI({ loglar }: { loglar: LogKaydi[] }) {
  const [arama, setArama] = useState('');
  const [tarih, setTarih] = useState('');
  const [islemFiltresi, setIslemFiltresi] = useState<'ALL' | 'CREATE' | 'UPDATE' | 'DELETE'>('ALL');
  const [acikKayitId, setAcikKayitId] = useState<string | null>(null);
  const { settings } = useSettings();

  const filtreliLoglar = useMemo(() => {
    return loglar.filter((log) => {
      if (islemFiltresi !== 'ALL' && log.action !== islemFiltresi) return false;
      if (tarih && !log.createdAt.startsWith(tarih)) return false;
      if (arama.trim()) {
        const q = arama.toLowerCase();
        const detayda = log.details?.toLowerCase().includes(q);
        const varlikta = log.entity?.toLowerCase().includes(q);
        const ipde = log.ipAddress?.toLowerCase().includes(q);
        if (!detayda && !varlikta && !ipde) return false;
      }
      return true;
    });
  }, [loglar, arama, tarih, islemFiltresi]);

  const filtreTemizle = () => {
    setArama('');
    setTarih('');
    setIslemFiltresi('ALL');
  };

  return (
    <div className="page-wrapper space-y-6 animate-fade-in">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Sistem Logları</h1>
            <p className="text-xs text-slate-500 mt-0.5">Tüm sistem işlemleri ve değişiklik geçmişi</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Kayıtlarda ara..."
              className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={tarih}
              onChange={(e) => setTarih(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all"
            />
          </div>
          {(['ALL', 'CREATE', 'UPDATE', 'DELETE'] as const).map((islem) => (
            <button
              key={islem}
              onClick={() => setIslemFiltresi(islem)}
              className={cn(
                'h-10 px-3 rounded-xl border text-[11px] font-bold uppercase tracking-wide transition-all',
                islemFiltresi === islem
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              {islem === 'ALL' ? 'Tümü' : islem}
            </button>
          ))}
          {(arama || tarih || islemFiltresi !== 'ALL') && (
            <button
              onClick={filtreTemizle}
              className="h-10 px-3 rounded-xl border border-slate-200 text-[11px] font-bold uppercase tracking-wide text-slate-500 hover:text-blue-600 hover:border-blue-200 inline-flex items-center gap-1 transition-all"
            >
              <FilterX className="w-4 h-4" />
              Temizle
            </button>
          )}
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-4 md:px-6 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold">
            Toplam <span className="text-slate-900 font-black">{filtreliLoglar.length}</span> kayıt
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Son 100 işlem</span>
        </div>
        <div className="divide-y divide-slate-100">
          {filtreliLoglar.map((log) => {
            const { ozet, teknik } = detayAyir(log.details);
            const meta = ISLEM_ETIKETLERI[log.action as keyof typeof ISLEM_ETIKETLERI] || ISLEM_ETIKETLERI.UPDATE;
            const Ikon = meta.ikon;
            const acikMi = acikKayitId === log.id;
            return (
              <article key={log.id} className="p-4 md:p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wide', meta.sinif)}>
                        <Ikon className="w-3 h-3" />
                        {meta.ad}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-700 break-all">{log.entity}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-lg font-mono">{log.entityId.slice(0, 12)}…</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed break-words">{ozet}</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs text-slate-500">
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 min-w-0">
                        <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="font-mono break-all">{log.ipAddress || '127.0.0.1'}</span>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 truncate" title={log.userAgent || ''}>
                        <span className="text-slate-400">{log.userAgent || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 md:text-right whitespace-nowrap shrink-0">
                    <p className="inline-flex items-center gap-1 font-semibold">
                      <Clock3 className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(log.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-slate-400 mt-0.5">{new Date(log.createdAt).toLocaleTimeString('tr-TR')}</p>
                  </div>
                </div>
                {teknik && settings.SETTING_LOG_DETAIL_LEVEL === 1 && (
                  <div className="mt-3">
                    <button
                      onClick={() => setAcikKayitId(acikMi ? null : log.id)}
                      className="text-[11px] font-bold uppercase tracking-wide text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {acikMi ? '▲ Teknik veriyi gizle' : '▼ Teknik veriyi göster'}
                    </button>
                    {acikMi && (
                      <pre className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 overflow-x-auto whitespace-pre-wrap break-all">
                        {(() => {
                          try {
                            return JSON.stringify(JSON.parse(teknik), null, 2);
                          } catch {
                            return teknik;
                          }
                        })()}
                      </pre>
                    )}
                  </div>
                )}
              </article>
            );
          })}
          {filtreliLoglar.length === 0 && (
            <div className="p-16 text-center">
              <Database className="mx-auto w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-bold text-slate-700">Kayıt bulunamadı</p>
              <p className="text-xs text-slate-400 mt-1">Filtreleri temizleyip tekrar deneyin.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
