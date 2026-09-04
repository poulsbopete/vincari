import { randomBytes } from "node:crypto";
import { CASES } from "./cases";
import {
  FACILITY,
  SECURITY_LOGS_STREAM,
  SECURITY_RULE_ID,
  getSecurityConfig,
  isSecurityConfigured,
} from "./config";
import { ElasticError } from "./elastic";

const ACTOR = {
  name: "billing.svc",
  id: "svc-revenue-cycle",
  roles: ["revenue-cycle", "ehr-read"],
};
const HOST = "wrk-rcm-jump-04";
const SOURCE_IP = "198.51.100.44";

function hexId(bytes: number) {
  return randomBytes(bytes).toString("hex");
}

async function securityEs(path: string, init: RequestInit = {}) {
  const { esUrl, apiKey } = getSecurityConfig();
  if (!esUrl || !apiKey) {
    throw new ElasticError("Security Elasticsearch is not configured");
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
    throw new ElasticError(`Security ES ${res.status} on ${path}`, res.status, text.slice(0, 1500));
  }
  return text ? JSON.parse(text) : {};
}

async function securityKibana(path: string, init: RequestInit = {}) {
  const { kibanaUrl, apiKey } = getSecurityConfig();
  const res = await fetch(`${kibanaUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `ApiKey ${apiKey}`,
      "kbn-xsrf": "true",
      "Content-Type": "application/json",
      "elastic-api-version": "2023-10-31",
      "x-elastic-internal-origin": "Kibana",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new ElasticError(`Security Kibana ${res.status} on ${path}`, res.status, text.slice(0, 1500));
  }
  return text ? JSON.parse(text) : {};
}

export function buildSecurityBurst() {
  const now = Date.now();
  const docs: Record<string, unknown>[] = [];
  docs.push({
    "@timestamp": new Date(now - 90_000).toISOString(),
    message: `${ACTOR.name} authenticated to the EHR from ${SOURCE_IP} outside the surgical LAN`,
    "log.level": "warn",
    "event.kind": "event",
    "event.category": ["authentication"],
    "event.type": ["start"],
    "event.action": "user.login",
    "event.dataset": "vincari.security",
    "event.outcome": "success",
    "event.module": "vincari",
    "user.name": ACTOR.name,
    "user.id": ACTOR.id,
    "user.roles": ACTOR.roles,
    "host.name": HOST,
    "source.ip": SOURCE_IP,
    "source.geo.city_name": "Ashburn",
    "source.geo.country_iso_code": "US",
    "labels.facility": FACILITY,
    "labels.demo": true,
    "threat.framework": "MITRE ATT&CK",
    "threat.tactic.id": "TA0001",
    "threat.tactic.name": "Initial Access",
    "threat.technique.id": "T1078",
    "threat.technique.name": "Valid Accounts",
  });

  CASES.forEach((surgical, index) => {
    const ts = new Date(now - 80_000 + index * 4_000).toISOString();
    docs.push({
      "@timestamp": ts,
      message: `FHIR Patient/${surgical.mrn} read by ${ACTOR.name} (${surgical.procedure})`,
      "log.level": "info",
      "event.kind": "event",
      "event.category": ["iam"],
      "event.type": ["access"],
      "event.action": "ehr.record.read",
      "event.dataset": "vincari.security",
      "event.outcome": "success",
      "event.module": "vincari",
      "user.name": ACTOR.name,
      "user.id": ACTOR.id,
      "user.roles": ACTOR.roles,
      "host.name": HOST,
      "source.ip": SOURCE_IP,
      "url.path": `/fhir/Patient/${surgical.mrn}`,
      "http.request.method": "GET",
      "labels.facility": FACILITY,
      "labels.case_id": surgical.id,
      "labels.mrn": surgical.mrn,
      "labels.procedure": surgical.procedure,
      "labels.demo": true,
      "related.user": [ACTOR.name],
      "threat.framework": "MITRE ATT&CK",
      "threat.tactic.id": "TA0009",
      "threat.tactic.name": "Collection",
      "threat.technique.id": "T1213",
      "threat.technique.name": "Data from Information Repositories",
    });
  });

  const acdf = CASES.find((c) => c.id === "OR-4421") ?? CASES[0];
  docs.push({
    "@timestamp": new Date(now - 8_000).toISOString(),
    message: `Operative note for ${acdf.id} opened by ${ACTOR.name} — not an assigned surgeon`,
    "log.level": "warn",
    "event.kind": "event",
    "event.category": ["file"],
    "event.type": ["access"],
    "event.action": "capd.note.read",
    "event.dataset": "vincari.security",
    "event.outcome": "success",
    "event.module": "vincari",
    "user.name": ACTOR.name,
    "user.id": ACTOR.id,
    "user.roles": ACTOR.roles,
    "host.name": HOST,
    "source.ip": SOURCE_IP,
    "file.name": `${acdf.id}-operative-note.txt`,
    "file.path": `/capd/notes/${acdf.id}`,
    "labels.facility": FACILITY,
    "labels.case_id": acdf.id,
    "labels.mrn": acdf.mrn,
    "labels.demo": true,
    "threat.framework": "MITRE ATT&CK",
    "threat.tactic.id": "TA0009",
    "threat.tactic.name": "Collection",
    "threat.technique.id": "T1213",
    "threat.technique.name": "Data from Information Repositories",
  });

  return docs;
}

async function ensureLogsTemplate() {
  await securityEs("/_index_template/logs-vincari.security", {
    method: "PUT",
    body: JSON.stringify({
      index_patterns: ["logs-vincari.security-*"],
      data_stream: {},
      priority: 500,
      template: {
        mappings: {
          dynamic: true,
        },
      },
    }),
  });
}

async function ensureDetectionRule() {
  const { kibanaUrl } = getSecurityConfig();
  if (!kibanaUrl) return { ok: false, reason: "no kibana" };
  const existing = await fetch(
    `${kibanaUrl}/api/detection_engine/rules?rule_id=${SECURITY_RULE_ID}`,
    {
      headers: {
        Authorization: `ApiKey ${getSecurityConfig().apiKey}`,
        "kbn-xsrf": "true",
        "elastic-api-version": "2023-10-31",
        "x-elastic-internal-origin": "Kibana",
      },
      cache: "no-store",
    },
  );
  if (existing.ok) return { ok: true, created: false, ruleId: SECURITY_RULE_ID };

  const body = {
    rule_id: SECURITY_RULE_ID,
    name: "Surgical CAPD — revenue-cycle account reading EHR",
    description:
      "A billing/revenue-cycle service account is reading FHIR Patient records and CAPD operative notes. Surgeons and charting workstations should own that access, not RCM automation.",
    type: "query",
    language: "kuery",
    query:
      'event.dataset : "vincari.security" and user.name : "billing.svc" and event.action : ("ehr.record.read" or "capd.note.read")',
    index: ["logs-vincari.security-*"],
    interval: "1m",
    from: "now-2h",
    to: "now",
    enabled: true,
    severity: "high",
    risk_score: 73,
    tags: ["surgical-capd", "hipaa", "demo"],
    threat: [
      {
        framework: "MITRE ATT&CK",
        tactic: {
          id: "TA0009",
          name: "Collection",
          reference: "https://attack.mitre.org/tactics/TA0009/",
        },
        technique: [
          {
            id: "T1213",
            name: "Data from Information Repositories",
            reference: "https://attack.mitre.org/techniques/T1213/",
          },
        ],
      },
    ],
    note:
      "Confirm whether this account is an approved break-glass identity. Correlate with Surgical CAPD case IDs in labels.case_id and otel-demo traces.",
  };
  await securityKibana("/api/detection_engine/rules", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { ok: true, created: true, ruleId: SECURITY_RULE_ID };
}

export async function ingestSecurityScenario() {
  if (!isSecurityConfigured()) {
    return {
      ok: false as const,
      skipped: true as const,
      reason: "SECURITY_API_KEY is not set",
    };
  }
  await ensureLogsTemplate();
  const docs = buildSecurityBurst();
  const ndjson = docs
    .map((doc) => `${JSON.stringify({ create: {} })}\n${JSON.stringify(doc)}`)
    .join("\n")
    .concat("\n");
  const bulk = await securityEs(
    `/${encodeURIComponent(SECURITY_LOGS_STREAM)}/_bulk?refresh=wait_for`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-ndjson" },
      body: ndjson,
    },
  );
  let rule: { ok: boolean; created?: boolean; ruleId?: string; error?: string } = {
    ok: false,
  };
  try {
    rule = await ensureDetectionRule();
  } catch (error) {
    rule = {
      ok: false,
      error: error instanceof Error ? error.message : "rule create failed",
    };
  }
  return {
    ok: !bulk.errors,
    skipped: false as const,
    ingested: docs.length,
    actor: ACTOR.name,
    sourceIp: SOURCE_IP,
    bulkErrors: Boolean(bulk.errors),
    rule,
    investigationId: hexId(8),
  };
}
