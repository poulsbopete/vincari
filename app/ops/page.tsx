import { AppShell } from "@/components/app-shell";
import { ObservabilityPanel } from "@/components/observability-panel";

export default function OpsPage() {
  return (
    <AppShell eyebrow="Elastic Cloud Serverless Observability · otel-demo-a5630c.kb.us-east-1.aws.elastic.cloud">
      <ObservabilityPanel />
    </AppShell>
  );
}
