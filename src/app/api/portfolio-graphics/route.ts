import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createSupabaseServerClient();

  const [industries, clients, carousels, copywriting, reels, photoEditing] = await Promise.all([
    supabase.from("industries").select("id, name").order("created_at", { ascending: true }),
    supabase
      .from("clients")
      .select("id, industry_id, name, image_url, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("carousels")
      .select("id, client, image_url, position, created_at")
      .order("position", { ascending: true }),
    supabase
      .from("copywriting")
      .select("id, client, title, body, image_url, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("reels")
      .select("id, client, title, video_url, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("photo_editing")
      .select("id, client, title, before_image_url, after_image_url, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const error = industries.error ?? clients.error ?? carousels.error ?? copywriting.error ?? reels.error ?? photoEditing.error;
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    industries: industries.data ?? [],
    clients: clients.data ?? [],
    carousels: carousels.data ?? [],
    copywriting: copywriting.data ?? [],
    reels: reels.data ?? [],
    photoEditing: photoEditing.data ?? [],
  });
}
