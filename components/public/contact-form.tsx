"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { contactSchema, type ContactInput } from "@/features/contact/schema";
import { publicEnv } from "@/lib/env";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement | string, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

export function ContactForm() {
  const [token, setToken] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const siteKey = publicEnv.turnstileSiteKey;

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema) as never,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      consent: false as unknown as true,
      website: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (values: ContactInput) => {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, turnstileToken: token }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error ?? "Zprávu se nepodařilo odeslat. Zkuste to prosím znovu.");
        return;
      }
      setSubmitted(true);
      form.reset();
      if (window.turnstile) window.turnstile.reset();
      toast.success("Zpráva odeslána. Ozvu se co nejdřív.");
    } catch {
      toast.error("Při odesílání došlo k chybě sítě.");
    }
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-8 text-center">
        <p className="font-serif text-2xl">Děkuji za zprávu</p>
        <p className="mt-2 text-muted-foreground">
          Ozvu se obvykle do 48 hodin. Pokud jde o naléhavý dotaz, zkuste mě najít na Instagramu.
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={() => setSubmitted(false)}>
            Odeslat další zprávu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Jméno a příjmení *"
          error={form.formState.errors.name?.message}
        >
          <Input {...form.register("name")} autoComplete="name" required />
        </Field>
        <Field label="E-mail *" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register("email")} autoComplete="email" required />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Telefon" error={form.formState.errors.phone?.message}>
          <Input type="tel" {...form.register("phone")} autoComplete="tel" />
        </Field>
        <Field label="Předmět" error={form.formState.errors.subject?.message}>
          <Input {...form.register("subject")} />
        </Field>
      </div>

      <Field label="Zpráva *" error={form.formState.errors.message?.message}>
        <Textarea rows={6} {...form.register("message")} required />
      </Field>

      {/* honeypot */}
      <div aria-hidden className="pointer-events-none absolute -z-10 h-0 w-0 overflow-hidden opacity-0">
        <label>
          Web (nevyplňovat)
          <input tabIndex={-1} autoComplete="off" {...form.register("website")} />
        </label>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="consent"
          checked={form.watch("consent") as unknown as boolean}
          onCheckedChange={(v) => form.setValue("consent", (v === true) as unknown as true, { shouldValidate: true })}
        />
        <Label htmlFor="consent" className="text-sm font-normal leading-snug text-muted-foreground">
          Souhlasím se{" "}
          <a href="/ochrana-osobnich-udaju" className="underline underline-offset-2 hover:text-foreground">
            zpracováním osobních údajů
          </a>{" "}
          pro účely odpovědi na tuto zprávu.
        </Label>
      </div>
      {form.formState.errors.consent ? (
        <p className="text-sm text-red-700">{form.formState.errors.consent.message as string}</p>
      ) : null}

      {siteKey ? (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div
            className="cf-turnstile"
            data-sitekey={siteKey}
            data-callback="__turnstileSet"
          />
          <Script id="turnstile-callback">{`window.__turnstileSet = function(token){ window.dispatchEvent(new CustomEvent('turnstile-token',{detail:token})); };`}</Script>
          <TurnstileListener onToken={setToken} />
        </>
      ) : null}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          Odesláním přijímáte zásady ochrany osobních údajů.
        </p>
        <Button type="submit" size="lg" variant="primary" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Odesílám…" : "Odeslat zprávu"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

function TurnstileListener({ onToken }: { onToken: (t: string) => void }) {
  useEffect(() => {
    const handler = (e: Event) => {
      onToken((e as CustomEvent<string>).detail ?? "");
    };
    window.addEventListener("turnstile-token", handler);
    return () => window.removeEventListener("turnstile-token", handler);
  }, [onToken]);
  return null;
}
