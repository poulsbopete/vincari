import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">
            Demo context
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Vincari, Nuance, and Microsoft Cloud for Healthcare
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This application is an unaffiliated technical demonstration of
            surgical CAPD workflow observability. It is not a Microsoft, Nuance,
            or Vincari product.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What Vincari was</CardTitle>
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
              A CAPD platform still has to stay fast and trustworthy in the OR:
              EHR pulls, implant lookups, coding engines, and note sign events.
              This demo writes those workflow logs into an Elastic Cloud
              Serverless Observability project and deep-links surgeons’ ops
              counterparts into Discover, APM, and Streams.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
