import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await sql("select 1 as ok");
    return NextResponse.json({ status: "ok", database: true });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        database: false,
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 503 },
    );
  }
}
