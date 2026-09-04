export const SERVICE_NAME = "vincari-capd";
export const SERVICE_ENVIRONMENT = "demo";
export const LOGS_DATA_STREAM = "logs-vincari.capd-default";
export const FACILITY = "Pacific Surgical Institute";

/** Elastic Cloud Serverless Observability project used by this demo. */
export const DEFAULT_KIBANA_URL =
  "https://otel-demo-a5630c.kb.us-east-1.aws.elastic.cloud";
export const DEFAULT_ES_URL =
  "https://otel-demo-a5630c.es.us-east-1.aws.elastic.cloud";

export function getElasticConfig() {
  const esUrl = (
    process.env.ELASTICSEARCH_URL ||
    process.env.ES_URL ||
    DEFAULT_ES_URL
  ).replace(/\/$/, "");
  const apiKey =
    process.env.ELASTICSEARCH_API_KEY || process.env.ES_API_KEY || "";
  const kibanaUrl = (
    process.env.KIBANA_URL ||
    process.env.NEXT_PUBLIC_KIBANA_URL ||
    DEFAULT_KIBANA_URL
  ).replace(/\/$/, "");
  return { esUrl, apiKey, kibanaUrl };
}

export function isElasticConfigured() {
  const { esUrl, apiKey } = getElasticConfig();
  return Boolean(esUrl && apiKey);
}
