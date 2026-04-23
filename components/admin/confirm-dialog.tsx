"use client";

import { useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  /** Trigger element – typicky tlačítko (používá se jako asChild). */
  children: ReactNode;
  title: string;
  description: ReactNode;
  /** Akce po potvrzení. Pokud vrátí Promise, dialog drží loading stav a zavře se až po dokončení. */
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Volitelný obsah mezi description a footerem (např. checkbox „smazat i z Cloudinary"). */
  extraContent?: ReactNode;
  /** Externí loading flag, pokud ho volající chce řídit sám. */
  loading?: boolean;
  /** Controlled open stav (volitelný). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Jednotný potvrzovací dialog pro destruktivní akce v adminu.
 *
 * Postavený na shadcn AlertDialog – zachovává stávající design systém.
 * Automaticky spravuje loading stav a zabraňuje dvojkliku, pokud `onConfirm`
 * vrací Promise.
 */
export function ConfirmDialog({
  children,
  title,
  description,
  onConfirm,
  confirmLabel = "Smazat",
  cancelLabel = "Zrušit",
  extraContent,
  loading: externalLoading,
  open: controlledOpen,
  onOpenChange,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const pending = busy || externalLoading === true;

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
    if (pending) return;
    try {
      setBusy(true);
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => (pending ? null : setOpen(v))}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {extraContent}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-700 text-white hover:bg-red-800"
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? "Mažu…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
