import { redirect } from "next/navigation";
import {
  adminCookieValue,
  expectedAdmin,
  isAdminAuthenticated,
} from "@/lib/admin-auth";
import { cookies } from "next/headers";

export const runtime = "nodejs";

async function loginAction(formData: FormData) {
  "use server";
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  const expected = expectedAdmin();
  if (username === expected.username && password === expected.password) {
    const jar = await cookies();
    const cookie = adminCookieValue(username);
    jar.set(cookie.name, cookie.value, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    redirect("/admin");
  }
  redirect("/admin/login?error=1");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdminAuthenticated()) redirect("/admin");
  const params = await searchParams;
  return (
    <div className="admin-shell">
      <header>
        <div style={{ fontWeight: 700 }}>StorySites</div>
      </header>
      <main>
        <div className="card" style={{ maxWidth: 420, margin: "2rem auto" }}>
          <h1 style={{ marginTop: 0 }}>Admin login</h1>
          <p className="muted">Sign in to review StorySites inquiries.</p>
          {params.error ? <p className="error">Invalid username or password.</p> : null}
          <form action={loginAction}>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input id="username" name="username" autoComplete="username" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit">Sign in</button>
          </form>
          <p className="muted" style={{ marginTop: "1rem" }}>
            Local sample defaults: admin / change-me (override with secrets).
          </p>
        </div>
      </main>
    </div>
  );
}
