import { AppShell } from "@/components/app-shell";
import { CapabilityAction } from "@/components/capability-action";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { capabilityById } from "@/lib/solutions";

const capability = capabilityById("engagement")!;

export default function EngagementPage() {
  return (
    <AppShell eyebrow="Patient Engagement · portal, care plans, booking">
      <div className="mb-6 max-w-2xl space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">
          Patient Engagement
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Care plan and self-service portal
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
            <CardTitle className="text-base">Rivera, Ana · SYN-104882</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Care plan: TKA recovery week 2 — PT 3×, wound check Friday.</p>
            <p>Next slot: Friday 10:30 · Vargas ortho clinic.</p>
            <p>Records: discharge summary, implant card, med list (synthetic).</p>
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
