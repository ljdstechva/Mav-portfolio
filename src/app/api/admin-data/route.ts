import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ensureSupabaseAuthed } from "@/lib/supabaseAdminAuth";

export const runtime = "nodejs";

type TableResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

function rowsOrWarning<T>(label: string, result: TableResult<T>, warnings: string[]) {
  if (result.error) {
    warnings.push(`${label}: ${result.error.message}`);
    return [];
  }

  return result.data ?? [];
}

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
    portfolioCategoryOrder,
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
    supabase
      .from("portfolio_category_order")
      .select("id, category_id, sort_order, created_at, updated_at")
      .order("sort_order", { ascending: true })
      .order("category_id", { ascending: true }),
  ]);

  const graphicDesignSetupWarnings: string[] = [];
  const portfolioSetupWarnings: string[] = [];
  const aiMediaSetupWarnings: string[] = [];
  const categoryOrderWarnings: string[] = [];

  const industryRows = rowsOrWarning("Industries table", industries, graphicDesignSetupWarnings);
  const clientRows = rowsOrWarning("Graphic design clients table", clients, graphicDesignSetupWarnings);
  const carouselRows = rowsOrWarning("Carousels table", carousels, portfolioSetupWarnings);
  const reelRows = rowsOrWarning("Reels table", reels, portfolioSetupWarnings);
  const storyRows = rowsOrWarning("Stories table", stories, portfolioSetupWarnings);
  const copywritingRows = rowsOrWarning("Copywriting table", copywriting, portfolioSetupWarnings);
  const photoEditingRows = rowsOrWarning("Photo editing table", photoEditing, portfolioSetupWarnings);
  const testimonialRows = rowsOrWarning("Testimonials table", testimonials, portfolioSetupWarnings);
  const aiImageRows = rowsOrWarning("AI Images table", aiImages, aiMediaSetupWarnings);
  const aiVideoRows = rowsOrWarning("AI Videos table", aiVideos, aiMediaSetupWarnings);
  const portfolioCategoryOrderRows = rowsOrWarning(
    "Portfolio category order table",
    portfolioCategoryOrder,
    categoryOrderWarnings
  );

  const databaseSetupWarnings = [
    ...graphicDesignSetupWarnings,
    ...portfolioSetupWarnings,
    ...aiMediaSetupWarnings,
    ...categoryOrderWarnings,
  ];

  const response = NextResponse.json({
    industries: industryRows,
    clients: clientRows,
    carousels: carouselRows,
    reels: reelRows,
    stories: storyRows,
    copywriting: copywritingRows,
    photoEditing: photoEditingRows,
    testimonials: testimonialRows,
    aiImages: aiImageRows,
    aiVideos: aiVideoRows,
    portfolioCategoryOrder: portfolioCategoryOrderRows,
    graphicDesignSetupWarnings,
    databaseSetupWarnings,
    aiMediaSetupWarnings,
    categoryOrderWarnings,
  });

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}
