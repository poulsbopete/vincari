"use client";

import { useState } from "react";
import { DeepLink } from "@/components/deep-link";
import { ProductMark } from "@/components/product-mark";
import { Button } from "@/components/ui/button";
import type { Capability } from "@/lib/solutions";

type Result = {
  ok?: boolean;
  error?: string;
  traceId?: string;
  serviceName?: string;
  deepLinks?: {
    discoverCase?: string | null;
    apmTrace?: string | null;
    apmService?: string | null;
    discoverLogs?: string | null;
    slos?: string | null;
  } | null;
};

export function CapabilityAction({ capability }: { capability: Capability }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    setPending(true);
    setResult(null);
    try {
      const res = await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capability: capability.id, caseId: "OR-4412" }),
      });
      setResult((await res.json()) as Result);
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
    <div className="space-y-3">
      <Button onClick={run} disabled={pending}>
        {pending ? "Writing to Elastic…" : capability.demoAction}
      </Button>
      {result ? (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          {result.ok ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <ProductMark product="Observability" />
                <p>
                  Logged to{" "}
                  <code className="font-mono text-xs">{result.serviceName}</code>
                  . Trace{" "}
                  <code className="font-mono text-xs">{result.traceId}</code>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <DeepLink href={result.deepLinks?.discoverCase}>
                  Case logs
                </DeepLink>
                <DeepLink href={result.deepLinks?.apmTrace}>
                  APM waterfall
                </DeepLink>
                <DeepLink href={result.deepLinks?.apmService}>
                  APM service
                </DeepLink>
                <DeepLink href={result.deepLinks?.discoverLogs}>
                  Fleet logs
                </DeepLink>
                <DeepLink href={result.deepLinks?.slos}>SLOs</DeepLink>
              </div>
            </div>
          ) : (
            <p className="text-destructive">{result.error}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
