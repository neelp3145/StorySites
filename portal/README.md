# StorySites management portal

Same UI as https://portal-experiment.netlify.app.

Data loads from Supabase through the StorySites backend on
[storysite-entry](https://storysite-entry.netlify.app) (`/api/admin/*`).
Layout and styling are unchanged — only the data source was wired.

| Portal view | Live source |
| --- | --- |
| New inquiries | Inquiries still awaiting first outreach (`status=New`) |
| Customers | Contacted / active journey records |
| Overview metrics | Derived from the same people list |
| File library | Still browser-local in this UI (unchanged) |

## Local preview

```bash
npm run portal:dev
# or: npx --yes serve portal -l 8890
```

Open http://127.0.0.1:8890 — `api-config.js` points at storysite-entry.
Use `?api=local` only when Netlify Functions are running locally.

## Deploy (portal-experiment)

| Setting | Value |
| --- | --- |
| Base directory | `portal` |
| Publish directory | `.` |
| Functions | empty |

Ensure **storysite-entry** allows origin `https://portal-experiment.netlify.app`
(already listed in `netlify/lib/origins.mjs`).
