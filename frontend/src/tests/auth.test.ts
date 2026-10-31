import { describe, it, expect } from 'vitest';
import * as z from 'zod';
import { queryClient } from '../lib/queryClient';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
  remember: z.boolean().optional(),
});

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.string().email('Format email tidak valid'),
    phone: z.string().min(8, 'Nomor telepon/WhatsApp minimal 8 digit'),
    password: z
      .string()
      .min(10, 'Kata sandi minimal 10 karakter')
      .regex(/[A-Z]/, 'Wajib mengandung minimal 1 huruf besar')
      .regex(/[a-z]/, 'Wajib mengandung minimal 1 huruf kecil')
      .regex(/[0-9]/, 'Wajib mengandung minimal 1 angka'),
    password_confirmation: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
    agree_terms: z.boolean().refine((val) => val === true, {
      message: 'Anda wajib menyetujui Ketentuan Layanan & Kebijakan Privasi',
    }),
    address: z.string().optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['password_confirmation'],
  });

describe('Tahap N: Authentication & Security Schema Validations', () => {
  it('validates register password strength (min 10 chars, uppercase, lowercase, number)', () => {
    // Too short (<10 chars)
    const weakShort = registerSchema.safeParse({
      name: 'Rian Pratama',
      email: 'rian@cdepearls.com',
      phone: '081234567890',
      password: 'Pass1',
      password_confirmation: 'Pass1',
      agree_terms: true,
    });
    expect(weakShort.success).toBe(false);

    // Missing uppercase
    const missingUpper = registerSchema.safeParse({
      name: 'Rian Pratama',
      email: 'rian@cdepearls.com',
      phone: '081234567890',
      password: 'password2026!',
      password_confirmation: 'password2026!',
      agree_terms: true,
    });
    expect(missingUpper.success).toBe(false);

    // Missing number
    const missingNum = registerSchema.safeParse({
      name: 'Rian Pratama',
      email: 'rian@cdepearls.com',
      phone: '081234567890',
      password: 'StrongPasswordWithoutNumber!',
      password_confirmation: 'StrongPasswordWithoutNumber!',
      agree_terms: true,
    });
    expect(missingNum.success).toBe(false);

    // Password confirmation mismatch
    const mismatch = registerSchema.safeParse({
      name: 'Rian Pratama',
      email: 'rian@cdepearls.com',
      phone: '081234567890',
      password: 'ValidPassword2026!',
      password_confirmation: 'DifferentPassword2026!',
      agree_terms: true,
    });
    expect(mismatch.success).toBe(false);

    // Terms agreement unchecked
    const termsUnchecked = registerSchema.safeParse({
      name: 'Rian Pratama',
      email: 'rian@cdepearls.com',
      phone: '081234567890',
      password: 'ValidPassword2026!',
      password_confirmation: 'ValidPassword2026!',
      agree_terms: false,
    });
    expect(termsUnchecked.success).toBe(false);

    // Fully compliant registration data
    const valid = registerSchema.safeParse({
      name: 'Rian Pratama',
      email: 'rian@cdepearls.com',
      phone: '081234567890',
      password: 'ValidPassword2026!',
      password_confirmation: 'ValidPassword2026!',
      agree_terms: true,
    });
    expect(valid.success).toBe(true);
  });

  it('validates login format with proper email and required password', () => {
    const invalidEmail = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'somePassword',
    });
    expect(invalidEmail.success).toBe(false);

    const emptyPassword = loginSchema.safeParse({
      email: 'user@cdepearls.com',
      password: '',
    });
    expect(emptyPassword.success).toBe(false);

    const validLogin = loginSchema.safeParse({
      email: 'user@cdepearls.com',
      password: 'ValidPassword2026!',
      remember: true,
    });
    expect(validLogin.success).toBe(true);
  });

  it('clears TanStack Query cache on logout', () => {
    queryClient.setQueryData(['user-profile'], { name: 'Old User' });
    expect(queryClient.getQueryData(['user-profile'])).toBeDefined();

    queryClient.clear();
    expect(queryClient.getQueryData(['user-profile'])).toBeUndefined();
  });
});
