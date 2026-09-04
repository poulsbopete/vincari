import { NextResponse } from "next/server";
import { SERVICE_NAME, getElasticConfig, isElasticConfigured } from "@/lib/config";
import { buildDeepLinks } from "@/lib/deep-links";
import { pingElastic } from "@/lib/elastic";

export async function GET() {
  const { kibanaUrl } = getElasticConfig();
  const ping = await pingElastic();
  return NextResponse.json({
    configured: isElasticConfigured(),
    service: SERVICE_NAME,
    ...ping,
    deepLinks: kibanaUrl ? buildDeepLinks(kibanaUrl) : null,
  });
}
