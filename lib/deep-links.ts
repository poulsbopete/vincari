const TIME = { from: "now-24h", to: "now" };

function risonQuote(str: string) {
  if (/^[\w\-.*@]+$/.test(str)) return str;
  return `'${String(str).replace(/'/g, "!'")}'`;
}

function risonEncode(value: unknown): string {
  if (value === null || value === undefined) return "!n";
  if (value === true) return "!t";
  if (value === false) return "!f";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return risonQuote(value);
  if (Array.isArray(value)) {
    return value.length ? `!(${value.map(risonEncode).join(",")})` : "!()";
  }
  if (typeof value === "object") {
    return `(${Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}:${risonEncode(v)}`)
      .join(",")})`;
  }
  return String(value);
}

export const VINCARI_LOGS_ESQL = [
  "FROM logs-*",
  '| WHERE service.name == "vincari-capd"',
  "| SORT @timestamp DESC",
  "| KEEP @timestamp, log.level, message, event.action, labels.case_id, labels.procedure, trace.id, event.duration",
  "| LIMIT 50",
].join(" ");

export const VINCARI_ERRORS_ESQL = [
  "FROM logs-*",
  '| WHERE service.name == "vincari-capd" AND log.level IN ("error", "warn")',
  "| SORT @timestamp DESC",
  "| KEEP @timestamp, log.level, message, event.action, labels.case_id, trace.id",
  "| LIMIT 50",
].join(" ");

export const VINCARI_LATENCY_ESQL = [
  "FROM logs-*",
  '| WHERE service.name == "vincari-capd" AND event.duration IS NOT NULL',
  "| STATS events = COUNT(*), p95_ns = PERCENTILE(event.duration, 95) BY event.action",
  "| SORT events DESC",
  "| LIMIT 15",
].join(" ");

export function kibanaDiscoverUrl(
  kibanaBase: string,
  {
    query,
    timeFrom = TIME.from,
    timeTo = TIME.to,
  }: { query?: string; timeFrom?: string; timeTo?: string } = {},
) {
  const base = kibanaBase.replace(/\/$/, "");
  if (!base) return null;
  const esql = query || VINCARI_LOGS_ESQL;
  const appState = {
    dataSource: { type: "esql" },
    filters: [],
    interval: "auto",
    query: { esql },
    sort: [],
  };
  const globalState = {
    filters: [],
    refreshInterval: { pause: true, value: 60000 },
    time: { from: timeFrom, to: timeTo },
  };
  return `${base}/app/discover#/?_g=${risonEncode(globalState)}&_a=${risonEncode(appState)}`;
}

export function kibanaApmServicesUrl(kibanaBase: string, serviceName?: string) {
  const base = kibanaBase.replace(/\/$/, "");
  const params = new URLSearchParams({
    comparisonEnabled: "true",
    environment: "ENVIRONMENT_ALL",
    lagAhead: "off",
    rangeFrom: TIME.from,
    rangeTo: TIME.to,
    kuery: serviceName
      ? `service.name : "${serviceName}"`
      : 'service.name : "vincari-capd"',
  });
  return `${base}/app/apm/services?${params.toString()}`;
}

export function kibanaApmServiceUrl(
  kibanaBase: string,
  serviceName = "vincari-capd",
) {
  const base = kibanaBase.replace(/\/$/, "");
  const params = new URLSearchParams({
    comparisonEnabled: "true",
    environment: "ENVIRONMENT_ALL",
    rangeFrom: TIME.from,
    rangeTo: TIME.to,
  });
  return `${base}/app/apm/services/${encodeURIComponent(serviceName)}/overview?${params.toString()}`;
}

export function kibanaTraceUrl(kibanaBase: string, traceId: string) {
  const base = kibanaBase.replace(/\/$/, "");
  const params = new URLSearchParams({
    kuery: `trace.id : "${traceId}"`,
    rangeFrom: TIME.from,
    rangeTo: TIME.to,
  });
  return `${base}/app/apm/traces?${params.toString()}`;
}

export function kibanaStreamsUrl(kibanaBase: string) {
  return `${kibanaBase.replace(/\/$/, "")}/app/streams`;
}

export function kibanaDashboardsUrl(kibanaBase: string) {
  return `${kibanaBase.replace(/\/$/, "")}/app/dashboards#/list?_g=(time:(from:now-24h,to:now))`;
}

export function kibanaDashboardViewUrl(kibanaBase: string, dashboardId: string) {
  return `${kibanaBase.replace(/\/$/, "")}/app/dashboards#/view/${dashboardId}?_g=(time:(from:now-24h,to:now))`;
}

export function buildDeepLinks(
  kibanaUrl: string,
  extras: { traceId?: string; caseId?: string } = {},
) {
  const caseQuery = extras.caseId
    ? [
        "FROM logs-*",
        `| WHERE service.name == "vincari-capd" AND labels.case_id == "${extras.caseId}"`,
        "| SORT @timestamp DESC",
        "| LIMIT 50",
      ].join(" ")
    : VINCARI_LOGS_ESQL;

  return {
    discoverLogs: kibanaDiscoverUrl(kibanaUrl, { query: VINCARI_LOGS_ESQL }),
    discoverErrors: kibanaDiscoverUrl(kibanaUrl, { query: VINCARI_ERRORS_ESQL }),
    discoverLatency: kibanaDiscoverUrl(kibanaUrl, {
      query: VINCARI_LATENCY_ESQL,
    }),
    discoverCase: kibanaDiscoverUrl(kibanaUrl, { query: caseQuery }),
    apmServices: kibanaApmServicesUrl(kibanaUrl, "vincari-capd"),
    apmService: kibanaApmServiceUrl(kibanaUrl),
    apmTrace: extras.traceId
      ? kibanaTraceUrl(kibanaUrl, extras.traceId)
      : kibanaApmServicesUrl(kibanaUrl),
    streams: kibanaStreamsUrl(kibanaUrl),
    dashboards: kibanaDashboardsUrl(kibanaUrl),
  };
}
