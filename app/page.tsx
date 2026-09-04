import { AppShell } from "@/components/app-shell";
import { SolutionsMap } from "@/components/solutions-map";

export default function HomePage() {
  return (
    <AppShell eyebrow="Microsoft Cloud for Healthcare capabilities · solved in Elastic Serverless Observability (otel-demo)">
      <div className="mb-6 max-w-3xl space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">
          Elastic × Cloud for Healthcare
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Four core capabilities, one observability plane
        </h1>
        <p className="text-sm text-muted-foreground">
          Surgical CAPD is the clinical documentation product in this demo —
          computer-assisted physician documentation for the OR, in the Microsoft
          Cloud for Healthcare family. Elastic Observability (plus Search,
          Security, and LLM observability) covers Patient Engagement, Virtual
          Health, Clinical Insights, and AI Assistance. Telemetry goes to
          otel-demo, signed notes can go to the AI Assistants search project,
          and unusual EHR access is a Security Serverless SIEM scenario.
        </p>
      </div>
      <SolutionsMap />
    </AppShell>
  );
}
