import { z } from 'zod';

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export type EmailFormValues = z.infer<typeof emailSchema>;

export const otpSchema = z.object({
  code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/u),
});

export type OtpFormValues = z.infer<typeof otpSchema>;
