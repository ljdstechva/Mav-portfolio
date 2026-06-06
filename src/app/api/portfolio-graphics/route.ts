import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type TableResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

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
      .select("id, industry_id, name, image_url, sort_order, created_at")
      .order("sort_order", { ascending: true, nullsFirst: false })
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

  const graphicDesignError = industries.error ?? clients.error;
  if (graphicDesignError) {
    return NextResponse.json({ message: graphicDesignError.message }, { status: 500 });
  }

  const setupWarnings = [
    carousels.error ? `Carousels table: ${carousels.error.message}` : null,
    copywriting.error ? `Copywriting table: ${copywriting.error.message}` : null,
    reels.error ? `Reels table: ${reels.error.message}` : null,
    photoEditing.error ? `Photo editing table: ${photoEditing.error.message}` : null,
    aiImages.error ? `AI images table: ${aiImages.error.message}` : null,
    aiVideos.error ? `AI videos table: ${aiVideos.error.message}` : null,
    portfolioCategoryOrder.error ? `Portfolio category order table: ${portfolioCategoryOrder.error.message}` : null,
  ].filter((message): message is string => Boolean(message));

  const optionalRows = <T>(result: TableResult<T>) => (result.error ? [] : (result.data ?? []));

  return NextResponse.json({
    industries: industries.data ?? [],
    clients: clients.data ?? [],
    carousels: optionalRows(carousels),
    copywriting: optionalRows(copywriting),
    reels: optionalRows(reels),
    stories: storiesData,
    photoEditing: optionalRows(photoEditing),
    aiImages: optionalRows(aiImages),
    aiVideos: optionalRows(aiVideos),
    portfolioCategoryOrder: optionalRows(portfolioCategoryOrder),
    setupWarnings,
  });
}
