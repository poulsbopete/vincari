"use client";

import { useMemo, useState } from "react";
import { DeepLink } from "@/components/deep-link";
import { ProductBand, ProductMark } from "@/components/product-mark";
import { SecurityAccessLinks } from "@/components/security-access-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  STATUS_LABEL,
  type SurgicalCase,
} from "@/lib/cases";
import { DEFAULT_NOTES_KIBANA_URL } from "@/lib/config";
import { kibanaNotesDiscoverUrl } from "@/lib/deep-links";

type CompleteResponse = {
  ok?: boolean;
  error?: string;
  traceId?: string;
  deepLinks?: {
    discoverCase?: string | null;
    apmTrace?: string | null;
    discoverTrace?: string | null;
    discoverLogs?: string | null;
    notesSearch?: string | null;
  } | null;
  notes?: { ok?: boolean; skipped?: boolean; reason?: string; id?: string };
};

export function CapdWorkspace({ surgical }: { surgical: SurgicalCase }) {
  const [note, setNote] = useState(surgical.note);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<CompleteResponse | null>(null);

  const completeness = useMemo(() => {
    const needed = surgical.suggestions.length;
    if (needed === 0) return 100;
    const pct =
      surgical.completeness +
      Math.round((accepted.length / needed) * (100 - surgical.completeness));
    return Math.min(100, pct);
  }, [accepted.length, surgical]);

  function accept(id: string, insertText: string) {
    if (accepted.includes(id)) return;
    setAccepted((prev) => [...prev, id]);
    setNote((prev) => `${prev.trim()}\n\n${insertText}`);
  }

  async function signAndFile() {
    setPending(true);
    setResult(null);
    try {
      const res = await fetch(`/api/cases/${surgical.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completeness,
          findings: surgical.suggestions.length - accepted.length,
          noteLength: note.length,
          note,
        }),
      });
      const data = (await res.json()) as CompleteResponse;
      setResult(data);
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : "Request failed",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">{surgical.procedure}</CardTitle>
              <CardDescription>
                {surgical.id} · {surgical.patient} · {surgical.surgeon}
              </CardDescription>
            </div>
            <Badge variant="secondary">{STATUS_LABEL[surgical.status]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <ProductBand
            product="Observability"
            title="Sign & file writes logs and an APM waterfall"
          >
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-[420px] font-mono text-[13px] leading-relaxed"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Completeness {completeness}% · synthetic demo data only, no real PHI
              </p>
              <Button onClick={signAndFile} disabled={pending}>
                {pending ? "Filing…" : "Sign & file"}
              </Button>
            </div>
            {result ? (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                {result.ok ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <ProductMark product="Observability" />
                      <p>
                        Note filed. Trace{" "}
                        <code className="font-mono text-xs">{result.traceId}</code>
                      </p>
                    </div>
                    {result.notes?.ok ? (
                      <p className="flex flex-wrap items-center gap-2 text-xs">
                        <ProductMark product="Search" />
                        Indexed to surgical-capd-notes on AI Assistants.
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <DeepLink href={result.deepLinks?.discoverCase}>
                        Case logs
                      </DeepLink>
                      <DeepLink href={result.deepLinks?.apmTrace}>
                        APM waterfall
                      </DeepLink>
                      <DeepLink href={result.deepLinks?.discoverTrace}>
                        Trace spans
                      </DeepLink>
                      <DeepLink href={result.deepLinks?.discoverLogs}>
                        All CAPD logs
                      </DeepLink>
                      <DeepLink href={result.deepLinks?.notesSearch}>
                        Search note
                      </DeepLink>
                    </div>
                  </div>
                ) : (
                  <p className="text-destructive">{result.error}</p>
                )}
              </div>
            ) : null}
          </ProductBand>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <ProductBand product="LLM observability" title="CAPD findings">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentation gaps</CardTitle>
              <CardDescription>
                Computer-assisted physician documentation checks before coding.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {surgical.suggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No open gaps. This note is ready for the encoder.
                </p>
              ) : (
                surgical.suggestions.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <Badge variant="outline" className="capitalize">
                        {item.severity}
                      </Badge>
                    </div>
                    <p className="mb-3 text-xs text-muted-foreground">
                      {item.detail}
                    </p>
                    <Button
                      size="sm"
                      variant={accepted.includes(item.id) ? "secondary" : "default"}
                      disabled={accepted.includes(item.id)}
                      onClick={() => accept(item.id, item.insertText)}
                    >
                      {accepted.includes(item.id) ? "Inserted" : "Insert language"}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </ProductBand>
        <ProductBand product="Search" title="Retrieve this operative note">
          <DeepLink href={kibanaNotesDiscoverUrl(DEFAULT_NOTES_KIBANA_URL, surgical.id)}>
            Search this case
          </DeepLink>
        </ProductBand>
        <ProductBand product="Security" title="Who can open this note">
          <p className="text-xs">
            Treating surgeon vs billing.svc bulk read of FHIR Patients and CAPD
            notes.
          </p>
          <SecurityAccessLinks />
        </ProductBand>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Case facts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm text-muted-foreground">
            <p>OR / room: {surgical.or}</p>
            <p>Start: {surgical.start}</p>
            <p>CPT hint: {surgical.cptHint}</p>
            {surgical.laterality ? <p>Laterality: {surgical.laterality}</p> : null}
            <p>MRN: {surgical.mrn}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
