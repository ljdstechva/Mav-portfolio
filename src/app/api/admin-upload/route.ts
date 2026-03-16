import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ensureSupabaseAuthed } from "@/lib/supabaseAdminAuth";

export const runtime = "nodejs";

type AllowedTable = "testimonials";

const ALLOWED_UPLOADS: Record<AllowedTable, string[]> = {
  testimonials: ["avatar_url"],
};

const STORAGE_BUCKET = "portfolio";

function sanitizeExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  return extension.replace(/[^a-z0-9]/g, "") || "bin";
}

export async function POST(request: Request) {
  if (!(await ensureSupabaseAuthed(request))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const table = String(formData.get("table") ?? "").trim() as AllowedTable;
  const field = String(formData.get("field") ?? "").trim();
  const file = formData.get("file");

  if (!table || !(table in ALLOWED_UPLOADS)) {
    return NextResponse.json({ message: "Invalid upload table." }, { status: 400 });
  }

  if (!ALLOWED_UPLOADS[table].includes(field)) {
    return NextResponse.json({ message: "Invalid upload field." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "No file provided." }, { status: 400 });
  }

  if (file.type && !file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return NextResponse.json(
      { message: "Only image and video uploads are supported for testimonials." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();
  const bucket = await supabase.storage.getBucket(STORAGE_BUCKET);

  if (bucket.error || !bucket.data) {
    return NextResponse.json(
      { message: `Supabase storage bucket "${STORAGE_BUCKET}" is not available.` },
      { status: 500 }
    );
  }

  if (!bucket.data.public) {
    return NextResponse.json(
      { message: `Supabase storage bucket "${STORAGE_BUCKET}" must be public for testimonial media URLs to render.` },
      { status: 500 }
    );
  }

  const extension = sanitizeExtension(file.name);
  const filePath = `${table}/${field}/${crypto.randomUUID()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();
  const upload = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, Buffer.from(arrayBuffer), {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });

  if (upload.error) {
    return NextResponse.json({ message: upload.error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  return NextResponse.json({
    publicUrl: data.publicUrl,
    path: filePath,
    bucketPublic: bucket.data.public,
  });
}
