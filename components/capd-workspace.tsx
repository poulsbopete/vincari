"use client";

import { useMemo, useState } from "react";
import { DeepLink } from "@/components/deep-link";
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

type CompleteResponse = {
  ok?: boolean;
  error?: string;
  traceId?: string;
  deepLinks?: {
    discoverCase?: string | null;
    apmTrace?: string | null;
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
                  <p>
                    Note filed. Trace{" "}
                    <code className="font-mono text-xs">{result.traceId}</code>{" "}
                    written to Elastic Observability
                    {result.notes?.ok
                      ? ", and the operative note was indexed for search on ai-assistants."
                      : "."}
                    {result.notes?.skipped ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Note search is not wired yet (set NOTES_API_KEY for the
                        ai-assistants project).
                      </span>
                    ) : null}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <DeepLink href={result.deepLinks?.discoverCase}>
                      Case logs
                    </DeepLink>
                    <DeepLink href={result.deepLinks?.apmTrace}>
                      APM traces
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
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CAPD findings</CardTitle>
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
