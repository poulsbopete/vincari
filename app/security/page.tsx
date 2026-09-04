import { AppShell } from "@/components/app-shell";
import { SecurityScenario } from "@/components/security-scenario";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecurityPage() {
  return (
    <AppShell eyebrow="Elastic Security Serverless · my-security-project-ac9463.kb.us-central1.gcp.elastic.cloud">
      <div className="mb-6 max-w-3xl space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">
          Security use case
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Unusual EHR access around Surgical CAPD
        </h1>
        <p className="text-sm text-muted-foreground">
          Observability stays on otel-demo. This scenario writes audit events
          into the Security Serverless project so SIEM can treat PHI access as
          a detection problem, not an APM chart.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Security</Badge>
          <Badge variant="outline">Collection (TA0009)</Badge>
          <Badge variant="outline">T1213</Badge>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Story</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              While Dr. Okonkwo is in OR 5 on ACDF C5–C6, the revenue-cycle
              service account <code className="font-mono text-xs">billing.svc</code>{" "}
              authenticates from a VPN address ({" "}
              <code className="font-mono text-xs">198.51.100.44</code>
              ), walks every synthetic FHIR Patient in the OR board, and opens
              the ACDF operative note.
            </p>
            <p>
              That is not a surgeon or charting workstation. Elastic Security
              should fire on a non-clinical identity reading CAPD notes and
              FHIR Patients in bulk.
            </p>
            <SecurityScenario />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What gets written</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Data stream{" "}
              <code className="font-mono text-xs">logs-vincari.security-default</code>{" "}
              on my-security-project-ac9463.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-xs">
              <li>Valid-account login from outside the surgical LAN</li>
              <li>One FHIR Patient read per OR board case (labels.mrn / case.id)</li>
              <li>CAPD note open for OR-4421</li>
              <li>
                Custom query rule:{" "}
                <code className="font-mono">billing.svc</code> +{" "}
                <code className="font-mono">ehr.record.read</code> /{" "}
                <code className="font-mono">capd.note.read</code>
              </li>
            </ul>
            <p className="text-xs">
              Correlate back to otel-demo with <code className="font-mono">labels.case_id</code>{" "}
              and the Observability traces for the same case.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
