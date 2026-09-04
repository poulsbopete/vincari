import { AppShell } from "@/components/app-shell";
import { CapabilityPills } from "@/components/capability-pills";
import { ElasticSolves } from "@/components/elastic-solves";
import { OrBoard } from "@/components/or-board";
import { ProductBand } from "@/components/product-mark";
import { SecurityAccessLinks } from "@/components/security-access-links";
import { DeepLink } from "@/components/deep-link";
import { DEFAULT_NOTES_KIBANA_URL } from "@/lib/config";
import { kibanaNotesDiscoverUrl } from "@/lib/deep-links";
import { capabilityById } from "@/lib/solutions";

const capability = capabilityById("ai-assistance")!;
const notes = kibanaNotesDiscoverUrl(DEFAULT_NOTES_KIBANA_URL);

export default function OrPage() {
  return (
    <AppShell eyebrow="AI Assistance · Surgical CAPD · Elastic LLM observability">
      <div className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">
          AI Assistance
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Surgical CAPD worklist
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Surgical CAPD is computer-assisted physician documentation for the OR.
          Close documentation gaps, sign the note, and jump into Elastic for
          gen_ai tokens, EHR-pull errors, and Fabric-style pipeline events.
        </p>
        <CapabilityPills products={capability.elasticProducts} />
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <ProductBand product="LLM observability" title="Note draft quality">
          <p>
            Open a case to insert CAPD language. Token, model, and latency
            ride the same gen_ai spans as the signed note.
          </p>
        </ProductBand>
        <ProductBand product="Search" title="Signed notes index">
          <p>Filed notes land in surgical-capd-notes on AI Assistants.</p>
          <DeepLink href={notes}>Search operative notes</DeepLink>
        </ProductBand>
        <ProductBand product="Security" title="Who reads CAPD notes">
          <p>Bulk note opens from billing.svc belong in SIEM, not APM.</p>
          <SecurityAccessLinks />
        </ProductBand>
      </div>
      <div className="mb-6">
        <ProductBand
          product="Observability"
          title="Worklist → Sign & file traces"
        >
          <p>
            Each case card opens documentation. Sign & file writes logs and an
            APM waterfall on vincari-capd.
          </p>
        </ProductBand>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <OrBoard />
        <ElasticSolves capability={capability} />
      </div>
    </AppShell>
  );
}
