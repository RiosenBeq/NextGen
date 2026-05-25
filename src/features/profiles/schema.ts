import { z } from 'zod';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const SLUG = /^[a-z0-9-]{2,32}$/;

export const profileBrandSchema = z.object({
  brandName: z.string().min(2, 'Marka adı en az 2 karakter olmalı.').max(60),
  monogram: z.string().min(1).max(3, 'Monogram en fazla 3 karakter.'),
  primaryColor: z.string().regex(HEX_COLOR, 'Renk #RRGGBB formatında olmalı.'),
  accentColor: z.string().regex(HEX_COLOR, 'Renk #RRGGBB formatında olmalı.'),
  logoUrl: z
    .union([z.string().url(), z.literal(''), z.null()])
    .optional()
    .transform((v) => (v && v !== '' ? v : null)),
});
export type ProfileBrandInput = z.input<typeof profileBrandSchema>;

export const createProfileSchema = profileBrandSchema.extend({
  slug: z.string().regex(SLUG, 'Slug: küçük harf, rakam ve tire, 2-32 karakter.'),
  name: z.string().min(2).max(80),
});
export type CreateProfileInput = z.input<typeof createProfileSchema>;

export const grantAccessSchema = z.object({
  profileId: z.string().min(1),
  email: z.string().email('Geçerli bir e-posta girin.'),
  role: z.enum(['owner', 'admin', 'member']).default('member'),
});
export type GrantAccessInput = z.input<typeof grantAccessSchema>;

export const updateRoleSchema = z.object({
  profileId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(['owner', 'admin', 'member']),
});
export type UpdateRoleInput = z.input<typeof updateRoleSchema>;

export const revokeAccessSchema = z.object({
  profileId: z.string().min(1),
  userId: z.string().min(1),
});
export type RevokeAccessInput = z.input<typeof revokeAccessSchema>;
