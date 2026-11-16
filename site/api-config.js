// Same-origin Netlify Function at /api/inquiries (see netlify.toml redirect).
// Override only if the API is hosted elsewhere.
window.STORYSITES_API_BASE =
  typeof window.STORYSITES_API_BASE === "string"
    ? window.STORYSITES_API_BASE
    : "";
