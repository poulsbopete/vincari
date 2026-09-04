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

function specFromAction(service: string, action: string, durationMs: number): SpanSpec {
  const catalog: Record<string, Omit<SpanSpec, "durationMs">> = {
    "appointment.book": {
      name: "POST /portal/appointments",
      route: "/portal/appointments",
      method: "POST",
      child: { name: "GET fhir.Patient", peer: "vincari-fhir", durationMs: 40 },
    },
    "careplan.render": { name: "GET /portal/care-plan", route: "/portal/care-plan", method: "GET" },
    "records.fetch": { name: "GET /portal/records", route: "/portal/records", method: "GET" },
    "portal.login": { name: "GET /portal/login", route: "/portal/login", method: "GET" },
    "telehealth.join": {
      name: "POST /telehealth/join",
      route: "/telehealth/join",
      method: "POST",
      child: { name: "POST teams.graph", peer: "microsoft-teams", durationMs: 420 },
    },
    "teams.graph": { name: "POST /telehealth/graph", route: "/telehealth/graph", method: "POST" },
    "session.qos": { name: "GET /telehealth/qos", route: "/telehealth/qos", method: "GET" },
    "visit.end": { name: "POST /telehealth/end", route: "/telehealth/end", method: "POST" },
    "fhir.patient.read": { name: "GET /fhir/Patient", route: "/fhir/Patient", method: "GET" },
    "fhir.encounter.search": { name: "GET /fhir/Encounter", route: "/fhir/Encounter", method: "GET" },
    "fhir.bundle.assemble": { name: "POST /fhir/Bundle", route: "/fhir/Bundle", method: "POST" },
    "ahds.export": { name: "POST /fhir/export", route: "/fhir/export", method: "POST" },
    "case.opened": { name: "GET /capd/cases", route: "/capd/cases", method: "GET" },
    "capd.suggest": { name: "POST /capd/suggest", route: "/capd/suggest", method: "POST" },
    "ehr.pull": { name: "GET /capd/ehr", route: "/capd/ehr", method: "GET" },
    "note.save": {
      name: "POST /capd/notes",
      route: "/capd/notes",
      method: "POST",
      child: { name: "GET fhir.Encounter", peer: "vincari-fhir", durationMs: 55 },
    },
    "note.signed": {
      name: "POST /capd/notes",
      route: "/capd/notes",
      method: "POST",
      child: { name: "GET fhir.Encounter", peer: "vincari-fhir", durationMs: 55 },
    },
    "coding.score": { name: "POST /capd/coding", route: "/capd/coding", method: "POST" },
    "gen_ai.note.draft": { name: "POST /gen_ai/note.draft", route: "/gen_ai/note.draft", method: "POST" },
    "fabric.pipeline": { name: "POST /capd/fabric", route: "/capd/fabric", method: "POST" },
  };
  const mapped = catalog[action];
  if (mapped) return { ...mapped, durationMs };
  const method = action.includes("read") || action.includes("render") ? "GET" : "POST";
  const route = `/${service.replace("vincari-", "")}/${action.replace(/\./g, "/")}`;
  return { name: `${method} ${route}`, route, method, durationMs };
}

function buildSpan(
  spec: SpanSpec,
  end: bigint,
  failed: boolean,
  traceId = hexId(16),
) {
  const start = end - BigInt(spec.durationMs) * NS_PER_MS;
  const spanId = hexId(8);
  const statusCode = failed ? 500 : 200;
  const httpAttrs = [
    attr("http.request.method", spec.method),
    attr("http.method", spec.method),
    attr("http.route", spec.route),
    attr("url.path", spec.route),
    attr("http.target", spec.route),
    attr("url.scheme", "https"),
      attr("server.address", "healthcare-capd.vercel.app"),
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
  return { spans, spanId, traceId };
}

function resourceFor(service: string) {
  return {
    attributes: [
      attr("service.name", service),
      attr("service.version", "1.0.0"),
      attr("service.instance.id", `${service}-demo`),
      attr("deployment.environment", "demo"),
      attr("service.environment", "demo"),
      attr("telemetry.sdk.name", "opentelemetry"),
      attr("telemetry.sdk.language", "nodejs"),
      attr("telemetry.sdk.version", "1.28.0"),
      attr("host.name", "healthcare-capd"),
      attr("process.pid", 1),
    ],
  };
}

function gauge(name: string, value: number, timeUnixNano: bigint, unit = "1") {
  const isInt = Number.isInteger(value);
  return {
    name,
    unit,
    gauge: {
      dataPoints: [
        {
          timeUnixNano: `${timeUnixNano}`,
          ...(isInt ? { asInt: String(Math.round(value)) } : { asDouble: value }),
        },
      ],
    },
  };
}

function buildRuntimeMetricsPayload(endTimes?: bigint[]) {
  const mem = process.memoryUsage();
  const times = endTimes?.length ? endTimes : [nowNano()];
  return {
    resourceMetrics: HEALTHCARE_SERVICES.map((service) => ({
      resource: resourceFor(service),
      scopeMetrics: [
        {
          scope: { name: "surgical-capd.demo", version: "1.0.0" },
          metrics: times.flatMap((t, i) => {
            const heapUsed = mem.heapUsed * (0.92 + ((i + service.length) % 7) * 0.02);
            const heapTotal = Math.max(mem.heapTotal, heapUsed * 1.4);
            const rss = mem.rss * (0.95 + ((i % 5) * 0.01));
            const cpu = 0.04 + ((i + service.length) % 9) * 0.012;
            const loop = 1.2 + ((i + service.length) % 6) * 0.4;
            return [
              gauge("nodejs.memory.heap.used.bytes", heapUsed, t, "By"),
              gauge("nodejs.memory.heap.allocated.bytes", heapTotal, t, "By"),
              gauge("nodejs.memory.external.bytes", mem.external, t, "By"),
              gauge("system.process.memory.rss.bytes", rss, t, "By"),
              gauge("system.process.cpu.total.norm.pct", cpu, t, "1"),
              gauge("system.cpu.total.norm.pct", Math.min(0.35, cpu * 1.4), t, "1"),
              gauge("system.memory.total", 2_147_483_648, t, "By"),
              gauge("system.memory.actual.free", 900_000_000 + (i % 4) * 20_000_000, t, "By"),
              gauge("nodejs.eventloop.delay.avg.ms", loop, t, "ms"),
              gauge("nodejs.handles.active", 18 + (i % 8), t, "1"),
              gauge("nodejs.requests.active", 2 + (i % 5), t, "1"),
              gauge("process.runtime.nodejs.memory.heap.used", heapUsed, t, "By"),
              gauge("process.cpu.utilization", cpu, t, "1"),
            ];
          }),
        },
      ],
    })),
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
                spans: buildSpan(spec, tick, failed).spans,
              },
            ],
          });
        }
      }
    }
  }
  return { resourceSpans };
}

export type TraceFromLog = {
  serviceName: string;
  action: string;
  durationMs: number;
  traceId: string;
  timestamp: string;
  failed?: boolean;
};

export async function emitTracesForLogEvents(events: TraceFromLog[]) {
  if (events.length === 0) {
    return {
      ok: true,
      status: 204,
      body: "",
      ingest: "",
      spanBatches: 0,
      sampleSpanId: "",
      sampleTransactionName: "",
    };
  }
  const built = events.map((event) => {
    const durationMs = Math.max(12, Math.round(event.durationMs));
    const spec = specFromAction(event.serviceName, event.action, durationMs);
    const end = BigInt(new Date(event.timestamp).getTime()) * NS_PER_MS || nowNano();
    const span = buildSpan(spec, end, Boolean(event.failed), event.traceId);
    return {
      spec,
      spanId: span.spanId,
      resourceSpans: {
        resource: resourceFor(event.serviceName),
        scopeSpans: [
          {
            scope: { name: "surgical-capd.demo", version: "1.0.0" },
            spans: span.spans,
          },
        ],
      },
    };
  });
  const sent = await postOtlpJson("/v1/traces", {
    resourceSpans: built.map((item) => item.resourceSpans),
  });
  return {
    ...sent,
    spanBatches: built.length,
    sampleSpanId: built[0]?.spanId ?? "",
    sampleTransactionName: built[0]?.spec.name ?? "",
  };
}

export async function emitApmRuntimeMetrics(hours = 12, everyMinutes = 2) {
  const now = nowNano();
  const step = BigInt(everyMinutes) * NS_PER_MIN;
  const ticks = Math.floor((hours * 60) / everyMinutes);
  const times = Array.from({ length: ticks + 1 }, (_, i) => now - BigInt(ticks - i) * step);
  const runtime: { ok: boolean; status: number }[] = [];
  for (let i = 0; i < times.length; i += 20) {
    const sent = await postOtlpJson("/v1/metrics", buildRuntimeMetricsPayload(times.slice(i, i + 20)));
    runtime.push({ ok: sent.ok, status: sent.status, body: sent.body } as { ok: boolean; status: number });
    if (!sent.ok) return { ok: false, runtime, error: sent.body };
  }
  return { ok: runtime.every((r) => r.ok), points: times.length, runtime };
}

function buildAppMetricDoc(service: string, timestamp: string, tick = 0) {
  const mem = process.memoryUsage();
  const heapUsed = Math.round(mem.heapUsed * (0.9 + (tick % 8) * 0.02));
  const heapTotal = Math.max(mem.heapTotal, Math.round(heapUsed * 1.35));
  const rss = Math.round(mem.rss * (0.94 + (tick % 5) * 0.012));
  const cpu = 0.05 + (tick % 9) * 0.011;
  return {
    "@timestamp": timestamp,
    processor: { event: "metric", name: "metric" },
    metricset: { name: "app" },
    service: {
      name: service,
      environment: "demo",
      node: { name: "healthcare-capd" },
      language: { name: "javascript" },
      runtime: { name: "nodejs", version: process.version.replace(/^v/, "") },
    },
    agent: { name: "otlp", version: "1.28.0" },
    host: { name: "healthcare-capd", os: { platform: "linux" } },
    process: { pid: 1, title: "node" },
    "system.cpu.total.norm.pct": Math.min(0.4, cpu * 1.35),
    "system.process.cpu.total.norm.pct": cpu,
    "system.memory.total": 2_147_483_648,
    "system.memory.actual.free": 880_000_000 + (tick % 6) * 15_000_000,
    "system.process.memory.rss.bytes": rss,
    "nodejs.memory.heap.used.bytes": heapUsed,
    "nodejs.memory.heap.allocated.bytes": heapTotal,
    "nodejs.memory.external.bytes": mem.external,
    "nodejs.eventloop.delay.avg.ms": 1.1 + (tick % 7) * 0.35,
    "nodejs.handles.active": 16 + (tick % 9),
    "nodejs.requests.active": 1 + (tick % 4),
  };
}

export async function emitApmAppMetrics(hours = 0, everyMinutes = 2) {
  const now = Date.now();
  const timestamps: string[] = [];
  if (hours <= 0) {
    timestamps.push(new Date(now).toISOString());
  } else {
    const step = everyMinutes * 60_000;
    const ticks = Math.floor((hours * 60) / everyMinutes);
    for (let i = ticks; i >= 0; i--) {
      timestamps.push(new Date(now - i * step).toISOString());
    }
  }
  const indexed: Record<string, number> = {};
  for (const service of HEALTHCARE_SERVICES) {
    const docs = timestamps.map((ts, tick) => buildAppMetricDoc(service, ts, tick));
    const result = await bulkIndex(`metrics-apm.app.${service}-default`, docs);
    indexed[service] = docs.length;
    if (result.errors) {
      return { ok: false, indexed, error: `bulk errors for ${service}` };
    }
  }
  return { ok: true, indexed, points: timestamps.length };
}

export async function emitApmTraffic(copies = 1) {
  const payload = buildApmTracesPayload(copies);
  const [traces, metrics, appMetrics] = await Promise.all([
    postOtlpJson("/v1/traces", payload),
    postOtlpJson("/v1/metrics", buildRuntimeMetricsPayload()),
    emitApmAppMetrics(0),
  ]);
  return {
    traces,
    metrics,
    appMetrics,
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
  const metricTimes: bigint[] = [];
  const metricStep = BigInt(2) * NS_PER_MIN;
  const metricTicks = Math.floor((hours * 60) / 2);
  for (let i = metricTicks; i >= 0; i--) {
    metricTimes.push(now - BigInt(i) * metricStep);
  }
  const runtime: { ok: boolean; status: number }[] = [];
  for (let i = 0; i < metricTimes.length; i += 30) {
    const chunk = metricTimes.slice(i, i + 30);
    const sent = await postOtlpJson("/v1/metrics", buildRuntimeMetricsPayload(chunk));
    runtime.push({ ok: sent.ok, status: sent.status });
    if (!sent.ok) break;
  }
  const appMetrics = await emitApmAppMetrics(hours, 2);
  const metrics = await backfillApmRollupMetrics(hours, everyMinutes);
  return {
    ok:
      batches.every((b) => b.ok) &&
      metrics.ok &&
      runtime.every((r) => r.ok) &&
      appMetrics.ok,
    hours,
    everyMinutes,
    ticks: times.length,
    batches,
    metrics,
    runtime,
    appMetrics,
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
