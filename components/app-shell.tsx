import Link from "next/link";
import { Activity, Stethoscope } from "lucide-react";

const NAV = [
  { href: "/", label: "Capabilities" },
  { href: "/or", label: "Surgical CAPD" },
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
      <div className="h-1 w-full bg-gradient-to-r from-[#0078D4] via-[#00BCF2] to-[#00B7C3]" />
      <header className="border-b border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-sm bg-primary text-primary-foreground">
              <Stethoscope className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight">
                Surgical CAPD
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Microsoft Cloud for Healthcare
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
            <a
              href="https://otel-demo-a5630c.kb.us-east-1.aws.elastic.cloud/"
              target="_blank"
              rel="noreferrer"
              className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-primary hover:bg-muted"
            >
              <Activity className="size-3.5" />
              Kibana
            </a>
          </nav>
        </div>
        {eyebrow ? (
          <div className="border-t border-border bg-[#e6f2fb] px-4 py-1.5 text-center text-[11px] text-[#004578]">
            {eyebrow}
          </div>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
