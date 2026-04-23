"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      theme="light"
      toastOptions={{
        classNames: {
          toast: "bg-background text-foreground border border-border shadow-lg",
          description: "text-muted-foreground",
          actionButton: "bg-foreground text-background",
        },
      }}
    />
  );
}
