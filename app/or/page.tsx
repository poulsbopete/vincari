import { AppShell } from "@/components/app-shell";
import { OrBoard } from "@/components/or-board";

export default function OrPage() {
  return (
    <AppShell eyebrow="AI Assistance · Dragon Copilot / Vincari CAPD · Elastic LLM observability">
      <div className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">
          AI Assistance
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Surgical documentation worklist
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Computer-assisted physician documentation for the OR. Close CAPD gaps,
          sign the note, and jump into Elastic for gen_ai tokens, EHR-pull
          errors, and Fabric-style pipeline events.
        </p>
      </div>
      <OrBoard />
    </AppShell>
  );
}
