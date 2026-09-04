import {
  FACILITY,
  NOTES_INDEX,
  getNotesConfig,
  isNotesConfigured,
} from "./config";
import { ElasticError } from "./elastic";
import type { SurgicalCase } from "./cases";

export type SignedNoteDoc = {
  "@timestamp": string;
  "note.id": string;
  "case.id": string;
  "patient.display": string;
  "patient.mrn": string;
  surgeon: string;
  procedure: string;
  cpt: string;
  "or.room": string;
  facility: string;
  "note.text": string;
  "note.completeness": number;
  "capd.findings_open": number;
  "trace.id": string;
  "labels.demo": boolean;
};

export function buildSignedNoteDoc(input: {
  surgical: SurgicalCase;
  note: string;
  completeness: number;
  findings: number;
  traceId: string;
}): SignedNoteDoc {
  const id = `${input.surgical.id}-${Date.now()}`;
  return {
    "@timestamp": new Date().toISOString(),
    "note.id": id,
    "case.id": input.surgical.id,
    "patient.display": input.surgical.patient,
    "patient.mrn": input.surgical.mrn,
    surgeon: input.surgical.surgeon,
    procedure: input.surgical.procedure,
    cpt: input.surgical.cptHint,
    "or.room": input.surgical.or,
    facility: FACILITY,
    "note.text": input.note,
    "note.completeness": input.completeness,
    "capd.findings_open": input.findings,
    "trace.id": input.traceId,
    "labels.demo": true,
  };
}

export async function indexSignedNote(doc: SignedNoteDoc) {
  if (!isNotesConfigured()) {
    return { ok: false as const, skipped: true as const, reason: "NOTES_API_KEY is not set" };
  }
  const { esUrl, apiKey } = getNotesConfig();
  const res = await fetch(
    `${esUrl}/${NOTES_INDEX}/_doc/${encodeURIComponent(doc["note.id"])}?refresh=wait_for`,
    {
      method: "PUT",
      headers: {
        Authorization: `ApiKey ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(doc),
      cache: "no-store",
    },
  );
  const text = await res.text();
  if (!res.ok) {
    throw new ElasticError(
      `Notes index ${res.status} on ${NOTES_INDEX}`,
      res.status,
      text.slice(0, 1200),
    );
  }
  return { ok: true as const, skipped: false as const, id: doc["note.id"], index: NOTES_INDEX };
}
