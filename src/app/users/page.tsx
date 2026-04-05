'use client';

import { useEffect, useState } from 'react';
import { getSystemUsers, createSystemUser, deleteSystemUser } from '@/features/auth/admin-actions';
import { UserPlus, Shield, ShieldCheck, Mail, Clock, LogIn, KeySquare, Trash2, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ModernModal from '@/components/ModernModal';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'superadmin' | 'user'>('user');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    const data = await getSystemUsers();
    setUsers(data || []);
    setIsLoading(false);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    const res = await createSystemUser({ email, password, fullName, role });
    if (!res.success) {
      setFormError(res.error);
      setIsSubmitting(false);
      return;
    }

    // Başarılı
    setIsModalOpen(false);
    setEmail('');
    setPassword('');
    setFullName('');
    setRole('user');
    setIsSubmitting(false);
    loadUsers();
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    const res = await deleteSystemUser(id);
    if (res.success) {
       loadUsers();
    } else {
       alert('Kullanıcı silinemedi: ' + res.error);
    }
  }

  return (
    <div className="page-wrapper max-w-7xl mx-auto p-4 md:p-8 pt-12 space-y-10 animate-fade-in relative z-10 text-slate-900 bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border flex items-center gap-2"
                style={{ color: '#2F6BFF', background: 'rgba(47,107,255,0.05)', borderColor: 'rgba(47,107,255,0.15)' }}
             >
                <ShieldCheck className="w-3 h-3" />
                SİSTEM YÖNETİMİ
             </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic uppercase tracking-tighter" style={{ color: '#1E2A44' }}>
             Yetkili <span style={{ color: '#2F6BFF' }}>Kullanıcılar</span>
          </h1>
          <p className="text-base text-slate-500 font-medium max-w-xl leading-relaxed">
             Siber güvenlik kurallarına uygun kapalı devre <strong style={{ color: '#2F6BFF' }}>SaaS Yetkilendirme</strong> altyapısı. Yalnızca Üst Yöneticiler işlem yapabilir.
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: '#2F6BFF', color: 'white', boxShadow: '0 10px 30px rgba(47,107,255,0.3)' }}
        >
          <UserPlus size={16} />
          Yeni Kullanıcı Ekle
        </button>
      </header>

      {/* Users List */}
      <section className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
             <thead>
               <tr className="bg-slate-50 border-b border-slate-200">
                 <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Profil & Rol</th>
                 <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">E-Posta Adresi</th>
                 <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Kayıt Tarihi</th>
                 <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Son Giriş</th>
                 <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-right">Aksiyon</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {isLoading ? (
                 <tr>
                   <td colSpan={5} className="py-20 text-center">
                     <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                   </td>
                 </tr>
               ) : users.map((user, idx) => (
                 <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                   <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner" style={user.role === 'superadmin' ? { background: '#1E2A44', color: 'white' } : { background: 'rgba(47,107,255,0.1)', color: '#2F6BFF' }}>
                            {user.fullName !== '-' ? user.fullName.substring(0, 2).toUpperCase() : 'US'}
                         </div>
                         <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">{user.fullName}</span>
                            <span className={cn(
                               "text-[10px] font-black uppercase tracking-widest mt-0.5",
                               user.role === 'superadmin' ? 'text-amber-500' : 'text-slate-500'
                            )}>
                               {user.role === 'superadmin' ? 'Üst Yönetici' : 'Platform Kullanıcısı'}
                            </span>
                         </div>
                      </div>
                   </td>
                   <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                         <Mail size={14} className="text-slate-400" />
                         {user.email}
                      </div>
                   </td>
                   <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
                         <Clock size={12} className="text-slate-400" />
                         {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                   </td>
                   <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
                         <LogIn size={12} className="text-slate-400" />
                         {user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString('tr-TR') : 'Hiç giriş yapmadı'}
                      </div>
                   </td>
                   <td className="px-8 py-6 text-right">
                      <button 
                         onClick={() => handleDelete(user.id)}
                         className="p-2 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                         title="Kullanıcıyı Sil"
                      >
                         <Trash2 size={16} />
                      </button>
                   </td>
                 </tr>
               ))}
               {!isLoading && users.length === 0 && (
                 <tr>
                   <td colSpan={5} className="py-20 text-center text-slate-500 font-medium">Hiç kullanıcı bulunamadı.</td>
                 </tr>
               )}
             </tbody>
          </table>
        </div>
      </section>

      {/* Add User Modal */}
      <ModernModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
         <div className="p-8 space-y-8 bg-white min-w-[320px] md:min-w-[480px]">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center border" style={{ background: 'rgba(47,107,255,0.05)', borderColor: 'rgba(47,107,255,0.15)' }}>
                     <UserPlus size={20} style={{ color: '#2F6BFF' }} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Yeni Kullanıcı</h3>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
                  <X size={20} />
               </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-5">
               {formError && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-2 shadow-sm">
                     <Shield size={14} />
                     {formError}
                  </div>
               )}

               <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Ad Soyad (Opsiyonel)</label>
                  <input 
                     type="text" 
                     value={fullName}
                     onChange={(e) => setFullName(e.target.value)}
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none transition-all shadow-inner"
                     placeholder="John Doe"
                     onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 4px rgba(47,107,255,0.2)"; e.currentTarget.style.borderColor = "rgba(47,107,255,0.5)"; e.currentTarget.style.backgroundColor = "white"; }}
                     onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.backgroundColor = "#F8FAFC"; }}
                  />
               </div>

               <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">E-Posta Adresi</label>
                  <div className="relative">
                     <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none transition-all shadow-inner"
                        placeholder="admin@nextgen.com"
                        onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 4px rgba(47,107,255,0.2)"; e.currentTarget.style.borderColor = "rgba(47,107,255,0.5)"; e.currentTarget.style.backgroundColor = "white"; }}
                        onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.backgroundColor = "#F8FAFC"; }}
                     />
                  </div>
               </div>

               <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Sistem Şifresi</label>
                  <div className="relative">
                     <KeySquare size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none transition-all shadow-inner"
                        placeholder="••••••••"
                        onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 4px rgba(47,107,255,0.2)"; e.currentTarget.style.borderColor = "rgba(47,107,255,0.5)"; e.currentTarget.style.backgroundColor = "white"; }}
                        onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.backgroundColor = "#F8FAFC"; }}
                     />
                  </div>
               </div>

               <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Yetki Seviyesi</label>
                  <div className="grid grid-cols-2 gap-3">
                     <button
                        type="button"
                        onClick={() => setRole('user')}
                        className={cn(
                           "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all",
                           role === 'user' ? "bg-white border-blue-500 shadow-[0_0_0_4px_rgba(47,107,255,0.1)]" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        )}
                     >
                        <Shield size={20} className={role === 'user' ? 'text-blue-600' : 'text-slate-400'} />
                        <span className={cn("text-[10px] font-black uppercase tracking-widest mt-2", role === 'user' ? 'text-blue-600' : 'text-slate-500')}>Kullanıcı</span>
                     </button>
                     <button
                        type="button"
                        onClick={() => setRole('superadmin')}
                        className={cn(
                           "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all",
                           role === 'superadmin' ? "bg-slate-900 border-slate-900 shadow-md" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        )}
                     >
                        <ShieldCheck size={20} className={role === 'superadmin' ? 'text-amber-500' : 'text-slate-400'} />
                        <span className={cn("text-[10px] font-black uppercase tracking-widest mt-2", role === 'superadmin' ? 'text-white' : 'text-slate-500')}>Üst Yönetici</span>
                     </button>
                  </div>
               </div>

               <div className="pt-4 mt-8 border-t border-slate-100">
                  <button 
                     type="submit"
                     disabled={isSubmitting}
                     className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                     style={{ background: '#2F6BFF', color: 'white' }}
                  >
                     {isSubmitting ? 'Doğrulanıyor...' : 'Erişim Tanımla'}
                  </button>
               </div>
            </form>
         </div>
      </ModernModal>
    </div>
  );
}
