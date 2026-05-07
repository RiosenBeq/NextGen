'use client';

import React, { useMemo, useState } from 'react';
import { User, Mail, Shield, Save, Loader2, CheckCircle2, AlertCircle, Lock, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { updateProfile } from '../profile-actions';

interface ProfileSettingsProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    birthDate?: string;
    lastSignIn?: string;
  };
}

const inputBase =
  'w-full px-4 py-3 rounded-xl bg-[--bg-elevated] border border-transparent text-[15px] text-[--text] placeholder:text-[--text-tertiary] focus:outline-none focus:bg-[--surface] focus:border-[--accent] transition-colors duration-200 min-h-[44px]';

export function ProfileSettingsForm({ user }: ProfileSettingsProps) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [birthDate, setBirthDate] = useState(user.birthDate || '');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isDirty = useMemo(() => {
    return fullName !== (user.fullName || '') || birthDate !== (user.birthDate || '') || password.length > 0;
  }, [fullName, birthDate, password, user.fullName, user.birthDate]);

  const initials = useMemo(() => {
    const source = (fullName || user.email || '').trim();
    if (!source) return '?';
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [fullName, user.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');

    const result = await updateProfile({ fullName, birthDate, password });
    if (result.success) {
      setStatus('success');
      setPassword('');
      setTimeout(() => setStatus('idle'), 2500);
    } else {
      setStatus('error');
      setErrorMsg(result.error || 'Profil güncellenirken bir hata oluştu.');
    }
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="apple-card p-6 md:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[--bg-elevated] text-[--text-secondary] flex items-center justify-center text-[14px] font-medium tabular-nums">
            {initials}
          </div>
          <div>
            <p className="apple-eyebrow">Profil</p>
            <h3 className="apple-title-1 mt-1">Hesap Ayarları</h3>
            <p className="text-[14px] text-[--text-secondary] mt-1">İsim, doğum tarihi ve şifre bilgilerinizi güncelleyin.</p>
          </div>
        </div>
        {status === 'success' && (
          <div className="chip-accent inline-flex items-center gap-2">
            <CheckCircle2 size={14} strokeWidth={1.75} /> Kaydedildi
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputField label="Ad Soyad" icon={<User size={16} strokeWidth={1.75} />} value={fullName} onChange={setFullName} placeholder="Tam adınız" />

        <div className="space-y-2">
          <label className="text-[13px] font-medium text-[--text]">E-posta</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-tertiary]">
              <Mail size={16} strokeWidth={1.75} />
            </div>
            <div className="w-full pl-10 pr-4 py-3 rounded-xl bg-[--bg-elevated] text-[15px] text-[--text-tertiary] truncate min-h-[44px] flex items-center">
              {user.email}
            </div>
          </div>
        </div>

        <InputField
          label="Doğum Tarihi"
          icon={<CalendarDays size={16} strokeWidth={1.75} />}
          value={birthDate}
          onChange={setBirthDate}
          type="date"
          placeholder=""
        />

        <InputField
          label="Yeni Şifre"
          icon={<Lock size={16} strokeWidth={1.75} />}
          value={password}
          onChange={setPassword}
          type="password"
          placeholder="Boş bırakırsanız değişmez"
        />

        <div className="md:col-span-2 rounded-xl bg-[--bg-elevated] p-4 space-y-2">
          <p className="text-[12px] text-[--text-tertiary]">Hesap Bilgileri</p>
          <p className="text-[14px] text-[--text] inline-flex items-center gap-2">
            <Shield size={14} strokeWidth={1.75} className="text-[--text-tertiary]" /> Rol: <span className="font-medium">{user.role}</span>
          </p>
          <p className="text-[12px] text-[--text-tertiary] tabular-nums">
            Son giriş: {user.lastSignIn ? new Date(user.lastSignIn).toLocaleString('tr-TR') : '—'}
          </p>
        </div>

        {status === 'error' && (
          <div className="md:col-span-2 rounded-xl bg-[--danger-soft] px-4 py-3 text-[14px] text-[--danger] inline-flex items-center gap-2">
            <AlertCircle size={16} strokeWidth={1.75} /> {errorMsg}
          </div>
        )}

        <div className="md:col-span-2 pt-6 border-t border-[--border] flex justify-end gap-3">
          <button type="submit" disabled={isSubmitting || !isDirty} className="elite-button-primary">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" strokeWidth={2} /> : <Save size={16} strokeWidth={1.75} />}
            Güncelle
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function InputField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[13px] font-medium text-[--text]">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-tertiary]">{icon}</div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputBase} pl-10`}
        />
      </div>
    </div>
  );
}
