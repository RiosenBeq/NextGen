'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { getErrorMessage } from '@/lib/errors';
import { requireProfileAccess } from '@/lib/auth-guards';
import { cafeDailySalesSchema, type CafeDailySalesInput } from './schema';

function parseDayUTC(input: string): Date {
  // input: "YYYY-MM-DD" → UTC midnight
  const [y, m, d] = input.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) {
    throw new Error('Geçerli bir tarih girilmeli.');
  }
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function computeTotalIfMissing(input: ReturnType<typeof cafeDailySalesSchema.parse>) {
  const sumCategories =
    input.coffeeRevenue +
    input.coldDrinkRevenue +
    input.dessertRevenue +
    input.foodRevenue +
    input.otherRevenue;
  if (input.totalRevenue && input.totalRevenue > 0) return input.totalRevenue;
  return sumCategories;
}

export async function upsertCafeDailySales(data: CafeDailySalesInput) {
  try {
    const guard = await requireProfileAccess();
    if (guard.error || !guard.user || !guard.profile) {
      return { success: false, error: guard.error };
    }
    if (guard.profile.businessType !== 'cafe') {
      return { success: false, error: 'Bu işlem sadece cafe profili için geçerli.' };
    }
    const profileId = guard.profile.id;

    const validated = cafeDailySalesSchema.parse(data);
    const day = parseDayUTC(validated.date);
    const total = computeTotalIfMissing(validated);

    const id = `cafe_daily_${validated.locationId}_${validated.date}`;

    const upserted = await prisma.cafeDailySales.upsert({
      where: { locationId_date: { locationId: validated.locationId, date: day } },
      create: {
        id,
        profileId,
        locationId: validated.locationId,
        date: day,
        totalRevenue: total,
        customerCount: validated.customerCount,
        coffeeRevenue: validated.coffeeRevenue,
        coldDrinkRevenue: validated.coldDrinkRevenue,
        dessertRevenue: validated.dessertRevenue,
        foodRevenue: validated.foodRevenue,
        otherRevenue: validated.otherRevenue,
        notes: validated.notes,
      },
      update: {
        totalRevenue: total,
        customerCount: validated.customerCount,
        coffeeRevenue: validated.coffeeRevenue,
        coldDrinkRevenue: validated.coldDrinkRevenue,
        dessertRevenue: validated.dessertRevenue,
        foodRevenue: validated.foodRevenue,
        otherRevenue: validated.otherRevenue,
        notes: validated.notes,
      },
    });

    await createAuditLog('UPDATE', 'CafeDailySales', upserted.id, {
      date: validated.date,
      total,
      customers: validated.customerCount,
      by: guard.user.id,
    });

    revalidatePath('/cafe');
    revalidatePath('/cafe/satislar');
    revalidatePath('/cafe/raporlar');
    return { success: true };
  } catch (error) {
    console.error('upsertCafeDailySales error:', error);
    return { success: false, error: getErrorMessage(error, 'Kayıt başarısız.') };
  }
}

export async function deleteCafeDailySales(id: string) {
  try {
    const guard = await requireProfileAccess();
    if (guard.error || !guard.user || !guard.profile) {
      return { success: false, error: guard.error };
    }
    if (guard.profile.businessType !== 'cafe') {
      return { success: false, error: 'Bu işlem sadece cafe profili için geçerli.' };
    }
    const profileId = guard.profile.id;

    await prisma.cafeDailySales.deleteMany({ where: { id, profileId } });

    await createAuditLog('DELETE', 'CafeDailySales', id, { by: guard.user.id });

    revalidatePath('/cafe');
    revalidatePath('/cafe/satislar');
    revalidatePath('/cafe/raporlar');
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export interface CafeDailyRow {
  id: string;
  locationId: string;
  locationName: string;
  date: string; // ISO date
  totalRevenue: number;
  customerCount: number;
  coffeeRevenue: number;
  coldDrinkRevenue: number;
  dessertRevenue: number;
  foodRevenue: number;
  otherRevenue: number;
  notes: string | null;
}

export async function listCafeDailySales(opts?: {
  month?: string; // YYYY-MM, optional filter
  locationId?: string;
  limit?: number;
}): Promise<CafeDailyRow[]> {
  const guard = await requireProfileAccess();
  if (guard.error || !guard.profile) return [];
  if (guard.profile.businessType !== 'cafe') return [];
  const profileId = guard.profile.id;

  const where: {
    profileId: string;
    locationId?: string;
    date?: { gte: Date; lt: Date };
  } = { profileId };

  if (opts?.locationId) where.locationId = opts.locationId;

  if (opts?.month) {
    const [y, m] = opts.month.split('-').map((n) => parseInt(n, 10));
    if (y && m) {
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 1));
      where.date = { gte: start, lt: end };
    }
  }

  const rows = await prisma.cafeDailySales.findMany({
    where,
    orderBy: { date: 'desc' },
    take: opts?.limit ?? 200,
    include: { location: true },
  });

  return rows.map((r) => ({
    id: r.id,
    locationId: r.locationId,
    locationName: r.location?.name ?? '—',
    date: r.date.toISOString().slice(0, 10),
    totalRevenue: r.totalRevenue,
    customerCount: r.customerCount,
    coffeeRevenue: r.coffeeRevenue,
    coldDrinkRevenue: r.coldDrinkRevenue,
    dessertRevenue: r.dessertRevenue,
    foodRevenue: r.foodRevenue,
    otherRevenue: r.otherRevenue,
    notes: r.notes,
  }));
}

export interface CafeMonthlySummary {
  monthLabel: string;
  monthId: string;
  totalRevenue: number;
  totalCustomers: number;
  daysWithSales: number;
  avgDailyRevenue: number;
  avgTicket: number;
  categoryBreakdown: {
    coffee: number;
    coldDrink: number;
    dessert: number;
    food: number;
    other: number;
  };
  bestDay: { date: string; revenue: number } | null;
  worstDay: { date: string; revenue: number } | null;
}

export async function getCafeMonthlySummary(month?: string): Promise<CafeMonthlySummary | null> {
  const guard = await requireProfileAccess();
  if (guard.error || !guard.profile) return null;
  if (guard.profile.businessType !== 'cafe') return null;
  const profileId = guard.profile.id;

  const monthId = month ?? new Date().toISOString().slice(0, 7);
  const [y, m] = monthId.split('-').map((n) => parseInt(n, 10));
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));

  const rows = await prisma.cafeDailySales.findMany({
    where: { profileId, date: { gte: start, lt: end } },
    orderBy: { totalRevenue: 'desc' },
  });

  const totalRevenue = rows.reduce((s, r) => s + r.totalRevenue, 0);
  const totalCustomers = rows.reduce((s, r) => s + r.customerCount, 0);
  const daysWithSales = rows.filter((r) => r.totalRevenue > 0).length;

  const categoryBreakdown = {
    coffee: rows.reduce((s, r) => s + r.coffeeRevenue, 0),
    coldDrink: rows.reduce((s, r) => s + r.coldDrinkRevenue, 0),
    dessert: rows.reduce((s, r) => s + r.dessertRevenue, 0),
    food: rows.reduce((s, r) => s + r.foodRevenue, 0),
    other: rows.reduce((s, r) => s + r.otherRevenue, 0),
  };

  const best = rows[0];
  const worst = [...rows].reverse().find((r) => r.totalRevenue > 0);

  const monthDate = new Date(start);
  const monthLabel = monthDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  return {
    monthLabel,
    monthId,
    totalRevenue,
    totalCustomers,
    daysWithSales,
    avgDailyRevenue: daysWithSales > 0 ? totalRevenue / daysWithSales : 0,
    avgTicket: totalCustomers > 0 ? totalRevenue / totalCustomers : 0,
    categoryBreakdown,
    bestDay: best ? { date: best.date.toISOString().slice(0, 10), revenue: best.totalRevenue } : null,
    worstDay: worst ? { date: worst.date.toISOString().slice(0, 10), revenue: worst.totalRevenue } : null,
  };
}

export async function listAvailableMonths(): Promise<string[]> {
  const guard = await requireProfileAccess();
  if (guard.error || !guard.profile) return [];
  if (guard.profile.businessType !== 'cafe') return [];
  const profileId = guard.profile.id;

  const rows = await prisma.cafeDailySales.findMany({
    where: { profileId },
    select: { date: true },
    orderBy: { date: 'desc' },
  });

  const set = new Set<string>();
  for (const r of rows) set.add(r.date.toISOString().slice(0, 7));
  set.add(new Date().toISOString().slice(0, 7));

  return Array.from(set).sort().reverse();
}
