export type TestimonialMediaKind = "image" | "video" | null;

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg", ".ogv"];

export function getTestimonialMediaKind(mediaUrl?: string | null): TestimonialMediaKind {
  if (!mediaUrl) {
    return null;
  }

  const normalized = mediaUrl.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";

  if (VIDEO_EXTENSIONS.some((extension) => normalized.endsWith(extension))) {
    return "video";
  }

  return "image";
}

export function formatTestimonialAttribution(role?: string | null, company?: string | null) {
  const cleanRole = role?.trim();
  const cleanCompany = company?.trim();

  if (cleanRole && cleanCompany) return `${cleanRole}, ${cleanCompany}`;
  if (cleanRole) return cleanRole;
  if (cleanCompany) return cleanCompany;
  return "";
}
