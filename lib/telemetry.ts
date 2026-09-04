import { randomBytes } from "node:crypto";
import { CASES } from "./cases";
import {
  FACILITY,
  LOGS_DATA_STREAM,
  SERVICE_ENVIRONMENT,
  SERVICE_NAME,
} from "./config";
import { bulkIndex } from "./elastic";

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
  "labels.case_id"?: string;
  "labels.procedure"?: string;
  "labels.facility": string;
  "labels.surgeon"?: string;
  "labels.completeness"?: number;
  "labels.capd_findings"?: number;
};

const ACTIONS = [
  "case.opened",
  "capd.suggest",
  "ehr.pull",
  "note.save",
  "coding.score",
  "note.signed",
  "implant.lookup",
] as const;

function jitter(base: number, spread: number) {
  return Math.max(8, Math.round(base + (Math.random() - 0.5) * spread));
}

export function buildHistoricalEvents(count = 72): TelemetryEvent[] {
  const now = Date.now();
  const events: TelemetryEvent[] = [];
  for (let i = 0; i < count; i++) {
    const surgical = CASES[i % CASES.length];
    const action = ACTIONS[i % ACTIONS.length];
    const ageMs = Math.round((count - i) * 4.5 * 60_000 * Math.random() + i * 45_000);
    const timestamp = new Date(now - ageMs).toISOString();
    const traceId = hexId(16);
    const durationMs =
      action === "ehr.pull"
        ? jitter(420, 800)
        : action === "coding.score"
          ? jitter(180, 220)
          : action === "implant.lookup"
            ? jitter(90, 80)
            : jitter(40, 50);
    const ehrTimeout = action === "ehr.pull" && durationMs > 850;
    const codingWarn = action === "coding.score" && surgical.status === "coding-hold";
    const level: TelemetryEvent["log.level"] = ehrTimeout
      ? "error"
      : codingWarn
        ? "warn"
        : "info";
    const message = ehrTimeout
      ? `EHR problem-list pull timed out for ${surgical.id}`
      : codingWarn
        ? `Coding hold: incomplete laterality or implant data on ${surgical.id}`
        : `${action} for ${surgical.id} ${surgical.procedure}`;
    events.push({
      "@timestamp": timestamp,
      message,
      "log.level": level,
      "service.name": SERVICE_NAME,
      "service.environment": SERVICE_ENVIRONMENT,
      "event.dataset": "vincari.capd",
      "event.action": action,
      "event.duration": durationMs * 1_000_000,
      "trace.id": traceId,
      "transaction.id": hexId(8),
      "labels.case_id": surgical.id,
      "labels.procedure": surgical.procedure,
      "labels.facility": FACILITY,
      "labels.surgeon": surgical.surgeon,
      "labels.completeness": surgical.completeness,
      "labels.capd_findings": surgical.suggestions.length,
    });
  }
  return events;
}

export function buildLiveEvent(input: {
  caseId: string;
  procedure: string;
  surgeon: string;
  action: string;
  level?: TelemetryEvent["log.level"];
  message: string;
  durationMs?: number;
  completeness?: number;
  findings?: number;
  traceId?: string;
}): TelemetryEvent {
  return {
    "@timestamp": new Date().toISOString(),
    message: input.message,
    "log.level": input.level ?? "info",
    "service.name": SERVICE_NAME,
    "service.environment": SERVICE_ENVIRONMENT,
    "event.dataset": "vincari.capd",
    "event.action": input.action,
    "event.duration": (input.durationMs ?? jitter(55, 40)) * 1_000_000,
    "trace.id": input.traceId ?? hexId(16),
    "transaction.id": hexId(8),
    "labels.case_id": input.caseId,
    "labels.procedure": input.procedure,
    "labels.facility": FACILITY,
    "labels.surgeon": input.surgeon,
    "labels.completeness": input.completeness,
    "labels.capd_findings": input.findings,
  };
}

export async function ingestEvents(events: TelemetryEvent[]) {
  const result = await bulkIndex(LOGS_DATA_STREAM, events);
  const errors = Boolean(result.errors);
  return {
    ingested: events.length,
    errors,
    dataStream: LOGS_DATA_STREAM,
    sampleTraceId: events[0]?.["trace.id"],
  };
}
