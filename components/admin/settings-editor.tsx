"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoPicker, PhotoChip, type PhotoLite } from "@/components/admin/photo-picker";
import { updateSiteSettingsAction } from "@/features/site-settings/actions";
import type { SiteSettings, Story } from "@/types/database";

type StoryLite = Pick<Story, "id" | "title" | "slug" | "published_at">;

interface Props {
  settings: SiteSettings;
  availablePhotos: PhotoLite[];
  availableStories: StoryLite[];
}

/**
 * Nastavení webu je cíleně minimalistické – brand, kontakty, SEO
 * a „vybrané fotky / příběhy" pro homepage. Textový obsah homepage
 * (hero, o autorce, galerie, CTA, feed příběhů) se edituje ve Studio
 * → Stránky → Hlavní stránka formou modulů.
 */
export function SettingsEditor({ settings, availablePhotos, availableStories }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);

  const photoMap = new Map(availablePhotos.map((p) => [p.id, p]));

  function set<K extends keyof SiteSettings>(key: K, v: SiteSettings[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function save() {
    setSaving(true);
    try {
      await updateSiteSettingsAction({
        site_name: values.site_name,
        site_tagline: values.site_tagline,
        default_seo_title: values.default_seo_title,
        default_seo_description: values.default_seo_description,
        contact_email_public: values.contact_email_public,
        contact_email_delivery_target: values.contact_email_delivery_target,
        phone: values.phone,
        instagram_url: values.instagram_url,
        facebook_url: values.facebook_url,
        address: values.address,
        featured_photo_ids: values.featured_photo_ids,
        featured_story_ids: values.featured_story_ids,
        // hero_texts záměrně neposíláme – edituje se přes moduly homepage.
      });
      toast.success("Nastavení uloženo.");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-8">
        <Card title="Značka">
          <Field label="Název webu">
            <Input value={values.site_name} onChange={(e) => set("site_name", e.target.value)} />
          </Field>
          <Field label="Tagline (zobrazí se v headeru pod názvem a v patičce)">
            <Input
              value={values.site_tagline ?? ""}
              onChange={(e) => set("site_tagline", e.target.value || null)}
            />
          </Field>
        </Card>

        <Card title="Kontakt">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Veřejný e-mail">
              <Input
                type="email"
                value={values.contact_email_public ?? ""}
                onChange={(e) => set("contact_email_public", e.target.value || null)}
                placeholder="kontakt@domena.cz"
              />
            </Field>
            <Field label="Doručovací e-mail (kam chodí zprávy)">
              <Input
                type="email"
                value={values.contact_email_delivery_target ?? ""}
                onChange={(e) => set("contact_email_delivery_target", e.target.value || null)}
              />
            </Field>
            <Field label="Telefon">
              <Input value={values.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} />
            </Field>
            <Field label="Adresa">
              <Input value={values.address ?? ""} onChange={(e) => set("address", e.target.value || null)} />
            </Field>
            <Field label="Instagram URL">
              <Input value={values.instagram_url ?? ""} onChange={(e) => set("instagram_url", e.target.value || null)} />
            </Field>
            <Field label="Facebook URL">
              <Input value={values.facebook_url ?? ""} onChange={(e) => set("facebook_url", e.target.value || null)} />
            </Field>
          </div>
        </Card>

        <Card title="SEO">
          <Field label="Výchozí title">
            <Input
              value={values.default_seo_title ?? ""}
              onChange={(e) => set("default_seo_title", e.target.value || null)}
            />
          </Field>
          <Field label="Výchozí description">
            <Textarea
              rows={3}
              value={values.default_seo_description ?? ""}
              onChange={(e) => set("default_seo_description", e.target.value || null)}
            />
          </Field>
        </Card>

        <Card
          title="Vybrané fotky (pro moduly homepage)"
          description="Sdílený seznam používaný moduly „Homepage – hero carousel“ a „Homepage – rotující galerie“, když v nich zaškrtneš „Použít fotky z nastavení“. Je 1:1 synchronizovaný s příznakem „Vybraná na hlavní stránku“ v galerii – cokoliv tady přidáš, dostane flag v galerii a naopak."
        >
          <PhotoPicker
            photos={availablePhotos}
            values={values.featured_photo_ids}
            multi
            onChange={(ids) => set("featured_photo_ids", ids)}
            label="Vybrat fotky"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            {values.featured_photo_ids.map((id) => {
              const p = photoMap.get(id);
              return (
                <div key={id} className="flex items-center gap-2 rounded-md bg-muted px-2 py-1">
                  {p ? <PhotoChip photo={p} /> : <span className="text-xs text-red-700">Chybějící fotka</span>}
                  <button
                    type="button"
                    onClick={() => set("featured_photo_ids", values.featured_photo_ids.filter((x) => x !== id))}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Odebrat"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            {values.featured_photo_ids.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Zatím žádné vybrané fotky. Moduly homepage pak použijí fallback – fotky označené
                „Vybraná na hlavní stránku“ v galerii, řazené podle data.
              </p>
            ) : null}
          </div>
        </Card>

        <Card
          title="Vybrané příběhy (pro moduly homepage)"
          description="Volitelný kurátorský výběr příběhů. Modul „Homepage – feed příběhů“ aktuálně zobrazuje nejnovější publikované; seznam je tu připravený pro budoucí ruční pořadí."
        >
          <div className="space-y-2">
            {availableStories.map((s) => {
              const checked = values.featured_story_ids.includes(s.id);
              return (
                <label key={s.id} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      set(
                        "featured_story_ids",
                        checked
                          ? values.featured_story_ids.filter((x) => x !== s.id)
                          : [...values.featured_story_ids, s.id],
                      )
                    }
                  />
                  <span className="font-medium">{s.title}</span>
                  <span className="text-xs text-muted-foreground">/{s.slug}</span>
                </label>
              );
            })}
            {availableStories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Zatím žádné příběhy.</p>
            ) : null}
          </div>
        </Card>
      </div>

      <aside>
        <div className="sticky top-6 rounded-lg border border-border bg-background p-6">
          <Button variant="primary" onClick={save} disabled={saving} className="w-full">
            <Save className="h-4 w-4" /> {saving ? "Ukládám…" : "Uložit nastavení"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Nastavení ukládá branding, kontakty, SEO a seznam „vybraných“ položek.
            Textový obsah homepage se edituje v Modulech.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <h2 className="font-serif text-xl">{title}</h2>
      {description ? (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
