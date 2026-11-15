import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "storysites_admin";

function secret(): string {
  return process.env.SECRET_KEY?.trim() || "dev-secret-change-me";
}

export function expectedAdmin(): { username: string; password: string } {
  return {
    username: process.env.ADMIN_USERNAME?.trim() || "admin",
    password: process.env.ADMIN_PASSWORD?.trim() || "change-me",
  };
}

function sign(username: string): string {
  const sig = createHmac("sha256", secret()).update(username).digest("hex");
  return `${username}.${sig}`;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;
  const [username, sig] = token.split(".");
  if (!username || !sig) return false;
  const expected = sign(username);
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  return username === expectedAdmin().username;
}

export function adminCookieValue(username: string): { name: string; value: string } {
  return { name: COOKIE, value: sign(username) };
}

export function adminCookieName(): string {
  return COOKIE;
}
