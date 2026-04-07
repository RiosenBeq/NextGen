'use client';

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Clock, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { updateProfile } from '../profile-actions';
import { cn } from '@/lib/utils';

interface ProfileSettingsProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    lastSignIn?: string;
  };
}

export function ProfileSettingsForm({ user }: ProfileSettingsProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');

    const result = await updateProfile({ fullName });
    if (result.success) {
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
      setErrorMsg(result.error || 'Profil güncellenirken bir hata oluştu.');
    }
    setIsSubmitting(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 bg-white border border-slate-200 shadow-sm rounded-[32px] overflow-hidden"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[28px] bg-slate-900 flex items-center justify-center text-white text-3xl font-bold shadow-2xl relative group">
             {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'US'}
             <div className="absolute inset-0 rounded-[28px] bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity" />
          </div>
          <div className="space-y-1">
             <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Kullanıcı Profili</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{user.id}</p>
          </div>
        </div>

        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 shadow-sm"
          >
            <CheckCircle2 size={16} /> BAŞARIYLA GÜNCELLENDİ
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Ad Soyad</label>
              <div className="relative group">
                 <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                 <input 
                   value={fullName}
                   onChange={e => setFullName(e.target.value)}
                   className="w-full h-14 pl-14 pr-6 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none"
                   placeholder="Tam Adınız..."
                 />
              </div>
           </div>

           <div className="space-y-2 opacity-60 cursor-not-allowed">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                 <Mail size={12} /> E-Posta Adresi
              </label>
              <div className="w-full h-14 px-6 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-medium text-slate-500 flex items-center">
                 {user.email}
              </div>
              <p className="text-[9px] font-medium text-slate-400 italic pl-1">E-posta adresi sistem yöneticisi tarafından değiştirilebilir.</p>
           </div>
        </div>

        <div className="space-y-6">
           <div className="p-8 rounded-[28px] bg-slate-50 border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 text-slate-400">
                 <Shield size={16} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Hesap Detayları</span>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sistem Rolü</span>
                    <p className="text-xs font-bold text-slate-900 uppercase">{user.role}</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Son Giriş</span>
                    <p className="text-xs font-bold text-slate-900">
                       {user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '—'}
                    </p>
                 </div>
              </div>

              <div className="pt-4 border-t border-slate-200/50 flex items-center gap-3 text-amber-600">
                 <Clock size={14} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Parola Sıfırlama İstediği</span>
                 <button type="button" className="ml-auto text-[9px] font-bold bg-white px-3 py-1.5 rounded-lg border border-amber-100 hover:bg-amber-50 transition-all shadow-sm">TALEP GÖNDER</button>
              </div>
           </div>

           <button 
             type="submit" 
             disabled={isSubmitting || fullName === user.fullName}
             className="w-full h-16 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
           >
             {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
             PROFİL BİLGİLERİNİ GÜNCELLE
           </button>
        </div>
      </form>

      {status === 'error' && (
        <div className="mt-8 p-5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-widest flex items-center gap-4">
           <AlertCircle size={20} /> {errorMsg}
        </div>
      )}
    </motion.div>
  );
}
