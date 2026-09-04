import { AppShell } from "@/components/app-shell";
import { OrBoard } from "@/components/or-board";

export default function HomePage() {
  return (
    <AppShell eyebrow="Synthetic patients only · Pacific Surgical Institute demo · Elastic Observability on serverless">
      <div className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">
          Today’s board
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Surgical documentation worklist
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Vincari-style computer-assisted physician documentation for the OR.
          Open a case, close CAPD gaps, then jump from the signed note into
          Elastic logs and traces.
        </p>
      </div>
      <OrBoard />
    </AppShell>
  );
}
