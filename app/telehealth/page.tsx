import { AppShell } from "@/components/app-shell";
import { CapabilityAction } from "@/components/capability-action";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { capabilityById } from "@/lib/solutions";

const capability = capabilityById("virtual-health")!;

export default function TelehealthPage() {
  return (
    <AppShell eyebrow="Virtual Health · Microsoft Teams consult">
      <div className="mb-6 max-w-2xl space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">
          Virtual Health
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Postoperative Teams visit
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
            <CardTitle className="text-base">Visit OR-4412 · Vargas, MD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Channel: Microsoft Teams (Cloud for Healthcare telehealth).</p>
            <p>Waiting room: Rivera, Ana · wound photo attached (synthetic).</p>
            <p>Join path: identity → Graph meeting → media session.</p>
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
