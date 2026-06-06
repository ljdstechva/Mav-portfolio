import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ensureSupabaseAuthed } from "@/lib/supabaseAdminAuth";

export const runtime = "nodejs";

type AllowedTable =
  | "industries"
  | "clients"
  | "reels"
  | "carousels"
  | "stories"
  | "photo_editing"
  | "testimonials"
  | "copywriting"
  | "ai_images"
  | "ai_videos";
const ID_DELETE_TABLES: ReadonlyArray<Exclude<AllowedTable, "industries" | "clients">> = [
  "reels",
  "carousels",
  "stories",
  "photo_editing",
  "testimonials",
  "copywriting",
  "ai_images",
  "ai_videos",
];

const STORAGE_BUCKET = "portfolio";

function extractPortfolioStoragePath(publicUrl: string | null | undefined, table: "ai_images" | "ai_videos" | "reels") {
  if (!publicUrl) return null;

  try {
    const url = new URL(publicUrl);
    const prefix = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const pathIndex = url.pathname.indexOf(prefix);
    if (pathIndex === -1) return null;

    const path = decodeURIComponent(url.pathname.slice(pathIndex + prefix.length));
    if (!path.startsWith(`${table}/`)) return null;
    return path;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!(await ensureSupabaseAuthed(request))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let body: {
    table?: AllowedTable;
    id?: string;
    industry_id?: string;
    name?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

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

  if (body.table === "ai_images" || body.table === "ai_videos" || body.table === "reels") {
    const mediaColumns = body.table === "ai_images"
      ? "image_url, thumbnail_url"
      : body.table === "ai_videos"
        ? "video_url, thumbnail_url"
        : "video_url";
    const existing = await supabase
      .from(body.table)
      .select(mediaColumns)
      .eq("id", body.id)
      .maybeSingle();

    if (existing.error) {
      return NextResponse.json({ message: existing.error.message }, { status: 500 });
    }

    const { error } = await supabase.from(body.table).delete().eq("id", body.id);
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const row = existing.data as
      | { image_url?: string | null; video_url?: string | null; thumbnail_url?: string | null }
      | null;
    const storagePaths = [
      extractPortfolioStoragePath(row?.image_url, body.table),
      extractPortfolioStoragePath(row?.video_url, body.table),
      extractPortfolioStoragePath(row?.thumbnail_url, body.table),
    ].filter((path): path is string => Boolean(path));

    if (storagePaths.length > 0) {
      const storageDelete = await supabase.storage.from(STORAGE_BUCKET).remove(storagePaths);
      if (storageDelete.error) {
        return NextResponse.json(
          { ok: true, warning: storageDelete.error.message },
          { status: 200 }
        );
      }
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
