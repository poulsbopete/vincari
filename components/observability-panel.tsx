"use client";

import { useEffect, useState } from "react";
import { DeepLink } from "@/components/deep-link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DeepLinks = {
  discoverLogs?: string | null;
  discoverErrors?: string | null;
  discoverLatency?: string | null;
  apmService?: string | null;
  apmServices?: string | null;
  streams?: string | null;
  dashboards?: string | null;
};

type EventRow = {
  timestamp: string;
  level: string;
  message: string;
  action: string;
  caseId: string;
  procedure: string;
  traceId: string;
  durationNs: number | null;
};

type Payload = {
  ok?: boolean;
  error?: string;
  seeded?: boolean;
  count?: number;
  events?: EventRow[];
  deepLinks?: DeepLinks | null;
};

function formatDuration(ns: number | null) {
  if (ns == null) return "—";
  return `${Math.round(ns / 1_000_000)} ms`;
}

export function ObservabilityPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [health, setHealth] = useState<{
    ok?: boolean;
    kibanaHost?: string | null;
    version?: string;
    error?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [obs, ping] = await Promise.all([
      fetch("/api/observability", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/health", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setData(obs);
    setHealth(ping);
  }

  async function seed() {
    setBusy(true);
    try {
      await fetch("/api/observability", { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const links = data?.deepLinks;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Platform observability
          </h1>
          <p className="text-sm text-muted-foreground">
            CAPD workflow telemetry in Elastic Serverless Observability, with
            deep links into Discover, APM, and Streams.
          </p>
        </div>
        <Button onClick={seed} disabled={busy} variant="secondary">
          {busy ? "Seeding…" : "Seed 80 workflow events"}
        </Button>
      </div>

      {health && !health.ok ? (
        <Alert variant="destructive">
          <AlertTitle>Elasticsearch not reachable</AlertTitle>
          <AlertDescription>
            {health.error || "Set ES_URL and ES_API_KEY (or ELASTICSEARCH_*)."}
          </AlertDescription>
        </Alert>
      ) : null}

      {data && data.ok === false ? (
        <Alert variant="destructive">
          <AlertTitle>Query failed</AlertTitle>
          <AlertDescription>{data.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Project</CardDescription>
            <CardTitle className="text-base">
              {health?.kibanaHost || "otel-demo"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Kibana {health?.version || "serverless"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>CAPD events loaded</CardDescription>
            <CardTitle className="text-base">{data?.count ?? "—"}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            service.name = vincari-capd
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Deep links</CardDescription>
            <CardTitle className="text-base">Kibana</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <DeepLink href={links?.discoverLogs}>Discover logs</DeepLink>
            <DeepLink href={links?.discoverErrors}>Errors</DeepLink>
            <DeepLink href={links?.discoverLatency}>Latency</DeepLink>
            <DeepLink href={links?.apmService}>APM service</DeepLink>
            <DeepLink href={links?.streams}>Streams</DeepLink>
            <DeepLink href={links?.dashboards}>Dashboards</DeepLink>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent CAPD telemetry</CardTitle>
          <CardDescription>
            Each Sign & file action writes a log with trace.id for one-click
            jump into Kibana.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Case</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Kibana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.events || []).slice(0, 20).map((event) => (
                <TableRow key={`${event.timestamp}-${event.traceId}`}>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {event.timestamp.replace("T", " ").slice(0, 19)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={event.level === "error" ? "destructive" : "outline"}
                    >
                      {event.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {event.action}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{event.caseId}</div>
                    <div className="max-w-[220px] truncate text-xs text-muted-foreground">
                      {event.procedure}
                    </div>
                  </TableCell>
                  <TableCell>{formatDuration(event.durationNs)}</TableCell>
                  <TableCell>
                    <DeepLink href={links?.discoverLogs}>Open</DeepLink>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(data?.events || []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No vincari-capd logs yet. Seed events or sign a note from the OR
              board.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
