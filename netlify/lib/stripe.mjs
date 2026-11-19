import Stripe from "stripe";

export function getStripe() {
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) {
    const err = new Error("Missing STRIPE_SECRET_KEY");
    err.statusCode = 503;
    throw err;
  }
  return new Stripe(key);
}

export function appOrigin(event) {
  const fromEnv = (process.env.STORYSITES_PUBLIC_URL || "").replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const headers = event.headers || {};
  const host = headers["x-forwarded-host"] || headers.host;
  const proto = headers["x-forwarded-proto"] || "https";
  if (host) return `${proto}://${host}`;
  return "https://storysite-entry.netlify.app";
}
