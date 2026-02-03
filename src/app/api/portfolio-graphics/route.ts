import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createSupabaseServerClient();

  const [industries, clients, carousels] = await Promise.all([
    supabase.from("industries").select("id, name").order("created_at", { ascending: true }),
    supabase
      .from("clients")
      .select("id, industry_id, name, image_url, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("carousels")
      .select("id, client, image_url, position, created_at")
      .order("position", { ascending: true }),
  ]);

  const error = industries.error ?? clients.error ?? carousels.error;
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    industries: industries.data ?? [],
    clients: clients.data ?? [],
    carousels: carousels.data ?? [],
  });
}
