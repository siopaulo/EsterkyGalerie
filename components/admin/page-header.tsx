import Link from "next/link";
import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function AdminPageHeader({ title, description, actions, breadcrumbs }: AdminPageHeaderProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="max-w-full px-4 py-6 md:px-10 md:py-8">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-2">
              {breadcrumbs.map((b, i) => (
                <li key={i} className="flex items-center gap-2">
                  {b.href ? (
                    <Link href={b.href} className="hover:text-foreground">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-foreground/70">{b.label}</span>
                  )}
                  {i < breadcrumbs.length - 1 ? <span>/</span> : null}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <div className="flex max-w-full flex-col gap-4 md:flex-row md:flex-wrap md:items-start md:justify-between">
          <div className="min-w-0 max-w-full">
            <h1 className="font-serif text-3xl md:text-4xl">{title}</h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex w-full max-w-full flex-shrink-0 flex-col gap-2 md:w-auto md:flex-row md:flex-wrap">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
