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
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150';

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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="rounded-2xl border border-slate-200/70 bg-white p-6 md:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-semibold tabular-nums">
            {initials}
          </div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">Profil Ayarları</h3>
            <p className="text-sm text-slate-500 mt-0.5">İsim, doğum tarihi ve şifre bilgilerinizi buradan güncelleyebilirsiniz.</p>
          </div>
        </div>
        {status === 'success' && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600">
            <CheckCircle2 size={14} /> Başarıyla kaydedildi
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField label="Ad Soyad" icon={<User size={16} />} value={fullName} onChange={setFullName} placeholder="Tam adınız" />

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">E-posta</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Mail size={16} />
            </div>
            <div className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-500 truncate">
              {user.email}
            </div>
          </div>
        </div>

        <InputField
          label="Doğum Tarihi"
          icon={<CalendarDays size={16} />}
          value={birthDate}
          onChange={setBirthDate}
          type="date"
          placeholder=""
        />

        <InputField
          label="Yeni Şifre"
          icon={<Lock size={16} />}
          value={password}
          onChange={setPassword}
          type="password"
          placeholder="Boş bırakırsanız değişmez"
        />

        <div className="md:col-span-2 rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Hesap Bilgileri</p>
          <p className="text-sm text-slate-700 inline-flex items-center gap-2">
            <Shield size={14} className="text-slate-400" /> Rol: <span className="font-medium text-slate-900">{user.role}</span>
          </p>
          <p className="text-xs text-slate-500 tabular-nums">
            Son giriş: {user.lastSignIn ? new Date(user.lastSignIn).toLocaleString('tr-TR') : '—'}
          </p>
        </div>

        {status === 'error' && (
          <div className="md:col-span-2 rounded-xl border border-rose-200/70 bg-rose-50 px-4 py-3 text-sm text-rose-600 inline-flex items-center gap-2">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <div className="md:col-span-2 pt-6 border-t border-slate-200/70 flex justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl font-medium text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-colors"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Profili Güncelle
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
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
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
