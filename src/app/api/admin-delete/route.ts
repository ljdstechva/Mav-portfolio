import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ensureSupabaseAuthed } from "@/lib/supabaseAdminAuth";

export const runtime = "nodejs";

type AllowedTable = "industries" | "clients" | "reels" | "carousels" | "stories" | "photo_editing" | "testimonials" | "copywriting";
const ID_DELETE_TABLES: ReadonlyArray<Exclude<AllowedTable, "industries" | "clients">> = [
  "reels",
  "carousels",
  "stories",
  "photo_editing",
  "testimonials",
  "copywriting",
];

export async function POST(request: Request) {
  if (!(await ensureSupabaseAuthed(request))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as {
    table?: AllowedTable;
    id?: string;
    industry_id?: string;
    name?: string;
  };

  if (!body.table || !body.id) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  if (body.table === "industries") {
    const { error } = await supabase.from("industries").delete().eq("id", body.id);
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (body.table === "clients") {
    if (!body.industry_id || !body.name) {
      return NextResponse.json({ message: "Client delete requires industry_id and name." }, { status: 400 });
    }

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("industry_id", body.industry_id)
      .eq("name", body.name);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (ID_DELETE_TABLES.includes(body.table)) {
    const { error } = await supabase.from(body.table).delete().eq("id", body.id);
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ message: "Invalid table." }, { status: 400 });
}
