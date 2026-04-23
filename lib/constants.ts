export const SITE_DEFAULTS = {
  /** Neutrální záloha v `<title>` / OG, když v nastavení webu není `site_name`. */
  name: "Foto web",
  tagline: "Fotografie s duší koně",
  description:
    "Editorial foto portfolio zaměřené na koně, portréty a přírodu. Autorka Esterka.",
  locale: "cs_CZ",
  ogImage: "/og-default.svg",
} as const;

export const PUBLIC_NAV = [
  { href: "/", label: "Domů" },
  { href: "/o-mne", label: "O mně" },
  { href: "/sluzby", label: "Služby" },
  { href: "/pribehy", label: "Příběhy" },
  { href: "/galerie", label: "Galerie" },
  { href: "/cenik", label: "Ceník" },
  { href: "/reference", label: "Reference" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

export const ADMIN_NAV = [
  { href: "/studio", label: "Přehled", icon: "LayoutDashboard" },
  { href: "/studio/galerie", label: "Galerie", icon: "Image" },
  { href: "/studio/pribehy", label: "Příběhy", icon: "BookOpen" },
  { href: "/studio/stranky", label: "Stránky", icon: "FileText" },
  { href: "/studio/tagy", label: "Tagy", icon: "Tag" },
  { href: "/studio/cenik", label: "Ceník", icon: "Wallet" },
  { href: "/studio/kontakty", label: "Zprávy", icon: "Mail" },
  { href: "/studio/recenze", label: "Reference", icon: "Star" },
  { href: "/studio/nastaveni", label: "Nastavení", icon: "Settings" },
] as const;

export const PAGINATION = {
  gallery: 24,
  stories: 9,
} as const;
