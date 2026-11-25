// Portal has no Netlify functions — always call storysite-entry admin APIs.
// Use ?api=local only when running `npm run portal:dev` with local functions.
(function () {
  if (typeof window.STORYSITES_API_BASE === "string") return;
  const params = new URLSearchParams(location.search);
  window.STORYSITES_API_BASE =
    params.get("api") === "local" ? "" : "https://storysite-entry.netlify.app";
})();
