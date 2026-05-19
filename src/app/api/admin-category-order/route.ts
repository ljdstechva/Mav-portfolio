import { NextResponse } from "next/server";
import { DEFAULT_PORTFOLIO_CATEGORY_IDS } from "@/data/portfolioData";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ensureSupabaseAuthed } from "@/lib/supabaseAdminAuth";

export const runtime = "nodejs";

const ALLOWED_CATEGORY_IDS = new Set(DEFAULT_PORTFOLIO_CATEGORY_IDS);

export async function POST(request: Request) {
  if (!(await ensureSupabaseAuthed(request))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let body: {
    items?: { category_id?: string; sort_order?: number }[];
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid category order payload." }, { status: 400 });
  }

  if (!Array.isArray(body.items)) {
    return NextResponse.json({ message: "Invalid category order payload." }, { status: 400 });
  }

  const seen = new Set<string>();
  const payload = body.items
    .filter((item) => typeof item.category_id === "string" && Number.isInteger(item.sort_order))
    .map((item) => ({
      category_id: item.category_id as string,
      sort_order: item.sort_order as number,
      updated_at: new Date().toISOString(),
    }))
    .filter((item) => {
      if (!ALLOWED_CATEGORY_IDS.has(item.category_id) || seen.has(item.category_id)) {
        return false;
      }
      seen.add(item.category_id);
      return true;
    });

  if (payload.length !== DEFAULT_PORTFOLIO_CATEGORY_IDS.length) {
    return NextResponse.json(
      { message: "Category order must include every portfolio category exactly once." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("portfolio_category_order")
    .upsert(payload, { onConflict: "category_id" })
    .select("category_id, sort_order")
    .order("sort_order", { ascending: true })
    .order("category_id", { ascending: true });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, portfolioCategoryOrder: data ?? [] }, { status: 200 });
}
