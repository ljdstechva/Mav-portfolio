import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ensureSupabaseAuthed } from "@/lib/supabaseAdminAuth";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type ProjectInsert = {
  title?: string;
  category?: string | null;
  image_url?: string | null;
  link?: string | null;
  description?: string | null;
};

type SupabaseLikeError = {
  code?: string;
  message?: string;
};

function isMissingProjectsTable(error: SupabaseLikeError) {
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "PGRST205" || message.includes("could not find the table") || message.includes("schema cache");
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingProjectsTable(error)) {
      return NextResponse.json([], {
        headers: {
          "X-MAV-Data-Warning": "Supabase projects table is not configured.",
        },
      });
    }

    return NextResponse.json({ message: "Unable to load projects." }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  if (!(await ensureSupabaseAuthed(request))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let body: ProjectInsert;
  try {
    body = (await request.json()) as ProjectInsert;
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

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
    if (isMissingProjectsTable(error)) {
      return NextResponse.json(
        { message: "Projects storage is not configured. Apply data/supabase-projects.sql before using this endpoint." },
        { status: 503 }
      );
    }

    return NextResponse.json({ message: "Unable to save project." }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
