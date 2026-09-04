import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent">
            Demo context
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Surgical CAPD in Microsoft Cloud for Healthcare
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This application is an unaffiliated technical demonstration of
            Surgical CAPD workflow observability. It is not a Microsoft, Nuance,
            or Vincari product. The team name for this documentation capability
            is Surgical CAPD; Vincari is the historical product lineage.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Where Surgical CAPD came from</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Vincari built clinical documentation and workflow automation for
              surgeons and physicians — computer-assisted physician
              documentation (CAPD) aimed at note quality and appropriate
              reimbursement.
            </p>
            <p>
              In 2018 Vincari partnered with Nuance on surgical documentation
              quality.{" "}
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="https://www.prnewswire.com/news-releases/vincari-and-nuance-team-to-improve-surgical-documentation-quality-and-drive-appropriate-reimbursement-300531875.html"
              >
                PR Newswire
              </a>
              . Product lineage is also summarized on{" "}
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="https://discovery.hgdata.com/product/vincari"
              >
                HG Insights
              </a>
              .
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acquisition chain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">July 2019.</strong> Nuance
              Communications acquired Vincari and folded surgical CAPD into its
              healthcare catalog.
            </p>
            <p>
              <strong className="text-foreground">March 2022.</strong> Microsoft
              completed its $19.7B acquisition of Nuance, placing conversational
              and ambient clinical intelligence into Microsoft Cloud for
              Healthcare.{" "}
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="https://news.microsoft.com/source/2022/03/04/microsoft-completes-acquisition-of-nuance-ushering-in-new-era-of-outcomes-based-ai/"
              >
                Microsoft announcement
              </a>
              ·{" "}
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="https://pitchbook.com/profiles/company/56494-54"
              >
                PitchBook
              </a>
              .
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Why Elastic is here</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Microsoft Cloud for Healthcare provides the clinical apps. Elastic
              is the operational and investigative plane that proves they stay
              fast, complete, and trustworthy.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Patient Engagement</strong> —
                Observability SLOs/APM on the portal and booking APIs; Security
                for record-access anomalies; Search for care-plan lookup.
              </li>
              <li>
                <strong className="text-foreground">Virtual Health</strong> —
                traces and logs across Teams/Graph join, session QoS, and visit
                teardown.
              </li>
              <li>
                <strong className="text-foreground">Clinical Insights</strong> —
                ES|QL over FHIR/AHDS pipeline health plus Search beside the
                unified patient view.
              </li>
              <li>
                <strong className="text-foreground">AI Assistance</strong> —
                LLM observability for Dragon Copilot–style note drafts, plus
                CAPD/EHR/Fabric events on the same Serverless project.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
