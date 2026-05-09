import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ensureSupabaseAuthed } from "@/lib/supabaseAdminAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await ensureSupabaseAuthed(request))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();

  const [
    industries,
    clients,
    carousels,
    reels,
    stories,
    copywriting,
    photoEditing,
    testimonials,
    aiImages,
    aiVideos,
  ] = await Promise.all([
    supabase.from("industries").select("*").order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("carousels")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("reels")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("stories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("copywriting")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("photo_editing")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_images")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_videos")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);

  const error =
    industries.error ??
    clients.error ??
    carousels.error ??
    reels.error ??
    stories.error ??
    copywriting.error ??
    photoEditing.error ??
    testimonials.error;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const aiMediaSetupWarnings = [
    aiImages.error ? `AI Images table: ${aiImages.error.message}` : null,
    aiVideos.error ? `AI Videos table: ${aiVideos.error.message}` : null,
  ].filter((message): message is string => Boolean(message));

  const response = NextResponse.json({
    industries: industries.data ?? [],
    clients: clients.data ?? [],
    carousels: carousels.data ?? [],
    reels: reels.data ?? [],
    stories: stories.data ?? [],
    copywriting: copywriting.data ?? [],
    photoEditing: photoEditing.data ?? [],
    testimonials: testimonials.data ?? [],
    aiImages: aiImages.error ? [] : (aiImages.data ?? []),
    aiVideos: aiVideos.error ? [] : (aiVideos.data ?? []),
    aiMediaSetupWarnings,
  });

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}
