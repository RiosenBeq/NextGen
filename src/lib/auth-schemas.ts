import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'E-posta adresi zorunludur.' })
    .email({ message: 'Geçerli bir e-posta adresi giriniz.' })
    .trim(),
  password: z
    .string()
    .min(6, { message: 'Şifre en az 6 karakter olmalıdır.' })
    .trim(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

// Future: Add user schema for admin user creation
export const addUserSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'E-posta adresi zorunludur.' })
    .email({ message: 'Geçerli bir e-posta adresi giriniz.' })
    .trim(),
  password: z
    .string()
    .min(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
    .trim(),
  displayName: z
    .string()
    .min(2, { message: 'Görünen ad en az 2 karakter olmalıdır.' })
    .max(50, { message: 'Görünen ad en fazla 50 karakter olabilir.' })
    .trim(),
  role: z.enum(['admin', 'user'], {
    message: 'Geçerli bir rol seçiniz.',
  }),
});

export type AddUserInput = z.infer<typeof addUserSchema>;
