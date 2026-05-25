'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee, Mic2, Building2, Loader2, Crown, Shield, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ProfileAccessRecord } from '@/providers/ProfileProvider';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';

interface Props {
  profiles: ProfileAccessRecord[];
}

const ROLE_META: Record<string, { label: string; icon: typeof Crown }> = {
  owner: { label: 'Sahip', icon: Crown },
  admin: { label: 'Yönetici', icon: Shield },
  member: { label: 'Üye', icon: UserIcon },
};

export default function ProfileSelectClient({ profiles }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleSelect = (profileId: string, businessType: string) => {
    setPendingId(profileId);
    startTransition(async () => {
      try {
        const res = await fetch('/api/profile/switch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Bilinmeyen hata.' }));
          toast.error(body.error ?? 'Profil seçilemedi.');
          setPendingId(null);
          return;
        }
        // Hedef paneli profile.businessType belirler
        router.push(businessType === 'cafe' ? '/cafe' : '/');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Profil seçilemedi.');
        setPendingId(null);
      }
    });
  };

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'radial-gradient(80% 60% at 50% 35%, #1a1f3a 0%, #0b1023 100%)' }}
      >
        <div className="max-w-md text-center">
          <Building2 className="w-14 h-14 mx-auto text-white/40" strokeWidth={1.5} />
          <h1 className="text-[28px] font-semibold text-white mt-6" style={{ letterSpacing: '-0.022em' }}>
            Henüz bir profile atanmadın
          </h1>
          <p className="text-[14px] text-white/60 mt-3 leading-relaxed">
            Hesabın bir işletme profiline bağlı değil. Yöneticinden erişim talep et;
            sana profil verildiğinde burada görünecek.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{
        background:
          'radial-gradient(80% 60% at 50% 30%, #1a1f3a 0%, #0b1023 60%, #050813 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-12"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
          Profil Seç
        </p>
        <h1
          className="text-[36px] md:text-[48px] font-semibold text-white mt-3"
          style={{ letterSpacing: '-0.025em' }}
        >
          Hangi <span className="hero-serif italic">işletmeye</span> giriyorsun?
        </h1>
        <p className="text-[14px] md:text-[15px] text-white/60 mt-4 max-w-xl mx-auto leading-relaxed">
          Her profil ayrı bir işletme — verisi, ekibi ve marka kimliği bağımsız.
          Dilediğin zaman üst bardaki seçiciden değiştirebilirsin.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7 w-full max-w-5xl">
        {profiles.map(({ profile, role }, idx) => {
          const isPending = pendingId === profile.id;
          const isCafe = profile.businessType === 'cafe';
          const TypeIcon = isCafe ? Coffee : Mic2;
          const RoleIcon = ROLE_META[role]?.icon ?? UserIcon;
          return (
            <motion.button
              key={profile.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isPending}
              onClick={() => handleSelect(profile.id, profile.businessType)}
              className={cn(
                'group relative overflow-hidden rounded-3xl p-8 text-left shadow-2xl border border-white/10 transition-all',
                isPending && 'opacity-70 cursor-wait'
              )}
              style={{
                background: `linear-gradient(135deg, ${profile.primaryColor}22 0%, ${profile.accentColor}22 100%), rgba(15, 20, 45, 0.85)`,
                boxShadow: `0 20px 50px ${profile.primaryColor}44, inset 0 1px 0 rgba(255,255,255,0.08)`,
              }}
            >
              {/* Top accent strip */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1"
                style={{
                  background: `linear-gradient(90deg, ${profile.primaryColor}, ${profile.accentColor})`,
                }}
              />

              {/* Loading overlay */}
              {isPending && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 text-white animate-spin" strokeWidth={2} />
                </div>
              )}

              {/* Big monogram */}
              <div
                className="relative w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
                style={{
                  background: `linear-gradient(135deg, ${profile.primaryColor}, ${profile.accentColor})`,
                  boxShadow: `0 14px 32px ${profile.primaryColor}66`,
                }}
              >
                <span
                  className="absolute inset-[4px] rounded-[22px] flex items-center justify-center"
                  style={{ background: 'rgba(11, 16, 35, 0.85)' }}
                >
                  <span
                    className="font-extrabold text-white leading-none"
                    style={{ fontSize: 28, letterSpacing: '-0.04em' }}
                  >
                    {profile.monogram}
                  </span>
                </span>
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50 inline-flex items-center gap-1.5">
                <TypeIcon className="w-3 h-3" strokeWidth={2} />
                {isCafe ? 'Cafe' : 'Karaoke Box'}
              </p>
              <h3
                className="text-[26px] font-semibold text-white mt-2 mb-3"
                style={{ letterSpacing: '-0.018em' }}
              >
                {profile.brandName}
              </h3>

              <div className="flex items-center justify-between pt-5 border-t border-white/10 mt-6">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/60">
                  <RoleIcon className="w-3 h-3" strokeWidth={2.25} />
                  {ROLE_META[role]?.label ?? role}
                </span>
                <span
                  className="text-[12px] font-semibold text-white/80 group-hover:text-white transition-colors inline-flex items-center gap-1"
                  style={{ letterSpacing: '-0.005em' }}
                >
                  Giriş Yap
                  <motion.span
                    aria-hidden
                    initial={{ x: 0 }}
                    animate={{ x: 0 }}
                    whileHover={{ x: 3 }}
                  >
                    →
                  </motion.span>
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 + profiles.length * 0.08, duration: 0.5 }}
        className="text-[11px] text-white/30 mt-12 tracking-wider"
      >
        Her profil için ayrı veri, ayrı marka kimliği · Multi-tenant
      </motion.p>
    </div>
  );
}
