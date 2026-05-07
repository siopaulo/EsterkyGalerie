"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { cn, formatDateCs } from "@/lib/utils";
import type { SentReplyRow } from "@/features/contact/sent-replies";

export type { SentReplyRow } from "@/features/contact/sent-replies";

export function SentRepliesTable({ rows }: { rows: SentReplyRow[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
        <p className="font-serif text-2xl">Zatím žádné odeslané odpovědi</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Po odeslání odpovědi z přijaté zprávy se záznam objeví tady a zůstane navázaný na původní dotaz.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: stacked cards. */}
      <ul className="space-y-3 md:hidden">
        {rows.map((r) => {
          const expanded = open === r.id;
          const orig = r.contact_messages;
          return (
            <li
              key={r.id}
              className={cn(
                "rounded-lg border bg-background transition-colors",
                expanded ? "border-foreground" : "border-border",
              )}
            >
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 rounded-t-lg p-4 text-left hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : r.id)}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {formatDateCs(r.created_at)}
                  </p>
                  <p className="truncate text-sm font-medium">{r.to_email}</p>
                  {orig?.name ? (
                    <p className="truncate text-xs text-muted-foreground">({orig.name})</p>
                  ) : null}
                  <p className="line-clamp-2 text-sm text-foreground">{r.subject}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {expanded ? "Skrýt" : "Detail"}
                </span>
              </button>
              {expanded ? (
                <div className="border-t border-border bg-muted/20 p-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Původní zpráva
                      </p>
                      {orig?.subject ? (
                        <p className="mt-1 text-sm font-medium text-foreground">{orig.subject}</p>
                      ) : null}
                      <div className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-sm text-muted-foreground">
                        {orig?.message ?? "— zpráva byla smazána —"}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Vaše odpověď
                      </p>
                      <div className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-sm leading-relaxed">
                        {r.body}
                      </div>
                    </div>
                  </div>
                  {r.contact_message_id ? (
                    <div className="mt-4">
                      <Link
                        href={`/studio/kontakty?tab=received&focus=${r.contact_message_id}`}
                        className="text-sm text-accent underline underline-offset-4"
                      >
                        Otevřít přijatou zprávu ve vláknu
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* Desktop: tabulka. */}
      <div className="hidden w-full max-w-full overflow-x-auto rounded-lg border border-border bg-background md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Odesláno</th>
              <th className="px-5 py-3">Komu</th>
              <th className="px-5 py-3">Předmět</th>
              <th className="px-5 py-3 text-right">Akce</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => {
              const expanded = open === r.id;
              const orig = r.contact_messages;
              return (
                <Fragment key={r.id}>
                  <tr
                    className="cursor-pointer hover:bg-muted/30 focus-within:bg-muted/30"
                    tabIndex={0}
                    role="button"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : r.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpen(expanded ? null : r.id);
                      }
                    }}
                  >
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDateCs(r.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{r.to_email}</div>
                      {orig?.name ? (
                        <div className="text-xs text-muted-foreground">({orig.name})</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 max-w-md">
                      <span className="line-clamp-2 text-foreground">{r.subject}</span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                      {expanded ? "Skrýt" : "Detail"}
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="bg-muted/20">
                      <td colSpan={4} className="px-5 py-5">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Původní zpráva
                            </p>
                            {orig?.subject ? (
                              <p className="mt-1 text-sm font-medium text-foreground">{orig.subject}</p>
                            ) : null}
                            <div className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-sm text-muted-foreground">
                              {orig?.message ?? "— zpráva byla smazána —"}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Vaše odpověď
                            </p>
                            <div className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-sm leading-relaxed">
                              {r.body}
                            </div>
                          </div>
                        </div>
                        {r.contact_message_id ? (
                          <div className="mt-4">
                            <Link
                              href={`/studio/kontakty?tab=received&focus=${r.contact_message_id}`}
                              className="text-sm text-accent underline underline-offset-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Otevřít přijatou zprávu ve vláknu
                            </Link>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
