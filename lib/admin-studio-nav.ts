import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Image as ImageIcon,
  BookOpen,
  FileText,
  Tag,
  Mail,
  Star,
  Settings,
} from "lucide-react";

/** Klíč pro číselné odznaky vedle položek navigace (server-side spočítané). */
export type StudioBadgeKey = "messages" | "reviews";

export type StudioBadges = Partial<Record<StudioBadgeKey, number>>;

export type AdminStudioNavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  /** Když true, aktivní jen při přesné shodě pathname. */
  exact?: boolean;
  /** Pokud je nastaven, vykreslí se odznak s počtem (jen ve studiu). */
  badgeKey?: StudioBadgeKey;
};

export const ADMIN_STUDIO_NAV: AdminStudioNavItem[] = [
  { href: "/studio", label: "Přehled", Icon: LayoutDashboard, exact: true },
  { href: "/studio/galerie", label: "Galerie", Icon: ImageIcon },
  { href: "/studio/pribehy", label: "Příběhy", Icon: BookOpen },
  { href: "/studio/stranky", label: "Stránky", Icon: FileText },
  { href: "/studio/tagy", label: "Tagy", Icon: Tag },
  { href: "/studio/kontakty", label: "Zprávy", Icon: Mail, badgeKey: "messages" },
  { href: "/studio/recenze", label: "Reference", Icon: Star, badgeKey: "reviews" },
  { href: "/studio/nastaveni", label: "Nastavení", Icon: Settings },
];
