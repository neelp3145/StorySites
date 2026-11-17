// Test replica API base.
// Empty string = same origin (Netlify Dev / a test Netlify deploy).
// Override to point at a deployed Netlify site if needed, e.g.:
//   window.STORYSITES_API_BASE = "https://your-test-site.netlify.app";
window.STORYSITES_API_BASE =
  typeof window.STORYSITES_API_BASE === "string"
    ? window.STORYSITES_API_BASE
    : "";
