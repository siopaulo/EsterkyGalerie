import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Image as ImageIcon,
  BookOpen,
  FileText,
  Tag,
  Wallet,
  Mail,
  Star,
  Settings,
} from "lucide-react";

export type AdminStudioNavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  /** Když true, aktivní jen při přesné shodě pathname. */
  exact?: boolean;
};

export const ADMIN_STUDIO_NAV: AdminStudioNavItem[] = [
  { href: "/studio", label: "Přehled", Icon: LayoutDashboard, exact: true },
  { href: "/studio/galerie", label: "Galerie", Icon: ImageIcon },
  { href: "/studio/pribehy", label: "Příběhy", Icon: BookOpen },
  { href: "/studio/stranky", label: "Stránky", Icon: FileText },
  { href: "/studio/tagy", label: "Tagy", Icon: Tag },
  { href: "/studio/cenik", label: "Ceník", Icon: Wallet },
  { href: "/studio/kontakty", label: "Zprávy", Icon: Mail },
  { href: "/studio/recenze", label: "Reference", Icon: Star },
  { href: "/studio/nastaveni", label: "Nastavení", Icon: Settings },
];
