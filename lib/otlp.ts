import { getElasticConfig } from "./config";

export function ingestBaseFromEs(esUrl: string) {
  const override = (
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    process.env.ELASTIC_OTLP_ENDPOINT ||
    ""
  ).replace(/\/$/, "");
  if (override) return override;
  const base = esUrl.replace(/\/$/, "");
  if (!base) return "";
  if (base.includes(".ingest.")) return base;
  if (base.includes(".es.")) return base.replace(".es.", ".ingest.");
  return base;
}

export async function postOtlpJson(path: "/v1/traces" | "/v1/metrics", payload: unknown) {
  const { esUrl, apiKey } = getElasticConfig();
  const ingest = ingestBaseFromEs(esUrl);
  if (!ingest || !apiKey) {
    return { ok: false, status: 0, body: "OTLP endpoint or API key missing", ingest };
  }
  const res = await fetch(`${ingest}${path}`, {
    method: "POST",
    headers: {
      Authorization: `ApiKey ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = await res.text();
  return {
    ok: res.ok,
    status: res.status,
    body: body.slice(0, 500),
    ingest: ingest.replace(/^https?:\/\//, ""),
  };
}
