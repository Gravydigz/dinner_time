# Architecture Documentation - Dinner Time

## System Overview

Dinner Time is a family meal planning web app: weekly recipe planning, family ratings, a favorites dashboard, and shopping list generation. A Node.js Express server serves the static frontend and a JSON-file-backed REST API. It runs in a single Docker container behind a reverse proxy (Traefik with HTTPS in production).

## Architecture Diagram

```
Browser (vanilla JS)
  ├── /            New interface  (index.html, assets/)
  ├── /legacy/     Frozen 2603.01.0 interface
  └── /upload.html Recipe upload & review
        │  fetch /api/*
        ▼
Node.js Express server (server/server.js, port 3000; 3010 in Docker)
  ├── Static files: frontend/public
  ├── REST API: recipes, plans, ratings, members, export, uploads
  └── Recipe processing: n8n webhook → callback → pending review
        │  read/write JSON
        ▼
data/  (mounted Docker volume in production)
  ├── master_recipes.json   members.json
  ├── ratings.json          weekly_plans.json
  └── uploads/ images, pdfs, processed
```

## Frontend

### Pages
- **`index.html`** — new interface (`body.app`): sticky toolbar, Planner / History / Rate / Dashboard tabs, floating Selected panel, pop-up windows (recipe, edit, shopping list, About, Archived)
- **`upload.html`** — upload images/PDFs, submit URLs or pasted text, review AI-extracted recipes before saving
- **`legacy/`** — frozen copy of the 2603.01.0 interface (own HTML/CSS/JS), reachable via About → Interface

### JavaScript Modules
- **`config.js`** — app version, recipe categories (single source of truth), API paths
- **`planner.js`** — recipe tiles, week picker, multi-select category filter and search, per-week plan saves, Selected panel, archive, recipe mode (Screen Wake Lock), recipe view/edit/print, shopping list, plan history
- **`script.js`** — members, ratings, dashboard, tab switching, About window

### CSS
`assets/css/styles.css` is shared with `upload.html`; new-interface styles are scoped under `.app`.

### Client State
- The browser keeps no copy of plans or ratings. Every change goes to the server first and the UI updates only after the server confirms; failures leave the UI unchanged and show an error message.
- `localStorage` holds only per-device preferences: Selected panel open/closed and the Legacy/New interface choice. (The legacy interface keeps its old localStorage fallback.)

## Data Layer

| File | Contents |
|------|----------|
| `master_recipes.json` | Recipes (`recipeId` numeric, `id` kebab-case string, ingredients, instructions, category, optional `archived`) |
| `members.json` | Family members for ratings |
| `ratings.json` | `{ user, recipe, score, date, dateFormatted }` entries |
| `weekly_plans.json` | One plan per ISO week: `{ planId, isoWeek, year, week, recipeIds, createdAt, updatedAt }` |

See `docs/WEEKLY_PLANS_GUIDE.md` for plan details.

### Repository vs. Production Data
- In git, real data files are gitignored and committed only as age-encrypted `.cry` twins (`.age-index`, `.githooks/`).
- Fake `data/*.example.json` samples are committed in plaintext and are the only data built into Docker images (`.dockerignore` excludes real data).
- In production, `data/` is a mounted volume. `docker-entrypoint.sh` copies a sample into any missing file on first run and never overwrites existing files.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/version` | App version |
| GET | `/api/export` | All data files as one JSON download |
| GET | `/api/members` | Family members |
| GET / POST | `/api/recipes` | List recipes / add a reviewed recipe |
| PUT | `/api/recipes/:id` | Update a recipe (edit, archive) |
| GET | `/api/plans` | All weekly plans |
| PUT | `/api/plans/:isoWeek` | Save one week (empty `recipeIds` removes it) |
| POST | `/api/plans` | Replace all plans (legacy interface) |
| GET / POST | `/api/ratings` | List ratings / replace all |
| POST | `/api/ratings/add` | Add one rating |
| POST | `/api/upload`, `/api/upload/multiple` | Upload images/PDFs |
| GET / DELETE | `/api/uploads`, `/api/uploads/:folder/:file` | List / delete uploads |
| POST / GET / DELETE | `/api/urls`, `/api/texts` | Submitted recipe URLs and pasted text |
| POST | `/api/process`, `/api/process-url`, `/api/process-text` | Send an item to the n8n workflow |
| POST | `/api/process/result` | n8n callback with the extracted recipe |
| GET / DELETE | `/api/process/pending` | Recipes awaiting review |

## Data Flows

### Weekly Planning
1. Planner loads recipes (`GET /api/recipes`) and plans (`GET /api/plans`)
2. ✓ on a tile queues a change for the shown week → `PUT /api/plans/:isoWeek`
3. The server re-reads the file, updates only that week, writes it, and returns all plans
4. The planner rebuilds its selection from the returned plans

Saves run one at a time, so rapid clicks resolve in order, and devices editing different weeks don't overwrite each other.

### Rating
1. Rate tab → `POST /api/ratings/add`
2. On success the rating is added in memory, tiles redraw their ★ averages and the form resets; on failure the form keeps its values and an error is shown

### Recipe Upload & Processing
1. `upload.html` stores files, URLs or text on the server
2. "Process with AI" sends the item to the n8n webhook (`N8N_WEBHOOK_URL`)
3. n8n extracts the recipe (Ollama) and posts it to `/api/process/result`
4. The recipe appears under Pending Review; after editing it is saved with `POST /api/recipes`

See `docs/N8N_RECIPE_PROCESSING.md`.

## Infrastructure

- **Image**: `node:18-alpine`, built for `linux/amd64`, published as `gravydigz/dinner-time:<version>` and `:latest`
- **Container**: port 3010 (`PORT` env), health check on `/`, `restart: unless-stopped`
- **Reverse proxy**: Traefik (labels in `docker/docker-compose.yml`) terminates HTTPS — also required for recipe mode's screen wake lock
- **Configuration**: `docker/.env` (age-encrypted in the repo as `docker/.env.cry`) provides `N8N_WEBHOOK_URL` and `CALLBACK_BASE_URL`; the compose file also reads `TZ`, `HOSTNAME` and `DOMAIN` from the server's environment

## Security Notes

- No authentication — intended for a trusted home network behind the reverse proxy
- Family data never leaves the server except through Export; it is encrypted in the repository and excluded from images
- Upload size limited to 10MB

## Backup & Recovery

- **Export**: About → Export data downloads all data files as one JSON
- **Server**: back up the mounted `data/` folder before each deployment (see `docs/DEPLOYMENT.md`)
- **Repository**: the encrypted `.cry` files are a point-in-time copy, decryptable with the age key

## Limitations & Next Steps

- JSON files with whole-file writes suit a single family; a database would be needed for heavier concurrent use
- Planned: a Maintenance & Settings release (import, member/rating editors, favorites, data-format maintenance) — see README → Future Enhancements
