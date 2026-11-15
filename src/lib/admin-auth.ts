import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "storysites_admin";

export type AdminCredentials = {
  username: string;
  password: string;
};

/** Returns credentials only when all required secrets are set. Otherwise null (fail closed). */
export function expectedAdmin(): AdminCredentials | null {
  const username = process.env.ADMIN_USERNAME?.trim() ?? "";
  const password = process.env.ADMIN_PASSWORD?.trim() ?? "";
  const key = process.env.SECRET_KEY?.trim() ?? "";
  if (!username || !password || !key) return null;
  return { username, password };
}

function signingKey(): string | null {
  const key = process.env.SECRET_KEY?.trim() ?? "";
  return key || null;
}

function sign(username: string, key: string): string {
  const sig = createHmac("sha256", key).update(username).digest("hex");
  return `${username}.${sig}`;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const key = signingKey();
  const admin = expectedAdmin();
  if (!key || !admin) return false;

  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;
  const [username, sig] = token.split(".");
  if (!username || !sig) return false;

  const expected = sign(username, key);
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  return username === admin.username;
}

export function adminCookieValue(
  username: string,
): { name: string; value: string } | null {
  const key = signingKey();
  if (!key) return null;
  return { name: COOKIE, value: sign(username, key) };
}

export function adminCookieName(): string {
  return COOKIE;
}

export function isAdminConfigured(): boolean {
  return expectedAdmin() !== null;
}
