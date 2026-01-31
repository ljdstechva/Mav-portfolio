import crypto from "node:crypto";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

export function adminConfigReady() {
  return ADMIN_USERNAME.length > 0 && ADMIN_PASSWORD.length > 0 && ADMIN_SECRET.length > 0;
}

export function getAdminSessionToken() {
  if (!adminConfigReady()) {
    return "";
  }

  return crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`)
    .digest("hex");
}

export function verifyAdminCredentials(username: string, password: string) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function isValidSessionToken(token: string | undefined) {
  if (!token) {
    return false;
  }

  const expected = getAdminSessionToken();
  if (!expected) {
    return false;
  }

  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);
  if (tokenBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
}
