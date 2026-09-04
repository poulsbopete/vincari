import { randomBytes } from "node:crypto";
import { HEALTHCARE_SERVICES } from "./solutions";
import { postOtlpJson } from "./otlp";

function hexId(bytes: number) {
  return randomBytes(bytes).toString("hex");
}

const NS_PER_MS = BigInt(1_000_000);

function nowNano() {
  return BigInt(Date.now()) * NS_PER_MS;
}

type SpanSpec = {
  name: string;
  route: string;
  method: string;
  durationMs: number;
  failed?: boolean;
  child?: { name: string; peer: string; durationMs: number };
};

const WORKLOAD: Record<string, SpanSpec[]> = {
  "vincari-portal": [
    { name: "GET /portal/care-plan", route: "/portal/care-plan", method: "GET", durationMs: 85 },
    { name: "POST /portal/appointments", route: "/portal/appointments", method: "POST", durationMs: 120, child: { name: "GET fhir.Patient", peer: "vincari-fhir", durationMs: 40 } },
  ],
  "vincari-telehealth": [
    { name: "POST /telehealth/join", route: "/telehealth/join", method: "POST", durationMs: 980, child: { name: "POST teams.graph", peer: "microsoft-teams", durationMs: 420 } },
    { name: "GET /telehealth/qos", route: "/telehealth/qos", method: "GET", durationMs: 160 },
  ],
  "vincari-fhir": [
    { name: "GET /fhir/Patient", route: "/fhir/Patient", method: "GET", durationMs: 95 },
    { name: "POST /fhir/Bundle", route: "/fhir/Bundle", method: "POST", durationMs: 310 },
  ],
  "vincari-capd": [
    { name: "POST /capd/notes", route: "/capd/notes", method: "POST", durationMs: 140, child: { name: "GET fhir.Encounter", peer: "vincari-fhir", durationMs: 55 } },
    { name: "POST /gen_ai/note.draft", route: "/gen_ai/note.draft", method: "POST", durationMs: 890 },
  ],
};

function attr(key: string, value: string | number) {
  if (typeof value === "number") {
    return { key, value: { intValue: String(Math.round(value)) } };
  }
  return { key, value: { stringValue: value } };
}

function buildSpan(spec: SpanSpec, end: bigint, failed: boolean) {
  const start = end - BigInt(spec.durationMs) * NS_PER_MS;
  const traceId = hexId(16);
  const spanId = hexId(8);
  const statusCode = failed ? 500 : 200;
  const spans: Record<string, unknown>[] = [
    {
      traceId,
      spanId,
      name: spec.name,
      kind: 2,
      startTimeUnixNano: `${start}`,
      endTimeUnixNano: `${end}`,
      attributes: [
        attr("http.method", spec.method),
        attr("http.route", spec.route),
        attr("url.path", spec.route),
        attr("http.status_code", statusCode),
        attr("http.response.status_code", statusCode),
      ],
      status: { code: failed ? 2 : 1 },
    },
  ];
  if (spec.child) {
    spans.push({
      traceId,
      spanId: hexId(8),
      parentSpanId: spanId,
      name: spec.child.name,
      kind: 3,
      startTimeUnixNano: `${start + BigInt(2_000_000)}`,
      endTimeUnixNano: `${start + BigInt(spec.child.durationMs) * NS_PER_MS}`,
      attributes: [
        attr("peer.service", spec.child.peer),
        attr("span.kind", "client"),
      ],
      status: { code: 1 },
    });
  }
  return spans;
}

export function buildApmTracesPayload(copies = 2) {
  const end = nowNano();
  const resourceSpans = HEALTHCARE_SERVICES.flatMap((service, serviceIndex) => {
    const specs = WORKLOAD[service] ?? [];
    return Array.from({ length: copies }, (_, copy) => {
      const spec = specs[(copy + serviceIndex) % specs.length];
      const failed = Math.random() < 0.12 && spec.route.includes("join");
      return {
        resource: {
          attributes: [
            attr("service.name", service),
            attr("deployment.environment", "demo"),
            attr("service.environment", "demo"),
            attr("telemetry.sdk.language", "nodejs"),
          ],
        },
        scopeSpans: [
          {
            scope: { name: "surgical-capd.demo", version: "1.0.0" },
            spans: buildSpan(spec, end - BigInt(copy) * BigInt(80_000_000), failed),
          },
        ],
      };
    });
  });
  return { resourceSpans };
}

export async function emitApmTraffic(copies = 2) {
  const payload = buildApmTracesPayload(copies);
  const traces = await postOtlpJson("/v1/traces", payload);
  return {
    traces,
    services: [...HEALTHCARE_SERVICES],
    spanBatches: payload.resourceSpans.length,
  };
}
