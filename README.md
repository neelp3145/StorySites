# StorySites inquiry backend

FastAPI backend for the [StorySites](https://storysite-entry.netlify.app/) contact form. Submissions are stored in **Supabase Postgres**, you get an email notification, and a password-protected admin UI lets you review leads.

## Features

- `POST /api/inquiries` — JSON or form-urlencoded (matches live form fields)
- Honeypot (`bot-field`), validation, CORS, rate limiting
- SMTP notification on successful create
- Admin UI at `/admin` (list, filter, status + notes)
- Alembic migrations for Supabase
- Dockerfile for Render / Railway / Fly

## Quick start

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. **Project Settings → Database → Connection string → URI**
3. Prefer the **Transaction pooler** (port `6543`) for deployed apps
4. Use the `postgresql+psycopg://...` scheme (see `.env.example`)

### 2. Configure

```bash
cd storysites-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: DATABASE_URL, SECRET_KEY, ADMIN_*, SMTP_*, NOTIFY_TO, CORS_ORIGINS
```

### 3. Migrate & run

```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

- API docs: http://127.0.0.1:8000/docs  
- Health: http://127.0.0.1:8000/health  
- Admin: http://127.0.0.1:8000/admin  

### 4. Smoke test (SQLite, no Supabase)

```bash
source .venv/bin/activate
python scripts/smoke_test.py
```

## API: create inquiry

```bash
curl -s -X POST http://127.0.0.1:8000/api/inquiries \
  -H 'Content-Type: application/json' \
  -d '{
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "phone": null,
    "request_type": "Request a StorySite",
    "service_type": "Personal / Professional StorySite",
    "hosting_preference": "Not sure yet",
    "project_details": "Tell us about your story…",
    "contact_consent": true,
    "terms_acknowledged": true,
    "terms_version": "draft-2026-11-11-v1",
    "quote_displayed": "Starting at $249.99",
    "bot-field": ""
  }'
```

## Frontend wiring

A wired copy of the landing page lives in [`frontend/`](frontend/):

1. Set `window.STORYSITES_API_BASE` in [`frontend/api-config.js`](frontend/api-config.js) to your API origin
2. Deploy `frontend/index.html` + `api-config.js` to Netlify (or merge the same submit change into your source repo)
3. Add the Netlify origin to `CORS_ORIGINS`

## Deploy

Build and run the Docker image with env vars set (including `DATABASE_URL` and `PORT`):

```bash
docker build -t storysites-backend .
docker run --env-file .env -p 8000:8000 storysites-backend
```

The container runs `alembic upgrade head` then starts Uvicorn.

## Admin

Sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`. Sessions use a signed cookie (`SECRET_KEY`). Change both before production.
