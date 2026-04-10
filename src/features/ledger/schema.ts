import { z } from 'zod';

export const monthlyPerformanceSchema = z.object({
  locationId: z.string().min(1, "Aylık performans için bir AVM seçilmelidir."),
  month: z.string().datetime({ message: "Geçerli bir tarih olmalıdır." }).or(z.date()),
  sessionCount: z.number().min(0, "Oturum sayısı 0'dan küçük olamaz."),
  extraExpenseAmount: z.union([z.string(), z.number()]).optional().nullable().transform((val) => val ? parseFloat(String(val)) : 0),
  extraExpenseNotes: z.string().optional().nullable(),
});
export type MonthlyPerformanceInput = z.infer<typeof monthlyPerformanceSchema>;

export const expenseSchema = z.object({
  description: z.string().min(1, "Açıklama alanı zorunludur.").max(500, "Açıklama çok uzun."),
  type: z.enum(['ONE_TIME', 'RECURRING']),
  amount: z.union([z.string(), z.number()]).transform((val) => val ? parseFloat(String(val)) : 0),
  vatRate: z.union([z.string(), z.number()]).transform((val) => val ? parseFloat(String(val)) : 0),
  isOfficial: z.union([z.boolean(), z.string()]).optional().nullable().transform((val) => val === 'true' || val === true),
  month: z.string().nullable().optional(),
  paidBy: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  locationId: z.string().nullable().optional(),
  attachmentUrl: z.union([z.string().url(), z.literal('')]).optional().nullable().transform(val => val === '' ? null : val),
});

export const investmentSchema = z.object({
  description: z.string().min(1, "Yatırım açıklaması zorunludur.").max(500, "Açıklama çok uzun."),
  locationId: z.string().min(1, "Lokasyon seçimi zorunludur."),
  amount: z.union([z.string(), z.number()]).transform((val) => val ? parseFloat(String(val)) : 0),
  currency: z.enum(['TL', 'USD', 'EUR']).default('TL'),
  notes: z.string().max(1000).nullable().optional(),
});

export const locationParamsSchema = z.object({
  fixedRent: z.union([z.string(), z.number()]).transform((val) => val ? parseFloat(String(val)) : 0),
  duesAmount: z.union([z.string(), z.number()]).transform((val) => val ? parseFloat(String(val)) : 0),
  revenueShareRate: z.union([z.string(), z.number()]).transform((val) => val ? parseFloat(String(val)) : 0),
  revenueThreshold: z.union([z.string(), z.number()]).transform((val) => val ? parseFloat(String(val)) : 0),
  rentVatRate: z.union([z.string(), z.number()]).transform((val) => val ? parseFloat(String(val)) : 0),
});
