"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { replyToMessageAction } from "@/features/contact/actions";

interface ReplyDialogProps {
  messageId: string;
  to: string;
  originalSubject?: string | null;
  originalMessage?: string | null;
  onReplied?: () => void;
  children: React.ReactNode;
}

function buildReplySubject(original: string | null | undefined): string {
  const subject = (original ?? "").trim();
  if (!subject) return "Re: Vaše zpráva";
  return /^re:/i.test(subject) ? subject : `Re: ${subject}`;
}

export function ReplyDialog({
  messageId,
  to,
  originalSubject,
  originalMessage,
  onReplied,
  children,
}: ReplyDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(() => buildReplySubject(originalSubject));
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (pending) return;
    setOpen(next);
    if (next) {
      setSubject(buildReplySubject(originalSubject));
      setBody("");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await replyToMessageAction({
        messageId,
        subject: subject.trim(),
        body: body.trim(),
      });
      if (res.ok) {
        toast.success("Odpověď byla odeslána.");
        setOpen(false);
        onReplied?.();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Odpovědět na zprávu</DialogTitle>
          <DialogDescription>
            E-mail bude odeslán z naší odesílací adresy. Adresát uvidí vaši
            zprávu jako reakci na svůj původní dotaz.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reply-to">Příjemce</Label>
            <Input id="reply-to" value={to} readOnly disabled />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reply-subject">Předmět</Label>
            <Input
              id="reply-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength={200}
              disabled={pending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reply-body">Zpráva</Label>
            <Textarea
              id="reply-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={8}
              maxLength={10000}
              placeholder="Dobrý den, …"
              disabled={pending}
            />
          </div>

          {originalMessage ? (
            <details className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <summary className="cursor-pointer text-muted-foreground">
                Zobrazit původní zprávu
              </summary>
              <div className="mt-3 whitespace-pre-wrap text-foreground/90">
                {originalMessage}
              </div>
            </details>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={pending}
            >
              Zrušit
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              <Send className="h-4 w-4" /> {pending ? "Odesílám…" : "Odeslat odpověď"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
