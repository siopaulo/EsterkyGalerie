import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Uveďte prosím jméno").max(120),
  email: z.string().email("Neplatný e-mail").max(200),
  phone: z
    .string()
    .max(40)
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),
  subject: z
    .string()
    .max(200)
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),
  message: z.string().min(10, "Zpráva je příliš krátká").max(5000),
  consent: z
    .union([z.literal(true), z.literal("true"), z.literal("on"), z.boolean()])
    .refine((v) => v === true || v === "true" || v === "on", {
      message: "Potřebujeme souhlas se zpracováním údajů",
    }),
  // honeypot
  website: z.string().max(0).optional(),
  // turnstile
  turnstileToken: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
