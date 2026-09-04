import { NextResponse } from "next/server";
import { SERVICE_NAME, getElasticConfig } from "@/lib/config";
import { buildDeepLinks } from "@/lib/deep-links";
import { ElasticError, esql } from "@/lib/elastic";
import { buildHistoricalEvents, ingestEvents } from "@/lib/telemetry";

type LogRow = {
  timestamp: string;
  level: string;
  message: string;
  action: string;
  caseId: string;
  procedure: string;
  traceId: string;
  durationNs: number | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("caseId") ?? undefined;
  const { kibanaUrl } = getElasticConfig();

  try {
    const where = caseId
      ? `service.name == "${SERVICE_NAME}" AND labels.case_id == "${caseId.replace(/"/g, "")}"`
      : `service.name == "${SERVICE_NAME}"`;
    const result = await esql(
      [
        "FROM logs-*",
        `| WHERE ${where}`,
        "| SORT @timestamp DESC",
        "| KEEP @timestamp, log.level, message, event.action, labels.case_id, labels.procedure, trace.id, event.duration",
        "| LIMIT 40",
      ].join(" "),
    );
    const rows: LogRow[] = (result.values || []).map((row) => ({
      timestamp: String(row[0] ?? ""),
      level: String(row[1] ?? "info"),
      message: String(row[2] ?? ""),
      action: String(row[3] ?? ""),
      caseId: String(row[4] ?? ""),
      procedure: String(row[5] ?? ""),
      traceId: String(row[6] ?? ""),
      durationNs: typeof row[7] === "number" ? row[7] : null,
    }));
    return NextResponse.json({
      ok: true,
      seeded: false,
      count: rows.length,
      events: rows,
      deepLinks: kibanaUrl
        ? buildDeepLinks(kibanaUrl, {
            caseId,
            traceId: rows[0]?.traceId,
          })
        : null,
    });
  } catch (error) {
    const message =
      error instanceof ElasticError
        ? `${error.message}${error.body ? `: ${error.body.slice(0, 280)}` : ""}`
        : error instanceof Error
          ? error.message
          : "Query failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

export async function POST() {
  const { kibanaUrl } = getElasticConfig();
  try {
    const events = buildHistoricalEvents(80);
    const ingest = await ingestEvents(events);
    return NextResponse.json({
      ok: true,
      ...ingest,
      deepLinks: kibanaUrl
        ? buildDeepLinks(kibanaUrl, { traceId: ingest.sampleTraceId })
        : null,
    });
  } catch (error) {
    const message =
      error instanceof ElasticError
        ? `${error.message}${error.body ? `: ${error.body.slice(0, 400)}` : ""}`
        : error instanceof Error
          ? error.message
          : "Seed failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
