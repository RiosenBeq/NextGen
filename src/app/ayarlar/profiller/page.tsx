import { redirect } from 'next/navigation';
import { requireProfileAccess } from '@/lib/auth-guards';
import { resolveActiveProfile } from '@/lib/profile-context';
import { listProfileMembers } from '@/features/profiles/actions';
import ProfilesManagementClient from '@/components/premium/ProfilesManagementClient';

export const metadata = {
  title: 'Profil Yönetimi — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function ProfilesManagementPage() {
  const guard = await requireProfileAccess();
  if (guard.error || !guard.user || !guard.profile) {
    redirect('/ayarlar');
  }

  const resolution = await resolveActiveProfile();
  const availableProfiles = resolution.availableProfiles ?? [];

  const membersPerProfile = await Promise.all(
    availableProfiles.map((p) => listProfileMembers(p.profile.id))
  );
  const memberBundle = availableProfiles.map((entry, idx) => ({
    profile: entry.profile,
    role: entry.role,
    members: membersPerProfile[idx] ?? [],
  }));

  const isSuperAdmin = guard.user.role === 'superadmin';

  return (
    <ProfilesManagementClient
      currentUserId={guard.user.id}
      isSuperAdmin={isSuperAdmin}
      profiles={memberBundle}
    />
  );
}
