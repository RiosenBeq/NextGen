'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Database, 
  Users, 
  MapPin, 
  Sliders, 
  ChevronRight, 
  HelpCircle,
  Plus,
  Trash2,
  Mail,
  UserPlus,
  Shield,
  Activity,
  Zap,
  KeySquare,
  Lock,
  Globe,
  Bell,
  Cpu,
  Monitor,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SystemParametersForm } from '@/features/ledger/components/SystemParametersForm';
import { LocationSettingsForm } from '@/features/ledger/components/LocationSettingsForm';
import { createSystemUser, deleteSystemUser } from '@/features/auth/admin-actions';
import { PremiumModal, PremiumDrawer } from './PremiumModal';

interface SettingsClientProps {
  locations: any[];
  parameters: Record<string, number>;
  users: any[];
  currentUser: any;
}

export default function SettingsClientUI({ locations, parameters, users, currentUser }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'locations' | 'users'>('general');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'superadmin' | 'user'>('user');
  const [formError, setFormError] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    const res = await createSystemUser({ email, password, fullName, role });
    if (res.success) {
      setIsUserModalOpen(false);
      window.location.reload();
    } else {
      setFormError(res.error || 'Kullanıcı oluşturulamadı.');
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Bu yetkili hesabı silmek istediğinize emin misiniz?')) {
      await deleteSystemUser(id);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* Premium Header */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-8">
        <div className="space-y-1.5">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                 <Settings size={28} />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sistem Ayarları</h1>
           </div>
           <p className="text-sm text-slate-500 font-medium italic pl-1">
              Operasyonel parametreler, lokasyon bazlı yapılandırmalar ve erişim kontrolü.
           </p>
        </div>
        
        <div className="hidden lg:flex items-center gap-4">
           <div className="bg-white border border-slate-200 px-6 py-4 rounded-[24px] shadow-sm flex items-center gap-5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg"><Zap size={20} /></div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">SİSTEM VERSİYON</span>
                 <span className="text-sm font-bold text-slate-900 tracking-tight">Build 2026.0406 <span className="text-[10px] font-medium text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full ml-1">STABLE</span></span>
              </div>
           </div>
        </div>
      </header>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
         
         <aside className="lg:col-span-3 space-y-2 lg:sticky lg:top-8">
            <div className="p-1 bg-slate-50 rounded-[28px] border border-slate-200 space-y-1">
               <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Sliders size={18} />} label="Genel Yapılandırma" />
               <TabButton active={activeTab === 'locations'} onClick={() => setActiveTab('locations')} icon={<MapPin size={18} />} label="Şube Ayarları" />
               <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={18} />} label="Erişim & Yetki" />
            </div>
            
            <div className="pt-6 px-4">
               <div className="p-6 rounded-[24px] bg-blue-50 border border-blue-100/50 space-y-4">
                  <div className="flex items-center gap-2 text-blue-600">
                     <HelpCircle size={16} />
                     <span className="text-[10px] font-bold uppercase tracking-widest">Sistem Notu</span>
                  </div>
                  <p className="text-[11px] text-blue-800/70 font-medium leading-relaxed italic">
                     Burada yapacağınız tüm değişiklikler finansal raporları ve dashboard metriklerini geriye dönük olarak etkileyebilir. Değişiklik yapmadan önce verileri doğrulayın.
                  </p>
               </div>
            </div>
         </aside>

         <main className="lg:col-span-9">
            <AnimatePresence mode="wait">
               {activeTab === 'general' && (
                  <motion.div key="general" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                     <SectionHeader title="Finansal Temeller" icon={<Database className="text-blue-600" />} />
                     <SystemParametersForm parameters={parameters} />
                  </motion.div>
               )}

               {activeTab === 'locations' && (
                  <motion.div key="locations" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                     <SectionHeader title="Aktif Şube Konfigürasyonu" icon={<MapPin className="text-emerald-600" />} />
                     <div className="grid grid-cols-1 gap-8">
                        {locations.map(loc => (
                           <div key={loc.id} className="group transition-all">
                              <LocationSettingsForm location={loc} />
                           </div>
                        ))}
                     </div>
                  </motion.div>
               )}

               {activeTab === 'users' && (
                  <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <SectionHeader title="Yetkili Erişim Kontrolü" icon={<ShieldCheck className="text-slate-900" />} />
                        <button 
                           onClick={() => setIsUserModalOpen(true)} 
                           className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[11px] font-bold tracking-widest uppercase flex items-center justify-center gap-3 shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                        >
                           <UserPlus size={18} /> Yeni Hesap Tanımla
                        </button>
                     </div>

                     <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                 <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yetkili Kullanıcı</th>
                                 <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Erişim Yetkisi</th>
                                 <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">İşlemler</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {users.map(user => (
                                 <tr key={user.id} className="group hover:bg-slate-50/50 transition-all">
                                    <td className="px-8 py-6">
                                       <div className="flex items-center gap-4">
                                          <div className={cn(
                                             "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-inner transition-transform group-hover:scale-110", 
                                             user.role === 'superadmin' ? 'bg-slate-900 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                          )}>
                                             {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'US'}
                                          </div>
                                          <div className="flex flex-col">
                                             <span className="text-sm font-bold text-slate-900 tracking-tight">{user.fullName || '—'}</span>
                                             <span className="text-[11px] font-medium text-slate-400">{user.email}</span>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                       <span className={cn(
                                          "inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border shadow-sm", 
                                          user.role === 'superadmin' ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-slate-50 text-slate-400 border-slate-100"
                                       )}>
                                          {user.role === 'superadmin' ? <Shield size={12} /> : <Users size={12} />}
                                          {user.role === 'superadmin' ? 'SÜPER ADMİN' : 'STANDART YETKİLİ'}
                                       </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                       {user.id !== currentUser?.id ? (
                                          <button 
                                             onClick={() => handleDeleteUser(user.id)} 
                                             className="p-3 rounded-xl border border-slate-100 text-slate-300 hover:text-rose-600 hover:bg-white hover:border-rose-100 transition-all opacity-0 group-hover:opacity-100"
                                             title="Erişimi Kaldır"
                                          >
                                             <Trash2 size={18} />
                                          </button>
                                       ) : (
                                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest italic pr-4">SİZİN HESABINIZ</span>
                                       )}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </main>
      </div>

      {/* Add User Modal */}
      <PremiumModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Yeni Erişim Hattı Tanımla" maxWidth="max-w-xl">
         <form onSubmit={handleCreateUser} className="p-8 space-y-8">
            {formError && (
               <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-widest flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-rose-600 shadow-sm"><Lock size={16} /></div>
                  {formError}
               </div>
            )}
            
            <div className="space-y-6">
               <InputGroup label="TAM AD SOYAD" value={fullName} onChange={setFullName} placeholder="Örn: Okan Berk..." />
               <InputGroup label="KURUMSAL E-POSTA" icon={<Mail size={18} />} value={email} onChange={setEmail} type="email" placeholder="example@nextgen.com" />
               <InputGroup label="ERİŞİM ŞİFRESİ" icon={<KeySquare size={18} />} value={password} onChange={setPassword} type="password" placeholder="••••••••" />
               
               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 italic">YETKİ SEVİYESİ</label>
                  <div className="grid grid-cols-2 gap-4">
                     <RoleButton active={role === 'user'} onClick={() => setRole('user')} label="STANDART" icon={<Users size={20} />} />
                     <RoleButton active={role === 'superadmin'} onClick={() => setRole('superadmin')} label="SÜPER ADMİN" icon={<ShieldCheck size={20} />} isDark />
                  </div>
               </div>
            </div>

            <button 
               type="submit" 
               disabled={isSubmitting} 
               className="w-full h-16 bg-blue-600 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
               {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> İŞLENİYOR...</> : <><UserPlus size={18} /> ERİŞİMİ AKTİF ET</> }
            </button>
         </form>
      </PremiumModal>

    </div>
  );
}

function SectionHeader({ title, icon }: { title: string, icon: any }) {
  return (
    <div className="flex items-center gap-4 group">
       <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-md transition-all">
          {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
       </div>
       <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">{title}</h2>
    </div>
  );
}

function TabButton({ active, label, icon, onClick }: { active: boolean, label: string, icon: any, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
         "w-full p-4 flex items-center gap-4 rounded-[22px] transition-all text-left", 
         active 
            ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
            : "text-slate-400 hover:text-slate-600 border border-transparent"
      )}
    >
       <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all", 
          active ? "bg-slate-900 text-white shadow-lg" : "bg-white border border-slate-100 text-slate-400"
       )}>
          {icon}
       </div>
       <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function InputGroup({ label, value, onChange, placeholder, type = 'text', icon }: any) {
  return (
    <div className="space-y-2">
       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">{label}</label>
       <div className="relative group">
          {icon && <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">{icon}</div>}
          <input 
            type={type} 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            className={cn(
               "w-full h-14 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none placeholder:text-slate-300", 
               icon ? "pl-14 pr-6" : "px-6"
            )} 
            placeholder={placeholder} 
          />
       </div>
    </div>
  );
}

function RoleButton({ active, label, icon, onClick, isDark }: any) {
  return (
    <button 
      type="button" 
      onClick={onClick} 
      className={cn(
         "flex-1 p-6 rounded-[24px] border-2 transition-all text-left flex flex-col gap-4", 
         active 
            ? (isDark ? "bg-slate-900 border-slate-900 text-white shadow-2xl" : "bg-white border-blue-500 text-slate-900 shadow-xl") 
            : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
      )}
    >
       <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-inner", 
          active ? (isDark ? "bg-slate-800 text-white" : "bg-blue-500 text-white") : "bg-white text-slate-200"
       )}>
          {icon}
       </div>
       <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
