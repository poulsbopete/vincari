"use client";

import { useState } from "react";
import { DeepLink } from "@/components/deep-link";
import { Button } from "@/components/ui/button";

type Result = {
  ok?: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
  ingested?: number;
  actor?: string;
  sourceIp?: string;
  rule?: { ok?: boolean; created?: boolean; error?: string };
  deepLinks?: {
    alerts?: string | null;
    discover?: string | null;
    rules?: string | null;
  };
};

export function SecurityScenario() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    setPending(true);
    setResult(null);
    try {
      const res = await fetch("/api/security", { method: "POST" });
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
        {pending ? "Writing SIEM events…" : "Simulate suspicious EHR access"}
      </Button>
      {result ? (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          {result.ok ? (
            <div className="space-y-2">
              <p>
                Indexed {result.ingested} audit events as{" "}
                <code className="font-mono text-xs">{result.actor}</code> from{" "}
                <code className="font-mono text-xs">{result.sourceIp}</code> on
                the Security Serverless project.
              </p>
              {result.rule?.ok ? (
                <p className="text-xs text-muted-foreground">
                  Detection rule{" "}
                  {result.rule.created ? "created" : "already present"}: revenue-cycle
                  account reading EHR. Alerts appear after the 1-minute rule
                  interval.
                </p>
              ) : result.rule?.error ? (
                <p className="text-xs text-muted-foreground">
                  Events indexed; rule setup: {result.rule.error}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <DeepLink href={result.deepLinks?.discover}>Discover events</DeepLink>
                <DeepLink href={result.deepLinks?.alerts}>Security alerts</DeepLink>
                <DeepLink href={result.deepLinks?.rules}>Detection rules</DeepLink>
              </div>
            </div>
          ) : (
            <p className="text-destructive">
              {result.skipped
                ? "Set SECURITY_API_KEY for my-security-project-ac9463 to index SIEM events."
                : result.error}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
