import { SURGICAL_CAPD_DASHBOARD_ID, SURGICAL_CAPD_SLO_TAG } from "./config";

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

const FLEET = `"vincari-portal", "vincari-telehealth", "vincari-fhir", "vincari-capd"`;

export const VINCARI_LOGS_ESQL = [
  "FROM logs-*",
  `| WHERE service.name IN (${FLEET})`,
  "| SORT @timestamp DESC",
  "| KEEP @timestamp, log.level, message, event.action, service.name, labels.case_id, trace.id, event.duration",
  "| LIMIT 50",
].join(" ");

export const VINCARI_ERRORS_ESQL = [
  "FROM logs-*",
  `| WHERE service.name IN (${FLEET}) AND log.level IN ("error", "warn")`,
  "| SORT @timestamp DESC",
  "| KEEP @timestamp, log.level, message, event.action, service.name, trace.id",
  "| LIMIT 50",
].join(" ");

export const VINCARI_LATENCY_ESQL = [
  "FROM logs-*",
  `| WHERE service.name IN (${FLEET}) AND event.duration IS NOT NULL`,
  "| STATS events = COUNT(*), p95_ns = PERCENTILE(event.duration, 95) BY service.name, event.action",
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
      : 'service.name : "vincari-portal" or service.name : "vincari-telehealth" or service.name : "vincari-fhir" or service.name : "vincari-capd"',
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

export function kibanaSloUrl(kibanaBase: string) {
  const base = kibanaBase.replace(/\/$/, "");
  const search = risonEncode({
    kqlQuery: SURGICAL_CAPD_SLO_TAG,
    page: 0,
    perPage: 25,
    sort: { by: "status", direction: "desc" },
    view: "cardView",
    groupBy: "ungrouped",
    filters: [],
  });
  return `${base}/app/observability/slos?search=${search}`;
}

export function kibanaDashboardsUrl(kibanaBase: string) {
  return `${kibanaBase.replace(/\/$/, "")}/app/dashboards#/list?_g=(time:(from:now-24h,to:now))`;
}

export function kibanaDashboardViewUrl(kibanaBase: string, dashboardId: string) {
  return `${kibanaBase.replace(/\/$/, "")}/app/dashboards#/view/${dashboardId}?_g=(time:(from:now-24h,to:now))`;
}

export function buildDeepLinks(
  kibanaUrl: string,
  extras: { traceId?: string; caseId?: string; serviceName?: string; dashboardId?: string } = {},
) {
  const service = extras.serviceName ?? "vincari-capd";
  const caseQuery = extras.caseId
    ? [
        "FROM logs-*",
        `| WHERE labels.case_id == "${extras.caseId}"`,
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
    apmServices: kibanaApmServicesUrl(kibanaUrl),
    apmService: kibanaApmServiceUrl(kibanaUrl, service),
    apmTrace: extras.traceId
      ? kibanaTraceUrl(kibanaUrl, extras.traceId)
      : kibanaApmServicesUrl(kibanaUrl),
    streams: kibanaStreamsUrl(kibanaUrl),
    dashboards: kibanaDashboardsUrl(kibanaUrl),
    slos: kibanaSloUrl(kibanaUrl),
    vegaDashboard: kibanaDashboardViewUrl(
      kibanaUrl,
      extras.dashboardId || SURGICAL_CAPD_DASHBOARD_ID,
    ),
  };
}
