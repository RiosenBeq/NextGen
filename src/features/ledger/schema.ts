import { z } from 'zod';

export const monthlyPerformanceSchema = z.object({
  locationId: z.string().min(1, "Aylık performans için bir AVM seçilmelidir."),
  month: z.string().datetime({ message: "Geçerli bir tarih olmalıdır." }).or(z.date()),
  sessionCount: z.number().min(0, "Oturum sayısı 0'dan küçük olamaz."),
  extraExpenseAmount: z.number().min(0).optional().nullable(),
  extraExpenseNotes: z.string().optional().nullable(),
});
export type MonthlyPerformanceInput = z.infer<typeof monthlyPerformanceSchema>;

export const expenseSchema = z.object({
  description: z.string().min(1, "Açıklama alanı zorunludur.").max(500, "Açıklama çok uzun."),
  type: z.enum(['ONE_TIME', 'RECURRING']),
  amount: z.union([z.string(), z.number()]).transform((val) => parseFloat(String(val))),
  vatRate: z.union([z.string(), z.number()]).transform((val) => parseFloat(String(val))),
  isOfficial: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return false;
      if (typeof val === 'boolean') return val;
      const normalized = val.trim().toLowerCase();
      return normalized === 'true' || normalized === 'on' || normalized === '1';
    }),
  month: z.string().nullable().optional(),
  paidBy: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  locationId: z.string().nullable().optional(),
  attachmentUrl: z.string().url().nullable().optional(),
});

export const investmentSchema = z.object({
  description: z.string().min(1, "Yatırım açıklaması zorunludur.").max(500, "Açıklama çok uzun."),
  locationId: z.string().min(1, "Lokasyon seçimi zorunludur."),
  amount: z.union([z.string(), z.number()]).transform((val) => parseFloat(String(val))),
  currency: z.enum(['TL', 'USD', 'EUR']).default('TL'),
  notes: z.string().max(1000).nullable().optional(),
});

export const locationParamsSchema = z.object({
  fixedRent: z.union([z.string(), z.number()]).transform((val) => parseFloat(String(val))),
  duesAmount: z.union([z.string(), z.number()]).transform((val) => parseFloat(String(val))),
  revenueShareRate: z.union([z.string(), z.number()]).transform((val) => parseFloat(String(val))),
  revenueThreshold: z.union([z.string(), z.number()]).transform((val) => parseFloat(String(val))),
  rentVatRate: z.union([z.string(), z.number()]).transform((val) => parseFloat(String(val))),
});
