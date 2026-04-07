import { redirect } from 'next/navigation';

export default function UsersPage() {
  redirect('/ayarlar?tab=users');
  return null;
}
