'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import prisma from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { getErrorMessage } from '@/lib/errors';
import { requireSuperAdmin, requireProfileAccess } from '@/lib/auth-guards';
import {
  createProfileSchema,
  grantAccessSchema,
  profileBrandSchema,
  revokeAccessSchema,
  updateRoleSchema,
  type CreateProfileInput,
  type GrantAccessInput,
  type ProfileBrandInput,
  type RevokeAccessInput,
  type UpdateRoleInput,
} from './schema';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_HESAPSUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase admin kimlik bilgileri eksik (SUPABASE_SERVICE_ROLE_KEY).');
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function revalidateProfileScopedPaths() {
  revalidatePath('/', 'layout');
  revalidatePath('/ayarlar');
}

interface ProfileMember {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  lastSelectedAt: string | null;
  createdAt: string;
}

/**
 * Aktif profilin üyelerini listeler.
 * Süper-admin tüm üyeleri, owner/admin de listeyi görür.
 */
export async function listProfileMembers(profileId?: string): Promise<ProfileMember[]> {
  const guard = await requireProfileAccess();
  if (guard.error || !guard.user || !guard.profile) return [];
  const targetProfileId = profileId ?? guard.profile.id;

  // İzin kontrolü: yalnızca super-admin veya bu profilde owner/admin olanlar listeyi görebilir
  const isSuperAdmin = guard.user.role === 'superadmin';
  const access = await prisma.userProfileAccess.findUnique({
    where: { userId_profileId: { userId: guard.user.id, profileId: targetProfileId } },
  });
  const isProfileAdmin = access?.role === 'owner' || access?.role === 'admin';
  if (!isSuperAdmin && !isProfileAdmin) return [];

  const rows = await prisma.userProfileAccess.findMany({
    where: { profileId: targetProfileId },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
  });

  // userId'ler Supabase auth.users üzerinde tutuluyor — admin client'ı ile fetch
  let userIndex = new Map<string, { email: string; fullName: string }>();
  try {
    const admin = getAdminClient();
    const { data } = await admin.auth.admin.listUsers();
    for (const u of data?.users ?? []) {
      userIndex.set(u.id, {
        email: u.email ?? '',
        fullName: (u.user_metadata?.full_name as string | undefined) ?? '',
      });
    }
  } catch (e) {
    console.warn('listProfileMembers: auth.admin.listUsers başarısız (SERVICE_ROLE_KEY?):', e);
    userIndex = new Map();
  }

  return rows.map((row) => {
    const u = userIndex.get(row.userId);
    return {
      userId: row.userId,
      email: u?.email ?? '—',
      fullName: u?.fullName ?? '',
      role: row.role,
      lastSelectedAt: row.lastSelectedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  });
}

/**
 * Mevcut bir Supabase auth kullanıcısına bu profile erişim verir.
 * Sadece super-admin veya profile owner çağırabilir.
 */
export async function grantProfileAccess(input: GrantAccessInput) {
  try {
    const guard = await requireProfileAccess();
    if (guard.error || !guard.user || !guard.profile) {
      return { success: false, error: guard.error };
    }
    const validated = grantAccessSchema.parse(input);

    // Yetki: super-admin VEYA bu profilde owner
    const isSuper = guard.user.role === 'superadmin';
    const access = await prisma.userProfileAccess.findUnique({
      where: { userId_profileId: { userId: guard.user.id, profileId: validated.profileId } },
    });
    const isOwner = access?.role === 'owner';
    if (!isSuper && !isOwner) {
      return { success: false, error: 'Üye davet etmek için profil sahibi olmalısınız.' };
    }

    // E-postadan kullanıcı id'sini bul
    const admin = getAdminClient();
    const { data: usersList, error: listError } = await admin.auth.admin.listUsers();
    if (listError) throw listError;
    const targetUser = (usersList?.users ?? []).find(
      (u) => (u.email ?? '').toLowerCase() === validated.email.toLowerCase()
    );
    if (!targetUser) {
      return { success: false, error: 'Bu e-postaya sahip kullanıcı bulunamadı. Önce sistem kullanıcısı oluşturulmalı.' };
    }

    const upserted = await prisma.userProfileAccess.upsert({
      where: { userId_profileId: { userId: targetUser.id, profileId: validated.profileId } },
      update: { role: validated.role },
      create: {
        id: `upa_${targetUser.id}_${validated.profileId}`.slice(0, 60),
        userId: targetUser.id,
        profileId: validated.profileId,
        role: validated.role,
      },
    });

    await createAuditLog('CREATE', 'UserProfileAccess', upserted.id, {
      grantedUser: validated.email,
      role: validated.role,
      grantedBy: guard.user.id,
    });

    revalidateProfileScopedPaths();
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error('grantProfileAccess error:', error);
    return { success: false, error: getErrorMessage(error, 'Erişim verilemedi.') };
  }
}

/**
 * Bir üyenin profil rolünü değiştirir. Owner sayısını sıfıra düşürmesine izin vermez.
 */
export async function updateProfileMemberRole(input: UpdateRoleInput) {
  try {
    const guard = await requireProfileAccess();
    if (guard.error || !guard.user || !guard.profile) {
      return { success: false, error: guard.error };
    }
    const validated = updateRoleSchema.parse(input);

    const isSuper = guard.user.role === 'superadmin';
    const callerAccess = await prisma.userProfileAccess.findUnique({
      where: { userId_profileId: { userId: guard.user.id, profileId: validated.profileId } },
    });
    if (!isSuper && callerAccess?.role !== 'owner') {
      return { success: false, error: 'Rol güncellemek için profil sahibi olmalısınız.' };
    }

    // Son owner korumalı
    if (validated.role !== 'owner') {
      const owners = await prisma.userProfileAccess.findMany({
        where: { profileId: validated.profileId, role: 'owner' },
      });
      const isLastOwner = owners.length === 1 && owners[0].userId === validated.userId;
      if (isLastOwner) {
        return { success: false, error: 'Bu profilde başka sahip yok; son sahibin rolünü düşüremezsiniz.' };
      }
    }

    await prisma.userProfileAccess.update({
      where: { userId_profileId: { userId: validated.userId, profileId: validated.profileId } },
      data: { role: validated.role },
    });

    await createAuditLog('UPDATE', 'UserProfileAccess', validated.userId, {
      profileId: validated.profileId,
      newRole: validated.role,
      updatedBy: guard.user.id,
    });

    revalidateProfileScopedPaths();
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Bir kullanıcının profile erişimini siler. Kendi erişimini ve son owner'ı koruyucu.
 */
export async function revokeProfileAccess(input: RevokeAccessInput) {
  try {
    const guard = await requireProfileAccess();
    if (guard.error || !guard.user || !guard.profile) {
      return { success: false, error: guard.error };
    }
    const validated = revokeAccessSchema.parse(input);

    const isSuper = guard.user.role === 'superadmin';
    const callerAccess = await prisma.userProfileAccess.findUnique({
      where: { userId_profileId: { userId: guard.user.id, profileId: validated.profileId } },
    });
    if (!isSuper && callerAccess?.role !== 'owner') {
      return { success: false, error: 'Erişim kaldırmak için profil sahibi olmalısınız.' };
    }

    if (validated.userId === guard.user.id) {
      return { success: false, error: 'Kendi erişiminizi kaldıramazsınız.' };
    }

    // Son owner korumalı
    const target = await prisma.userProfileAccess.findUnique({
      where: { userId_profileId: { userId: validated.userId, profileId: validated.profileId } },
    });
    if (!target) {
      return { success: false, error: 'Bu üye zaten profilde değil.' };
    }
    if (target.role === 'owner') {
      const owners = await prisma.userProfileAccess.count({
        where: { profileId: validated.profileId, role: 'owner' },
      });
      if (owners <= 1) {
        return { success: false, error: 'Profilin son sahibini silemezsiniz.' };
      }
    }

    await prisma.userProfileAccess.delete({
      where: { userId_profileId: { userId: validated.userId, profileId: validated.profileId } },
    });

    await createAuditLog('DELETE', 'UserProfileAccess', validated.userId, {
      profileId: validated.profileId,
      removedBy: guard.user.id,
    });

    revalidateProfileScopedPaths();
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Aktif profilin marka kimliğini günceller (brandName, monogram, renkler, logo).
 * Owner/admin veya super-admin yetkisi gerektirir.
 */
export async function updateProfileBranding(profileId: string, input: ProfileBrandInput) {
  try {
    const guard = await requireProfileAccess();
    if (guard.error || !guard.user || !guard.profile) {
      return { success: false, error: guard.error };
    }
    const validated = profileBrandSchema.parse(input);

    const isSuper = guard.user.role === 'superadmin';
    const callerAccess = await prisma.userProfileAccess.findUnique({
      where: { userId_profileId: { userId: guard.user.id, profileId } },
    });
    const canEdit = isSuper || callerAccess?.role === 'owner' || callerAccess?.role === 'admin';
    if (!canEdit) {
      return { success: false, error: 'Marka kimliğini düzenlemek için yetkiniz yok.' };
    }

    await prisma.profile.update({
      where: { id: profileId },
      data: {
        brandName: validated.brandName,
        monogram: validated.monogram,
        primaryColor: validated.primaryColor,
        accentColor: validated.accentColor,
        logoUrl: validated.logoUrl,
      },
    });

    await createAuditLog('UPDATE', 'Profile', profileId, {
      brandName: validated.brandName,
      updatedBy: guard.user.id,
    });

    revalidateProfileScopedPaths();
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error('updateProfileBranding error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Yeni bir Profile oluşturur ve oluşturanı `owner` olarak ekler.
 * Sadece super-admin.
 */
export async function createProfile(input: CreateProfileInput) {
  try {
    const guard = await requireSuperAdmin();
    if (guard.error || !guard.user) {
      return { success: false, error: guard.error };
    }
    const validated = createProfileSchema.parse(input);

    const id = `prof_${validated.slug}`;
    const created = await prisma.profile.create({
      data: {
        id,
        slug: validated.slug,
        name: validated.name,
        brandName: validated.brandName,
        monogram: validated.monogram,
        primaryColor: validated.primaryColor,
        accentColor: validated.accentColor,
        logoUrl: validated.logoUrl,
      },
    });

    await prisma.userProfileAccess.create({
      data: {
        id: `upa_${guard.user.id}_${created.id}`.slice(0, 60),
        userId: guard.user.id,
        profileId: created.id,
        role: 'owner',
      },
    });

    await createAuditLog('CREATE', 'Profile', created.id, {
      slug: created.slug,
      brandName: created.brandName,
      createdBy: guard.user.id,
    });

    revalidateProfileScopedPaths();
    return { success: true, profile: { id: created.id, slug: created.slug, brandName: created.brandName } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error('createProfile error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}
