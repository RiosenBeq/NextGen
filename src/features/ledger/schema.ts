import { z } from 'zod';

export const monthlyPerformanceSchema = z.object({
  locationId: z.string().min(1, "Aylık performans için bir AVM seçilmelidir."),
  month: z.string().datetime({ message: "Geçerli bir tarih olmalıdır." }).or(z.date()),
  sessionCount: z.number().min(0, "Oturum sayısı 0'dan küçük olamaz."),
  extraExpenseAmount: z.number().min(0).optional().nullable(),
  extraExpenseNotes: z.string().optional().nullable(),
});

export type MonthlyPerformanceInput = z.infer<typeof monthlyPerformanceSchema>;
