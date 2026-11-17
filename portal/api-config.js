// Management portal API base.
// Empty = same origin (recommended: deploy this portal on a Netlify site
// that uses this repo with publish = portal and the shared functions).
// For local test against another Netlify site, set e.g.:
//   window.STORYSITES_API_BASE = "https://your-api-site.netlify.app";
window.STORYSITES_API_BASE =
  typeof window.STORYSITES_API_BASE === "string"
    ? window.STORYSITES_API_BASE
    : "";
