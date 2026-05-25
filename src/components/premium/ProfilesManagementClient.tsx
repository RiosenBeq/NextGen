'use client';

import React, { useState, useTransition } from 'react';
import {
  Building2,
  Crown,
  Shield,
  User as UserIcon,
  UserPlus,
  Trash2,
  Palette,
  Plus,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { PremiumModal } from './PremiumModal';
import {
  grantProfileAccess,
  revokeProfileAccess,
  updateProfileMemberRole,
  updateProfileBranding,
  createProfile,
} from '@/features/profiles/actions';

interface ProfileSummary {
  id: string;
  slug: string;
  brandName: string;
  monogram: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
}

interface Member {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  lastSelectedAt: string | null;
  createdAt: string;
}

interface ProfileBundle {
  profile: ProfileSummary;
  role: string;
  members: Member[];
}

interface Props {
  currentUserId: string;
  isSuperAdmin: boolean;
  profiles: ProfileBundle[];
}

const ROLE_META: Record<string, { label: string; icon: typeof Crown; tone: string }> = {
  owner: { label: 'Sahip', icon: Crown, tone: 'text-amber-700 bg-amber-50 border-amber-200' },
  admin: { label: 'Yönetici', icon: Shield, tone: 'text-blue-700 bg-blue-50 border-blue-200' },
  member: { label: 'Üye', icon: UserIcon, tone: 'text-slate-700 bg-slate-50 border-slate-200' },
};

function ProfileSwatch({ profile, size = 44 }: { profile: ProfileSummary; size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-2xl"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${profile.primaryColor} 0%, ${profile.accentColor} 100%)`,
        boxShadow: `0 8px 22px ${profile.primaryColor}55`,
      }}
      aria-hidden
    >
      <span
        className="absolute inset-[3px] rounded-[14px] flex items-center justify-center"
        style={{ background: 'rgba(11, 16, 35, 0.85)', backdropFilter: 'blur(6px)' }}
      >
        <span
          className="font-extrabold text-white leading-none tabular-nums"
          style={{ fontSize: size * 0.42, letterSpacing: '-0.04em' }}
        >
          {profile.monogram}
        </span>
      </span>
    </span>
  );
}

export default function ProfilesManagementClient({ currentUserId, isSuperAdmin, profiles }: Props) {
  const router = useRouter();
  const [activeProfileId, setActiveProfileId] = useState<string>(profiles[0]?.profile.id ?? '');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const activeBundle = profiles.find((p) => p.profile.id === activeProfileId) ?? profiles[0];

  return (
    <div className="page-wrapper space-y-8 animate-fade-in">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="apple-eyebrow">İşletme Profilleri</p>
          <h1 className="apple-headline mt-3">Profil <span className="text-gradient-aurora">yönetimi</span></h1>
          <p className="apple-body max-w-2xl mt-4">
            Her profil ayrı bir işletme. Marka kimliği, lokasyonlar, finansal veriler izole çalışır.
            Buradan profillere üye ekleyebilir, rolleri yönetebilir, marka renklerini düzenleyebilirsin.
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-semibold text-white shadow-lg transition-transform active:scale-95"
            style={{ background: 'var(--grad-aurora)' }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.25} />
            Yeni Profil
          </button>
        )}
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Profile list */}
        <aside className="space-y-2">
          <p className="apple-eyebrow px-1 mb-2">{profiles.length} Profil</p>
          {profiles.map(({ profile, role, members }) => {
            const isActive = profile.id === activeProfileId;
            return (
              <button
                key={profile.id}
                onClick={() => setActiveProfileId(profile.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all',
                  isActive
                    ? 'border-transparent shadow-lg bg-white'
                    : 'border-[--border] bg-white/60 hover:bg-white hover:border-[--border-strong]'
                )}
                style={isActive ? { boxShadow: `0 10px 28px ${profile.primaryColor}33` } : undefined}
              >
                <ProfileSwatch profile={profile} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[--text] truncate" style={{ letterSpacing: '-0.01em' }}>
                    {profile.brandName}
                  </p>
                  <p className="text-[11px] text-[--text-tertiary] uppercase tracking-wider mt-0.5">
                    {members.length} üye · {ROLE_META[role]?.label ?? role}
                  </p>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-[--text-tertiary]" strokeWidth={2} />}
              </button>
            );
          })}
        </aside>

        {/* Detail panel */}
        {activeBundle ? (
          <div className="space-y-6">
            <ProfileBrandCard
              bundle={activeBundle}
              isSuperAdmin={isSuperAdmin}
              onEditBrand={() => setBrandOpen(true)}
            />
            <MembersCard
              bundle={activeBundle}
              currentUserId={currentUserId}
              isSuperAdmin={isSuperAdmin}
              onInvite={() => setInviteOpen(true)}
              onChanged={() => router.refresh()}
            />
          </div>
        ) : (
          <div className="apple-card p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto text-[--text-tertiary]" strokeWidth={1.5} />
            <p className="mt-4 text-[15px] text-[--text-secondary]">Henüz erişebileceğiniz bir profil yok.</p>
          </div>
        )}
      </section>

      <PremiumModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Üye Davet Et" maxWidth="max-w-md">
        <InviteForm
          profileId={activeBundle?.profile.id ?? ''}
          onDone={() => {
            setInviteOpen(false);
            router.refresh();
          }}
        />
      </PremiumModal>

      <PremiumModal isOpen={brandOpen} onClose={() => setBrandOpen(false)} title="Marka Kimliği" maxWidth="max-w-lg">
        {activeBundle && (
          <BrandForm
            profile={activeBundle.profile}
            onDone={() => {
              setBrandOpen(false);
              router.refresh();
            }}
          />
        )}
      </PremiumModal>

      {isSuperAdmin && (
        <PremiumModal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Yeni İşletme Profili" maxWidth="max-w-lg">
          <CreateProfileForm
            onDone={() => {
              setCreateOpen(false);
              router.refresh();
            }}
          />
        </PremiumModal>
      )}
    </div>
  );
}

function ProfileBrandCard({
  bundle,
  isSuperAdmin,
  onEditBrand,
}: {
  bundle: ProfileBundle;
  isSuperAdmin: boolean;
  onEditBrand: () => void;
}) {
  const { profile, role } = bundle;
  const canEdit = isSuperAdmin || role === 'owner' || role === 'admin';
  return (
    <div className="apple-card p-6 md:p-8 overflow-hidden relative">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ background: `linear-gradient(90deg, ${profile.primaryColor}, ${profile.accentColor})` }}
      />
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <ProfileSwatch profile={profile} size={84} />
        <div className="flex-1 min-w-0">
          <p className="apple-eyebrow">Marka</p>
          <h2 className="apple-title-1 mt-2">{profile.brandName}</h2>
          <p className="text-[13px] text-[--text-tertiary] mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Slug: <span className="font-mono">{profile.slug}</span></span>
            <span>·</span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: profile.primaryColor }} />
              {profile.primaryColor}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: profile.accentColor }} />
              {profile.accentColor}
            </span>
          </p>
        </div>
        {canEdit && (
          <button
            onClick={onEditBrand}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-semibold text-[--text] bg-[--bg-elevated] hover:bg-[--bg-strong] transition-colors"
          >
            <Palette className="w-4 h-4" strokeWidth={2} />
            Düzenle
          </button>
        )}
      </div>
    </div>
  );
}

function MembersCard({
  bundle,
  currentUserId,
  isSuperAdmin,
  onInvite,
  onChanged,
}: {
  bundle: ProfileBundle;
  currentUserId: string;
  isSuperAdmin: boolean;
  onInvite: () => void;
  onChanged: () => void;
}) {
  const { profile, members, role: callerRole } = bundle;
  const canManage = isSuperAdmin || callerRole === 'owner';
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleRoleChange = (userId: string, newRole: 'owner' | 'admin' | 'member') => {
    setPendingId(userId);
    startTransition(async () => {
      const res = await updateProfileMemberRole({ profileId: profile.id, userId, role: newRole });
      setPendingId(null);
      if (res.success) {
        toast.success('Rol güncellendi');
        onChanged();
      } else {
        toast.error(res.error || 'Güncellenemedi');
      }
    });
  };

  const handleRevoke = (userId: string, email: string) => {
    if (!confirm(`${email} kullanıcısının erişimi kaldırılsın mı?`)) return;
    setPendingId(userId);
    startTransition(async () => {
      const res = await revokeProfileAccess({ profileId: profile.id, userId });
      setPendingId(null);
      if (res.success) {
        toast.success('Erişim kaldırıldı');
        onChanged();
      } else {
        toast.error(res.error || 'Kaldırılamadı');
      }
    });
  };

  return (
    <div className="apple-card overflow-hidden">
      <div className="px-6 py-5 border-b border-[--border] flex items-center justify-between">
        <div>
          <p className="apple-eyebrow">Üyeler</p>
          <h3 className="apple-title-2 mt-1">{members.length} kişi bu profile erişiyor</h3>
        </div>
        {canManage && (
          <button
            onClick={onInvite}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold text-white shadow-md transition-transform active:scale-95"
            style={{ background: 'var(--grad-aurora)' }}
          >
            <UserPlus className="w-4 h-4" strokeWidth={2.25} />
            Davet Et
          </button>
        )}
      </div>

      <div className="divide-y divide-[--border-soft]">
        {members.length === 0 && (
          <div className="px-6 py-10 text-center">
            <p className="text-[14px] text-[--text-tertiary]">Henüz üye yok.</p>
          </div>
        )}
        {members.map((m) => {
          const meta = ROLE_META[m.role] ?? ROLE_META.member;
          const RoleIcon = meta.icon;
          const isSelf = m.userId === currentUserId;
          const isPending = pendingId === m.userId;
          return (
            <div key={m.userId} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[--text]">
                  {m.fullName || m.email}
                  {isSelf && <span className="ml-2 text-[11px] text-[--text-tertiary]">(siz)</span>}
                </p>
                <p className="text-[12px] text-[--text-tertiary]">{m.email}</p>
              </div>

              <div className="flex items-center gap-2">
                {canManage && !isSelf ? (
                  <select
                    value={m.role}
                    disabled={isPending}
                    onChange={(e) => handleRoleChange(m.userId, e.target.value as 'owner' | 'admin' | 'member')}
                    className="text-[12px] rounded-full border border-[--border] bg-white px-3 py-1.5 font-medium"
                  >
                    <option value="owner">Sahip</option>
                    <option value="admin">Yönetici</option>
                    <option value="member">Üye</option>
                  </select>
                ) : (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider',
                      meta.tone
                    )}
                  >
                    <RoleIcon className="w-3 h-3" strokeWidth={2.25} />
                    {meta.label}
                  </span>
                )}

                {canManage && !isSelf && (
                  <button
                    onClick={() => handleRevoke(m.userId, m.email)}
                    disabled={isPending}
                    className="p-2 rounded-full text-[--text-tertiary] hover:text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="Erişimi kaldır"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" strokeWidth={1.75} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InviteForm({ profileId, onDone }: { profileId: string; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'owner' | 'admin' | 'member'>('member');
  const [, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    startTransition(async () => {
      const res = await grantProfileAccess({ profileId, email: email.trim(), role });
      setIsSubmitting(false);
      if (res.success) {
        toast.success('Üye eklendi');
        onDone();
      } else {
        toast.error(res.error || 'Davet başarısız');
      }
    });
  };

  return (
    <form onSubmit={submit} className="p-6 space-y-5">
      <div>
        <label className="block text-[12px] font-semibold uppercase tracking-wider text-[--text-tertiary] mb-2">
          E-posta
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ekip@ornek.com"
          className="w-full px-4 py-3 rounded-xl border border-[--border] bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-[--brand-primary]"
        />
        <p className="text-[11px] text-[--text-tertiary] mt-1.5">
          Kullanıcı önce Erişim sekmesinden sistem hesabı oluşturulmuş olmalı.
        </p>
      </div>

      <div>
        <label className="block text-[12px] font-semibold uppercase tracking-wider text-[--text-tertiary] mb-2">
          Rol
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['owner', 'admin', 'member'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                'py-2.5 rounded-xl text-[13px] font-semibold border transition-all',
                role === r
                  ? 'border-[--brand-primary] text-white shadow-md'
                  : 'border-[--border] bg-white text-[--text-secondary] hover:bg-[--bg-elevated]'
              )}
              style={role === r ? { background: 'var(--grad-aurora)' } : undefined}
            >
              {ROLE_META[r].label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !email.trim()}
        className="w-full py-3 rounded-xl text-[14px] font-semibold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
        style={{ background: 'var(--grad-aurora)' }}
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Ekleniyor...
          </span>
        ) : (
          'Davet Et'
        )}
      </button>
    </form>
  );
}

function BrandForm({ profile, onDone }: { profile: ProfileSummary; onDone: () => void }) {
  const [brandName, setBrandName] = useState(profile.brandName);
  const [monogram, setMonogram] = useState(profile.monogram);
  const [primaryColor, setPrimaryColor] = useState(profile.primaryColor);
  const [accentColor, setAccentColor] = useState(profile.accentColor);
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    startTransition(async () => {
      const res = await updateProfileBranding(profile.id, {
        brandName: brandName.trim(),
        monogram: monogram.trim().toUpperCase(),
        primaryColor,
        accentColor,
        logoUrl: logoUrl.trim() || null,
      });
      setIsSubmitting(false);
      if (res.success) {
        toast.success('Marka güncellendi');
        onDone();
      } else {
        toast.error(res.error || 'Güncellenemedi');
      }
    });
  };

  return (
    <form onSubmit={submit} className="p-6 space-y-5">
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[--bg-elevated]">
        <ProfileSwatch profile={{ ...profile, brandName, monogram, primaryColor, accentColor }} size={56} />
        <div>
          <p className="text-[11px] text-[--text-tertiary] uppercase tracking-wider">Önizleme</p>
          <p className="text-[16px] font-semibold text-[--text] mt-1">{brandName || 'Marka adı'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Marka adı">
          <input
            type="text"
            required
            maxLength={60}
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[--border] bg-white text-[14px]"
          />
        </Field>
        <Field label="Monogram (1-3 harf)">
          <input
            type="text"
            required
            maxLength={3}
            value={monogram}
            onChange={(e) => setMonogram(e.target.value.toUpperCase())}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[--border] bg-white text-[14px] font-mono uppercase tracking-widest"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ColorField label="Ana renk" value={primaryColor} onChange={setPrimaryColor} />
        <ColorField label="Vurgu rengi" value={accentColor} onChange={setAccentColor} />
      </div>

      <Field label="Logo URL (opsiyonel)">
        <input
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-[--border] bg-white text-[14px]"
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 rounded-xl text-[14px] font-semibold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)` }}
      >
        {isSubmitting ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...
          </span>
        ) : (
          'Kaydet'
        )}
      </button>
    </form>
  );
}

function CreateProfileForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [slug, setSlug] = useState('');
  const [monogram, setMonogram] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [accentColor, setAccentColor] = useState('#06B6D4');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  // brandName girilince slug + monogram otomatik öner
  React.useEffect(() => {
    if (brandName && !slug) {
      setSlug(brandName.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32));
    }
    if (brandName && !monogram) {
      const initials = brandName.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 3);
      setMonogram(initials);
    }
  }, [brandName, slug, monogram]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    startTransition(async () => {
      const res = await createProfile({
        name: name.trim() || brandName.trim(),
        brandName: brandName.trim(),
        slug: slug.trim(),
        monogram: monogram.trim().toUpperCase(),
        primaryColor,
        accentColor,
        logoUrl: null,
      });
      setIsSubmitting(false);
      if (res.success) {
        toast.success('Profil oluşturuldu');
        onDone();
      } else {
        toast.error(res.error || 'Oluşturulamadı');
      }
    });
  };

  return (
    <form onSubmit={submit} className="p-6 space-y-5">
      <Field label="Marka adı (UI'da görünür)">
        <input
          type="text"
          required
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="L'Affogato, Karaköy Box, ..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-[--border] bg-white text-[14px]"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Slug (URL/identifier)">
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="laffogato"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[--border] bg-white text-[14px] font-mono"
          />
        </Field>
        <Field label="Monogram">
          <input
            type="text"
            required
            maxLength={3}
            value={monogram}
            onChange={(e) => setMonogram(e.target.value.toUpperCase())}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[--border] bg-white text-[14px] font-mono uppercase tracking-widest"
          />
        </Field>
      </div>

      <Field label="İç ad (opsiyonel, default brand adı)">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={brandName || 'NextGenBox'}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[--border] bg-white text-[14px]"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <ColorField label="Ana renk" value={primaryColor} onChange={setPrimaryColor} />
        <ColorField label="Vurgu rengi" value={accentColor} onChange={setAccentColor} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !brandName.trim() || !slug.trim() || !monogram.trim()}
        className="w-full py-3 rounded-xl text-[14px] font-semibold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)` }}
      >
        {isSubmitting ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Oluşturuluyor...
          </span>
        ) : (
          'Profili Oluştur'
        )}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold uppercase tracking-wider text-[--text-tertiary] mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-11 rounded-xl border border-[--border] bg-white cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          className="flex-1 px-3 py-2.5 rounded-xl border border-[--border] bg-white text-[14px] font-mono uppercase"
        />
      </div>
    </Field>
  );
}
