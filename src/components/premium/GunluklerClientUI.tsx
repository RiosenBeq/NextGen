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
  CREATE: { ad: 'Oluşturma', sinif: 'bg-emerald-50 text-emerald-700', ikon: Database },
  UPDATE: { ad: 'Güncelleme', sinif: 'bg-blue-50 text-blue-700', ikon: Pencil },
  DELETE: { ad: 'Silme', sinif: 'bg-rose-50 text-rose-700', ikon: Trash2 },
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
      <header className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Sistem Logları</h1>
            <p className="text-sm text-slate-500 mt-0.5">Tüm sistem işlemleri ve değişiklik geçmişi</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Kayıtlarda ara..."
              className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={tarih}
              onChange={(e) => setTarih(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
            />
          </div>
          {(['ALL', 'CREATE', 'UPDATE', 'DELETE'] as const).map((islem) => (
            <button
              key={islem}
              onClick={() => setIslemFiltresi(islem)}
              className={cn(
                'h-10 px-3 rounded-xl border text-xs font-medium transition-all',
                islemFiltresi === islem
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              )}
            >
              {islem === 'ALL' ? 'Tümü' : islem === 'CREATE' ? 'Oluşturma' : islem === 'UPDATE' ? 'Güncelleme' : 'Silme'}
            </button>
          ))}
          {(arama || tarih || islemFiltresi !== 'ALL') && (
            <button
              onClick={filtreTemizle}
              className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 inline-flex items-center gap-1.5 transition-all"
            >
              <FilterX className="w-4 h-4" />
              Temizle
            </button>
          )}
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Toplam <span className="text-slate-900 font-semibold tabular-nums">{filtreliLoglar.length}</span> kayıt
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Son 100 işlem</span>
        </div>
        <div className="divide-y divide-slate-100">
          {filtreliLoglar.map((log) => {
            const { ozet, teknik } = detayAyir(log.details);
            const meta = ISLEM_ETIKETLERI[log.action as keyof typeof ISLEM_ETIKETLERI] || ISLEM_ETIKETLERI.UPDATE;
            const Ikon = meta.ikon;
            const acikMi = acikKayitId === log.id;
            return (
              <article key={log.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', meta.sinif)}>
                        <Ikon className="w-3 h-3" />
                        {meta.ad}
                      </span>
                      <span className="text-sm font-medium text-slate-700 break-all">{log.entity}</span>
                      <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg font-mono tabular-nums">{log.entityId.slice(0, 12)}…</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed break-words">{ozet}</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs text-slate-500">
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50/70 px-2.5 py-1.5 min-w-0">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono tabular-nums break-all text-slate-600">{log.ipAddress || '127.0.0.1'}</span>
                      </div>
                      <div className="rounded-lg bg-slate-50/70 px-2.5 py-1.5 truncate" title={log.userAgent || ''}>
                        <span className="text-slate-400">{log.userAgent || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 md:text-right whitespace-nowrap shrink-0">
                    <p className="inline-flex items-center gap-1.5 font-medium tabular-nums text-slate-700">
                      <Clock3 className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(log.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-slate-400 mt-0.5 tabular-nums">{new Date(log.createdAt).toLocaleTimeString('tr-TR')}</p>
                  </div>
                </div>
                {teknik && settings.SETTING_LOG_DETAIL_LEVEL === 1 && (
                  <div className="mt-3">
                    <button
                      onClick={() => setAcikKayitId(acikMi ? null : log.id)}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      {acikMi ? '▲ Teknik veriyi gizle' : '▼ Teknik veriyi göster'}
                    </button>
                    {acikMi && (
                      <pre className="mt-2 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap break-all">
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
              <p className="text-sm font-medium text-slate-700">Kayıt bulunamadı</p>
              <p className="text-xs text-slate-400 mt-1">Filtreleri temizleyip tekrar deneyin.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
