import { AppShell } from "@/components/app-shell";
import { SolutionsMap } from "@/components/solutions-map";

export default function HomePage() {
  return (
    <AppShell eyebrow="Microsoft Cloud for Healthcare capabilities · solved in Elastic Serverless Observability (otel-demo)">
      <div className="mb-6 max-w-3xl space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">
          Elastic × Cloud for Healthcare
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Four core capabilities, one observability plane
        </h1>
        <p className="text-sm text-muted-foreground">
          Vincari-lineage CAPD sits inside Microsoft Cloud for Healthcare. This
          demo shows how Elastic Observability — plus Search, Security, and LLM
          observability — covers Patient Engagement, Virtual Health, Clinical
          Insights, and AI Assistance. Each card writes telemetry into
          otel-demo and deep-links to Kibana.
        </p>
      </div>
      <SolutionsMap />
    </AppShell>
  );
}
