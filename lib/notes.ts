import { CASES, type SurgicalCase } from "./cases";
import {
  FACILITY,
  NOTES_INDEX,
  getNotesConfig,
  isNotesConfigured,
} from "./config";
import { ElasticError } from "./elastic";

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

const NOTES_MAPPINGS = {
  properties: {
    "@timestamp": { type: "date" },
    "note.id": { type: "keyword" },
    "case.id": { type: "keyword" },
    "patient.display": { type: "keyword" },
    "patient.mrn": { type: "keyword" },
    surgeon: { type: "text", fields: { keyword: { type: "keyword" } } },
    procedure: { type: "text", fields: { keyword: { type: "keyword" } } },
    cpt: { type: "keyword" },
    "or.room": { type: "keyword" },
    facility: { type: "keyword" },
    "note.text": { type: "text" },
    "note.completeness": { type: "integer" },
    "capd.findings_open": { type: "integer" },
    "trace.id": { type: "keyword" },
    "labels.demo": { type: "boolean" },
  },
};

async function notesFetch(path: string, init: RequestInit = {}) {
  const { esUrl, apiKey } = getNotesConfig();
  if (!esUrl || !apiKey) {
    throw new ElasticError("NOTES_API_KEY is not set");
  }
  const res = await fetch(`${esUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `ApiKey ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new ElasticError(
      `Notes Elasticsearch ${res.status} on ${path}`,
      res.status,
      text.slice(0, 2000),
    );
  }
  return text ? JSON.parse(text) : {};
}

export async function ensureNotesIndex() {
  if (!isNotesConfigured()) {
    return { ok: false as const, skipped: true as const, reason: "NOTES_API_KEY is not set" };
  }
  const { esUrl, apiKey } = getNotesConfig();
  const res = await fetch(`${esUrl}/${NOTES_INDEX}`, {
    method: "PUT",
    headers: {
      Authorization: `ApiKey ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mappings: NOTES_MAPPINGS }),
    cache: "no-store",
  });
  const text = await res.text();
  if (res.ok) return { ok: true as const, created: true as const, index: NOTES_INDEX };
  if (res.status === 400 && text.includes("resource_already_exists_exception")) {
    return { ok: true as const, created: false as const, index: NOTES_INDEX };
  }
  throw new ElasticError(`Create ${NOTES_INDEX} failed (${res.status})`, res.status, text.slice(0, 1200));
}

export function buildSignedNoteDoc(input: {
  surgical: SurgicalCase;
  note: string;
  completeness: number;
  findings: number;
  traceId: string;
  noteId?: string;
}): SignedNoteDoc {
  const id = input.noteId ?? `${input.surgical.id}-${Date.now()}`;
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
  await ensureNotesIndex();
  await notesFetch(`/${NOTES_INDEX}/_doc/${encodeURIComponent(doc["note.id"])}?refresh=wait_for`, {
    method: "PUT",
    body: JSON.stringify(doc),
  });
  return { ok: true as const, skipped: false as const, id: doc["note.id"], index: NOTES_INDEX };
}

export async function seedSignedNotes() {
  const ensured = await ensureNotesIndex();
  if (!ensured.ok) return { ...ensured, seeded: 0 };
  const docs = CASES.map((surgical) =>
    buildSignedNoteDoc({
      surgical,
      note: surgical.note,
      completeness: surgical.completeness,
      findings: surgical.suggestions.length,
      traceId: "seed",
      noteId: `${surgical.id}-seed`,
    }),
  );
  for (const doc of docs) {
    await indexSignedNote(doc);
  }
  return { ok: true as const, skipped: false as const, seeded: docs.length, index: NOTES_INDEX };
}
