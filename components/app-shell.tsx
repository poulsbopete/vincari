import Link from "next/link";
import { Activity, Stethoscope } from "lucide-react";

const NAV = [
  { href: "/", label: "OR board" },
  { href: "/ops", label: "Observability" },
  { href: "/about", label: "Lineage" },
];

export function AppShell({
  children,
  eyebrow,
}: {
  children: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <header className="border-b border-border/80 bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight">
                Vincari
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Surgical CAPD · demo
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/ops"
              className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-primary hover:bg-muted"
            >
              <Activity className="size-3.5" />
              Elastic o11y
            </Link>
          </nav>
        </div>
        {eyebrow ? (
          <div className="border-t border-border/60 bg-muted/40 px-4 py-1.5 text-center text-[11px] text-muted-foreground">
            {eyebrow}
          </div>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
