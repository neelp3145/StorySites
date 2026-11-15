import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
let pool: pg.Pool | undefined;
let local: Promise<PGlite> | undefined;

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== "") {
    pool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    return (await pool.query(text, params)).rows as T[];
  }
  local ??= startLocal().catch((error: unknown) => {
    local = undefined;
    throw error;
  });
  return (await (await local).query<T>(text, params)).rows;
}

async function startLocal(): Promise<PGlite> {
  const db = new PGlite();
  const files = (await readdir("migrations").catch(() => [])).filter((f) =>
    f.endsWith(".sql"),
  ).sort();
  for (const file of files) {
    const body = await readFile(`migrations/${file}`, "utf8");
    // PGlite may not support CREATE TYPE; use text status fallback statements.
    const adapted = body
      .replace(/create type inquiry_status as enum \([^)]+\);\s*/i, "")
      .replace(/inquiry_status/g, "text");
    await db.exec(adapted);
  }
  return db;
}

export type InquiryStatus = "new" | "contacted" | "closed";

export type Inquiry = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  request_type: string;
  service_type: string;
  hosting_preference: string | null;
  project_details: string;
  contact_consent: boolean;
  terms_acknowledged: boolean;
  terms_version: string | null;
  quote_displayed: string | null;
  status: InquiryStatus;
  notes: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};
