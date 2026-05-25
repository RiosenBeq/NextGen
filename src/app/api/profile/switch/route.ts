import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { requireUser } from '@/lib/auth-guards';
import { setActiveProfileCookie } from '@/lib/profile-context';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error ?? 'Yetkisiz' }, { status: 401 });
  }

  let body: { profileId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 });
  }

  const profileId = body.profileId;
  if (typeof profileId !== 'string' || profileId.length === 0) {
    return NextResponse.json({ error: 'profileId gerekli.' }, { status: 400 });
  }

  const access = await prisma.userProfileAccess.findUnique({
    where: { userId_profileId: { userId: auth.user.id, profileId } },
  });

  if (!access) {
    return NextResponse.json({ error: 'Bu profile erişiminiz yok.' }, { status: 403 });
  }

  await setActiveProfileCookie(profileId);

  await prisma.userProfileAccess.update({
    where: { userId_profileId: { userId: auth.user.id, profileId } },
    data: { lastSelectedAt: new Date() },
  });

  revalidatePath('/', 'layout');

  return NextResponse.json({ ok: true, profileId });
}
