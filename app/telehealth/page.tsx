import { AppShell } from "@/components/app-shell";
import { CapabilityAction } from "@/components/capability-action";
import { ElasticSolves } from "@/components/elastic-solves";
import { ProductMark } from "@/components/product-mark";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { capabilityById } from "@/lib/solutions";

const capability = capabilityById("virtual-health")!;

export default function TelehealthPage() {
  return (
    <AppShell eyebrow="Virtual Health · Microsoft Teams consult">
      <div className="mb-6 max-w-2xl space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">
          Virtual Health
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Postoperative Teams visit
        </h1>
        <p className="text-sm text-muted-foreground">{capability.msSummary}</p>
        <div className="flex flex-wrap gap-2">
          {capability.elasticProducts.map((product) => (
            <ProductMark key={product} product={product} />
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
        <ElasticSolves capability={capability} />
      </div>
    </AppShell>
  );
}
