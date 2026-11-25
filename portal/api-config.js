// Management portal API base.
// Local (npm run portal:dev): same origin → Netlify Dev functions.
// Production (portal-experiment): call the StorySites entry site,
// which already has /api/admin/* → Supabase.
(function () {
  if (typeof window.STORYSITES_API_BASE === "string") return;
  const host = window.location.hostname;
  const local = host === "localhost" || host === "127.0.0.1";
  window.STORYSITES_API_BASE = local
    ? ""
    : "https://storysite-entry.netlify.app";
})();
