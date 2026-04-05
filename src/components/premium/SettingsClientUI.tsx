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
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* 1. HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-slate-100">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full border border-blue-100 bg-blue-50/50">
            <ShieldCheck size={14} className="text-blue-600 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Sistem Çekirdeği (Kernel)</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase flex items-center gap-4">
            <Settings className="w-10 h-10 text-slate-300" />
            Sistem Ayarları
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-2xl">
            NextGenBox ekosisteminin finansal algoritmalarını, modül davranışlarını ve <span className="font-bold text-slate-800">Erişim Hiyerarşisini</span> profesyonelce yönetin.
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-4">
           <div className="bg-white border border-slate-200 p-5 rounded-3xl min-w-[200px] shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-950 flex items-center justify-center text-white">
                 <Zap size={20} />
              </div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sistem Durumu</span>
                 <span className="text-xs font-black text-slate-900 uppercase italic">Sorunsuz (V1.2)</span>
              </div>
           </div>
        </div>
      </header>

      {/* 2. TABBED INTERFACE NAVIGATION */}
      <div className="flex flex-col lg:flex-row gap-10">
         
         {/* SIDEBAR TABS */}
         <aside className="lg:w-72 shrink-0 space-y-2">
            <TabButton 
               active={activeTab === 'general'} 
               onClick={() => setActiveTab('general')} 
               icon={<Sliders size={18} />} 
               label="Genel Yapılandırma" 
               desc="Finansal Değişkenler"
            />
            <TabButton 
               active={activeTab === 'locations'} 
               onClick={() => setActiveTab('locations')} 
               icon={<MapPin size={18} />} 
               label="Şube Ayarları" 
               desc="Lokasyon Parametreleri"
            />
            <TabButton 
               active={activeTab === 'users'} 
               onClick={() => setActiveTab('users')} 
               icon={<Users size={18} />} 
               label="Erişim Yönetimi" 
               desc="Kullanıcılar & Roller"
            />
            
            <div className="pt-8 px-4">
               <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 text-slate-400">
                     <HelpCircle size={16} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Yardım & Destek</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                    Sistem değişkenleri raporlardaki tüm hesaplamaları gerçek zamanlı etkiler. Lütfen hassas verileri değiştirmeden önce dökümantasyonu inceleyin.
                  </p>
               </div>
            </div>
         </aside>

         {/* TAB CONTENT AREA */}
         <main className="flex-1 space-y-12">
            
            <AnimatePresence mode="wait">
               {activeTab === 'general' && (
                  <motion.div 
                    key="general" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                     <SectionHeader 
                       title="Genel Finans Yapılandırması" 
                       desc="Tüm sistemdeki hesaplamaların temelini oluşturan global katsayılar."
                       icon={<Database className="text-blue-600" />}
                     />
                     <SystemParametersForm parameters={parameters} />
                  </motion.div>
               )}

               {activeTab === 'locations' && (
                  <motion.div 
                    key="locations" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                     <SectionHeader 
                       title="Şube Bazlı Özelleştirme" 
                       desc="Her lokasyonun kendine özgü kira, ciro payı ve aidat anlaşmaları."
                       icon={<MapPin className="text-emerald-600" />}
                     />
                     <div className="grid grid-cols-1 gap-6">
                        {locations.map(loc => (
                           <LocationSettingsForm key={loc.id} location={loc} />
                        ))}
                     </div>
                  </motion.div>
               )}

               {activeTab === 'users' && (
                  <motion.div 
                    key="users" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <SectionHeader 
                          title="Yetkili Erişim Listesi" 
                          desc="Sisteme giriş yapabilen hesaplar ve atanan sistem rolleri."
                          icon={<Users className="text-slate-900" />}
                        />
                        <button 
                          onClick={() => setIsUserModalOpen(true)}
                          className="px-6 py-4 bg-slate-900 text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95"
                        >
                           <UserPlus size={16} />
                           Yeni Erişim Tanımla
                        </button>
                     </div>

                     <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                 <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profil & Kimlik</th>
                                 <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">E-Posta</th>
                                 <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Yetki</th>
                                 <th className="px-8 py-5"></th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {users.map(user => (
                                 <tr key={user.id} className="group hover:bg-slate-50/30 transition-all">
                                    <td className="px-8 py-6">
                                       <div className="flex items-center gap-4">
                                          <div className={cn(
                                             "w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-sm shadow-inner",
                                             user.role === 'superadmin' ? 'bg-slate-950 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                          )}>
                                             {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'US'}
                                          </div>
                                          <div className="flex flex-col">
                                             <span className="text-sm font-black text-slate-900 italic tracking-tighter uppercase">{user.fullName || '—'}</span>
                                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{user.id.slice(0, 8)}</span>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-slate-500 italic">{user.email}</td>
                                    <td className="px-8 py-6 text-center">
                                       <span className={cn(
                                          "inline-block px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic shadow-sm",
                                          user.role === 'superadmin' ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-slate-50 text-slate-400 border border-slate-100"
                                       )}>
                                          {user.role === 'superadmin' ? 'ÜST YÖNETİCİ' : 'STANDART'}
                                       </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                          {user.id !== currentUser?.id && (
                                             <button 
                                               onClick={() => handleDeleteUser(user.id)}
                                               className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 border border-slate-100 hover:border-rose-100 transition-all hover:scale-110"
                                             >
                                                <Trash2 size={16} />
                                             </button>
                                          )}
                                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                                             <ChevronRight size={14} />
                                          </div>
                                       </div>
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

      {/* 3. USER ADD MODAL */}
      <PremiumModal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        title="Yeni Sistem Erişimi Tanımla"
        maxWidth="max-w-xl"
      >
         <form onSubmit={handleCreateUser} className="space-y-8 py-4">
            {formError && (
               <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-black uppercase tracking-widest flex items-center gap-3 italic">
                  <Lock size={16} />
                  {formError}
               </div>
            )}

            <div className="grid grid-cols-1 gap-6">
               <InputGroup label="Ad Soyad" value={fullName} onChange={setFullName} placeholder="Ad Soyad giriniz..." />
               <InputGroup label="E-Posta Adresi" icon={<Mail size={16} />} value={email} onChange={setEmail} type="email" placeholder="example@nextgen.com" />
               <InputGroup label="Geçici Şifre" icon={<KeySquare size={16} />} value={password} onChange={setPassword} type="password" placeholder="••••••••" />
               
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 italic flex items-center gap-2">
                     <ShieldCheck size={12} /> Sistem Rolü Ataması
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                     <RoleButton 
                        active={role === 'user'} 
                        onClick={() => setRole('user')} 
                        label="Kullanıcı" 
                        icon={<Users size={18} />} 
                        desc="Standart Erişim"
                     />
                     <RoleButton 
                        active={role === 'superadmin'} 
                        onClick={() => setRole('superadmin')} 
                        label="Üst Yönetici" 
                        icon={<Shield size={18} />} 
                        desc="Tam Yetki (Admin)"
                        isDark
                     />
                  </div>
               </div>
            </div>

            <div className="pt-6">
               <button 
                 type="submit" 
                 disabled={isSubmitting}
                 className="w-full py-5 bg-blue-600 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
               >
                 {isSubmitting ? 'Doğrulanıyor...' : 'Erişim Protokolünü Kaydet'}
               </button>
            </div>
         </form>
      </PremiumModal>

    </div>
  );
}

function SectionHeader({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-5">
       <div className="w-14 h-14 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
          {cloneIcon(icon)}
       </div>
       <div className="space-y-0.5">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">{title}</h2>
          <p className="text-xs text-slate-500 font-medium italic">{desc}</p>
       </div>
    </div>
  );
}

function TabButton({ active, label, desc, icon, onClick }: { active: boolean, label: string, desc: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full p-4 flex items-center gap-4 rounded-3xl transition-all text-left group border border-transparent",
        active 
          ? "bg-white text-slate-900 shadow-xl shadow-slate-100/50 border-slate-100 -translate-y-0.5" 
          : "text-slate-400 hover:bg-white hover:border-slate-50"
      )}
    >
       <div className={cn(
          "w-11 h-11 rounded-2xl flex items-center justify-center transition-all",
          active ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "bg-slate-50 text-slate-400 group-hover:bg-white border border-transparent"
       )}>
          {icon}
       </div>
       <div className="flex flex-col">
          <span className={cn("text-[13px] font-black uppercase italic tracking-tighter", active ? "text-slate-900" : "text-slate-500")}>{label}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{desc}</span>
       </div>
    </button>
  );
}

function InputGroup({ label, value, onChange, placeholder, type = 'text', icon }: any) {
  return (
    <div className="space-y-2">
       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 italic">
          {label}
       </label>
       <div className="relative group">
          {icon && (
             <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                {icon}
             </div>
          )}
          <input 
             type={type}
             value={value}
             onChange={e => onChange(e.target.value)}
             className={cn(
                "w-full py-4 bg-slate-50 border border-slate-200 rounded-[22px] text-sm font-black italic uppercase tracking-tighter text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-inner",
                icon ? "pl-14 pr-6" : "px-6"
             )}
             placeholder={placeholder}
          />
       </div>
    </div>
  );
}

function RoleButton({ active, label, desc, icon, onClick, isDark }: any) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={cn(
         "w-full p-5 rounded-3xl border-2 transition-all text-left flex flex-col gap-3 group",
         active 
           ? (isDark ? "bg-slate-950 border-slate-950 text-white shadow-2xl shadow-slate-300" : "bg-white border-blue-600 text-slate-900 shadow-xl shadow-blue-50")
           : "bg-slate-50 border-slate-100 hover:border-slate-200"
      )}
    >
       <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
          active 
            ? (isDark ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600") 
            : "bg-white text-slate-300 group-hover:scale-110"
       )}>
          {icon}
       </div>
       <div>
          <p className={cn("text-sm font-black uppercase italic tracking-tighter", active && !isDark ? "text-slate-900" : (active && isDark ? "text-white" : "text-slate-500"))}>{label}</p>
          <p className={cn("text-[9px] font-bold uppercase tracking-widest", active ? (isDark ? "text-slate-400" : "text-blue-400") : "text-slate-400")}>{desc}</p>
       </div>
    </button>
  );
}

function cloneIcon(icon: any) {
  return React.cloneElement(icon as React.ReactElement, { size: 28, strokeWidth: 2.5 });
}
