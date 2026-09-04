import { NextResponse } from "next/server";
import { emitApmTraffic } from "@/lib/apm-traffic";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await emitApmTraffic(3);
    return NextResponse.json({
      ok: result.traces.ok,
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
  return GET();
}
