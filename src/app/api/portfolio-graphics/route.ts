import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createSupabaseServerClient();

  const [
    industries,
    clients,
    carousels,
    copywriting,
    reels,
    photoEditing,
    aiImages,
    aiVideos,
    portfolioCategoryOrder,
  ] = await Promise.all([
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
      .select("id, client, title, body, image_url, sort_order, created_at")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("reels")
      .select("id, client, title, video_url, sort_order, created_at")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("photo_editing")
      .select("id, client, title, before_image_url, after_image_url, sort_order, created_at")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_images")
      .select("id, title, description, image_url, thumbnail_url, alt_text, sort_order, is_published, created_at")
      .eq("is_published", true)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_videos")
      .select("id, title, description, video_url, thumbnail_url, sort_order, is_published, created_at")
      .eq("is_published", true)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("portfolio_category_order")
      .select("category_id, sort_order")
      .order("sort_order", { ascending: true })
      .order("category_id", { ascending: true }),
  ]);

  let storiesData: unknown[] = [];
  try {
    const stories = await supabase
      .from("stories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (!stories.error) {
      storiesData = stories.data ?? [];
    }
  } catch {
    storiesData = [];
  }

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
    stories: storiesData,
    photoEditing: photoEditing.data ?? [],
    aiImages: aiImages.error ? [] : (aiImages.data ?? []),
    aiVideos: aiVideos.error ? [] : (aiVideos.data ?? []),
    portfolioCategoryOrder: portfolioCategoryOrder.error ? [] : (portfolioCategoryOrder.data ?? []),
  });
}
