import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type ProjectInsert = {
  title: string;
  category?: string | null;
  image_url?: string | null;
  link?: string | null;
  description?: string | null;
};

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

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  if (!(await ensureAuthed(request))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as ProjectInsert;
  const title = body.title?.trim();

  if (!title) {
    return NextResponse.json(
      { message: "Project title is required." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      id: randomUUID(),
      title,
      category: body.category ?? null,
      image_url: body.image_url ?? null,
      link: body.link ?? null,
      description: body.description ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
