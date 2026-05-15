import { z } from 'zod';

export const projectCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'error_name_required')
    .max(255, 'error_name_too_long'),
  description: z
    .string()
    .trim()
    .max(4000, 'error_description_too_long'),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
