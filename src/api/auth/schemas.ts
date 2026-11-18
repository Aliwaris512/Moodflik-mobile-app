import { z } from 'zod';

import { zForgotPasswordRequest, zLoginRequest } from '@/api/generated/zod.gen';

const PASSWORD_RULE = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
export const PASSWORD_HINT =
  'Password should be between 6-16 characters including small and capital letters, number(s) and special characters';

const name = (label: string) =>
  z
    .string()
    .min(1, `Please enter ${label}`)
    .regex(/^[a-zA-Z ]+$/, `Please enter a valid ${label}`);

const password = z.string().min(1, 'Please enter a password').regex(PASSWORD_RULE, PASSWORD_HINT);

export function ageOf(date: Date, now = new Date()): number {
  let age = now.getFullYear() - date.getFullYear();
  const m = now.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age -= 1;
  return age;
}

export const loginSchema = zLoginRequest.extend({
  email: z.email('Please enter a valid email'),
  password: z.string().min(1, 'Please enter a password'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signUpSchema = z
  .object({
    first_name: name('first name'),
    last_name: name('last name'),
    username: z.string().min(1, 'Please enter a username'),
    email: z.email('Please enter a valid email'),
    password,
    confirm_password: z.string().min(1, 'Please confirm your password'),
    date_of_birth: z.string().min(1, 'Please select your date of birth'),
    gender: z.enum(['M', 'F', 'NA'], 'Please select gender'),
    terms: z.literal(true, 'Please check the box to proceed.'),
  })
  .refine((v) => v.password === v.confirm_password, {
    path: ['confirm_password'],
    message: 'Password does not match',
  })
  .refine((v) => !v.date_of_birth || ageOf(new Date(v.date_of_birth)) >= 13, {
    path: ['date_of_birth'],
    message: 'You must be aged 13 or over to sign up!',
  });
export type SignUpValues = z.input<typeof signUpSchema>;

export const forgotPasswordSchema = zForgotPasswordRequest.extend({
  email: z.email('Please enter a valid email'),
});

export const otpSchema = z.object({
  code: z.string().regex(/^\d{4,6}$/, 'Enter the code from your email'),
});

export const resetPasswordSchema = z
  .object({ password, confirm_password: z.string().min(1, 'Please confirm your password') })
  .refine((v) => v.password === v.confirm_password, {
    path: ['confirm_password'],
    message: 'Password does not match',
  });
