import { randomBytes } from "node:crypto";
import { bulkIndex, esSearch } from "./elastic";
import { HEALTHCARE_SERVICES } from "./solutions";
import { postOtlpJson } from "./otlp";

function hexId(bytes: number) {
  return randomBytes(bytes).toString("hex");
}

const NS_PER_MS = BigInt(1_000_000);
const NS_PER_MIN = BigInt(60) * BigInt(1_000_000_000);

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
    {
      name: "POST /portal/appointments",
      route: "/portal/appointments",
      method: "POST",
      durationMs: 120,
      child: { name: "GET fhir.Patient", peer: "vincari-fhir", durationMs: 40 },
    },
  ],
  "vincari-telehealth": [
    {
      name: "POST /telehealth/join",
      route: "/telehealth/join",
      method: "POST",
      durationMs: 980,
      child: { name: "POST teams.graph", peer: "microsoft-teams", durationMs: 420 },
    },
    { name: "GET /telehealth/qos", route: "/telehealth/qos", method: "GET", durationMs: 160 },
  ],
  "vincari-fhir": [
    { name: "GET /fhir/Patient", route: "/fhir/Patient", method: "GET", durationMs: 95 },
    { name: "POST /fhir/Bundle", route: "/fhir/Bundle", method: "POST", durationMs: 310 },
  ],
  "vincari-capd": [
    {
      name: "POST /capd/notes",
      route: "/capd/notes",
      method: "POST",
      durationMs: 140,
      child: { name: "GET fhir.Encounter", peer: "vincari-fhir", durationMs: 55 },
    },
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
  const httpAttrs = [
    attr("http.request.method", spec.method),
    attr("http.method", spec.method),
    attr("http.route", spec.route),
    attr("url.path", spec.route),
    attr("http.target", spec.route),
    attr("url.scheme", "https"),
    attr("server.address", "vincari.vercel.app"),
    attr("http.status_code", statusCode),
    attr("http.response.status_code", statusCode),
  ];
  const spans: Record<string, unknown>[] = [
    {
      traceId,
      spanId,
      name: spec.name,
      kind: 2,
      startTimeUnixNano: `${start}`,
      endTimeUnixNano: `${end}`,
      attributes: httpAttrs,
      status: { code: failed ? 2 : 1 },
    },
  ];
  if (spec.child) {
    const childStart = start + BigInt(2_000_000);
    const childEnd = childStart + BigInt(spec.child.durationMs) * NS_PER_MS;
    spans.push({
      traceId,
      spanId: hexId(8),
      parentSpanId: spanId,
      name: spec.child.name,
      kind: 3,
      startTimeUnixNano: `${childStart}`,
      endTimeUnixNano: `${childEnd > end ? `${end}` : `${childEnd}`}`,
      attributes: [
        attr("peer.service", spec.child.peer),
        attr("server.address", spec.child.peer),
        attr("span.kind", "client"),
        attr("http.request.method", "GET"),
        attr("http.method", "GET"),
      ],
      status: { code: 1 },
    });
  }
  return spans;
}

function resourceFor(service: string) {
  return {
    attributes: [
      attr("service.name", service),
      attr("service.version", "1.0.0"),
      attr("deployment.environment", "demo"),
      attr("service.environment", "demo"),
      attr("telemetry.sdk.name", "opentelemetry"),
      attr("telemetry.sdk.language", "nodejs"),
      attr("telemetry.sdk.version", "1.28.0"),
    ],
  };
}

export function buildApmTracesPayload(copies = 1, endTimes?: bigint[]) {
  const ends = endTimes?.length ? endTimes : [nowNano()];
  const resourceSpans: Record<string, unknown>[] = [];
  for (const end of ends) {
    for (let copy = 0; copy < copies; copy++) {
      const tick = end - BigInt(copy) * BigInt(12_000_000_000);
      for (const service of HEALTHCARE_SERVICES) {
        for (const spec of WORKLOAD[service] ?? []) {
          const failed = Math.random() < 0.1 && spec.route.includes("join");
          resourceSpans.push({
            resource: resourceFor(service),
            scopeSpans: [
              {
                scope: { name: "surgical-capd.demo", version: "1.0.0" },
                spans: buildSpan(spec, tick, failed),
              },
            ],
          });
        }
      }
    }
  }
  return { resourceSpans };
}

export async function emitApmTraffic(copies = 1) {
  const payload = buildApmTracesPayload(copies);
  const traces = await postOtlpJson("/v1/traces", payload);
  return {
    traces,
    services: [...HEALTHCARE_SERVICES],
    spanBatches: payload.resourceSpans.length,
  };
}

/** Spread server transactions across a lookback window so APM Overview charts have a series. */
export async function emitApmBackfill(hours = 24, everyMinutes = 15) {
  const now = nowNano();
  const step = BigInt(everyMinutes) * NS_PER_MIN;
  const ticks = Math.floor((hours * 60) / everyMinutes);
  const times = Array.from({ length: ticks + 1 }, (_, i) => now - BigInt(ticks - i) * step);
  const chunkSize = 8;
  const batches: { ok: boolean; status: number; spanBatches: number }[] = [];
  for (let i = 0; i < times.length; i += chunkSize) {
    const payload = buildApmTracesPayload(1, times.slice(i, i + chunkSize));
    const traces = await postOtlpJson("/v1/traces", payload);
    batches.push({
      ok: traces.ok,
      status: traces.status,
      spanBatches: payload.resourceSpans.length,
    });
    if (!traces.ok) {
      return { ok: false, hours, everyMinutes, batches, error: traces.body };
    }
  }
  const metrics = await backfillApmRollupMetrics(hours, everyMinutes);
  return {
    ok: batches.every((b) => b.ok) && metrics.ok,
    hours,
    everyMinutes,
    ticks: times.length,
    batches,
    metrics,
  };
}

/**
 * APM Overview charts read 1-minute rollup metrics, which are timestamped at
 * ingest time. Clone recent rollups across the lookback window so latency /
 * throughput / failed-rate charts fill in immediately.
 */
async function backfillApmRollupMetrics(hours: number, everyMinutes: number) {
  const datasets = [
    "service_transaction.1m.otel",
    "transaction.1m.otel",
    "service_summary.1m.otel",
  ] as const;
  const templates: Record<string, Record<string, unknown>[]> = {};
  for (const service of HEALTHCARE_SERVICES) {
    for (const dataset of datasets) {
      const res = await esSearch("metrics-*", {
        size: 1,
        sort: [{ "@timestamp": "desc" }],
        query: {
          bool: {
            must: [
              { term: { "resource.attributes.service.name": service } },
              { term: { "data_stream.dataset": dataset } },
            ],
          },
        },
      });
      templates[`${service}:${dataset}`] = (res.hits?.hits ?? []).map(
        (hit: { _source: Record<string, unknown> }) => hit._source,
      );
    }
  }

  const now = Date.now();
  const stepMs = everyMinutes * 60_000;
  const ticks = Math.floor((hours * 60) / everyMinutes);
  const timestamps: string[] = [];
  for (let i = ticks; i >= 2; i--) {
    timestamps.push(new Date(now - i * stepMs).toISOString());
  }

  const indexed: Record<string, number> = {};
  for (const dataset of datasets) {
    const docs: Record<string, unknown>[] = [];
    for (const ts of timestamps) {
      for (const service of HEALTHCARE_SERVICES) {
        const src = templates[`${service}:${dataset}`]?.[0];
        if (!src) continue;
        docs.push({ ...src, "@timestamp": ts });
      }
    }
    const result = await bulkIndex(`metrics-${dataset}-default`, docs);
    indexed[dataset] = docs.length;
    if (result.errors) {
      return { ok: false, indexed, error: "bulk errors writing APM rollup metrics" };
    }
  }
  return { ok: true, indexed, points: timestamps.length };
}
