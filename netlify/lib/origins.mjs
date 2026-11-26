/** Allowed browser origins for StorySites Netlify Functions (CORS). */
export const STORYSITES_ALLOWED_ORIGINS = new Set([
  "https://storysite-entry.netlify.app",
  "https://portal-experiment.netlify.app",
  "https://storysites-mgmt-portal.netlify.app",
  "http://localhost:8888",
  "http://127.0.0.1:8888",
  "http://localhost:8890",
  "http://127.0.0.1:8890",
  "http://localhost:3999",
  "http://127.0.0.1:3999",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
]);

export const STORYSITES_PORTAL_DEFAULT =
  "https://portal-experiment.netlify.app";

export const STORYSITES_ENTRY_DEFAULT =
  "https://storysite-entry.netlify.app";

export function allowOrigin(origin, fallback = STORYSITES_ENTRY_DEFAULT) {
  if (origin && STORYSITES_ALLOWED_ORIGINS.has(origin)) return origin;
  return fallback;
}
