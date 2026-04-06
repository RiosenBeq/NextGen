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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-slate-900">Profil Ayarları</h3>
          <p className="text-xs text-slate-500 mt-1">İsim, doğum tarihi ve şifre bilgilerinizi buradan güncelleyebilirsiniz.</p>
        </div>
        {status === 'success' && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
            <CheckCircle2 size={14} /> Başarıyla kaydedildi
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField label="Ad Soyad" icon={<User size={16} />} value={fullName} onChange={setFullName} placeholder="Tam adınız" />

        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">E-posta</label>
          <div className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-500 inline-flex items-center gap-2 w-full">
            <Mail size={16} />
            <span className="truncate">{user.email}</span>
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

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Hesap Bilgileri</p>
          <p className="text-sm text-slate-700 inline-flex items-center gap-2"><Shield size={14} /> Rol: <b className="uppercase">{user.role}</b></p>
          <p className="text-xs text-slate-500">Son giriş: {user.lastSignIn ? new Date(user.lastSignIn).toLocaleString('tr-TR') : '—'}</p>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="h-12 px-6 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wide hover:bg-slate-800 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Profili Güncelle
          </button>
        </div>
      </form>

      {status === 'error' && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 inline-flex items-center gap-2">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}
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
      <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
        />
      </div>
    </div>
  );
}
