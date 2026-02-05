import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type AllowedTable = "stories" | "reels" | "photo_editing" | "testimonials";

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

export async function POST(request: Request) {
  if (!(await ensureAuthed(request))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as {
    table?: AllowedTable;
    order?: { id?: string; sort_order?: number }[];
    items?: { id?: string; sort_order?: number }[];
  };

  if (!body.table || !(["stories", "reels", "photo_editing", "testimonials"] as const).includes(body.table)) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

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
  const { error } = await supabase
    .from(body.table)
    .upsert(payload, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
