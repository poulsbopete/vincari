import { AppShell } from "@/components/app-shell";
import { OrBoard } from "@/components/or-board";

export default function OrPage() {
  return (
    <AppShell eyebrow="AI Assistance · Surgical CAPD · Elastic LLM observability">
      <div className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">
          AI Assistance
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Surgical CAPD worklist
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Surgical CAPD is computer-assisted physician documentation for the OR.
          Close documentation gaps, sign the note, and jump into Elastic for
          gen_ai tokens, EHR-pull errors, and Fabric-style pipeline events.
        </p>
      </div>
      <OrBoard />
    </AppShell>
  );
}
