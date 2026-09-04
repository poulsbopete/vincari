import { NextResponse } from "next/server";
import { getCase } from "@/lib/cases";
import { getElasticConfig } from "@/lib/config";
import { buildDeepLinks } from "@/lib/deep-links";
import { ElasticError } from "@/lib/elastic";
import { capabilityById, type CapabilityId } from "@/lib/solutions";
import { buildLiveEvent, ingestEvents } from "@/lib/telemetry";

const LIVE: Record<
  CapabilityId,
  { action: string; dataset: string; durationMs: number; genAi?: boolean }
> = {
  engagement: {
    action: "appointment.book",
    dataset: "vincari.engagement",
    durationMs: 95,
  },
  "virtual-health": {
    action: "telehealth.join",
    dataset: "vincari.telehealth",
    durationMs: 1280,
  },
  "clinical-insights": {
    action: "fhir.bundle.assemble",
    dataset: "vincari.fhir",
    durationMs: 310,
  },
  "ai-assistance": {
    action: "gen_ai.note.draft",
    dataset: "vincari.capd",
    durationMs: 980,
    genAi: true,
  },
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    capability?: CapabilityId;
    caseId?: string;
  };
  const capability = capabilityById(body.capability ?? "engagement");
  if (!capability) {
    return NextResponse.json({ error: "Unknown capability" }, { status: 400 });
  }
  const spec = LIVE[capability.id];
  const surgical = getCase(body.caseId ?? "OR-4412");
  const event = buildLiveEvent({
    capability: capability.id,
    serviceName: capability.serviceName,
    dataset: spec.dataset,
    action: spec.action,
    message: `${spec.action} · ${capability.msTitle} · ${surgical?.id ?? "OR-4412"}`,
    durationMs: spec.durationMs,
    caseId: surgical?.id,
    procedure: surgical?.procedure,
    surgeon: surgical?.surgeon,
    patientId: surgical?.mrn,
    genAi: spec.genAi,
  });
  const { kibanaUrl } = getElasticConfig();
  try {
    const ingest = await ingestEvents([event]);
    return NextResponse.json({
      ok: true,
      traceId: event["trace.id"],
      serviceName: event["service.name"],
      action: event["event.action"],
      deepLinks: kibanaUrl
        ? buildDeepLinks(kibanaUrl, {
            caseId: surgical?.id,
            traceId: event["trace.id"],
            transactionId: ingest.sampleSpanId,
            transactionName: ingest.sampleTransactionName,
            serviceName: capability.serviceName,
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
