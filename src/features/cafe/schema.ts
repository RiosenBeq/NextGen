import { z } from 'zod';

export const CAFE_CATEGORIES = [
  { key: 'coffee', label: 'Kahve', field: 'coffeeRevenue' as const },
  { key: 'coldDrink', label: 'Soğuk İçecek', field: 'coldDrinkRevenue' as const },
  { key: 'dessert', label: 'Tatlı', field: 'dessertRevenue' as const },
  { key: 'food', label: 'Yemek', field: 'foodRevenue' as const },
  { key: 'other', label: 'Diğer', field: 'otherRevenue' as const },
];

const positiveNumber = z.preprocess((v) => {
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  return v;
}, z.number().min(0, 'Tutar negatif olamaz.'));

const positiveInt = z.preprocess((v) => {
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
  }
  return v;
}, z.number().int().min(0));

export const cafeDailySalesSchema = z.object({
  locationId: z.string().min(1, 'Lokasyon seçilmeli.'),
  date: z.string().min(8, 'Tarih girilmeli (YYYY-MM-DD).'),
  totalRevenue: positiveNumber.optional().default(0),
  customerCount: positiveInt.optional().default(0),
  coffeeRevenue: positiveNumber.optional().default(0),
  coldDrinkRevenue: positiveNumber.optional().default(0),
  dessertRevenue: positiveNumber.optional().default(0),
  foodRevenue: positiveNumber.optional().default(0),
  otherRevenue: positiveNumber.optional().default(0),
  notes: z
    .string()
    .max(500)
    .optional()
    .transform((v) => (v && v.trim() !== '' ? v.trim() : null)),
});
export type CafeDailySalesInput = z.input<typeof cafeDailySalesSchema>;
export type CafeDailySalesOutput = z.output<typeof cafeDailySalesSchema>;
