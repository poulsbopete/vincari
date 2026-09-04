import { randomBytes } from "node:crypto";
import { CASES } from "./cases";
import {
  FACILITY,
  LOGS_DATA_STREAM,
  SERVICE_ENVIRONMENT,
} from "./config";
import { emitTracesForLogEvents } from "./apm-traffic";
import { bulkIndex, ElasticError } from "./elastic";
import type { CapabilityId } from "./solutions";

function hexId(bytes: number) {
  return randomBytes(bytes).toString("hex");
}

export type TelemetryEvent = {
  "@timestamp": string;
  message: string;
  "log.level": "info" | "warn" | "error";
  "service.name": string;
  "service.environment": string;
  "event.dataset": string;
  "event.action": string;
  "event.duration"?: number;
  "trace.id": string;
  "transaction.id": string;
  "labels.capability": CapabilityId;
  "labels.facility": string;
  "labels.case_id"?: string;
  "labels.procedure"?: string;
  "labels.surgeon"?: string;
  "labels.completeness"?: number;
  "labels.capd_findings"?: number;
  "labels.patient_id"?: string;
  "gen_ai.operation.name"?: string;
  "gen_ai.request.model"?: string;
  "gen_ai.usage.input_tokens"?: number;
  "gen_ai.usage.output_tokens"?: number;
};

function jitter(base: number, spread: number) {
  return Math.max(8, Math.round(base + (Math.random() - 0.5) * spread));
}

const PORTAL_ACTIONS = [
  "appointment.book",
  "careplan.render",
  "records.fetch",
  "portal.login",
] as const;

const TELEHEALTH_ACTIONS = [
  "telehealth.join",
  "teams.graph",
  "session.qos",
  "visit.end",
] as const;

const FHIR_ACTIONS = [
  "fhir.patient.read",
  "fhir.encounter.search",
  "fhir.bundle.assemble",
  "ahds.export",
] as const;

const CAPD_ACTIONS = [
  "case.opened",
  "capd.suggest",
  "ehr.pull",
  "note.save",
  "coding.score",
  "note.signed",
  "gen_ai.note.draft",
  "fabric.pipeline",
] as const;

function baseEvent(partial: Omit<TelemetryEvent, "service.environment" | "labels.facility">): TelemetryEvent {
  return {
    "service.environment": SERVICE_ENVIRONMENT,
    "labels.facility": FACILITY,
    ...partial,
  };
}

export function buildHistoricalEvents(count = 96): TelemetryEvent[] {
  const now = Date.now();
  const events: TelemetryEvent[] = [];
  for (let i = 0; i < count; i++) {
    const bucket = i % 4;
    const ageMs = Math.round((count - i) * 3.2 * 60_000 * Math.random() + i * 35_000);
    const timestamp = new Date(now - ageMs).toISOString();
    const surgical = CASES[i % CASES.length];
    if (bucket === 0) {
      const action = PORTAL_ACTIONS[i % PORTAL_ACTIONS.length];
      const durationMs = action === "records.fetch" ? jitter(280, 500) : jitter(70, 80);
      const error = action === "records.fetch" && durationMs > 620;
      events.push(
        baseEvent({
          "@timestamp": timestamp,
          message: error
            ? `Health-record fetch timed out for ${surgical.mrn}`
            : `${action} for ${surgical.patient} (${surgical.mrn})`,
          "log.level": error ? "error" : "info",
          "service.name": "vincari-portal",
          "event.dataset": "vincari.engagement",
          "event.action": action,
          "event.duration": durationMs * 1_000_000,
          "trace.id": hexId(16),
          "transaction.id": hexId(8),
          "labels.capability": "engagement",
          "labels.case_id": surgical.id,
          "labels.patient_id": surgical.mrn,
        }),
      );
    } else if (bucket === 1) {
      const action = TELEHEALTH_ACTIONS[i % TELEHEALTH_ACTIONS.length];
      const durationMs = action === "telehealth.join" ? jitter(900, 1400) : jitter(120, 200);
      const warn = action === "session.qos" && i % 7 === 0;
      const error = action === "teams.graph" && i % 11 === 0;
      events.push(
        baseEvent({
          "@timestamp": timestamp,
          message: error
            ? `Teams Graph token exchange failed for visit ${surgical.id}`
            : warn
              ? `Telehealth QoS degraded (jitter) on visit ${surgical.id}`
              : `${action} Teams consult ${surgical.id}`,
          "log.level": error ? "error" : warn ? "warn" : "info",
          "service.name": "vincari-telehealth",
          "event.dataset": "vincari.telehealth",
          "event.action": action,
          "event.duration": durationMs * 1_000_000,
          "trace.id": hexId(16),
          "transaction.id": hexId(8),
          "labels.capability": "virtual-health",
          "labels.case_id": surgical.id,
          "labels.patient_id": surgical.mrn,
          "labels.surgeon": surgical.surgeon,
        }),
      );
    } else if (bucket === 2) {
      const action = FHIR_ACTIONS[i % FHIR_ACTIONS.length];
      const durationMs = action === "fhir.bundle.assemble" ? jitter(340, 400) : jitter(90, 120);
      const warn = action === "ahds.export" && i % 9 === 0;
      events.push(
        baseEvent({
          "@timestamp": timestamp,
          message: warn
            ? `Azure Health Data Services export lag for ${surgical.mrn}`
            : `${action} FHIR ${surgical.mrn}`,
          "log.level": warn ? "warn" : "info",
          "service.name": "vincari-fhir",
          "event.dataset": "vincari.fhir",
          "event.action": action,
          "event.duration": durationMs * 1_000_000,
          "trace.id": hexId(16),
          "transaction.id": hexId(8),
          "labels.capability": "clinical-insights",
          "labels.case_id": surgical.id,
          "labels.patient_id": surgical.mrn,
          "labels.procedure": surgical.procedure,
        }),
      );
    } else {
      const action = CAPD_ACTIONS[i % CAPD_ACTIONS.length];
      const durationMs =
        action === "ehr.pull"
          ? jitter(420, 800)
          : action === "gen_ai.note.draft"
            ? jitter(1100, 900)
            : jitter(50, 60);
      const ehrTimeout = action === "ehr.pull" && durationMs > 850;
      events.push(
        baseEvent({
          "@timestamp": timestamp,
          message: ehrTimeout
            ? `EHR problem-list pull timed out for ${surgical.id}`
            : `${action} for ${surgical.id} ${surgical.procedure}`,
          "log.level": ehrTimeout ? "error" : "info",
          "service.name": "vincari-capd",
          "event.dataset": "vincari.capd",
          "event.action": action,
          "event.duration": durationMs * 1_000_000,
          "trace.id": hexId(16),
          "transaction.id": hexId(8),
          "labels.capability": "ai-assistance",
          "labels.case_id": surgical.id,
          "labels.procedure": surgical.procedure,
          "labels.surgeon": surgical.surgeon,
          "labels.completeness": surgical.completeness,
          "labels.capd_findings": surgical.suggestions.length,
          ...(action === "gen_ai.note.draft"
            ? {
                "gen_ai.operation.name": "chat",
                "gen_ai.request.model": "dragon-copilot-demo",
                "gen_ai.usage.input_tokens": 800 + (i % 200),
                "gen_ai.usage.output_tokens": 220 + (i % 80),
              }
            : {}),
        }),
      );
    }
  }
  return events;
}

export function buildLiveEvent(input: {
  capability: CapabilityId;
  serviceName: string;
  dataset: string;
  action: string;
  message: string;
  level?: TelemetryEvent["log.level"];
  durationMs?: number;
  caseId?: string;
  procedure?: string;
  surgeon?: string;
  patientId?: string;
  completeness?: number;
  findings?: number;
  genAi?: boolean;
}): TelemetryEvent {
  return baseEvent({
    "@timestamp": new Date().toISOString(),
    message: input.message,
    "log.level": input.level ?? "info",
    "service.name": input.serviceName,
    "event.dataset": input.dataset,
    "event.action": input.action,
    "event.duration": (input.durationMs ?? jitter(55, 40)) * 1_000_000,
    "trace.id": hexId(16),
    "transaction.id": hexId(8),
    "labels.capability": input.capability,
    "labels.case_id": input.caseId,
    "labels.procedure": input.procedure,
    "labels.surgeon": input.surgeon,
    "labels.completeness": input.completeness,
    "labels.capd_findings": input.findings,
    "labels.patient_id": input.patientId,
    ...(input.genAi
      ? {
          "gen_ai.operation.name": "chat",
          "gen_ai.request.model": "dragon-copilot-demo",
          "gen_ai.usage.input_tokens": 640,
          "gen_ai.usage.output_tokens": 180,
        }
      : {}),
  });
}

export async function ingestEvents(events: TelemetryEvent[]) {
  const result = await bulkIndex(LOGS_DATA_STREAM, events);
  const traces = await emitTracesForLogEvents(
    events.map((event) => ({
      serviceName: event["service.name"],
      action: event["event.action"],
      durationMs: Math.round((event["event.duration"] ?? 50_000_000) / 1_000_000),
      traceId: event["trace.id"],
      timestamp: event["@timestamp"],
      failed: event["log.level"] === "error",
    })),
  );
  if (!traces.ok) {
    throw new ElasticError(
      `OTLP traces failed (${traces.status})`,
      traces.status,
      traces.body,
    );
  }
  return {
    ingested: events.length,
    errors: Boolean(result.errors),
    dataStream: LOGS_DATA_STREAM,
    sampleTraceId: events[0]?.["trace.id"],
    sampleSpanId: traces.sampleSpanId,
    sampleTransactionName: traces.sampleTransactionName,
    tracesOk: traces.ok,
  };
}
