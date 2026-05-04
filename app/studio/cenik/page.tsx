import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function StudioPricingPage() {
  await requireAdmin();
  redirect("/studio/stranky/cenik");
}
