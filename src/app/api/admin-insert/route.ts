import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type AllowedTable =
  | "industries"
  | "clients"
  | "projects"
  | "portfolio_assets"
  | "testimonials"
  | "credentials"
  | "profiles";

const TABLE_COLUMNS: Record<AllowedTable, string[]> = {
  industries: ["name", "slug", "display_order"],
  clients: [
    "industry_id",
    "name",
    "slug",
    "description",
    "thumbnail_url",
    "website_url",
  ],
  projects: [
    "title",
    "description",
    "image_url",
    "link",
    "category",
    "time_saved",
    "cost_saved",
    "tags",
    "video_url",
    "preview_image",
    "detailed_description",
  ],
  portfolio_assets: [
    "client_id",
    "asset_url",
    "caption",
    "format",
    "display_order",
  ],
  testimonials: ["client_id", "client_name", "quote", "rating"],
  credentials: [
    "title",
    "issuer",
    "date_issued",
    "image_url",
    "link",
    "credential_id",
    "categories",
    "skills",
    "external_url",
    "provider",
  ],
  profiles: ["username", "full_name", "bio", "avatar_url", "social_links"],
};

const ARRAY_FIELDS = new Set(["tags", "detailed_description", "categories", "skills"]);
const NUMBER_FIELDS = new Set(["display_order", "rating"]);
const JSON_FIELDS = new Set(["social_links"]);

async function ensureAuthed(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : "";

  if (!token) {
    return false;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

function normalizeValue(key: string, value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    if (ARRAY_FIELDS.has(key)) {
      return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
    }
    if (NUMBER_FIELDS.has(key)) {
      const parsed = Number(trimmed);
      return Number.isNaN(parsed) ? null : parsed;
    }
    if (JSON_FIELDS.has(key)) {
      try {
        return JSON.parse(trimmed);
      } catch (error) {
        return null;
      }
    }
    return trimmed;
  }
  return value;
}

export async function POST(request: Request) {
  if (!(await ensureAuthed(request))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as {
    table?: AllowedTable;
    values?: Record<string, unknown>;
  };

  const table = body.table;
  if (!table || !TABLE_COLUMNS[table]) {
    return NextResponse.json({ message: "Invalid table." }, { status: 400 });
  }

  const allowedColumns = TABLE_COLUMNS[table];
  const values = body.values ?? {};
  const payload: Record<string, unknown> = {};

  for (const column of allowedColumns) {
    if (column in values) {
      const normalized = normalizeValue(column, values[column]);
      if (normalized !== null) {
        payload[column] = normalized;
      }
    }
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(
      { message: "No valid data provided." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
