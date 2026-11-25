// Management portal API base.
// Local Netlify Dev (portal:dev with functions): same origin.
// Static local smoke / production portal-experiment: call storysite-entry.
(function () {
  if (typeof window.STORYSITES_API_BASE === "string") return;
  const host = window.location.hostname;
  const params = new URLSearchParams(location.search);
  if (params.get('api') === 'local') {
    window.STORYSITES_API_BASE = "";
    return;
  }
  // Portal Netlify site has no functions — always use entry.
  // Localhost without ?api=local also uses entry so static previews work.
  window.STORYSITES_API_BASE = "https://storysite-entry.netlify.app";
})();
