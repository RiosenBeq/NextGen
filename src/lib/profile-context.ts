import { cache } from 'react';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { requireUser } from '@/lib/auth-guards';

export const ACTIVE_PROFILE_COOKIE = 'active_profile_id';

export type BusinessType = 'karaoke' | 'cafe';

export interface ProfileSummary {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  monogram: string;
  businessType: BusinessType;
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

export interface ResolvedProfile {
  profile: ProfileSummary;
  role: string;
  availableProfiles: ProfileAccessRecord[];
}

export type ProfileResolutionResult =
  | (ResolvedProfile & { error?: undefined })
  | { profile: null; role: null; availableProfiles: []; error: string };

function toSummary(p: {
  id: string; slug: string; name: string; brandName: string; monogram: string;
  businessType?: string;
  primaryColor: string; accentColor: string; logoUrl: string | null;
  locale: string; currency: string;
}): ProfileSummary {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brandName: p.brandName,
    monogram: p.monogram,
    businessType: p.businessType === 'cafe' ? 'cafe' : 'karaoke',
    primaryColor: p.primaryColor,
    accentColor: p.accentColor,
    logoUrl: p.logoUrl,
    locale: p.locale,
    currency: p.currency,
  };
}

/**
 * Aktif profili (cookie veya en son seçilen) çözer ve kullanıcının
 * erişebildiği tüm profilleri liste olarak döner.
 *
 * React `cache()` ile sarılı: aynı server request içinde kaç kez
 * çağrılırsa çağrılsın tek bir Prisma sorgusu çalışır. Layout +
 * page'lerde paralel kullanım için kritik.
 */
export const resolveActiveProfile = cache(async (): Promise<ProfileResolutionResult> => {
  const auth = await requireUser();
  if (auth.error || !auth.user) {
    return { profile: null, role: null, availableProfiles: [], error: auth.error ?? 'Oturum yok.' };
  }

  const accesses = await prisma.userProfileAccess.findMany({
    where: { userId: auth.user.id },
    include: { profile: true },
    orderBy: [
      { lastSelectedAt: { sort: 'desc', nulls: 'last' } },
      { createdAt: 'asc' },
    ],
  });

  if (accesses.length === 0) {
    return {
      profile: null,
      role: null,
      availableProfiles: [],
      error: 'Hiçbir profile erişiminiz yok. Lütfen yöneticinizle iletişime geçin.',
    };
  }

  const cookieStore = await cookies();
  const requestedId = cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value;

  // Tercih sırası: cookie eşleşmesi → en son seçilen → ilk satır.
  // accesses zaten lastSelectedAt desc sıralı olduğundan accesses[0] doğrudur.
  const selected =
    accesses.find(a => a.profileId === requestedId) ?? accesses[0];

  const availableProfiles: ProfileAccessRecord[] = accesses.map(a => ({
    profile: toSummary(a.profile),
    role: a.role,
  }));

  return {
    profile: toSummary(selected.profile),
    role: selected.role,
    availableProfiles,
  };
});

export async function setActiveProfileCookie(profileId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PROFILE_COOKIE, profileId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}
