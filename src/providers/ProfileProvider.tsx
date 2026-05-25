'use client';

import React, { createContext, useCallback, useContext, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export interface ProfileSummary {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  monogram: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  locale: string;
  currency: string;
}

export interface ProfileAccessRecord {
  profile: ProfileSummary;
  role: string;
}

interface ProfileContextValue {
  activeProfile: ProfileSummary | null;
  activeRole: string | null;
  availableProfiles: ProfileAccessRecord[];
  switchProfile: (profileId: string) => Promise<void>;
  isPending: boolean;
  error: string | null;
}

const ProfileContext = createContext<ProfileContextValue>({
  activeProfile: null,
  activeRole: null,
  availableProfiles: [],
  switchProfile: async () => {},
  isPending: false,
  error: null,
});

export interface ProfileProviderInitial {
  activeProfile: ProfileSummary | null;
  activeRole: string | null;
  availableProfiles: ProfileAccessRecord[];
}

export function ProfileProvider({
  initial,
  children,
}: {
  initial: ProfileProviderInitial;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const switchProfile = useCallback(async (profileId: string) => {
    if (profileId === initial.activeProfile?.id) return;
    setError(null);
    try {
      const res = await fetch('/api/profile/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Bilinmeyen hata.' }));
        setError(body.error ?? 'Profil değiştirilemedi.');
        return;
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Profil değiştirilemedi.');
    }
  }, [initial.activeProfile?.id, router]);

  return (
    <ProfileContext.Provider
      value={{
        activeProfile: initial.activeProfile,
        activeRole: initial.activeRole,
        availableProfiles: initial.availableProfiles,
        switchProfile,
        isPending,
        error,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
