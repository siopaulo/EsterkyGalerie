"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateCs } from "@/lib/utils";
import { toggleMessageHandledAction, deleteMessageAction } from "@/features/contact/actions";
import type { ContactMessage } from "@/types/database";

export function MessagesTable({ messages: initial }: { messages: ContactMessage[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);

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

  if (messages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
        <p className="font-serif text-2xl">Žádné zprávy</p>
        <p className="mt-2 text-sm text-muted-foreground">Jakmile někdo napíše, objeví se tady.</p>
      </div>
    );
  }

  return (
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
          {messages.map((m) => {
            const expanded = open === m.id;
            return (
              <Fragment key={m.id}>
                <tr className="cursor-pointer hover:bg-muted/30" onClick={() => setOpen(expanded ? null : m.id)}>
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
                    {m.subject ? <strong className="text-foreground">{m.subject} — </strong> : null}
                    {m.message.slice(0, 80)}…
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDateCs(m.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    <a href={`mailto:${m.email}`} className="mr-3 text-foreground underline-offset-4 hover:underline">
                      <Mail className="inline h-4 w-4" />
                    </a>
                  </td>
                </tr>
                {expanded ? (
                  <tr className="bg-muted/20">
                    <td colSpan={5} className="px-5 py-5">
                      <div className="max-w-2xl whitespace-pre-wrap text-sm leading-relaxed">{m.message}</div>
                      {m.phone ? (
                        <p className="mt-4 text-xs text-muted-foreground">Telefon: {m.phone}</p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggleHandled(m.id, m.handled)}>
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
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-700"
                          onClick={() => remove(m.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Smazat
                        </Button>
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
  );
}
