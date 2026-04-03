'use server'

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { monthlyPerformanceSchema, MonthlyPerformanceInput } from './schema';

export async function addMonthlyPerformance(data: MonthlyPerformanceInput) {
  try {
    const validatedData = monthlyPerformanceSchema.parse(data);

    const record = await prisma.monthlyPerformance.create({
      data: {
        locationId: validatedData.locationId,
        month: new Date(validatedData.month),
        sessionCount: validatedData.sessionCount,
        extraExpenseAmount: validatedData.extraExpenseAmount || 0,
        extraExpenseNotes: validatedData.extraExpenseNotes,
      }
    });

    revalidatePath('/performance');
    revalidatePath('/dashboard');
    
    return { success: true, record };
  } catch (error: any) {
    console.error("Hata:", error);
    return { success: false, error: error.message || "Bilinmeyen bir hata oluştu." };
  }
}

export async function getActiveLocations() {
  try {
    return await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
}

export async function getSystemParameters() {
  try {
    const params = await prisma.systemParameter.findMany();
    const map: Record<string, number> = {};
    for (const p of params) {
      map[p.key] = p.value;
    }
    return map;
  } catch (error) {
    console.error("Error fetching params:", error);
    return {};
  }
}
