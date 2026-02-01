import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type AllowedTable =
  | "industries"
  | "graphic_designs"
  | "carousels"
  | "carousel_images"
  | "reels"
  | "copywriting"
  | "photo_editing"
  | "testimonials";

const TABLE_COLUMNS: Record<AllowedTable, string[]> = {
  industries: ["name"],
  graphic_designs: ["industry_id", "title", "client", "category", "image_url"],
  carousels: ["industry_id", "client", "title", "description"],
  carousel_images: ["carousel_id", "image_url", "position"],
  reels: ["industry_id", "client", "title", "video_url"],
  copywriting: ["industry_id", "client", "title", "body"],
  photo_editing: ["industry_id", "client", "title", "before_image_url", "after_image_url"],
  testimonials: ["client_name", "role", "company", "quote", "avatar_url"],
};

const ARRAY_FIELDS = new Set([] as string[]);
const NUMBER_FIELDS = new Set(["position"]);
const JSON_FIELDS = new Set([] as string[]);

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
