'use client';
import { useRouter } from 'next/navigation';

import React, { useState } from 'react';
import { History as HistoryIcon, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import DailyPerformanceForm from '@/features/ledger/components/DailyPerformanceForm';
import { PremiumDrawer, PremiumModal } from './PremiumModal';
import { deleteDailyPerformance } from '@/features/ledger/performans-actions';
import { toast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/errors';

type PerformanceLocation = { id: string; name: string };

type PerformanceHistoryRow = {
  id: string;
  locationId: string;
  date: string;
  sessionCount: number;
  testCount: number;
  extraMetrics?: { notlar?: string } | null;
  location?: { name?: string } | null;
};

interface PerformanceClientProps {
  locations: PerformanceLocation[];
  history: PerformanceHistoryRow[];
  historyLocId: string;
}

export default function PerformanceClientUI({ locations, history, historyLocId }: PerformanceClientProps) {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PerformanceHistoryRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatMonth = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleDelete = async (row: PerformanceHistoryRow) => {
    if (!confirm('Bu günlük kaydı silmek istediğinize emin misiniz?')) return;
    setIsLoading(true);
    try {
      const resp = await deleteDailyPerformance(row.id, row.locationId, row.date);
      if (!resp.success) toast.error(resp.error ?? '');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Silme sırasında bir hata oluştu'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (row: PerformanceHistoryRow) => {
    setSelectedRow(row);
    setIsEditModalOpen(true);
  };

  const totalSessions = history.reduce((acc, row) => acc + Number(row.sessionCount || 0), 0);
  const totalTests = history.reduce((acc, row) => acc + Number(row.testCount || 0), 0);
  const avgSessionPerDay = history.length > 0 ? Math.round(totalSessions / history.length) : 0;

  return (
    <div className="space-y-12 md:space-y-16 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="apple-eyebrow">Günlük Operasyon</p>
          <h1 className="apple-headline mt-3">Performans Yönetimi</h1>
          <p className="mt-4 apple-body max-w-2xl">
            Günlük seans girişlerini ve operasyonel verileri yönetin.
          </p>
        </div>
        <span className="chip">Manuel Mod Aktif</span>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        <StatCard label="Toplam Oturum" value={totalSessions.toLocaleString('tr-TR')} subtitle="Filtrelenen kayıtlar" />
        <StatCard label="Toplam Test" value={totalTests.toLocaleString('tr-TR')} subtitle="Operasyon takibi" />
        <StatCard label="Günlük Ortalama" value={avgSessionPerDay.toLocaleString('tr-TR')} subtitle="Oturum / gün" />
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Form Section */}
        <section className="xl:col-span-5 space-y-5">
          <div className="apple-card p-1">
            <DailyPerformanceForm locations={locations} onSuccess={() => router.refresh()} />
          </div>

          <div className="apple-card p-6">
            <p className="apple-eyebrow">Bilgilendirme</p>
            <p className="text-[14px] text-[--text-secondary] leading-relaxed mt-3">
              Girdiğiniz günlük veriler, ilgili döneme ait <span className="text-[--text] font-medium">Nakit Akışı</span> raporlarına otomatik olarak aktarılır.
            </p>
          </div>
        </section>

        {/* History Section */}
        <section className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="apple-eyebrow">Geçmiş</p>
              <h3 className="apple-title-1 mt-2 flex items-center gap-2">
                <HistoryIcon size={20} strokeWidth={1.75} className="text-[--text-tertiary]" />
                Giriş Geçmişi
              </h3>
            </div>
            <div className="flex items-center gap-1 p-1 bg-[--bg-elevated] rounded-full overflow-x-auto">
              <FilterLink href="/performans?location=all" active={historyLocId === '' || historyLocId === 'all'} label="Tümü" />
              {locations.map((loc) => (
                <FilterLink key={loc.id} href={`/performans?location=${loc.id}`} active={historyLocId === loc.id} label={loc.name} />
              ))}
            </div>
          </div>

          <div className="apple-card overflow-hidden">
            <div className="hidden md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[--border]">
                    <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary]">Tarih / Şube</th>
                    <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-center">Oturum</th>
                    <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-center">Test</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--border-soft]">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-[14px] text-[--text-tertiary]">
                        Kayıt bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    history.map((row) => (
                      <tr
                        key={row.id}
                        className="group hover:bg-[--bg-subtle] transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedRow(row);
                          setIsDrawerOpen(true);
                        }}
                      >
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-[15px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>{formatMonth(row.date)}</span>
                            <span className="text-[12px] text-[--text-tertiary]">{row.location?.name || 'Genel'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-[15px] font-medium tabular-nums text-[--text]">{row.sessionCount}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-[15px] tabular-nums text-[--text-secondary]">{row.testCount}</span>
                        </td>
                        <td className="px-6 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              disabled={isLoading}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(row);
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--text] hover:bg-[--bg-elevated] transition-colors disabled:opacity-50"
                              aria-label="Düzenle"
                            >
                              <Edit2 size={14} strokeWidth={1.75} />
                            </button>
                            <button
                              disabled={isLoading}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(row);
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--danger] hover:bg-[--danger-soft] transition-colors disabled:opacity-50"
                              aria-label="Sil"
                            >
                              <Trash2 size={14} strokeWidth={1.75} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-[--border-soft]">
              {history.length === 0 ? (
                <div className="empty-state">
                  <HistoryIcon className="empty-state-icon" />
                  <p className="empty-state-title">Kayıt yok</p>
                </div>
              ) : (
                history.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      setSelectedRow(row);
                      setIsDrawerOpen(true);
                    }}
                    className="w-full text-left p-5 hover:bg-[--bg-subtle] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[15px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>{formatMonth(row.date)}</p>
                        <p className="text-[12px] text-[--text-tertiary] mt-0.5">{row.location?.name || 'Genel'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[18px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.014em' }}>{row.sessionCount}</p>
                        <p className="text-[12px] text-[--text-tertiary]">oturum · {row.testCount} test</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <PremiumDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Veri Detayı">
        {selectedRow && (
          <div className="space-y-8 py-4">
            <div className="rounded-[22px] bg-[--bg-elevated] p-6 space-y-5">
              <div>
                <p className="text-[12px] text-[--text-tertiary]">{formatMonth(selectedRow.date)}</p>
                <p className="text-[24px] md:text-[28px] font-semibold text-[--text] mt-1" style={{ letterSpacing: '-0.022em' }}>
                  {selectedRow.location?.name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-5 border-t border-[--border]">
                <div>
                  <p className="text-[12px] text-[--text-tertiary]">Oturum</p>
                  <p className="text-[20px] md:text-[22px] font-semibold tabular-nums text-[--text] mt-1" style={{ letterSpacing: '-0.018em' }}>{selectedRow.sessionCount}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[--text-tertiary]">Test</p>
                  <p className="text-[20px] md:text-[22px] font-semibold tabular-nums text-[--text] mt-1" style={{ letterSpacing: '-0.018em' }}>{selectedRow.testCount}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[13px] text-[--text-secondary]">Notlar</p>
              <p className="text-[14px] text-[--text] leading-relaxed">{selectedRow.extraMetrics?.notlar || 'Not eklenmemiş.'}</p>
            </div>
            <button onClick={() => setIsDrawerOpen(false)} className="elite-button-secondary w-full">
              Kapat
            </button>
          </div>
        )}
      </PremiumDrawer>

      <PremiumModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Veriyi Düzenle" maxWidth="max-w-xl">
        <DailyPerformanceForm
          locations={locations}
          initialData={selectedRow ?? undefined}
          onSuccess={() => setIsEditModalOpen(false)}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </PremiumModal>
    </div>
  );
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={cn(
        'px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap min-h-[32px] flex items-center',
        active ? 'bg-[--surface] text-[--text]' : 'text-[--text-secondary] hover:text-[--text]'
      )}
      style={{ letterSpacing: '-0.005em' }}
    >
      {label}
    </a>
  );
}

function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
  return (
    <div className="apple-card p-6">
      <p className="text-[13px] text-[--text-secondary]" style={{ letterSpacing: '-0.005em' }}>{label}</p>
      <p className="mt-1 text-[24px] md:text-[28px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.022em' }}>{value}</p>
      <p className="text-[12px] text-[--text-tertiary] mt-2">{subtitle}</p>
    </div>
  );
}
