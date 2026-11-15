// Same-origin by default so the published app and local uvicorn both work.
// Override before load if the API lives on another host.
window.STORYSITES_API_BASE =
  typeof window.STORYSITES_API_BASE === "string"
    ? window.STORYSITES_API_BASE
    : "";
