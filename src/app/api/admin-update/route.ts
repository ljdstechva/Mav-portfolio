import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type AllowedTable = "testimonials" | "industries" | "carousels" | "photo_editing" | "copywriting";

const TABLE_COLUMNS: Record<AllowedTable, string[]> = {
  testimonials: ["client_name", "quote"],
  industries: ["name"],
  carousels: ["client", "position", "image_url"],
  photo_editing: ["before_image_url", "after_image_url"],
  copywriting: ["image_url", "sort_order"],
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
    client?: string;
    positions?: { id: string; position?: number; sort_order?: number }[];
  };

  const table = body.table;
  if (!table || !TABLE_COLUMNS[table]) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  if (table === "carousels" && Array.isArray(body.positions)) {
    const updates = body.positions.filter((item) => item?.id && typeof item.position === "number");

    if (updates.length === 0) {
      return NextResponse.json({ message: "No valid positions provided." }, { status: 400 });
    }

    const results = await Promise.all(
      updates.map((item) =>
        supabase
          .from("carousels")
          .update({ position: item.position })
          .eq("id", item.id)
      )
    );

    const error = results.find((result) => result.error)?.error;
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (table === "copywriting" && Array.isArray(body.positions)) {
    const updates = body.positions.filter((item) => item?.id && typeof item.sort_order === "number");

    if (updates.length === 0) {
      return NextResponse.json({ message: "No valid positions provided." }, { status: 400 });
    }

    const results = await Promise.all(
      updates.map((item) =>
        supabase
          .from("copywriting")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id)
      )
    );

    const error = results.find((result) => result.error)?.error;
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (table === "carousels" && body.client) {
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

    const { data, error } = await supabase
      .from("carousels")
      .update(payload)
      .eq("client", body.client)
      .select("*");

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  }

  if (!body.id) {
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
