import { getActiveLocations, getSystemParameters } from '@/features/ledger/actions';
import { getSystemUsers } from '@/features/auth/admin-actions';
import { getMyProfile } from '@/features/auth/profile-actions';
import SettingsClientUI from '@/components/premium/SettingsClientUI';

export const metadata = {
  title: 'Sistem Ayarları — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [locations, parameters, users, currentUser] = await Promise.all([
    getActiveLocations(),
    getSystemParameters(),
    getSystemUsers(),
    getMyProfile(),
  ]);

  return (
    <SettingsClientUI
      locations={locations || []}
      parameters={parameters || {}}
      users={users || []}
      currentUser={currentUser}
    />
  );
}
