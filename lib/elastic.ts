import { getElasticConfig } from "./config";

export class ElasticError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: string,
  ) {
    super(message);
  }
}

async function esFetch(path: string, init: RequestInit = {}) {
  const { esUrl, apiKey } = getElasticConfig();
  if (!esUrl || !apiKey) {
    throw new ElasticError("Elasticsearch is not configured");
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
    throw new ElasticError(
      `Elasticsearch ${res.status} on ${path}`,
      res.status,
      text.slice(0, 2000),
    );
  }
  return text ? JSON.parse(text) : {};
}

export async function esql<T = unknown>(query: string): Promise<{
  columns: { name: string; type: string }[];
  values: T[][];
}> {
  return esFetch("/_query", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

export async function bulkIndex(
  dataStream: string,
  docs: Record<string, unknown>[],
) {
  if (docs.length === 0) return { errors: false, items: [] };
  const ndjson = docs
    .map((doc) => `${JSON.stringify({ create: {} })}\n${JSON.stringify(doc)}`)
    .join("\n")
    .concat("\n");
  return esFetch(`/${encodeURIComponent(dataStream)}/_bulk?refresh=wait_for`, {
    method: "POST",
    headers: { "Content-Type": "application/x-ndjson" },
    body: ndjson,
  });
}

export async function pingElastic() {
  const { esUrl, kibanaUrl } = getElasticConfig();
  try {
    const info = await esFetch("/");
    return {
      ok: true as const,
      cluster: info.cluster_name as string | undefined,
      version: info.version?.number as string | undefined,
      esHost: esUrl.replace(/^https?:\/\//, "").split("/")[0],
      kibanaHost: kibanaUrl.replace(/^https?:\/\//, "").split("/")[0],
    };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
      esHost: esUrl.replace(/^https?:\/\//, "").split("/")[0] || null,
      kibanaHost: kibanaUrl.replace(/^https?:\/\//, "").split("/")[0] || null,
    };
  }
}
