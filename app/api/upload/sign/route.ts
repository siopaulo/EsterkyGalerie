import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { signUpload } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/auth";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

const paramsSchema = z.object({
  public_id: z.string().optional(),
  context: z.string().optional(),
  tags: z.string().optional(),
});

/**
 * Vrací podpisové parametry pro přímý (signed) upload z prohlížeče do Cloudinary.
 * Přístup pouze pro přihlášeného admina.
 */
export async function POST(request: NextRequest) {
  await requireAdmin();

  let json: unknown = {};
  try {
    json = await request.json();
  } catch {
    json = {};
  }
  const parsed = paramsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatné parametry" }, { status: 400 });
  }

  try {
    const signed = signUpload(parsed.data);
    return NextResponse.json(signed);
  } catch (err) {
    log("error", "cloudinary sign failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Nepodařilo se vygenerovat podpis pro upload." },
      { status: 500 },
    );
  }
}
