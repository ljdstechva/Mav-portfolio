import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type AllowedTable = "testimonials";

const TABLE_COLUMNS: Record<AllowedTable, string[]> = {
  testimonials: ["client_name", "quote"],
};

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
  } catch {
    return false;
  }
}

function normalizeValue(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  return value;
}

export async function POST(request: Request) {
  if (!(await ensureAuthed(request))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as {
    table?: AllowedTable;
    id?: string;
    values?: Record<string, unknown>;
  };

  const table = body.table;
  if (!table || !TABLE_COLUMNS[table] || !body.id) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const values = body.values ?? {};
  const payload: Record<string, unknown> = {};

  for (const column of TABLE_COLUMNS[table]) {
    if (column in values) {
      const normalized = normalizeValue(values[column]);
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
    .update(payload)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
