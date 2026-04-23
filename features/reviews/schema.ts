import { z } from "zod";

/**
 * Veřejný vstup z formuláře reference.
 * Jméno i zpráva jsou volitelné, hodnocení je jediné povinné pole.
 */
export const reviewInputSchema = z.object({
  name: z
    .string()
    .max(120, "Jméno je příliš dlouhé")
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),
  message: z
    .string()
    .max(2000, "Zpráva je příliš dlouhá")
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),
  rating: z
    .number({ invalid_type_error: "Vyberte hodnocení 1 až 5" })
    .int()
    .min(1, "Vyberte hodnocení 1 až 5")
    .max(5, "Vyberte hodnocení 1 až 5"),
  // honeypot
  website: z.string().max(0).optional(),
  // cloudflare turnstile
  turnstileToken: z.string().optional(),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;

/**
 * Admin update – celou recenzi lze upravit.
 */
export const reviewAdminUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .max(120)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  message: z
    .string()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  rating: z.number().int().min(1).max(5),
  approved: z.boolean(),
});

export type ReviewAdminUpdate = z.infer<typeof reviewAdminUpdateSchema>;
