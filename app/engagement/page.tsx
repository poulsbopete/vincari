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

const capability = capabilityById("engagement")!;
const notes = kibanaNotesDiscoverUrl(DEFAULT_NOTES_KIBANA_URL);

export default function EngagementPage() {
  return (
    <AppShell eyebrow="Patient Engagement · portal, care plans, booking">
      <div className="mb-6 max-w-2xl space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">
          Patient Engagement
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Care plan and self-service portal
        </h1>
        <p className="text-sm text-muted-foreground">{capability.msSummary}</p>
        <CapabilityPills products={capability.elasticProducts} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rivera, Ana · SYN-104882</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProductBand
              product="Search"
              title="Portal lookup — not a live EHR scan"
            >
              <p>Care plan: TKA recovery week 2 — PT 3×, wound check Friday.</p>
              <ul className="list-disc space-y-1 pl-5 text-xs">
                <li>Discharge summary</li>
                <li>Implant card</li>
                <li>Medication list</li>
              </ul>
              <DeepLink href={notes}>Search these records</DeepLink>
            </ProductBand>
            <ProductBand
              product="Observability"
              title="Booking and care-plan APIs"
            >
              <p>Next slot: Friday 10:30 · Vargas ortho clinic.</p>
              <CapabilityAction capability={capability} />
            </ProductBand>
            <ProductBand
              product="Security"
              title="Who is allowed to open this chart"
            >
              <p>
                Session identity: Rivera (patient). A revenue-cycle account
                walking every FHIR Patient is a detection problem, not a slow
                page.
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
