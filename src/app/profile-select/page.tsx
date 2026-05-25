import { redirect } from 'next/navigation';
import { resolveActiveProfile } from '@/lib/profile-context';
import ProfileSelectClient from '@/components/premium/ProfileSelectClient';

export const metadata = {
  title: 'Profil Seç',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function ProfileSelectPage() {
  const resolution = await resolveActiveProfile();
  // requireUser handled inside resolveActiveProfile — error means no auth
  if (resolution.error && !resolution.profile) {
    if (resolution.error.toLowerCase().includes('oturum')) {
      redirect('/login');
    }
  }

  const profiles = resolution.availableProfiles ?? [];
  if (profiles.length === 0) {
    return <ProfileSelectClient profiles={[]} />;
  }

  // Tek profil varsa direkt onu seç ve uygun panele yönlendir
  if (profiles.length === 1) {
    const single = profiles[0];
    if (single.profile.businessType === 'cafe') redirect('/cafe');
    redirect('/');
  }

  return <ProfileSelectClient profiles={profiles} />;
}
