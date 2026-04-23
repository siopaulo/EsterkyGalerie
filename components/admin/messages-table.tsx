"use client";

import { Fragment, useLayoutEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Reply, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ReplyDialog } from "@/components/admin/reply-dialog";
import { formatDateCs, cn } from "@/lib/utils";
import {
  toggleMessageHandledAction,
  deleteMessageAction,
} from "@/features/contact/actions";
import type { ContactMessage } from "@/types/database";

type StatusFilter = "all" | "new" | "handled";

/** Klíč pro remount tabulky po `router.refresh()` – nahrazuje sync `initial` přes effect. */
export function messagesTableRefreshKey(messages: ContactMessage[]): string {
  return `${messages.length}|${messages.map((m) => `${m.id}:${m.handled ? 1 : 0}`).join(":")}`;
}

export function MessagesTable({
  messages: initial,
  focusMessageId,
}: {
  messages: ContactMessage[];
  focusMessageId?: string;
}) {
  const router = useRouter();
  const focusApplies = Boolean(
    focusMessageId && initial.some((m) => m.id === focusMessageId),
  );

  const [messages, setMessages] = useState(initial);
  const [open, setOpen] = useState<string | null>(focusApplies ? focusMessageId! : null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>(focusApplies ? "all" : "new");

  useLayoutEffect(() => {
    if (!focusApplies || !focusMessageId) return;
    requestAnimationFrame(() => {
      document.getElementById(`contact-msg-${focusMessageId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }, [focusApplies, focusMessageId]);

  const counts = {
    total: messages.length,
    newCount: messages.filter((m) => !m.handled).length,
    handledCount: messages.filter((m) => m.handled).length,
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter((m) => {
      if (status === "new" && m.handled) return false;
      if (status === "handled" && !m.handled) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.subject ?? "").toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    });
  }, [messages, search, status]);

  async function toggleHandled(id: string, cur: boolean) {
    try {
      await toggleMessageHandledAction(id, !cur);
      setMessages((arr) => arr.map((m) => (m.id === id ? { ...m, handled: !cur } : m)));
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function remove(id: string) {
    try {
      await deleteMessageAction(id);
      setMessages((arr) => arr.filter((m) => m.id !== id));
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function onReplied(id: string) {
    setMessages((arr) => arr.map((m) => (m.id === id ? { ...m, handled: true } : m)));
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <FilterPill active={status === "all"} onClick={() => setStatus("all")}>
            Vše <span className="ml-1 text-muted-foreground">{counts.total}</span>
          </FilterPill>
          <FilterPill
            active={status === "new"}
            tone="accent"
            onClick={() => setStatus("new")}
          >
            Nové <span className="ml-1 text-muted-foreground">{counts.newCount}</span>
          </FilterPill>
          <FilterPill active={status === "handled"} onClick={() => setStatus("handled")}>
            Vyřízené <span className="ml-1 text-muted-foreground">{counts.handledCount}</span>
          </FilterPill>
        </div>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hledat ve zprávách…"
          className="max-w-xs"
        />
      </div>

      {messages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
          <p className="font-serif text-2xl">Žádné zprávy</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Jakmile někdo napíše, objeví se tady.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
          <p className="font-serif text-2xl">Nic neodpovídá</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Zkuste jiný filtr nebo hledaný výraz.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Stav</th>
                <th className="px-5 py-3">Od</th>
                <th className="px-5 py-3">Předmět / začátek</th>
                <th className="px-5 py-3">Datum</th>
                <th className="px-5 py-3 text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((m) => {
                const expanded = open === m.id;
                return (
                  <Fragment key={m.id}>
                <tr
                  id={`contact-msg-${m.id}`}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => setOpen(expanded ? null : m.id)}
                >
                      <td className="px-5 py-3">
                        {m.handled ? (
                          <Badge variant="muted">Vyřízeno</Badge>
                        ) : (
                          <Badge variant="accent">Nové</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {m.subject ? (
                          <strong className="text-foreground">{m.subject} — </strong>
                        ) : null}
                        {m.message.slice(0, 80)}
                        {m.message.length > 80 ? "…" : ""}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDateCs(m.created_at)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-xs text-muted-foreground">
                          {expanded ? "Skrýt" : "Rozbalit"}
                        </span>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-muted/20">
                        <td colSpan={5} className="px-5 py-5">
                          <div className="max-w-2xl whitespace-pre-wrap text-sm leading-relaxed">
                            {m.message}
                          </div>
                          {m.phone ? (
                            <p className="mt-4 text-xs text-muted-foreground">
                              Telefon: {m.phone}
                            </p>
                          ) : null}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <ReplyDialog
                              messageId={m.id}
                              to={m.email}
                              originalSubject={m.subject}
                              originalMessage={m.message}
                              onReplied={() => onReplied(m.id)}
                            >
                              <Button size="sm" variant="primary">
                                <Reply className="h-4 w-4" /> Odpovědět
                              </Button>
                            </ReplyDialog>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleHandled(m.id, m.handled)}
                            >
                              {m.handled ? (
                                <>
                                  <RotateCcw className="h-4 w-4" /> Označit jako nové
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4" /> Označit jako vyřízené
                                </>
                              )}
                            </Button>
                            <ConfirmDialog
                              title="Opravdu smazat tuto zprávu?"
                              description="Tuto akci nelze vrátit zpět. Zpráva bude trvale odstraněna."
                              onConfirm={() => remove(m.id)}
                            >
                              <Button size="sm" variant="ghost" className="text-red-700">
                                <Trash2 className="h-4 w-4" /> Smazat
                              </Button>
                            </ConfirmDialog>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  tone,
  onClick,
  children,
}: {
  active?: boolean;
  tone?: "accent";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-3 text-sm transition-colors",
        active
            ? tone === "accent"
            ? "border-accent bg-accent/10 text-accent"
            : "border-foreground bg-foreground text-background"
          : "border-border text-foreground hover:border-foreground/60",
      )}
    >
      {children}
    </button>
  );
}
