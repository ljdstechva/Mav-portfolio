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
  } catch {
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
    clients,
    graphicDesigns,
    carousels,
    reels,
    copywriting,
    photoEditing,
    testimonials,
  ] = await Promise.all([
    supabase.from("industries").select("*").order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("graphic_designs")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("carousels")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("reels").select("*").order("created_at", { ascending: false }),
    supabase.from("copywriting").select("*").order("created_at", { ascending: false }),
    supabase.from("photo_editing").select("*").order("created_at", { ascending: false }),
    supabase.from("testimonials").select("*").order("created_at", { ascending: false }),
  ]);

  const error =
    industries.error ??
    clients.error ??
    graphicDesigns.error ??
    carousels.error ??
    reels.error ??
    copywriting.error ??
    photoEditing.error ??
    testimonials.error;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const response = NextResponse.json({
    industries: industries.data ?? [],
    clients: clients.data ?? [],
    graphicDesigns: graphicDesigns.data ?? [],
    carousels: carousels.data ?? [],
    reels: reels.data ?? [],
    copywriting: copywriting.data ?? [],
    photoEditing: photoEditing.data ?? [],
    testimonials: testimonials.data ?? [],
  });

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}
