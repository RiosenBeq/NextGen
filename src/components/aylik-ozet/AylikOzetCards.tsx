'use client';

import { useState } from 'react';
import { X, Activity, Building2, Receipt, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LocationCalc = {
  name: string;
  sessionCount: number;
  sessionPrice: number;
  grossRevenue: number;
  iyzicoCommission: number;
  nayaxCommission: number;
  totalCommission: number;
  fixedRent: number;
  fixedRentWithVat: number;
  duesAmount: number;
  revenueShare: number;
  revenueShareRate: number;
  totalAvmExpense: number;
  extraExpense: number;
  netCash: number;
  breakEvenSessions: number;
};

export type AylikOzetCardsProps = {
  monthRevenue: number;
  monthCommission: number;
  monthAvmFixed: number;
  monthOperationalExpense: number;
  rawNetCash: number;
  ebitProfit: number;
  monthlyAmortization: number;
  totalInv: number;
  isProfitable: boolean;
  locationDetails: LocationCalc[];
};

type ModalType = 'ebit' | 'amortization' | 'revenue' | 'avm' | 'operational' | null;

const fmt = (n: number) => `₺${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `%${n.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`;

export default function AylikOzetCards(props: AylikOzetCardsProps) {
  const [modal, setModal] = useState<ModalType>(null);
  const {
    locationDetails,
    ebitProfit,
    rawNetCash,
    monthRevenue,
    monthCommission,
    monthAvmFixed,
    monthOperationalExpense,
    monthlyAmortization,
    totalInv,
    isProfitable,
  } = props;

  const close = () => setModal(null);

  return (
    <>
      {/* Main Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* EBIT Card */}
        <div
          onClick={() => setModal('ebit')}
          className={cn(
            'lg:col-span-2 p-10 rounded-[32px] border-2 flex flex-col justify-between min-h-[300px] shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5',
            isProfitable
              ? 'bg-white border-emerald-100 hover:border-emerald-300'
              : 'bg-white border-rose-100 hover:border-rose-300',
          )}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border',
                  isProfitable
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-rose-50 text-rose-600 border-rose-100',
                )}
              >
                {isProfitable ? 'Net Operasyonel Kar' : 'Net Operasyonel Zarar'}
              </span>
              <span className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-full text-[10px] font-bold uppercase tracking-widest">
                AMORTİSMAN SONRASI (EBIT)
              </span>
              <span className="px-2 py-1 bg-blue-50 text-blue-500 border border-blue-100 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                <Info size={10} /> Hesaplamayı gör
              </span>
            </div>
            <h2
              className={cn(
                'text-6xl font-bold tracking-tighter tabular-nums italic',
                isProfitable ? 'text-slate-900' : 'text-rose-600',
              )}
            >
              {fmt(ebitProfit)}
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10 pt-8 border-t border-slate-100">
            <SummaryStat label="Kişi Başı" val={fmt(ebitProfit / 4)} />
            <SummaryStat
              label="ROI"
              val={totalInv > 0 ? fmtPct((ebitProfit / totalInv) * 100) : '—'}
            />
            <SummaryStat
              label="Kar Marjı"
              val={monthRevenue > 0 ? fmtPct((rawNetCash / monthRevenue) * 100) : '—'}
            />
            <SummaryStat label="Hacim" val={fmt(monthRevenue)} />
          </div>
        </div>

        {/* Amortisman Card */}
        <div
          onClick={() => setModal('amortization')}
          className="bg-white border border-slate-200 p-10 rounded-[32px] shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-amber-200"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 uppercase">Amortisman</h3>
              <span className="ml-auto text-[10px] text-blue-400 font-bold flex items-center gap-1">
                <Info size={10} /> detay
              </span>
            </div>
            <div className="py-6 px-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-3xl font-bold text-slate-900 italic tracking-tighter">
                {fmt(monthlyAmortization)}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">
                Aylık Pay
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed text-center">
            Yatırımın <span className="text-slate-600 font-bold">36 aylık</span> planına göre
            hesaplanan sabit maliyet.
          </p>
        </div>
      </section>

      {/* Analysis Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnalysisCard
          label="Brüt Satış"
          val={monthRevenue}
          icon={Activity}
          color="blue"
          onClick={() => setModal('revenue')}
        />
        <AnalysisCard
          label="Sabit Gider (AVM)"
          val={monthAvmFixed}
          icon={Building2}
          color="rose"
          onClick={() => setModal('avm')}
        />
        <AnalysisCard
          label="Operasyonel"
          val={monthOperationalExpense + monthCommission}
          icon={Receipt}
          color="amber"
          onClick={() => setModal('operational')}
        />
      </section>

      {/* Detail Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          onClick={close}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full md:max-w-2xl max-h-[90vh] bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-8 py-5 flex items-center justify-between z-10">
              <h3 className="font-bold text-slate-900 uppercase text-sm tracking-widest">
                {modal === 'ebit' && 'EBIT Hesaplama Detayı'}
                {modal === 'amortization' && 'Amortisman Hesaplama'}
                {modal === 'revenue' && 'Brüt Satış Detayı'}
                {modal === 'avm' && 'AVM Gideri Detayı'}
                {modal === 'operational' && 'Operasyonel Gider Detayı'}
              </h3>
              <button
                onClick={close}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              {modal === 'ebit' && <EbitModal {...props} />}
              {modal === 'amortization' && (
                <AmortizationModal
                  totalInv={totalInv}
                  monthlyAmortization={monthlyAmortization}
                />
              )}
              {modal === 'revenue' && (
                <RevenueModal
                  locationDetails={locationDetails}
                  monthRevenue={monthRevenue}
                />
              )}
              {modal === 'avm' && (
                <AvmModal
                  locationDetails={locationDetails}
                  monthAvmFixed={monthAvmFixed}
                />
              )}
              {modal === 'operational' && (
                <OperationalModal
                  locationDetails={locationDetails}
                  monthCommission={monthCommission}
                  monthOperationalExpense={monthOperationalExpense}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Shared helpers ─────────────────────────────────────── */

function CalcRow({
  label,
  val,
  highlight = false,
  indent = false,
  positive,
}: {
  label: string;
  val: string;
  highlight?: boolean;
  indent?: boolean;
  positive?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-3 px-4 rounded-xl',
        highlight ? 'bg-slate-900' : 'bg-slate-50 border border-slate-100',
        indent && 'ml-4',
      )}
    >
      <span
        className={cn(
          'text-xs font-bold uppercase tracking-wider',
          highlight ? 'text-slate-300' : 'text-slate-500',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'font-bold tabular-nums italic',
          highlight ? 'text-white text-lg' : 'text-slate-900',
          !highlight && positive === true && 'text-emerald-600',
          !highlight && positive === false && 'text-rose-600',
        )}
      >
        {val}
      </span>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-1">
      <span className="text-slate-400 text-sm font-bold">{label}</span>
    </div>
  );
}

function LocationHeader({ name }: { name: string }) {
  return (
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">{name}</p>
  );
}

/* ─── Modal bodies ─────────────────────────────────────── */

function EbitModal(props: AylikOzetCardsProps) {
  const {
    monthRevenue,
    monthCommission,
    monthAvmFixed,
    monthOperationalExpense,
    rawNetCash,
    monthlyAmortization,
    ebitProfit,
    locationDetails,
  } = props;

  return (
    <div className="space-y-6">
      {/* Formula */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Hesaplama Formülü
        </p>
        <CalcRow label="Brüt Satış Geliri" val={fmt(monthRevenue)} positive />
        <CalcRow label="— Komisyon Gideri (iyzico %2 + Nayax %2)" val={`-${fmt(monthCommission)}`} indent positive={false} />
        <CalcRow label="— AVM Sabit Giderleri (Kira+KDV+Aidat+Ciro Payı)" val={`-${fmt(monthAvmFixed)}`} indent positive={false} />
        <CalcRow label="— Operasyonel Giderler (Ek masraflar)" val={`-${fmt(monthOperationalExpense)}`} indent positive={false} />
        <CalcRow label="= Net Nakit Akış" val={fmt(rawNetCash)} highlight />
        <CalcRow label="— Aylık Amortisman (Toplam Yatırım ÷ 36 ay)" val={`-${fmt(monthlyAmortization)}`} indent positive={false} />
        <CalcRow label="= EBIT (Operasyonel Kar/Zarar)" val={fmt(ebitProfit)} highlight />
      </div>

      {/* Per-location breakdown */}
      {locationDetails.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Lokasyon Bazlı Net Nakit
          </p>
          {locationDetails.map((loc) => (
            <div key={loc.name} className="p-4 rounded-2xl border border-slate-100 space-y-3">
              <p className="text-xs font-bold text-slate-700 uppercase">{loc.name}</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-slate-50 rounded-xl">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Seans</p>
                  <p className="font-bold text-slate-800 text-sm">{loc.sessionCount}</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-xl">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Brüt Gelir</p>
                  <p className="font-bold text-slate-800 text-sm">{fmt(loc.grossRevenue)}</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-xl">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Net Nakit</p>
                  <p
                    className={cn(
                      'font-bold text-sm',
                      loc.netCash >= 0 ? 'text-emerald-600' : 'text-rose-600',
                    )}
                  >
                    {fmt(loc.netCash)}
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Break-even: <span className="font-bold text-slate-600">{loc.breakEvenSessions} seans</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shareholder split */}
      <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl space-y-3">
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
          Hissedar Başına Pay (4 × %25)
        </p>
        <div className="grid grid-cols-2 gap-3">
          {['Okan', 'Talha', 'Furkan', 'Alp'].map((name) => (
            <div key={name} className="flex items-center justify-between bg-white/80 rounded-xl px-4 py-2">
              <span className="text-xs font-bold text-blue-800">{name}</span>
              <span className="font-bold text-blue-900 tabular-nums italic">
                {fmt(ebitProfit / 4)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AmortizationModal({
  totalInv,
  monthlyAmortization,
}: {
  totalInv: number;
  monthlyAmortization: number;
}) {
  return (
    <div className="space-y-4">
      <CalcRow label="Toplam Yatırım (Tüm Lokasyonlar)" val={fmt(totalInv)} positive />
      <Divider label="÷ 36 ay (3 Yıl)" />
      <CalcRow label="Aylık Amortisman Payı" val={fmt(monthlyAmortization)} highlight />
      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
        <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
          Yatırımın 36 aya (3 yıl) eşit bölünmesiyle hesaplanan sabit aylık maliyet. Her ayın net
          nakit akışından düşülerek EBIT değeri elde edilir.
        </p>
      </div>
    </div>
  );
}

function RevenueModal({
  locationDetails,
  monthRevenue,
}: {
  locationDetails: LocationCalc[];
  monthRevenue: number;
}) {
  return (
    <div className="space-y-4">
      {locationDetails.map((loc) => (
        <div key={loc.name} className="p-5 rounded-2xl border border-slate-100 space-y-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">{loc.name}</p>
          <CalcRow label="Seans Sayısı" val={`${loc.sessionCount} seans`} />
          <Divider label="×" />
          <CalcRow label="Seans Ücreti (KDV Dahil)" val={fmt(loc.sessionPrice)} />
          <Divider label="=" />
          <CalcRow label="Brüt Gelir" val={fmt(loc.grossRevenue)} highlight />
        </div>
      ))}
      {locationDetails.length > 1 && (
        <CalcRow label="Toplam Brüt Satış" val={fmt(monthRevenue)} highlight />
      )}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
        <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
          Seans ücreti KDV dahil olarak alınmaktadır. Gelirden KDV düşülmez.
        </p>
      </div>
    </div>
  );
}

function AvmModal({
  locationDetails,
  monthAvmFixed,
}: {
  locationDetails: LocationCalc[];
  monthAvmFixed: number;
}) {
  return (
    <div className="space-y-4">
      {locationDetails.map((loc) => (
        <div key={loc.name} className="p-5 rounded-2xl border border-slate-100 space-y-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">{loc.name}</p>
          <CalcRow label="Sabit Kira (KDV hariç)" val={fmt(loc.fixedRent)} />
          <CalcRow label="+ KDV (%20)" val={fmt(loc.fixedRentWithVat - loc.fixedRent)} indent />
          <CalcRow label="KDV'li Kira" val={fmt(loc.fixedRentWithVat)} />
          <CalcRow label="+ Aidat" val={fmt(loc.duesAmount)} />
          <CalcRow
            label={`+ Ciro Payı (%${loc.revenueShareRate}) — (Ciro - Kira) × %${loc.revenueShareRate}`}
            val={fmt(loc.revenueShare)}
          />
          <CalcRow label="Toplam AVM Gideri" val={fmt(loc.totalAvmExpense)} highlight />
        </div>
      ))}
      {locationDetails.length > 1 && (
        <CalcRow label="Genel Toplam AVM Gideri" val={fmt(monthAvmFixed)} highlight />
      )}
      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
        <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
          Ciro payı sadece brüt ciro sabit kirayı aştığında hesaplanır. Mart 2025 için ciro payı
          uygulanmaz.
        </p>
      </div>
    </div>
  );
}

function OperationalModal({
  locationDetails,
  monthCommission,
  monthOperationalExpense,
}: {
  locationDetails: LocationCalc[];
  monthCommission: number;
  monthOperationalExpense: number;
}) {
  return (
    <div className="space-y-4">
      {/* Commissions */}
      <div className="p-5 rounded-2xl border border-slate-100 space-y-2">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Komisyon Giderleri
        </p>
        {locationDetails.map((loc) => (
          <div key={loc.name} className="space-y-1">
            {locationDetails.length > 1 && <LocationHeader name={loc.name} />}
            <CalcRow label="iyzico Komisyon (%2 brüt ciro)" val={fmt(loc.iyzicoCommission)} indent />
            <CalcRow label="Nayax Komisyon (%2 brüt ciro)" val={fmt(loc.nayaxCommission)} indent />
          </div>
        ))}
        <CalcRow label="Toplam Komisyon (%4 brüt ciro)" val={fmt(monthCommission)} highlight />
      </div>

      {/* Extra expenses */}
      <div className="p-5 rounded-2xl border border-slate-100 space-y-2">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Ek / Operasyonel Giderler
        </p>
        {locationDetails.map((loc) => (
          <div key={loc.name} className="space-y-1">
            {locationDetails.length > 1 && <LocationHeader name={loc.name} />}
            <CalcRow
              label="Ek Masraflar (KDV Dahil)"
              val={fmt(loc.extraExpense)}
              indent
            />
          </div>
        ))}
        <CalcRow label="Toplam Ek Giderler" val={fmt(monthOperationalExpense)} highlight />
      </div>

      <CalcRow
        label="Genel Toplam (Komisyon + Ek Giderler)"
        val={fmt(monthCommission + monthOperationalExpense)}
        highlight
      />
    </div>
  );
}

/* ─── Card sub-components ─────────────────────────────────────── */

function SummaryStat({ label, val }: { label: string; val: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-lg font-bold text-slate-900 italic tracking-tighter">{val}</p>
    </div>
  );
}

function AnalysisCard({
  label,
  val,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  val: number;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  onClick: () => void;
}) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-600',
    rose: 'bg-rose-600',
    amber: 'bg-amber-600',
  };
  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 p-8 rounded-3xl space-y-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 group"
    >
      <div className="flex items-center justify-between">
        <div className={cn('p-2.5 rounded-xl text-white', bgColors[color])}>
          <Icon size={18} />
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-slate-900 tabular-nums tracking-tighter italic">
          ₺{val.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
        </p>
        <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Info size={10} /> detay
        </span>
      </div>
    </div>
  );
}
