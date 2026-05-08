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
  CREATE: { ad: 'Oluşturma', ikon: Database },
  UPDATE: { ad: 'Güncelleme', ikon: Pencil },
  DELETE: { ad: 'Silme', ikon: Trash2 },
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
    <div className="space-y-8 sm:space-y-12 md:space-y-16 animate-fade-in">
      <header>
        <p className="apple-eyebrow">Sistem</p>
        <h1 className="apple-headline mt-3">Sistem <span className="hero-serif text-gradient-aurora">logları</span></h1>
        <p className="mt-4 apple-body max-w-2xl">
          Tüm sistem işlemleri ve değişiklik geçmişi.
        </p>
      </header>

      <section className="apple-card p-5 md:p-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-tertiary]" strokeWidth={1.75} />
            <input
              type="text"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Kayıtlarda ara…"
              className="w-full h-11 rounded-full bg-[--bg-elevated] border border-transparent pl-11 pr-4 text-[15px] text-[--text] placeholder:text-[--text-tertiary] outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-tertiary]" strokeWidth={1.75} />
            <input
              type="date"
              value={tarih}
              onChange={(e) => setTarih(e.target.value)}
              className="h-11 rounded-full bg-[--bg-elevated] border border-transparent pl-11 pr-4 text-[14px] text-[--text] outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-[--bg-elevated] rounded-full">
            {(['ALL', 'CREATE', 'UPDATE', 'DELETE'] as const).map((islem) => (
              <button
                key={islem}
                onClick={() => setIslemFiltresi(islem)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors min-h-[36px]',
                  islemFiltresi === islem ? 'bg-[--surface] text-[--text]' : 'text-[--text-secondary] hover:text-[--text]'
                )}
                style={{ letterSpacing: '-0.005em' }}
              >
                {islem === 'ALL' ? 'Tümü' : islem === 'CREATE' ? 'Oluşturma' : islem === 'UPDATE' ? 'Güncelleme' : 'Silme'}
              </button>
            ))}
          </div>
          {(arama || tarih || islemFiltresi !== 'ALL') && (
            <button onClick={filtreTemizle} className="elite-button-tertiary">
              <FilterX className="w-4 h-4" strokeWidth={1.75} />
              Temizle
            </button>
          )}
        </div>
      </section>

      <section className="apple-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[--border] flex items-center justify-between">
          <span className="text-[14px] text-[--text-secondary]">
            Toplam <span className="text-[--text] font-medium tabular-nums">{filtreliLoglar.length}</span> kayıt
          </span>
          <span className="text-[12px] text-[--text-tertiary]">Son 100 işlem</span>
        </div>
        <div className="divide-y divide-[--border-soft]">
          {filtreliLoglar.map((log) => {
            const { ozet, teknik } = detayAyir(log.details);
            const meta = ISLEM_ETIKETLERI[log.action as keyof typeof ISLEM_ETIKETLERI] || ISLEM_ETIKETLERI.UPDATE;
            const Ikon = meta.ikon;
            const acikMi = acikKayitId === log.id;
            return (
              <article key={log.id} className="p-5 md:p-6 hover:bg-[--bg-subtle] transition-colors">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="chip">
                        <Ikon className="w-3 h-3" strokeWidth={1.75} />
                        {meta.ad}
                      </span>
                      <span className="text-[14px] font-medium text-[--text] break-all">{log.entity}</span>
                      <span className="text-[11px] text-[--text-tertiary] bg-[--bg-elevated] px-2 py-1 rounded-full font-mono tabular-nums">{log.entityId.slice(0, 12)}…</span>
                    </div>
                    <p className="text-[14px] text-[--text] leading-relaxed break-words" style={{ letterSpacing: '-0.005em' }}>{ozet}</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-[12px] text-[--text-tertiary]">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-[--bg-elevated] px-3 py-1.5 min-w-0">
                        <Globe className="w-3.5 h-3.5 text-[--text-tertiary] shrink-0" strokeWidth={1.75} />
                        <span className="font-mono tabular-nums break-all text-[--text-secondary]">{log.ipAddress || '127.0.0.1'}</span>
                      </div>
                      <div className="rounded-full bg-[--bg-elevated] px-3 py-1.5 truncate" title={log.userAgent || ''}>
                        <span className="text-[--text-tertiary]">{log.userAgent || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[12px] text-[--text-tertiary] md:text-right whitespace-nowrap shrink-0">
                    <p className="inline-flex items-center gap-1.5 font-medium tabular-nums text-[--text-secondary]">
                      <Clock3 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      {new Date(log.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="mt-0.5 tabular-nums">{new Date(log.createdAt).toLocaleTimeString('tr-TR')}</p>
                  </div>
                </div>
                {teknik && settings.SETTING_LOG_DETAIL_LEVEL === 1 && (
                  <div className="mt-3">
                    <button
                      onClick={() => setAcikKayitId(acikMi ? null : log.id)}
                      className="text-[12px] font-medium text-[--accent] hover:text-[--accent-hover] transition-colors"
                    >
                      {acikMi ? '▲ Teknik veriyi gizle' : '▼ Teknik veriyi göster'}
                    </button>
                    {acikMi && (
                      <pre className="mt-2 rounded-xl bg-[--bg-elevated] p-4 text-[12px] text-[--text-secondary] overflow-x-auto whitespace-pre-wrap break-all">
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
            <div className="empty-state">
              <Database className="empty-state-icon" />
              <p className="empty-state-title">Kayıt bulunamadı</p>
              <p className="empty-state-desc">Filtreleri temizleyip tekrar deneyin.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
