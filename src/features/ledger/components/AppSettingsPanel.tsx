'use client';
import { useRouter } from 'next/navigation';

import { useState } from 'react';
import { updateSystemParameter, resetSystemParameters } from '../actions';
import { 
  Settings, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  Zap,
  Layout
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';

export default function AppSettingsPanel({ initialParams }: { initialParams: Record<string, any> }) {
  const router = useRouter();
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
      toast.error('Hata: ' + res.error);
    }
    setLoading(null);
  };

  const handleReset = async () => {
    if (confirm('Tüm ayarları varsayılana sıfırlamak istediğinizden emin misiniz?')) {
      setLoading('RESET');
      const res = await resetSystemParameters();
      if (res.success) {
        router.refresh();
      } else {
        toast.error('Hata: ' + res.error);
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
            { value: 0, label: 'Hızlı', description: 'Profesyonel, hızlı tepki veren arayüz.' },
            { value: 1, label: 'Normal', description: 'Dengeli ve akıcı geçişler.' },
            { value: 2, label: 'Yavaş', description: 'Daha belirgin ve elit animasyonlar.' }
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
          <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter flex items-center gap-3">
             <Settings className="w-7 h-7" style={{ color: '#2F6BFF' }} />
             Sistem Uygulama Ayarları
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">KOD YAZMADAN PARAMETRE YÖNETİMİ</p>
        </div>
        
        <button
          onClick={handleReset}
          disabled={!!loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all font-black text-[10px] uppercase tracking-widest italic active:scale-95 disabled:opacity-50 shadow-sm"
        >
          {loading === 'RESET' ? <Zap className="w-3 h-3 animate-pulse" /> : <RotateCcw size={14} />}
          VARSAYILANA SIFIRLA
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {settingGroups.map((group) => (
          <div key={group.id} className="bg-white border border-slate-200 shadow-sm rounded-[32px] overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
               <group.icon className="w-4 h-4" style={{ color: '#2F6BFF' }} />
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] italic">{group.label}</h3>
            </div>
            
            <div className="p-2">
              {group.settings.map((setting: any) => (
                <div 
                  key={setting.key} 
                  className="group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl hover:bg-slate-50 transition-colors gap-6"
                >
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight italic">{setting.label}</p>
                      {success === setting.key && (
                        <motion.span 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
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
                        {setting.options?.map((opt: any) => {
                          const isActive = (params[setting.key] || 0) === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleUpdate(setting.key, opt.value)}
                              disabled={loading === setting.key}
                              className={cn(
                                "relative px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-tighter transition-all border shrink-0",
                                isActive 
                                  ? "shadow-sm text-white border-transparent" 
                                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50"
                              )}
                              style={isActive ? { background: '#2F6BFF' } : {}}
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
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        )}
                      >
                         <div className={cn(
                           "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center",
                           params[setting.key] === 1 ? "bg-emerald-500 border-white" : "bg-transparent border-slate-300"
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

      <div className="p-8 rounded-[32px] border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm" style={{ background: '#1E2A44', borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-5">
           <div className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}>
              <Zap size={24} style={{ color: '#2F6BFF' }} />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] italic" style={{ color: '#2F6BFF' }}>DİNAMİK YAPILANDIRMA ÜSSÜ</p>
              <p className="text-sm font-black text-white uppercase tracking-tight mt-1">NextGenBox Akıllı Yönetim Paneli</p>
           </div>
        </div>
        <p className="text-[10px] font-bold text-slate-400 text-center md:text-right max-w-[280px] italic">
          Yaptığınız tüm değişiklikler veritabanına anlık olarak işlenir ve sistem genelinde aktif olur.
        </p>
      </div>
    </div>
  );
}
