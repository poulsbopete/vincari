import { NextResponse } from "next/server";
import { getNotesConfig, isNotesConfigured } from "@/lib/config";
import { kibanaNotesDiscoverUrl } from "@/lib/deep-links";
import { ElasticError } from "@/lib/elastic";
import { seedSignedNotes } from "@/lib/notes";

export const dynamic = "force-dynamic";

export async function POST() {
  const { kibanaUrl } = getNotesConfig();
  if (!isNotesConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "NOTES_API_KEY is not set. Add a Search project API key to Vercel (and .env.local) named NOTES_API_KEY.",
      },
      { status: 503 },
    );
  }
  try {
    const result = await seedSignedNotes();
    return NextResponse.json({
      ...result,
      discover: kibanaNotesDiscoverUrl(kibanaUrl),
    });
  } catch (error) {
    const message =
      error instanceof ElasticError
        ? `${error.message}${error.body ? `: ${error.body.slice(0, 400)}` : ""}`
        : error instanceof Error
          ? error.message
          : "Notes seed failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
