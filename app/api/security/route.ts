import { NextResponse } from "next/server";
import { getSecurityConfig, isSecurityConfigured } from "@/lib/config";
import {
  kibanaSecurityAlertsUrl,
  kibanaSecurityDiscoverUrl,
  kibanaSecurityRulesUrl,
} from "@/lib/deep-links";
import { ElasticError } from "@/lib/elastic";
import { ingestSecurityScenario } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST() {
  const { kibanaUrl } = getSecurityConfig();
  try {
    const result = await ingestSecurityScenario();
    return NextResponse.json({
      ...result,
      configured: isSecurityConfigured(),
      deepLinks: {
        alerts: kibanaSecurityAlertsUrl(kibanaUrl),
        discover: kibanaSecurityDiscoverUrl(kibanaUrl),
        rules: kibanaSecurityRulesUrl(kibanaUrl),
      },
    });
  } catch (error) {
    const message =
      error instanceof ElasticError
        ? `${error.message}${error.body ? `: ${error.body.slice(0, 400)}` : ""}`
        : error instanceof Error
          ? error.message
          : "Security ingest failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
