import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ensureSupabaseAuthed } from "@/lib/supabaseAdminAuth";

export const runtime = "nodejs";

type AllowedTable = "stories" | "reels" | "photo_editing" | "testimonials";
const ORDERABLE_TABLES: ReadonlyArray<AllowedTable> = [
  "stories",
  "reels",
  "photo_editing",
  "testimonials",
];

export async function POST(request: Request) {
  if (!(await ensureSupabaseAuthed(request))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as {
    table?: AllowedTable;
    order?: { id?: string; sort_order?: number }[];
    items?: { id?: string; sort_order?: number }[];
  };

  if (!body.table || !ORDERABLE_TABLES.includes(body.table)) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const table = body.table;

  const nextOrder = Array.isArray(body.items) ? body.items : body.order;

  if (!Array.isArray(nextOrder)) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const payload = nextOrder
    .filter((item) => typeof item.id === "string" && Number.isFinite(item.sort_order))
    .map((item) => ({ id: item.id as string, sort_order: item.sort_order as number }));

  if (payload.length === 0) {
    return NextResponse.json({ message: "No valid order data provided." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  // Use targeted updates here instead of partial upserts so tables with
  // required columns do not trip insert-time NOT NULL constraints.
  const results = await Promise.all(
    payload.map((item) =>
      supabase
        .from(table)
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
