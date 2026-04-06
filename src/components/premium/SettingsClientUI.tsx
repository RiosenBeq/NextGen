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
  Monitor
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
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            Sistem Ayarları
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-2xl">
            Sistem parametrelerini, lokasyon ayarlarını ve yetkili erişim protokollerini yönetin.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-4">
           <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white"><Zap size={16} /></div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sürüm</span>
                 <span className="text-xs font-bold text-slate-900">V1.2 Stable</span>
              </div>
           </div>
        </div>
      </header>

      {/* Tabs Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
         
         <aside className="lg:w-64 shrink-0 space-y-2">
            <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Sliders size={18} />} label="Genel Ayarlar" />
            <TabButton active={activeTab === 'locations'} onClick={() => setActiveTab('locations')} icon={<MapPin size={18} />} label="Şubeler" />
            <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={18} />} label="Erişim" />
            
            <div className="pt-6 px-2">
               <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex items-center gap-2 text-slate-400"><HelpCircle size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">Yardım</span></div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">Değişiklikler tüm hesaplamaları gerçek zamanlı etkiler.</p>
               </div>
            </div>
         </aside>

         <main className="flex-1 space-y-8">
            <AnimatePresence mode="wait">
               {activeTab === 'general' && (
                  <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                     <SectionHeader title="Finansal Yapılandırma" icon={<Database className="text-blue-600" />} />
                     <SystemParametersForm parameters={parameters} />
                  </motion.div>
               )}

               {activeTab === 'locations' && (
                  <motion.div key="locations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                     <SectionHeader title="Şube Parametreleri" icon={<MapPin className="text-emerald-600" />} />
                     <div className="grid grid-cols-1 gap-6">{locations.map(loc => <LocationSettingsForm key={loc.id} location={loc} />)}</div>
                  </motion.div>
               )}

               {activeTab === 'users' && (
                  <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <SectionHeader title="Yetkili Hesaplar" icon={<Users className="text-slate-900" />} />
                        <button onClick={() => setIsUserModalOpen(true)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all">
                           <UserPlus size={16} /> Yeni Hesap Tanımla
                        </button>
                     </div>

                     <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                 <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kullanıcı</th>
                                 <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-Posta</th>
                                 <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Rol</th>
                                 <th className="px-6 py-4"></th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {users.map(user => (
                                 <tr key={user.id} className="group hover:bg-slate-50 transition-all">
                                    <td className="px-6 py-5">
                                       <div className="flex items-center gap-3">
                                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm", user.role === 'superadmin' ? 'bg-slate-900 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100')}>
                                             {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'US'}
                                          </div>
                                          <span className="text-sm font-bold text-slate-900">{user.fullName || '—'}</span>
                                       </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-medium text-slate-500">{user.email}</td>
                                    <td className="px-6 py-5 text-center">
                                       <span className={cn("inline-block px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border", user.role === 'superadmin' ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-slate-50 text-slate-400 border-slate-100")}>
                                          {user.role === 'superadmin' ? 'YÖNETİCİ' : 'STANDART'}
                                       </span>
                                    </td>
                                    <td className="px-6 py-5 text-right opacity-0 group-hover:opacity-100 transition-all">
                                       {user.id !== currentUser?.id && <button onClick={() => handleDeleteUser(user.id)} className="p-2.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-white transition-all"><Trash2 size={16} /></button>}
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
      <PremiumModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Yeni Erişim Tanımla" maxWidth="max-w-xl">
         <form onSubmit={handleCreateUser} className="p-6 space-y-6">
            {formError && <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-widest flex items-center gap-3"><Lock size={16} /> {formError}</div>}
            <InputGroup label="Ad Soyad" value={fullName} onChange={setFullName} placeholder="Ad Soyad..." />
            <InputGroup label="E-Posta" icon={<Mail size={16} />} value={email} onChange={setEmail} type="email" placeholder="example@nextgen.com" />
            <InputGroup label="Şifre" icon={<KeySquare size={16} />} value={password} onChange={setPassword} type="password" placeholder="••••••••" />
            <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 italic">Sistem Rolü</label>
               <div className="grid grid-cols-2 gap-4">
                  <RoleButton active={role === 'user'} onClick={() => setRole('user')} label="Kullanıcı" icon={<Users size={18} />} />
                  <RoleButton active={role === 'superadmin'} onClick={() => setRole('superadmin')} label="Admin" icon={<Shield size={18} />} isDark />
               </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
               {isSubmitting ? 'Kaydediliyor...' : 'Erişim Tanımla'}
            </button>
         </form>
      </PremiumModal>

    </div>
  );
}

function SectionHeader({ title, icon }: { title: string, icon: any }) {
  return (
    <div className="flex items-center gap-4">
       <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">{icon}</div>
       <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{title}</h2>
    </div>
  );
}

function TabButton({ active, label, icon, onClick }: { active: boolean, label: string, icon: any, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("w-full p-3 flex items-center gap-3 rounded-xl transition-all text-left border", active ? "bg-white text-slate-900 shadow-sm border-slate-200" : "text-slate-400 hover:bg-white hover:border-slate-100 border-transparent")}>
       <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", active ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400")}>{icon}</div>
       <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
    </button>
  );
}

function InputGroup({ label, value, onChange, placeholder, type = 'text', icon }: any) {
  return (
    <div className="space-y-1.5">
       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">{label}</label>
       <div className="relative group">
          {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
          <input type={type} value={value} onChange={e => onChange(e.target.value)} className={cn("w-full py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none", icon ? "pl-11 pr-4" : "px-4")} placeholder={placeholder} />
       </div>
    </div>
  );
}

function RoleButton({ active, label, icon, onClick, isDark }: any) {
  return (
    <button type="button" onClick={onClick} className={cn("w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3", active ? (isDark ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-blue-500 text-slate-900") : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200")}>
       <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold", active ? "bg-blue-500 text-white" : "bg-white text-slate-300")}>{icon}</div>
       <span className="text-xs font-bold uppercase">{label}</span>
    </button>
  );
}
