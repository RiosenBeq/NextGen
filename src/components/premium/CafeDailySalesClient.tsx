'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Coffee,
  GlassWater,
  Cookie,
  UtensilsCrossed,
  Package,
  Users,
  Loader2,
  Trash2,
  Save,
  Edit3,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProfileSummary } from '@/providers/ProfileProvider';
import type { CafeDailyRow } from '@/features/cafe/actions';
import { upsertCafeDailySales, deleteCafeDailySales } from '@/features/cafe/actions';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';

interface Props {
  profile: ProfileSummary;
  initialEntries: CafeDailyRow[];
  locations: { id: string; name: string }[];
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatTRY(n: number) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);
}

function formatDateLong(iso: string) {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
}

const CATEGORY_FIELDS = [
  { key: 'coffeeRevenue', label: 'Kahve', icon: Coffee, hue: '#6B4226' },
  { key: 'coldDrinkRevenue', label: 'Soğuk', icon: GlassWater, hue: '#3FA3D9' },
  { key: 'dessertRevenue', label: 'Tatlı', icon: Cookie, hue: '#D9A86C' },
  { key: 'foodRevenue', label: 'Yemek', icon: UtensilsCrossed, hue: '#A85542' },
  { key: 'otherRevenue', label: 'Diğer', icon: Package, hue: '#94A3B8' },
] as const;

type FormState = {
  date: string;
  locationId: string;
  customerCount: string;
  coffeeRevenue: string;
  coldDrinkRevenue: string;
  dessertRevenue: string;
  foodRevenue: string;
  otherRevenue: string;
  notes: string;
};

function emptyForm(locationId: string): FormState {
  return {
    date: todayISO(),
    locationId,
    customerCount: '',
    coffeeRevenue: '',
    coldDrinkRevenue: '',
    dessertRevenue: '',
    foodRevenue: '',
    otherRevenue: '',
    notes: '',
  };
}

function rowToForm(row: CafeDailyRow): FormState {
  return {
    date: row.date,
    locationId: row.locationId,
    customerCount: String(row.customerCount || ''),
    coffeeRevenue: String(row.coffeeRevenue || ''),
    coldDrinkRevenue: String(row.coldDrinkRevenue || ''),
    dessertRevenue: String(row.dessertRevenue || ''),
    foodRevenue: String(row.foodRevenue || ''),
    otherRevenue: String(row.otherRevenue || ''),
    notes: row.notes ?? '',
  };
}

export default function CafeDailySalesClient({ profile, initialEntries, locations }: Props) {
  const router = useRouter();
  const defaultLocId = locations[0]?.id ?? '';
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultLocId));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const total = useMemo(() => {
    const c = parseFloat(form.coffeeRevenue || '0') || 0;
    const cd = parseFloat(form.coldDrinkRevenue || '0') || 0;
    const d = parseFloat(form.dessertRevenue || '0') || 0;
    const f = parseFloat(form.foodRevenue || '0') || 0;
    const o = parseFloat(form.otherRevenue || '0') || 0;
    return c + cd + d + f + o;
  }, [form]);

  const avgTicket = useMemo(() => {
    const cust = parseInt(form.customerCount || '0', 10) || 0;
    return cust > 0 ? total / cust : 0;
  }, [total, form.customerCount]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm(defaultLocId));
    setEditingId(null);
  };

  const handleEdit = (row: CafeDailyRow) => {
    setForm(rowToForm(row));
    setEditingId(row.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Bu günün ciro kaydı silinsin mi?')) return;
    setPendingDelete(id);
    startTransition(async () => {
      const res = await deleteCafeDailySales(id);
      setPendingDelete(null);
      if (res.success) {
        toast.success('Kayıt silindi');
        router.refresh();
      } else {
        toast.error(res.error || 'Silinemedi');
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    startTransition(async () => {
      const res = await upsertCafeDailySales({
        date: form.date,
        locationId: form.locationId,
        customerCount: form.customerCount,
        coffeeRevenue: form.coffeeRevenue,
        coldDrinkRevenue: form.coldDrinkRevenue,
        dessertRevenue: form.dessertRevenue,
        foodRevenue: form.foodRevenue,
        otherRevenue: form.otherRevenue,
        notes: form.notes,
      });
      setIsSaving(false);
      if (res.success) {
        toast.success(editingId ? 'Kayıt güncellendi' : 'Kayıt eklendi');
        resetForm();
        router.refresh();
      } else {
        toast.error(res.error || 'Kaydedilemedi');
      }
    });
  };

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="apple-eyebrow inline-flex items-center gap-2">
            <Coffee className="w-3.5 h-3.5" strokeWidth={2} />
            {profile.brandName}
          </p>
          <h1 className="apple-headline mt-3">
            Günlük <span
              style={{
                background: `linear-gradient(135deg, ${profile.primaryColor}, ${profile.accentColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >ciro girişi</span>
          </h1>
          <p className="apple-body max-w-2xl mt-4">
            Her gün kategori bazlı ciroyu gir. Toplam otomatik hesaplanır.
            Aynı tarih için yeniden kayıt güncelleme yapar.
          </p>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="apple-card p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="apple-eyebrow">{editingId ? 'Güncelle' : 'Yeni Kayıt'}</p>
            <h2 className="apple-title-2 mt-1">{editingId ? 'Mevcut kayıt düzenleniyor' : 'Bugünün cirosu'}</h2>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-[--text-secondary] bg-[--bg-elevated] hover:bg-[--bg-strong]"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.25} />
              Yeni kayıt
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Tarih">
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
              max={todayISO()}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[--border] bg-white text-[14px]"
            />
          </Field>
          <Field label="Lokasyon">
            <select
              required
              value={form.locationId}
              onChange={(e) => updateField('locationId', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[--border] bg-white text-[14px]"
            >
              {locations.length === 0 && <option value="">Önce Ayarlar&apos;dan lokasyon ekle</option>}
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Müşteri / Fiş Sayısı">
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-tertiary]" strokeWidth={2} />
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={form.customerCount}
                onChange={(e) => updateField('customerCount', e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[--border] bg-white text-[14px] tabular-nums"
              />
            </div>
          </Field>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[--text-tertiary] mb-3">
            Kategori Bazlı Ciro (TL)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {CATEGORY_FIELDS.map((cat) => {
              const Icon = cat.icon;
              return (
                <CategoryField
                  key={cat.key}
                  label={cat.label}
                  icon={<Icon className="w-3.5 h-3.5" strokeWidth={2} />}
                  hue={cat.hue}
                  value={form[cat.key]}
                  onChange={(v) => updateField(cat.key, v)}
                />
              );
            })}
          </div>
        </div>

        <Field label="Not (opsiyonel)">
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Yağmurlu gün, hafta sonu rush, özel etkinlik..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[--border] bg-white text-[14px] resize-none"
          />
        </Field>

        {/* Live preview */}
        <div
          className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${profile.primaryColor}08, ${profile.accentColor}08)`,
            borderLeft: `3px solid ${profile.primaryColor}`,
          }}
        >
          <PreviewStat label="Toplam Ciro" value={`₺${formatTRY(total)}`} />
          <PreviewStat label="Müşteri" value={formatTRY(parseInt(form.customerCount || '0', 10) || 0)} />
          <PreviewStat label="Ortalama Hesap" value={`₺${formatTRY(avgTicket)}`} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 rounded-full text-[13px] font-semibold text-[--text-secondary] bg-[--bg-elevated] hover:bg-[--bg-strong]"
            >
              İptal
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving || !form.locationId || total <= 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${profile.primaryColor}, ${profile.accentColor})` }}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" strokeWidth={2.25} />
                {editingId ? 'Güncelle' : 'Kaydı Ekle'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* History */}
      <section className="apple-card overflow-hidden">
        <div className="px-6 py-5 border-b border-[--border]">
          <p className="apple-eyebrow">Geçmiş Kayıtlar</p>
          <h3 className="apple-title-2 mt-1">Son 60 gün</h3>
        </div>

        {initialEntries.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Coffee className="w-10 h-10 mx-auto text-[--text-tertiary]" strokeWidth={1.5} />
            <p className="text-[14px] text-[--text-secondary] mt-4">Henüz kayıt yok. Yukarıdan ilk girişi yap.</p>
          </div>
        ) : (
          <div className="divide-y divide-[--border-soft]">
            <AnimatePresence initial={false}>
              {initialEntries.map((row) => {
                const isEditing = editingId === row.id;
                const avgTicket = row.customerCount > 0 ? row.totalRevenue / row.customerCount : 0;
                return (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      'px-6 py-4 flex flex-col md:flex-row md:items-center gap-3 transition-colors',
                      isEditing && 'bg-[--bg-subtle]'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[--text]" style={{ letterSpacing: '-0.005em' }}>
                        {formatDateLong(row.date)}
                      </p>
                      <p className="text-[12px] text-[--text-tertiary] mt-0.5">
                        {row.locationName} · {row.customerCount} müşteri · ort. ₺{formatTRY(avgTicket)}
                      </p>
                      {row.notes && (
                        <p className="text-[12px] text-[--text-secondary] mt-1 italic">&ldquo;{row.notes}&rdquo;</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[16px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.012em' }}>
                          ₺{formatTRY(row.totalRevenue)}
                        </p>
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          {CATEGORY_FIELDS.map((cat) => {
                            const v = row[cat.key as keyof CafeDailyRow] as number;
                            if (!v || v <= 0) return null;
                            return (
                              <span
                                key={cat.key}
                                className="w-2 h-2 rounded-full"
                                style={{ background: cat.hue }}
                                title={`${cat.label}: ₺${formatTRY(v)}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(row)}
                          className="p-2 rounded-full text-[--text-tertiary] hover:text-[--text] hover:bg-[--bg-elevated]"
                          aria-label="Düzenle"
                        >
                          <Edit3 className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          disabled={pendingDelete === row.id}
                          className="p-2 rounded-full text-[--text-tertiary] hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                          aria-label="Sil"
                        >
                          {pendingDelete === row.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-[--text-tertiary] mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function CategoryField({
  label,
  icon,
  hue,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  hue: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[--text-secondary] mb-1.5">
        <span
          className="w-5 h-5 rounded-md flex items-center justify-center text-white"
          style={{ background: hue }}
        >
          {icon}
        </span>
        {label}
      </span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-tertiary] text-[13px] font-medium">
          ₺
        </span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-[--border] bg-white text-[14px] tabular-nums"
        />
      </div>
    </label>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[--text-tertiary]">{label}</p>
      <p
        className="text-[20px] font-semibold tabular-nums text-[--text] mt-1"
        style={{ letterSpacing: '-0.018em' }}
      >
        {value}
      </p>
    </div>
  );
}
