import { NextResponse } from "next/server";
import { getElasticConfig } from "@/lib/config";
import { buildDeepLinks } from "@/lib/deep-links";
import { ElasticError, esql } from "@/lib/elastic";
import { HEALTHCARE_SERVICES } from "@/lib/solutions";
import { buildHistoricalEvents, ingestEvents } from "@/lib/telemetry";

type LogRow = {
  timestamp: string;
  level: string;
  message: string;
  action: string;
  serviceName: string;
  caseId: string;
  traceId: string;
  durationNs: number | null;
};

const FLEET = HEALTHCARE_SERVICES.map((name) => `"${name}"`).join(", ");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("caseId") ?? undefined;
  const serviceName = searchParams.get("service") ?? undefined;
  const { kibanaUrl } = getElasticConfig();

  try {
    const parts = [`service.name IN (${FLEET})`];
    if (caseId) parts.push(`labels.case_id == "${caseId.replace(/"/g, "")}"`);
    if (serviceName) {
      parts.push(`service.name == "${serviceName.replace(/"/g, "")}"`);
    }
    const result = await esql(
      [
        "FROM logs-*",
        `| WHERE ${parts.join(" AND ")}`,
        "| SORT @timestamp DESC",
        "| KEEP @timestamp, log.level, message, event.action, service.name, labels.case_id, trace.id, event.duration",
        "| LIMIT 40",
      ].join(" "),
    );
    const rows: LogRow[] = (result.values || []).map((row) => ({
      timestamp: String(row[0] ?? ""),
      level: String(row[1] ?? "info"),
      message: String(row[2] ?? ""),
      action: String(row[3] ?? ""),
      serviceName: String(row[4] ?? ""),
      caseId: String(row[5] ?? ""),
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
            serviceName: serviceName ?? rows[0]?.serviceName,
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
    const events = buildHistoricalEvents(96);
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
