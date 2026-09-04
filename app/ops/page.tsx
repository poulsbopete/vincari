import { AppShell } from "@/components/app-shell";
import { ObservabilityPanel } from "@/components/observability-panel";

export default function OpsPage() {
  return (
    <AppShell eyebrow="Backend: Elastic Cloud Serverless Observability · otel-demo">
      <ObservabilityPanel />
    </AppShell>
  );
}
