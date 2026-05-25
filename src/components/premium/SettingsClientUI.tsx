'use client';
import { useRouter } from 'next/navigation';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Database,
  Users,
  MapPin,
  Sliders,
  HelpCircle,
  Trash2,
  Mail,
  UserPlus,
  Shield,
  KeySquare,
  Lock,
  Loader2,
  User,
  Save,
  Eye,
  Cloud,
  Server,
  Workflow,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SystemParametersForm } from '@/features/ledger/components/SystemParametersForm';
import { LocationSettingsForm } from '@/features/ledger/components/LocationSettingsForm';
import { ProfileSettingsForm } from '@/features/auth/components/ProfileSettingsForm';
import { createSystemUser, deleteSystemUser, updateSystemUserAccess } from '@/features/auth/admin-actions';
import { PremiumModal } from './PremiumModal';
import { toast } from '@/hooks/useToast';

type SettingsLocation = {
  id: string;
  name: string;
  fixedRent?: number;
  duesAmount?: number;
  revenueShareRate?: number;
  revenueThreshold?: number;
  rentVatRate?: number;
};

type SettingsUser = {
  id: string;
  email?: string;
  fullName?: string;
  role?: string;
  birthDate?: string;
  lastSignIn?: string;
  createdAt?: string;
};

interface SettingsClientProps {
  locations: SettingsLocation[];
  parameters: Record<string, number>;
  users: SettingsUser[];
  currentUser: SettingsUser | null;
}

export default function SettingsClientUI({ locations, parameters, users, currentUser }: SettingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'general' | 'locations' | 'users' | 'profile' | 'integrations'>('general');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'superadmin' | 'user'>('user');
  const [formError, setFormError] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [draftProfiles, setDraftProfiles] = useState<Record<string, { fullName: string; role: 'superadmin' | 'user' }>>(() =>
    (users || []).reduce<Record<string, { fullName: string; role: 'superadmin' | 'user' }>>((acc, user) => {
      acc[user.id] = { fullName: user.fullName || '', role: user.role === 'superadmin' ? 'superadmin' : 'user' };
      return acc;
    }, {})
  );
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    const res = await createSystemUser({ email, password, fullName, role });
    if (res.success) {
      setIsUserModalOpen(false);
      router.refresh();
    } else {
      setFormError(res.error || 'Kullanıcı oluşturulamadı.');
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Bu yetkili hesabı silmek istediğinize emin misiniz?')) {
      await deleteSystemUser(id);
      router.refresh();
    }
  };

  const handleDraftChange = (userId: string, key: 'fullName' | 'role', value: string) => {
    setDraftProfiles((prev) => ({
      ...prev,
      [userId]: {
        fullName: key === 'fullName' ? value : (prev[userId]?.fullName || ''),
        role: key === 'role' ? (value as 'superadmin' | 'user') : (prev[userId]?.role || 'user'),
      },
    }));
  };

  const handleSaveUser = async (id: string) => {
    const draft = draftProfiles[id];
    if (!draft?.fullName?.trim()) {
      toast.error('Ad soyad alanı boş bırakılamaz.');
      return;
    }

    setSavingUserId(id);
    const res = await updateSystemUserAccess({
      userId: id,
      fullName: draft.fullName.trim(),
      role: draft.role,
    });

    if (res.success) {
      setEditingUserId(null);
      router.refresh();
      return;
    }

    toast.error(res.error || 'Kullanıcı güncellenemedi.');
    setSavingUserId(null);
  };

  const selectedProfile = users.find((u) => u.id === selectedProfileId);
  const superAdminCount = users.filter((user) => user.role === 'superadmin').length;

  return (
    <div className="space-y-8 sm:space-y-12 md:space-y-16 animate-fade-in">
      {/* Header */}
      <header>
        <p className="apple-eyebrow">Sistem</p>
        <h1 className="apple-headline mt-3">Sistem <span className="hero-serif text-gradient-aurora">ayarları</span></h1>
        <p className="mt-4 apple-body max-w-2xl">
          Operasyonel parametreler, lokasyon yapılandırmaları ve erişim kontrolü.
        </p>
      </header>

      {/* Status cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        <StatusCard label="Aktif Şube" value={`${locations.length}`} icon={<MapPin size={18} strokeWidth={1.75} />} />
        <StatusCard label="Kullanıcı" value={`${users.length}`} icon={<Users size={18} strokeWidth={1.75} />} />
        <StatusCard label="Süper Admin" value={`${superAdminCount}`} icon={<ShieldCheck size={18} strokeWidth={1.75} />} highlight />
        <StatusCard label="Build" value="2026.04" icon={<Database size={18} strokeWidth={1.75} />} />
      </section>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        <aside className="lg:col-span-3 space-y-3 lg:sticky lg:top-20">
          <div className="apple-card p-2 space-y-1">
            <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Sliders size={16} strokeWidth={1.75} />} label="Genel" />
            <TabButton active={activeTab === 'locations'} onClick={() => setActiveTab('locations')} icon={<MapPin size={16} strokeWidth={1.75} />} label="Şube" />
            <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={16} strokeWidth={1.75} />} label="Erişim" />
            <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={16} strokeWidth={1.75} />} label="Profil" />
            <TabButton active={activeTab === 'integrations'} onClick={() => setActiveTab('integrations')} icon={<Workflow size={16} strokeWidth={1.75} />} label="Entegrasyon" />
          </div>

          <div className="apple-card p-5 bg-[--bg-elevated]">
            <div className="flex items-center gap-2 text-[--accent]">
              <HelpCircle size={14} strokeWidth={1.75} />
              <span className="text-[12px] font-medium">Sistem Notu</span>
            </div>
            <p className="text-[13px] text-[--text-secondary] mt-2 leading-relaxed">
              Burada yapacağınız değişiklikler dashboard ve raporları geriye dönük etkileyebilir.
            </p>
          </div>
        </aside>

        <main className="lg:col-span-9">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <motion.div key="general" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="space-y-6">
                <SectionHeader title="Finansal Temeller" eyebrow="Parametreler" icon={<Database size={18} strokeWidth={1.75} />} />
                <SystemParametersForm parameters={parameters} />
              </motion.div>
            )}

            {activeTab === 'locations' && (
              <motion.div key="locations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="space-y-6">
                <SectionHeader title="Şube Konfigürasyonu" eyebrow="Lokasyonlar" icon={<MapPin size={18} strokeWidth={1.75} />} />
                <div className="grid grid-cols-1 gap-5">
                  {locations.map((loc) => (
                    <LocationSettingsForm key={loc.id} location={loc} />
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <SectionHeader title="Erişim Kontrolü" eyebrow="Yetkiler" icon={<ShieldCheck size={18} strokeWidth={1.75} />} />
                  <button onClick={() => setIsUserModalOpen(true)} className="elite-button-primary">
                    <UserPlus size={16} strokeWidth={1.75} /> Yeni Hesap
                  </button>
                </div>

                <div className="apple-card overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[--border]">
                        <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary]">Kullanıcı</th>
                        <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-center">Yetki</th>
                        <th className="px-6 py-4 text-[13px] font-medium text-[--text-secondary] text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[--border-soft]">
                      {users.map((user) => (
                        <tr key={user.id} className="group hover:bg-[--bg-subtle] transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[--bg-elevated] flex items-center justify-center text-[13px] font-medium text-[--text-secondary]">
                                {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'US'}
                              </div>
                              <div className="flex flex-col">
                                {editingUserId === user.id ? (
                                  <input
                                    value={draftProfiles[user.id]?.fullName || ''}
                                    onChange={(e) => handleDraftChange(user.id, 'fullName', e.target.value)}
                                    className="h-9 px-3 rounded-xl bg-[--bg-elevated] border border-transparent text-[14px] font-medium text-[--text] outline-none focus:bg-[--surface] focus:border-[--accent]"
                                  />
                                ) : (
                                  <span className="text-[15px] font-medium text-[--text]" style={{ letterSpacing: '-0.005em' }}>{user.fullName || '—'}</span>
                                )}
                                <span className="text-[12px] text-[--text-tertiary]">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            {editingUserId === user.id ? (
                              <select
                                value={draftProfiles[user.id]?.role || 'user'}
                                onChange={(e) => handleDraftChange(user.id, 'role', e.target.value)}
                                className="h-10 px-3 rounded-xl bg-[--bg-elevated] border border-transparent text-[13px] focus:bg-[--surface] focus:border-[--accent]"
                              >
                                <option value="user">Standart</option>
                                <option value="superadmin">Süper Admin</option>
                              </select>
                            ) : (
                              <span className={cn('chip', user.role === 'superadmin' && 'chip-accent')}>
                                {user.role === 'superadmin' ? <Shield size={12} strokeWidth={1.75} /> : <Users size={12} strokeWidth={1.75} />}
                                {user.role === 'superadmin' ? 'Süper Admin' : 'Standart'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setSelectedProfileId(user.id)}
                                className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--text] hover:bg-[--bg-elevated] transition-colors"
                                aria-label="Profil"
                              >
                                <Eye size={14} strokeWidth={1.75} />
                              </button>
                              {editingUserId === user.id ? (
                                <button
                                  onClick={() => handleSaveUser(user.id)}
                                  disabled={savingUserId === user.id}
                                  className="elite-button-tertiary"
                                >
                                  {savingUserId === user.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={1.75} />}
                                  Kaydet
                                </button>
                              ) : (
                                <button
                                  onClick={() => setEditingUserId(user.id)}
                                  className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--text] hover:bg-[--bg-elevated] transition-colors"
                                  aria-label="Yetki Düzenle"
                                >
                                  <ShieldCheck size={14} strokeWidth={1.75} />
                                </button>
                              )}
                              {user.id !== currentUser?.id ? (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="w-9 h-9 flex items-center justify-center rounded-full text-[--text-tertiary] hover:text-[--danger] hover:bg-[--danger-soft] transition-colors"
                                  aria-label="Sil"
                                >
                                  <Trash2 size={14} strokeWidth={1.75} />
                                </button>
                              ) : (
                                <span className="text-[11px] font-medium text-[--accent] px-2">Siz</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="space-y-6">
                <SectionHeader title="Profilim" eyebrow="Kişisel" icon={<User size={18} strokeWidth={1.75} />} />
                {currentUser && (
                  <ProfileSettingsForm
                    user={{
                      id: currentUser.id,
                      email: currentUser.email ?? '',
                      fullName: currentUser.fullName ?? '',
                      role: currentUser.role ?? '',
                      birthDate: currentUser.birthDate,
                      lastSignIn: currentUser.lastSignIn,
                    }}
                  />
                )}
              </motion.div>
            )}

            {activeTab === 'integrations' && (
              <motion.div key="integrations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="space-y-6">
                <SectionHeader title="Entegrasyonlar" eyebrow="Bağlantılar" icon={<Cloud size={18} strokeWidth={1.75} />} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="apple-card p-5 sm:p-6 space-y-3">
                    <p className="apple-eyebrow">Veri Servisi</p>
                    <p className="text-[18px] font-medium text-[--text] inline-flex items-center gap-2">
                      <Server size={18} strokeWidth={1.75} className="text-[--text-secondary]" /> Supabase
                    </p>
                    <p className="text-[14px] text-[--text-secondary] leading-relaxed">
                      Notlar, giderler, loglar ve kullanıcı verileri Supabase üzerinde yönetiliyor.
                    </p>
                    <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-[--accent] hover:text-[--accent-hover]">
                      Supabase panelini aç →
                    </a>
                  </div>

                  <div className="apple-card p-5 sm:p-6 space-y-3">
                    <p className="apple-eyebrow">Yayın Ortamı</p>
                    <p className="text-[18px] font-medium text-[--text] inline-flex items-center gap-2">
                      <Cloud size={18} strokeWidth={1.75} className="text-[--text-secondary]" /> Vercel
                    </p>
                    <p className="text-[14px] text-[--text-secondary] leading-relaxed">
                      Uygulama dağıtımı ve çalışma zamanı Vercel altyapısında devam ediyor.
                    </p>
                    <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-[--accent] hover:text-[--accent-hover]">
                      Vercel panelini aç →
                    </a>
                  </div>
                </div>

                <div className="apple-card p-5 sm:p-6 bg-[--accent-soft]">
                  <p className="text-[13px] font-medium text-[--accent]">Gelişmiş Ayar Notu</p>
                  <p className="text-[14px] text-[--text-secondary] mt-2 leading-relaxed">
                    Bu panelde yapılan değişiklikler tüm sistem ekranlarına anlık olarak yansıtılır.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Add User Modal */}
      <PremiumModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Yeni Hesap Tanımla" maxWidth="max-w-xl">
        <form onSubmit={handleCreateUser} className="space-y-6 p-1">
          {formError && (
            <div className="p-4 rounded-xl bg-[--danger-soft] text-[--danger] text-[14px] flex items-center gap-3">
              <Lock size={16} strokeWidth={1.75} />
              {formError}
            </div>
          )}

          <div className="space-y-4">
            <InputGroup label="Ad Soyad" value={fullName} onChange={setFullName} placeholder="Örn. Okan Berk" />
            <InputGroup label="E-posta" icon={<Mail size={16} strokeWidth={1.75} />} value={email} onChange={setEmail} type="email" placeholder="ornek@nextgen.com" />
            <InputGroup label="Şifre" icon={<KeySquare size={16} strokeWidth={1.75} />} value={password} onChange={setPassword} type="password" placeholder="••••••••" />

            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[--text]">Yetki Seviyesi</label>
              <div className="grid grid-cols-2 gap-3">
                <RoleButton active={role === 'user'} onClick={() => setRole('user')} label="Standart" icon={<Users size={18} strokeWidth={1.75} />} />
                <RoleButton active={role === 'superadmin'} onClick={() => setRole('superadmin')} label="Süper Admin" icon={<ShieldCheck size={18} strokeWidth={1.75} />} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="elite-button-primary w-full">
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" strokeWidth={2} /> İşleniyor…
              </>
            ) : (
              <>
                <UserPlus size={16} strokeWidth={1.75} /> Hesap Oluştur
              </>
            )}
          </button>
        </form>
      </PremiumModal>

      <PremiumModal
        isOpen={Boolean(selectedProfile)}
        onClose={() => setSelectedProfileId(null)}
        title="Profil"
        maxWidth="max-w-lg"
      >
        {selectedProfile && (
          <div className="space-y-6 p-1">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[--bg-elevated] flex items-center justify-center text-[15px] font-medium text-[--text-secondary]">
                {selectedProfile.fullName ? selectedProfile.fullName.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <div>
                <p className="text-[18px] font-medium text-[--text]" style={{ letterSpacing: '-0.014em' }}>
                  {selectedProfile.fullName || 'İsimsiz Kullanıcı'}
                </p>
                <p className="text-[13px] text-[--text-tertiary]">{selectedProfile.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="Rol" value={selectedProfile.role === 'superadmin' ? 'Süper Admin' : 'Standart'} />
              <InfoItem label="Son Giriş" value={selectedProfile.lastSignIn ? new Date(selectedProfile.lastSignIn).toLocaleString('tr-TR') : '—'} />
              <InfoItem label="Kayıt Tarihi" value={selectedProfile.createdAt ? new Date(selectedProfile.createdAt).toLocaleDateString('tr-TR') : '—'} />
              <InfoItem label="ID" value={selectedProfile.id.slice(0, 8)} />
            </div>

            <p className="text-[13px] text-[--text-secondary] bg-[--bg-elevated] rounded-xl p-3 leading-relaxed">
              Yetki ve ad-soyad güncellemeleri için kullanıcı satırındaki kalkan ikonunu kullanabilirsiniz.
            </p>
          </div>
        )}
      </PremiumModal>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[--bg-elevated] p-3">
      <p className="text-[12px] text-[--text-tertiary]">{label}</p>
      <p className="text-[14px] font-medium text-[--text] mt-1 break-words">{value}</p>
    </div>
  );
}

function SectionHeader({ title, eyebrow, icon }: { title: string; eyebrow: string; icon: React.ReactNode }) {
  return (
    <div>
      <p className="apple-eyebrow flex items-center gap-2">
        {icon}
        {eyebrow}
      </p>
      <h2 className="apple-title-1 mt-2">{title}</h2>
    </div>
  );
}

function TabButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 flex items-center gap-3 rounded-xl transition-colors text-left min-h-[44px]',
        active ? 'bg-[--bg-elevated] text-[--text] font-medium' : 'text-[--text-secondary] hover:text-[--text] hover:bg-[--bg-elevated]'
      )}
    >
      <span className={cn(active ? 'text-[--accent]' : 'text-[--text-tertiary]')}>{icon}</span>
      <span className="text-[14px]" style={{ letterSpacing: '-0.005em' }}>{label}</span>
    </button>
  );
}

function InputGroup({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[13px] font-medium text-[--text]">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[--text-tertiary]">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full h-12 bg-[--bg-elevated] border border-transparent rounded-xl text-[15px] text-[--text] focus:bg-[--surface] focus:border-[--accent] transition-colors outline-none placeholder:text-[--text-tertiary]',
            icon ? 'pl-11 pr-4' : 'px-4'
          )}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function RoleButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-4 rounded-xl border transition-colors text-left flex flex-col gap-3 min-h-[44px]',
        active ? 'bg-[--bg-elevated] border-[--accent] text-[--text]' : 'bg-transparent border-[--border] text-[--text-secondary] hover:bg-[--bg-elevated]'
      )}
    >
      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center', active ? 'bg-[--accent] text-white' : 'bg-[--bg-elevated] text-[--text-tertiary]')}>
        {icon}
      </div>
      <span className="text-[14px] font-medium" style={{ letterSpacing: '-0.005em' }}>{label}</span>
    </button>
  );
}

function StatusCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="apple-card p-5 md:p-6">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[--text-tertiary]">{label}</p>
        <span className={cn(highlight ? 'text-[--accent]' : 'text-[--text-tertiary]')}>{icon}</span>
      </div>
      <p className="mt-2 text-[24px] md:text-[28px] font-semibold tabular-nums text-[--text]" style={{ letterSpacing: '-0.022em' }}>{value}</p>
    </div>
  );
}
