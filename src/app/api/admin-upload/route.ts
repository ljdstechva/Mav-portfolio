import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ensureSupabaseAuthed } from "@/lib/supabaseAdminAuth";

export const runtime = "nodejs";

type AllowedTable = "testimonials" | "ai_images" | "ai_videos";

const ALLOWED_UPLOADS: Record<AllowedTable, string[]> = {
  testimonials: ["avatar_url"],
  ai_images: ["image_url", "thumbnail_url"],
  ai_videos: ["video_url", "thumbnail_url"],
};

const STORAGE_BUCKET = "portfolio";
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const VIDEO_MIME_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-m4v", "video/mpeg", "video/ogg"]);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 1024 * 1024 * 1024;

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
  ogv: "video/ogg",
  ogg: "video/ogg",
};

function sanitizeExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  return extension.replace(/[^a-z0-9]/g, "") || "bin";
}

function getNormalizedMimeType(fileName: string, contentType: string) {
  const sanitizedContentType = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (IMAGE_MIME_TYPES.has(sanitizedContentType) || VIDEO_MIME_TYPES.has(sanitizedContentType)) {
    return sanitizedContentType;
  }

  const extension = sanitizeExtension(fileName);
  return EXTENSION_TO_MIME[extension] ?? sanitizedContentType;
}

function validateUploadDescriptor({
  fileName,
  contentType,
  size,
  table,
  field,
}: {
  fileName: string;
  contentType: string;
  size?: number | null;
  table: AllowedTable;
  field: string;
}) {
  const expectedKind = getExpectedUploadKind(table, field);
  const normalizedType = getNormalizedMimeType(fileName, contentType);

  if (expectedKind === "image" && !IMAGE_MIME_TYPES.has(normalizedType)) {
    return { error: "Only JPG, PNG, WEBP, GIF, and AVIF images are supported.", contentType: normalizedType };
  }

  if (expectedKind === "video" && !VIDEO_MIME_TYPES.has(normalizedType)) {
    return { error: "Only MP4, WEBM, MOV, M4V, MPEG, and OGG videos are supported.", contentType: normalizedType };
  }

  if (expectedKind === "testimonial" && !normalizedType.startsWith("image/") && !normalizedType.startsWith("video/")) {
    return { error: "Only image and video uploads are supported for testimonials.", contentType: normalizedType };
  }

  if (typeof size === "number" && size > 0) {
    if (expectedKind === "image" && size > MAX_IMAGE_BYTES) {
      return { error: "Image uploads must be 20MB or smaller.", contentType: normalizedType };
    }
    if (expectedKind === "video" && size > MAX_VIDEO_BYTES) {
      return { error: "Video uploads must be 1GB or smaller.", contentType: normalizedType };
    }
  }

  return { error: null, contentType: normalizedType };
}

function getExpectedUploadKind(table: AllowedTable, field: string) {
  if (table === "ai_videos" && field === "video_url") {
    return "video";
  }
  if (table === "ai_images" || field === "thumbnail_url") {
    return "image";
  }
  return "testimonial";
}

function validateFileForUpload(file: File, table: AllowedTable, field: string) {
  const expectedKind = getExpectedUploadKind(table, field);
  const descriptor = validateUploadDescriptor({
    fileName: file.name,
    contentType: file.type,
    size: file.size,
    table,
    field,
  });

  if (descriptor.error) {
    return descriptor.error;
  }

  if (expectedKind === "image") {
    if (file.size > MAX_IMAGE_BYTES) {
      return "Image uploads must be 20MB or smaller.";
    }
  }

  if (expectedKind === "video") {
    if (file.size > MAX_VIDEO_BYTES) {
      return "Video uploads must be 1GB or smaller.";
    }
  }

  if (expectedKind === "testimonial") {
    if (file.type && !file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return "Only image and video uploads are supported for testimonials.";
    }
  }

  return null;
}

export async function POST(request: Request) {
  if (!(await ensureSupabaseAuthed(request))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const requestContentType = request.headers.get("content-type") ?? "";
  const supabase = createSupabaseServerClient();

  if (requestContentType.includes("application/json")) {
    const body = (await request.json()) as {
      table?: AllowedTable;
      field?: string;
      fileName?: string;
      contentType?: string;
      size?: number;
    };

    const table = String(body.table ?? "").trim() as AllowedTable;
    const field = String(body.field ?? "").trim();
    const fileName = String(body.fileName ?? "").trim();

    if (!table || !(table in ALLOWED_UPLOADS)) {
      return NextResponse.json({ message: "Invalid upload table." }, { status: 400 });
    }

    if (!ALLOWED_UPLOADS[table].includes(field)) {
      return NextResponse.json({ message: "Invalid upload field." }, { status: 400 });
    }

    if (!fileName) {
      return NextResponse.json({ message: "File name is required." }, { status: 400 });
    }

    const descriptor = validateUploadDescriptor({
      fileName,
      contentType: body.contentType ?? "",
      size: body.size,
      table,
      field,
    });

    if (descriptor.error) {
      return NextResponse.json({ message: descriptor.error }, { status: 400 });
    }

    const bucket = await supabase.storage.getBucket(STORAGE_BUCKET);
    if (bucket.error || !bucket.data) {
      return NextResponse.json(
        { message: `Supabase storage bucket "${STORAGE_BUCKET}" is not available.` },
        { status: 500 }
      );
    }

    if (!bucket.data.public) {
      return NextResponse.json(
        { message: `Supabase storage bucket "${STORAGE_BUCKET}" must be public for uploaded media URLs to render.` },
        { status: 500 }
      );
    }

    const extension = sanitizeExtension(fileName);
    const filePath = `${table}/${field}/${crypto.randomUUID()}.${extension}`;
    const signedUpload = await supabase.storage.from(STORAGE_BUCKET).createSignedUploadUrl(filePath);

    if (signedUpload.error || !signedUpload.data?.token) {
      return NextResponse.json(
        { message: signedUpload.error?.message ?? "Failed to create a Supabase upload URL." },
        { status: 500 }
      );
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return NextResponse.json({
      publicUrl: data.publicUrl,
      path: filePath,
      token: signedUpload.data.token,
      contentType: descriptor.contentType,
      bucketPublic: bucket.data.public,
    });
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

  const validationError = validateFileForUpload(file, table, field);
  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 });
  }

  const bucket = await supabase.storage.getBucket(STORAGE_BUCKET);

  if (bucket.error || !bucket.data) {
    return NextResponse.json(
      { message: `Supabase storage bucket "${STORAGE_BUCKET}" is not available.` },
      { status: 500 }
    );
  }

  if (!bucket.data.public) {
    return NextResponse.json(
      { message: `Supabase storage bucket "${STORAGE_BUCKET}" must be public for uploaded media URLs to render.` },
      { status: 500 }
    );
  }

  const extension = sanitizeExtension(file.name);
  const normalizedContentType = getNormalizedMimeType(file.name, file.type);
  const filePath = `${table}/${field}/${crypto.randomUUID()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();
  const upload = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, Buffer.from(arrayBuffer), {
    cacheControl: "3600",
    upsert: false,
    contentType: normalizedContentType || "application/octet-stream",
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
