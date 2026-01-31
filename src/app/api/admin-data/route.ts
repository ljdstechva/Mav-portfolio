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
    clients,
    projects,
    assets,
    testimonials,
    credentials,
    profiles,
  ] = await Promise.all([
    supabase.from("industries").select("*").order("display_order"),
    supabase.from("clients").select("*"),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase
      .from("portfolio_assets")
      .select("*")
      .order("display_order"),
    supabase.from("testimonials").select("*").order("created_at", { ascending: false }),
    supabase.from("credentials").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*"),
  ]);

  const error =
    industries.error ??
    clients.error ??
    projects.error ??
    assets.error ??
    testimonials.error ??
    credentials.error ??
    profiles.error;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    industries: industries.data ?? [],
    clients: clients.data ?? [],
    projects: projects.data ?? [],
    assets: assets.data ?? [],
    testimonials: testimonials.data ?? [],
    credentials: credentials.data ?? [],
    profiles: profiles.data ?? [],
  });
}
