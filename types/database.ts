/**
 * Ručně psané typy odpovídající supabase/migrations/0001_init.sql.
 * Pro plnou type safety lze později generovat přes `pnpm db:types`.
 */

export type PhotoVisibility = "public" | "hidden";
export type AssetKind =
  | "story_block"
  | "page_block"
  | "story_cover"
  | "featured_home"
  | "site_setting";

export interface SiteSettings {
  id: number;
  site_name: string;
  site_tagline: string | null;
  default_seo_title: string | null;
  default_seo_description: string | null;
  contact_email_public: string | null;
  contact_email_delivery_target: string | null;
  phone: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  address: string | null;
  logo_url: string | null;
  hero_texts: Record<string, string> | null;
  featured_photo_ids: string[];
  featured_story_ids: string[];
  updated_at: string;
}

export interface Photo {
  id: string;
  cloudinary_public_id: string;
  original_filename: string | null;
  display_name: string;
  alt_text: string;
  description: string | null;
  visibility: PhotoVisibility;
  width: number | null;
  height: number | null;
  bytes: number | null;
  format: string | null;
  dominant_color: string | null;
  blur_data_url: string | null;
  is_featured_home: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface PhotoTag {
  photo_id: string;
  tag_id: string;
}

export interface Story {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_photo_id: string | null;
  published_at: string;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryBlock {
  id: string;
  story_id: string;
  block_type: string;
  sort_order: number;
  payload: unknown;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  intro: string | null;
  updated_at: string;
}

export interface PageBlock {
  id: string;
  page_id: string;
  block_type: string;
  sort_order: number;
  payload: unknown;
  created_at: string;
  updated_at: string;
}

export interface PricingItem {
  id: string;
  section: string;
  title: string;
  description: string | null;
  price_label: string | null;
  features: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  consent: boolean;
  ip_hash: string | null;
  user_agent: string | null;
  handled: boolean;
  created_at: string;
}

/** Odeslaná odpověď z adminu (Resend), navázaná na přijatou zprávu. */
export interface ContactMessageReply {
  id: string;
  contact_message_id: string | null;
  to_email: string;
  subject: string;
  body: string;
  created_at: string;
}

export interface Review {
  id: string;
  name: string | null;
  rating: number;
  message: string | null;
  approved: boolean;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetReference {
  id: string;
  photo_id: string;
  kind: AssetKind;
  ref_id: string | null;
  note: string | null;
  created_at: string;
}

export type PhotoWithTags = Photo & { tags: Tag[] };
export type StoryWithMeta = Story & {
  cover_photo: Photo | null;
  tags: Tag[];
};
