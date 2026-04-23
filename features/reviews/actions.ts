"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { reviewAdminUpdateSchema } from "@/features/reviews/schema";

/**
 * Admin CRUD pro reviews.
 * Všechny akce vyžadují admin session a používají service-role klienta.
 */

function revalidateReviews() {
  revalidatePath("/studio/recenze");
  revalidatePath("/studio");
  revalidatePath("/reference");
}

export async function setReviewApprovedAction(id: string, approved: boolean) {
  await requireAdmin();
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("reviews")
    .update({ approved })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateReviews();
  return { ok: true };
}

export async function updateReviewAction(input: unknown) {
  await requireAdmin();
  const parsed = reviewAdminUpdateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Neplatná data: " + parsed.error.message);
  }
  const { id, name, message, rating, approved } = parsed.data;
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("reviews")
    .update({ name, message, rating, approved })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateReviews();
  return { ok: true };
}

export async function deleteReviewAction(id: string) {
  await requireAdmin();
  const admin = createSupabaseAdmin();
  const { error } = await admin.from("reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateReviews();
  return { ok: true };
}
