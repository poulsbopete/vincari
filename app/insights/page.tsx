import { AppShell } from "@/components/app-shell";
import { CapabilityAction } from "@/components/capability-action";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { capabilityById } from "@/lib/solutions";

const capability = capabilityById("clinical-insights")!;

export default function InsightsPage() {
  return (
    <AppShell eyebrow="Clinical Insights · Azure Health Data Services · FHIR">
      <div className="mb-6 max-w-2xl space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">
          Clinical Insights
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Unified FHIR patient view
        </h1>
        <p className="text-sm text-muted-foreground">{capability.msSummary}</p>
        <div className="flex flex-wrap gap-2">
          {capability.elasticProducts.map((product) => (
            <Badge key={product} variant="outline">
              {product}
            </Badge>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bundle · SYN-104882</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Patient: Rivera, Ana</p>
            <p>Encounter: OR-4412 primary TKA, left</p>
            <p>DocumentReference: operative note (CAPD), implant log</p>
            <p>Source: Azure Health Data Services FHIR + EHR + Vincari note.</p>
            <CapabilityAction capability={capability} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Elastic solves</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{capability.elasticHow}</p>
            <p className="font-mono text-xs text-primary">
              service.name = {capability.serviceName}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
