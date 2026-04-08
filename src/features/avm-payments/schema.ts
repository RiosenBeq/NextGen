import { z } from 'zod';

export const avmPaymentSchema = z.object({
  locationId: z.string().min(1, 'Lokasyon seçimi zorunludur.'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Ay formatı YYYY-MM olmalıdır.'),
  paymentType: z.enum(['Kira', 'Aidat', 'CiroPay', 'Diger'], {
    errorMap: () => ({ message: 'Geçerli bir ödeme tipi seçiniz.' }),
  }),
  description: z.string().max(500, 'Açıklama en fazla 500 karakter olabilir.').optional().nullable(),
  amount: z.union([z.string(), z.number()]).transform((val) => parseFloat(String(val))),
});

export type AvmPaymentInput = z.infer<typeof avmPaymentSchema>;
