"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/public/star-rating";
import { TurnstileWidget } from "@/components/public/turnstile-widget";
import { reviewInputSchema, type ReviewInput } from "@/features/reviews/schema";
import { publicEnv } from "@/lib/env";

export function ReviewForm() {
  const [token, setToken] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const turnstileEnabled = Boolean(publicEnv.turnstileSiteKey);

  const form = useForm<ReviewInput>({
    resolver: zodResolver(reviewInputSchema) as never,
    defaultValues: {
      name: "",
      message: "",
      rating: 0 as unknown as 1,
      website: "",
    },
    mode: "onBlur",
  });

  const handleToken = useCallback((t: string) => setToken(t), []);
  // eslint-disable-next-line react-hooks/incompatible-library -- RHF watch pro hvězdy
  const rating = form.watch("rating") as number | undefined;

  const onSubmit = async (values: ReviewInput) => {
    if (!values.rating) {
      form.setError("rating", { message: "Vyberte hodnocení 1 až 5" });
      return;
    }
    if (turnstileEnabled && !token) {
      toast.error("Ještě chvilku – dokončuje se ověření proti robotům.");
      return;
    }
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name || undefined,
          message: values.message || undefined,
          rating: values.rating,
          website: values.website,
          turnstileToken: token,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error ?? "Recenzi se nepodařilo odeslat. Zkuste to prosím znovu.");
        return;
      }
      setSubmitted(true);
      form.reset();
      setToken("");
      if (typeof window !== "undefined" && window.turnstile) {
        try {
          window.turnstile.reset();
        } catch {
          // ignore
        }
      }
    } catch {
      toast.error("Při odesílání došlo k chybě sítě.");
    }
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-8 text-center">
        <p className="font-serif text-2xl">Děkujeme, recenze čeká na schválení</p>
        <p className="mt-2 text-muted-foreground">
          Jakmile si ji projdu, objeví se tady pro ostatní. Díky, že sis našla čas!
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={() => setSubmitted(false)}>
            Přidat další recenzi
          </Button>
        </div>
      </div>
    );
  }

  const ratingError = form.formState.errors.rating?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="rounded-lg border border-border bg-background p-6">
        <p className="font-serif text-2xl">Přidat recenzi</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Jméno i text jsou volitelné. Povinné je jen hodnocení hvězdičkami.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-medium">Hodnocení *</label>
            <div className="mt-2">
              <StarRating
                value={typeof rating === "number" ? rating : 0}
                onChange={(v) =>
                  form.setValue("rating", v as ReviewInput["rating"], {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                size={28}
              />
            </div>
            {ratingError ? (
              <p className="mt-1 text-sm text-red-700">{ratingError as string}</p>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Jméno (volitelné)" error={form.formState.errors.name?.message}>
              <Input
                placeholder="Např. Klára M."
                autoComplete="name"
                {...form.register("name")}
              />
            </Field>
          </div>

          <Field label="Text recenze (volitelné)" error={form.formState.errors.message?.message}>
            <Textarea
              rows={5}
              placeholder="Jaký byl zážitek z focení?"
              {...form.register("message")}
            />
          </Field>

          {/* honeypot */}
          <div aria-hidden className="pointer-events-none absolute -z-10 h-0 w-0 overflow-hidden opacity-0">
            <label>
              Web (nevyplňovat)
              <input tabIndex={-1} autoComplete="off" {...form.register("website")} />
            </label>
          </div>

          {turnstileEnabled ? <TurnstileWidget onToken={handleToken} action="review" /> : null}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Recenze se zobrazí až po schválení.
            </p>
            <Button
              type="submit"
              variant="primary"
              disabled={form.formState.isSubmitting || (turnstileEnabled && !token)}
            >
              {form.formState.isSubmitting ? "Odesílám…" : "Odeslat recenzi"}
            </Button>
          </div>
        </div>
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
