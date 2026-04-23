import { NextResponse } from "next/server";
import { exportMessagesCsvAction } from "@/features/contact/actions";

export const runtime = "nodejs";

export async function GET() {
  const csv = await exportMessagesCsvAction();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contact_messages_${Date.now()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
