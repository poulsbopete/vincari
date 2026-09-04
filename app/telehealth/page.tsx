import { AppShell } from "@/components/app-shell";
import { CapabilityAction } from "@/components/capability-action";
import { CapabilityPills } from "@/components/capability-pills";
import { DeepLink } from "@/components/deep-link";
import { ElasticSolves } from "@/components/elastic-solves";
import { ProductBand } from "@/components/product-mark";
import { SecurityAccessLinks } from "@/components/security-access-links";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_NOTES_KIBANA_URL } from "@/lib/config";
import { kibanaNotesDiscoverUrl } from "@/lib/deep-links";
import { capabilityById } from "@/lib/solutions";

const capability = capabilityById("virtual-health")!;
const notes = kibanaNotesDiscoverUrl(DEFAULT_NOTES_KIBANA_URL, "OR-4412");

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
        <CapabilityPills products={capability.elasticProducts} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visit OR-4412 · Vargas, MD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProductBand
              product="Search"
              title="After-visit summary — not a Teams transcript scrape"
            >
              <p>Waiting room: Rivera, Ana · wound photo attached (synthetic).</p>
              <DeepLink href={notes}>Search visit note</DeepLink>
            </ProductBand>
            <ProductBand
              product="Observability"
              title="Identity → Graph → media join path"
            >
              <p>Channel: Microsoft Teams (Cloud for Healthcare telehealth).</p>
              <p>Join path: identity → Graph meeting → media session.</p>
              <CapabilityAction capability={capability} />
            </ProductBand>
            <ProductBand
              product="Security"
              title="Who is allowed to join this consult"
            >
              <p>
                Attendee: Rivera (patient) with Vargas, MD. A billing service
                account on the same meeting is a SIEM problem, not jitter.
              </p>
              <SecurityAccessLinks />
            </ProductBand>
          </CardContent>
        </Card>
        <ElasticSolves capability={capability} />
      </div>
    </AppShell>
  );
}
