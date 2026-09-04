export const SERVICE_NAME = "vincari-capd";
export const SERVICE_ENVIRONMENT = "demo";
export const LOGS_DATA_STREAM = "logs-vincari.healthcare-default";
export const FACILITY = "Pacific Surgical Institute";

/** Elastic Cloud Serverless Observability project used by this demo. */
export const DEFAULT_KIBANA_URL =
  "https://otel-demo-a5630c.kb.us-east-1.aws.elastic.cloud";
export const DEFAULT_ES_URL =
  "https://otel-demo-a5630c.es.us-east-1.aws.elastic.cloud";
export const SURGICAL_CAPD_DASHBOARD_ID =
  "36a7f722-bd87-4802-8a5d-b18d59c0275d";
export const SURGICAL_CAPD_SLO_TAG = "surgical-capd";

/** Elasticsearch Serverless Search / AI Assistants project for signed notes. */
export const DEFAULT_NOTES_KIBANA_URL =
  "https://ai-assistants-ffcafb.kb.us-east-1.aws.elastic.cloud";
export const DEFAULT_NOTES_ES_URL =
  "https://ai-assistants-ffcafb.es.us-east-1.aws.elastic.cloud";
export const NOTES_INDEX = "surgical-capd-notes";

/** Elastic Security Serverless project for SIEM / unusual access. */
export const DEFAULT_SECURITY_KIBANA_URL =
  "https://my-security-project-ac9463.kb.us-central1.gcp.elastic.cloud";
export const DEFAULT_SECURITY_ES_URL =
  "https://my-security-project-ac9463.es.us-central1.gcp.elastic.cloud";
export const SECURITY_LOGS_STREAM = "logs-vincari.security-default";
export const SECURITY_RULE_ID = "surgical-capd-billing-ehr-read";

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

export function getNotesConfig() {
  const esUrl = (
    process.env.NOTES_ELASTICSEARCH_URL ||
    process.env.NOTES_ES_URL ||
    DEFAULT_NOTES_ES_URL
  ).replace(/\/$/, "");
  const apiKey = process.env.NOTES_ELASTICSEARCH_API_KEY || process.env.NOTES_API_KEY || "";
  const kibanaUrl = (
    process.env.NOTES_KIBANA_URL ||
    process.env.NEXT_PUBLIC_NOTES_KIBANA_URL ||
    DEFAULT_NOTES_KIBANA_URL
  ).replace(/\/$/, "");
  return { esUrl, apiKey, kibanaUrl };
}

export function isNotesConfigured() {
  const { esUrl, apiKey } = getNotesConfig();
  return Boolean(esUrl && apiKey);
}

export function getSecurityConfig() {
  const esUrl = (
    process.env.SECURITY_ELASTICSEARCH_URL ||
    process.env.SECURITY_ES_URL ||
    DEFAULT_SECURITY_ES_URL
  ).replace(/\/$/, "");
  const apiKey =
    process.env.SECURITY_ELASTICSEARCH_API_KEY ||
    process.env.SECURITY_API_KEY ||
    process.env.SECURITY_KIBANA_API_KEY ||
    "";
  const kibanaUrl = (
    process.env.SECURITY_KIBANA_URL ||
    process.env.NEXT_PUBLIC_SECURITY_KIBANA_URL ||
    DEFAULT_SECURITY_KIBANA_URL
  ).replace(/\/$/, "");
  return { esUrl, apiKey, kibanaUrl };
}

export function isSecurityConfigured() {
  const { esUrl, apiKey } = getSecurityConfig();
  return Boolean(esUrl && apiKey);
}

export function isElasticConfigured() {
  const { esUrl, apiKey } = getElasticConfig();
  return Boolean(esUrl && apiKey);
}
