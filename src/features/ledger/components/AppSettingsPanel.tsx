'use client';

import { useState } from 'react';
import { updateSystemParameter, resetSystemParameters } from '../actions';
import { 
  Settings, 
  RotateCcw, 
  CheckCircle2, 
  Monitor, 
  MousePointer2, 
  ShieldCheck, 
  Zap,
  Layout,
  Maximize2,
  ListFilter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AppSettingsPanel({ initialParams }: { initialParams: Record<string, any> }) {
  const [params, setParams] = useState(initialParams);
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpdate = async (key: string, value: number) => {
    setLoading(key);
    const res = await updateSystemParameter(key, value);
    if (res.success) {
      setParams({ ...params, [key]: value });
      setSuccess(key);
      setTimeout(() => setSuccess(null), 2000);
    } else {
      alert('Hata: ' + res.error);
    }
    setLoading(null);
  };

  const handleReset = async () => {
    if (confirm('Tüm ayarları varsayılana sıfırlamak istediğinizden emin misiniz?')) {
      setLoading('RESET');
      const res = await resetSystemParameters();
      if (res.success) {
        window.location.reload();
      } else {
        alert('Hata: ' + res.error);
      }
      setLoading(null);
    }
  };

  const settingGroups = [
    {
      id: 'ui',
      label: 'Görünüm & UI Davranışı',
      icon: Layout,
      settings: [
        {
          key: 'SETTING_POPUP_POSITION',
          label: 'Pop-up Konumlandırma',
          description: 'Modalların ekranın neresinde açılacağını belirler.',
          type: 'select',
          options: [
            { value: 0, label: 'Merkez', description: 'Ekranın ortası.' },
            { value: 1, label: 'Üst', description: 'Ekranın üstü.' }
          ]
        },
        {
          key: 'SETTING_ANIMATION_SPEED',
          label: 'Animasyon Akışkanlığı',
          description: 'Geçişlerin ve modalların açılma hızını ayarlar.',
          type: 'select',
          options: [
            { value: 0, label: 'Hızlı (Minimal)', description: 'Profesyonel, hızlı tepki veren arayüz.' },
            { value: 1, label: 'Normal (Smooth)', description: 'Dengeli ve akıcı geçişler.' },
            { value: 2, label: 'Yavaş (Premium)', description: 'Daha belirgin ve elit animasyonlar.' }
          ]
        }
      ]
    },
    {
      id: 'system',
      label: 'Sistem & Log Yönetimi',
      icon: ShieldCheck,
      settings: [
        {
          key: 'SETTING_LOG_DETAIL_LEVEL',
          label: 'Teknik Log Görünümü',
          description: 'Sistem loglarında JSON veri detaylarını göster/gizle.',
          type: 'toggle',
          labels: { on: 'Açık', off: 'Kapalı' }
        }
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
             <Settings className="w-7 h-7 text-blue-500" />
             Sistem Uygulama Ayarları
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">KOD YAZMADAN PARAMETRE YÖNETİMİ</p>
        </div>
        
        <button
          onClick={handleReset}
          disabled={!!loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/30 transition-all font-black text-[10px] uppercase tracking-widest italic active:scale-95 disabled:opacity-50"
        >
          {loading === 'RESET' ? <Zap className="w-3 h-3 animate-pulse" /> : <RotateCcw size={14} />}
          VARSAYILANA SIFIRLA
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {settingGroups.map((group) => (
          <div key={group.id} className="premium-card bg-white/[0.02] border border-white/10 rounded-[32px] overflow-hidden">
            <div className="px-8 py-5 border-b border-white/5 bg-white/[0.01] flex items-center gap-3">
               <group.icon className="w-4 h-4 text-blue-400" />
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">{group.label}</h3>
            </div>
            
            <div className="p-2">
              {group.settings.map((setting: any) => (
                <div 
                  key={setting.key} 
                  className="group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl hover:bg-white/[0.02] transition-colors gap-6"
                >
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-white uppercase tracking-tight italic">{setting.label}</p>
                      {success === setting.key && (
                        <motion.span 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20"
                        >
                          KAYDEDİLDİ
                        </motion.span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{setting.description}</p>
                  </div>

                  <div className="flex-shrink-0">
                    {setting.type === 'select' ? (
                      <div className="flex flex-wrap gap-2">
                        {setting.options?.map((opt) => {
                          const isActive = (params[setting.key] || 0) === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleUpdate(setting.key, opt.value)}
                              disabled={loading === setting.key}
                              className={cn(
                                "relative px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-tighter transition-all border shrink-0",
                                isActive 
                                  ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]" 
                                  : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
                              )}
                              title={opt.description}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : setting.type === 'toggle' ? (
                      <button
                        onClick={() => handleUpdate(setting.key, params[setting.key] === 1 ? 0 : 1)}
                        disabled={loading === setting.key}
                        className={cn(
                          "flex items-center gap-3 px-6 py-3 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all",
                          params[setting.key] === 1
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                            : "bg-white/5 border-white/10 text-slate-500"
                        )}
                      >
                         <div className={cn(
                           "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center",
                           params[setting.key] === 1 ? "bg-emerald-500 border-white/20" : "bg-transparent border-slate-700"
                         )}>
                            {params[setting.key] === 1 && <CheckCircle2 size={10} className="text-white" />}
                         </div>
                         {params[setting.key] === 1 ? setting.labels?.on : setting.labels?.off}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 rounded-[32px] bg-gradient-to-br from-blue-600/10 to-indigo-600/5 border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-5">
           <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
              <Zap size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] italic">DİNAMİK YAPILANDIRMA ÜSSÜ</p>
              <p className="text-sm font-black text-white uppercase tracking-tight mt-1">NextGenBox Intelligence Suite</p>
           </div>
        </div>
        <p className="text-[10px] font-bold text-slate-500 text-center md:text-right max-w-[280px] italic">
          Yaptığınız tüm değişiklikler veritabanına anlık olarak işlenir ve sistem genelinde aktif olur.
        </p>
      </div>
    </div>
  );
}
