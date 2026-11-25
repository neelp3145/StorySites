# StorySites management portal

Same UI as https://portal-experiment.netlify.app.

Loads inquiries/customers/projects from Supabase via storysite-entry
`/api/admin/*`. Layout is unchanged — only data sync was added.

## Deploy (portal-experiment)

| Setting | Value |
| --- | --- |
| Base directory | `portal` |
| Publish directory | `.` |
| Functions | empty |

Redeploy **storysite-entry** with CORS for this origin and
`STORYSITES_PORTAL_URL=https://portal-experiment.netlify.app`.
