export const SERVICE_NAME = "vincari-capd";
export const SERVICE_ENVIRONMENT = "demo";
export const LOGS_DATA_STREAM = "logs-vincari.capd-default";
export const FACILITY = "Pacific Surgical Institute";

export function getElasticConfig() {
  const esUrl = (
    process.env.ELASTICSEARCH_URL ||
    process.env.ES_URL ||
    ""
  ).replace(/\/$/, "");
  const apiKey =
    process.env.ELASTICSEARCH_API_KEY || process.env.ES_API_KEY || "";
  const kibanaUrl = (
    process.env.KIBANA_URL ||
    process.env.NEXT_PUBLIC_KIBANA_URL ||
    ""
  ).replace(/\/$/, "");
  return { esUrl, apiKey, kibanaUrl };
}

export function isElasticConfigured() {
  const { esUrl, apiKey } = getElasticConfig();
  return Boolean(esUrl && apiKey);
}
