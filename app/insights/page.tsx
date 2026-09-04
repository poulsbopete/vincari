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

const capability = capabilityById("clinical-insights")!;
const notes = kibanaNotesDiscoverUrl(DEFAULT_NOTES_KIBANA_URL, "OR-4412");

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
        <CapabilityPills products={capability.elasticProducts} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bundle · SYN-104882</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProductBand
              product="Search"
              title="DocumentReference beside the FHIR store"
            >
              <p>Patient: Rivera, Ana</p>
              <p>DocumentReference: operative note (CAPD), implant log</p>
              <DeepLink href={notes}>Search clinical documents</DeepLink>
            </ProductBand>
            <ProductBand
              product="Observability"
              title="AHDS + EHR bundle assemble"
            >
              <p>Encounter: OR-4412 primary TKA, left</p>
              <p>Source: Azure Health Data Services FHIR + EHR + Surgical CAPD note.</p>
              <CapabilityAction capability={capability} />
            </ProductBand>
            <ProductBand
              product="Security"
              title="Who is allowed to read this Patient"
            >
              <p>
                This view is a treating clinician assembling a bundle. A
                revenue-cycle account walking every FHIR Patient is a detection.
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
