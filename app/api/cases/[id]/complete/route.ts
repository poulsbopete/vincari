import { NextResponse } from "next/server";
import { getCase } from "@/lib/cases";
import { getElasticConfig } from "@/lib/config";
import { buildDeepLinks } from "@/lib/deep-links";
import { ElasticError } from "@/lib/elastic";
import { emitApmTraffic } from "@/lib/apm-traffic";
import { buildLiveEvent, ingestEvents } from "@/lib/telemetry";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const surgical = getCase(id);
  if (!surgical) {
    return NextResponse.json({ error: "Unknown case" }, { status: 404 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    completeness?: number;
    findings?: number;
    noteLength?: number;
  };
  const { kibanaUrl } = getElasticConfig();
  const durationMs = 90 + Math.round((body.noteLength ?? 400) / 12);
  const event = buildLiveEvent({
    capability: "ai-assistance",
    serviceName: "vincari-capd",
    dataset: "vincari.capd",
    action: "note.signed",
    message: `Operative note signed for ${surgical.id} (${surgical.procedure})`,
    durationMs,
    caseId: surgical.id,
    procedure: surgical.procedure,
    surgeon: surgical.surgeon,
    completeness: body.completeness ?? 100,
    findings: body.findings ?? surgical.suggestions.length,
  });
  try {
    await ingestEvents([event]);
    void emitApmTraffic(1).catch(() => undefined);
    return NextResponse.json({
      ok: true,
      traceId: event["trace.id"],
      action: event["event.action"],
      deepLinks: kibanaUrl
        ? buildDeepLinks(kibanaUrl, {
            caseId: surgical.id,
            traceId: event["trace.id"],
          })
        : null,
    });
  } catch (error) {
    const message =
      error instanceof ElasticError
        ? `${error.message}${error.body ? `: ${error.body.slice(0, 400)}` : ""}`
        : error instanceof Error
          ? error.message
          : "Ingest failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
