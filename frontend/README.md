# StorySites frontend (wired to API)

This is a copy of the live Netlify landing page with the contact form pointed at the StorySites backend.

1. Set your API origin in [`api-config.js`](api-config.js) (or override `window.STORYSITES_API_BASE` before load).
2. Deploy this `index.html` + `api-config.js` to Netlify (or merge the submit-handler change into your real frontend repo).
3. Ensure the backend `CORS_ORIGINS` includes your Netlify domain.
