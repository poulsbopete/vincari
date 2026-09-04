import { NextResponse } from "next/server";
import { emitApmBackfill, emitApmTraffic } from "@/lib/apm-traffic";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const backfillHours = Number(url.searchParams.get("backfill") ?? "0");
    if (backfillHours > 0) {
      const hours = Math.min(Math.max(backfillHours, 1), 48);
      const result = await emitApmBackfill(hours, 15);
      return NextResponse.json(result);
    }
    const result = await emitApmTraffic(1);
    return NextResponse.json({
      ok: Boolean(result.traces.ok && result.metrics.ok && result.appMetrics?.ok !== false),
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "APM emit failed" },
      { status: 502 },
    );
  }
}

export async function POST() {
  try {
    const result = await emitApmTraffic(1);
    return NextResponse.json({
      ok: Boolean(result.traces.ok && result.metrics.ok && result.appMetrics?.ok !== false),
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "APM emit failed" },
      { status: 502 },
    );
  }
}
