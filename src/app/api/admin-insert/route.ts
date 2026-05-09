import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ensureSupabaseAuthed } from "@/lib/supabaseAdminAuth";

export const runtime = "nodejs";

type AllowedTable =
  | "industries"
  | "clients"
  | "carousels"
  | "reels"
  | "stories"
  | "copywriting"
  | "photo_editing"
  | "testimonials"
  | "ai_images"
  | "ai_videos";

const TABLE_COLUMNS: Record<AllowedTable, string[]> = {
  industries: ["name"],
  clients: ["industry_id", "name", "image_url", "sort_order"],
  carousels: ["client", "image_url", "position"],
  reels: ["video_url", "sort_order"],
  stories: ["video_url", "sort_order"],
  copywriting: ["image_url", "sort_order"],
  photo_editing: ["before_image_url", "after_image_url"],
  testimonials: ["client_name", "role", "company", "quote", "avatar_url", "sort_order"],
  ai_images: ["title", "description", "image_url", "thumbnail_url", "alt_text", "sort_order", "is_published"],
  ai_videos: ["title", "description", "video_url", "thumbnail_url", "sort_order", "is_published"],
};
const REQUIRED_COLUMNS: Partial<Record<AllowedTable, string[]>> = {
  industries: ["name"],
  testimonials: ["client_name", "quote"],
  ai_images: ["title", "image_url"],
  ai_videos: ["title", "video_url"],
};

const NUMBER_FIELDS = new Set(["position", "sort_order"]);
const BOOLEAN_FIELDS = new Set(["is_published"]);

function normalizeValue(key: string, value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    if (NUMBER_FIELDS.has(key)) {
      const parsed = Number(trimmed);
      return Number.isNaN(parsed) ? null : parsed;
    }
    if (BOOLEAN_FIELDS.has(key)) {
      if (["true", "1", "on", "yes"].includes(trimmed.toLowerCase())) return true;
      if (["false", "0", "off", "no"].includes(trimmed.toLowerCase())) return false;
      return null;
    }
    return trimmed;
  }
  if (typeof value === "boolean" && BOOLEAN_FIELDS.has(key)) {
    return value;
  }
  return value;
}

export async function POST(request: Request) {
  if (!(await ensureSupabaseAuthed(request))) {
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

  for (const column of REQUIRED_COLUMNS[table] ?? []) {
    const normalized = normalizeValue(column, values[column]);
    if (normalized === null) {
      return NextResponse.json(
        { message: `${column} is required.` },
        { status: 400 }
      );
    }
    payload[column] = normalized;
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
