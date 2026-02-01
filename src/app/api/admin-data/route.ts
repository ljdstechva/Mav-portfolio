import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

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
  } catch (error) {
    return false;
  }
}

export async function GET(request: Request) {
  if (!(await ensureAuthed(request))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();

  const [
    industries,
    graphicDesigns,
    carousels,
    carouselImages,
    reels,
    copywriting,
    photoEditing,
    testimonials,
  ] = await Promise.all([
    supabase.from("industries").select("*").order("created_at", { ascending: false }),
    supabase
      .from("graphic_designs")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("carousels").select("*").order("created_at", { ascending: false }),
    supabase
      .from("carousel_images")
      .select("*")
      .order("position", { ascending: true }),
    supabase.from("reels").select("*").order("created_at", { ascending: false }),
    supabase.from("copywriting").select("*").order("created_at", { ascending: false }),
    supabase.from("photo_editing").select("*").order("created_at", { ascending: false }),
    supabase.from("testimonials").select("*").order("created_at", { ascending: false }),
  ]);

  const error =
    industries.error ??
    graphicDesigns.error ??
    carousels.error ??
    carouselImages.error ??
    reels.error ??
    copywriting.error ??
    photoEditing.error ??
    testimonials.error;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    industries: industries.data ?? [],
    graphicDesigns: graphicDesigns.data ?? [],
    carousels: carousels.data ?? [],
    carouselImages: carouselImages.data ?? [],
    reels: reels.data ?? [],
    copywriting: copywriting.data ?? [],
    photoEditing: photoEditing.data ?? [],
    testimonials: testimonials.data ?? [],
  });
}
