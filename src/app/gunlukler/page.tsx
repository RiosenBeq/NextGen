import { getAuditLogs } from '@/features/audit/actions';
import GunluklerClientUI from '@/components/premium/GunluklerClientUI';

export const metadata = {
  title: 'Sistem Logları — NextGenBox',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default async function GunluklerSayfasi() {
  const loglar = await getAuditLogs();

  return <GunluklerClientUI loglar={loglar || []} />;
}
