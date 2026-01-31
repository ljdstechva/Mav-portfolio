import { NextResponse } from "next/server";
import {
  adminConfigReady,
  getAdminSessionToken,
  verifyAdminCredentials,
} from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!adminConfigReady()) {
    return NextResponse.json(
      { message: "Admin credentials are not configured." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };

  const username = body.username?.trim() ?? "";
  const password = body.password?.trim() ?? "";

  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: "admin_session",
    value: getAdminSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}
