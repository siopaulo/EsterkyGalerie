/**
 * Typy a mapování pro seznam odeslaných odpovědí (join na contact_messages).
 * Supabase/PostgREST u vnořeného selectu často typuje 1:N jako pole i u jedné větve –
 * před předáním do UI sjednotíme na jeden objekt nebo null.
 */

export type SentReplyRow = {
  id: string;
  contact_message_id: string | null;
  to_email: string;
  subject: string;
  body: string;
  created_at: string;
  contact_messages: { name: string; subject: string | null; message: string } | null;
};

type NestedMessage = { name: string; subject: string | null; message: string };

/** Skutečný tvar řádku z `.select('..., contact_messages(...)')` před normalizací. */
export type SentReplySupabaseRow = Omit<SentReplyRow, "contact_messages"> & {
  contact_messages: NestedMessage | NestedMessage[] | null;
};

export function mapSentRepliesFromSupabase(data: SentReplySupabaseRow[] | null): SentReplyRow[] {
  return (data ?? []).map((row) => ({
    ...row,
    contact_messages: pickNestedMessage(row.contact_messages),
  }));
}

function pickNestedMessage(
  v: NestedMessage | NestedMessage[] | null,
): NestedMessage | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}
