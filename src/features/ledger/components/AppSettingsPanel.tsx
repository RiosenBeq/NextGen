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

interface SettingOption {
  value: number;
  label: string;
  description?: string;
}

interface SettingItem {
  key: string;
  label: string;
  description: string;
  type: string;
  options?: SettingOption[];
  labels?: { on: string; off: string };
}

export default function AppSettingsPanel({ initialParams }: { initialParams: Record<string, number> }) {
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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            Sistem Uygulama Ayarları
          </h2>
          <p className="text-sm text-slate-500 mt-1">Kod yazmadan parametre yönetimi.</p>
        </div>

        <button
          onClick={handleReset}
          disabled={!!loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors font-medium text-sm disabled:opacity-50"
        >
          {loading === 'RESET' ? <Zap className="w-4 h-4 animate-pulse" /> : <RotateCcw size={14} />}
          Varsayılana sıfırla
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {settingGroups.map((group) => (
          <div key={group.id} className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/70 bg-slate-50/50 flex items-center gap-3">
              <group.icon className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-widest">{group.label}</h3>
            </div>

            <div className="p-2">
              {group.settings.map((setting: SettingItem) => (
                <div
                  key={setting.key}
                  className="group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl hover:bg-slate-50/50 transition-colors gap-6"
                >
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 tracking-tight">{setting.label}</p>
                      {success === setting.key && (
                        <motion.span
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70"
                        >
                          Kaydedildi
                        </motion.span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{setting.description}</p>
                  </div>

                  <div className="flex-shrink-0">
                    {setting.type === 'select' ? (
                      <div className="sui-chip-group">
                        {setting.options?.map((opt: SettingOption) => {
                          const isActive = (params[setting.key] || 0) === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleUpdate(setting.key, opt.value)}
                              disabled={loading === setting.key}
                              className={cn('sui-chip', isActive && 'sui-chip--active')}
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
                          "inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-medium text-sm transition-colors",
                          params[setting.key] === 1
                            ? "bg-emerald-50 border-emerald-200/70 text-emerald-600"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                          params[setting.key] === 1 ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-300"
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

      <div className="p-6 rounded-2xl border border-slate-200/70 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
            <Zap size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Dinamik Yapılandırma</p>
            <p className="text-sm font-semibold text-slate-900 tracking-tight mt-0.5">NextGenBox Yönetim Paneli</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 text-center md:text-right max-w-[320px]">
          Yaptığınız tüm değişiklikler veritabanına anlık olarak işlenir ve sistem genelinde aktif olur.
        </p>
      </div>
    </motion.div>
  );
}
