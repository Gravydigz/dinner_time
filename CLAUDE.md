# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dinner Time is a family meal planning web application with weekly recipe planning, family ratings, dashboard analytics, and shopping list generation. It uses a Node.js Express backend for API persistence with a vanilla JavaScript frontend and Docker containerization for deployment.

## Development Commands

```bash
# Start local development server (Node API + static frontend, http://localhost:3000)
cd server && npm install && npm start

# Run with Docker (production-like)
cd docker && docker-compose up --build

# Validate recipe JSON
python3 -m json.tool < data/master_recipes.json

# Process uploaded recipes
bash scripts/process_recipes.sh
```

There is no build step, test suite, or linter configured. The frontend is plain static files served by the Express server, which also provides the `/api/*` endpoints the app needs.

## Architecture

### Data Layer
- **Master recipe database:** `data/master_recipes.json` - single source of truth for all recipes
- **Family members:** `data/members.json` - list of family members for ratings
- **Server storage:** `data/ratings.json` and `data/weekly_plans.json` for persistent API storage
- **Server is the only source of truth:** the new interface keeps no plan/rating data in the browser. Plan and rating changes apply only after the server confirms; on failure the UI is unchanged and `showAppError()` shows a message. (The legacy interface keeps its old localStorage fallback.)
- **Uploads:** `data/uploads/` for recipe images/PDFs awaiting processing
- **Encrypted real data:** the four real data files above are gitignored and committed only as age-encrypted `.cry` twins (listed in `.age-index`, handled by `.githooks/`: wrapper shims for the central secrets-process repo cloned at `~/.secrets-process`; see `secrets-process.md`). Never `git add -f` them or commit with `--no-verify`; each clone needs `git config core.hooksPath .githooks` once.
- **Sample data:** `data/*.example.json` hold fake data, committed in plaintext. Docker images ship only these; `docker-entrypoint.sh` copies them into the mounted `data/` volume on first run if a real file is missing. Production data lives in the mounted volume and is never overwritten by a new image.

### Frontend (`frontend/public/`)
- `index.html` - Main app (`body.app`): sticky toolbar (week picker, category filter, search, ☰ Selected), tabs Planner / History / Rate / Dashboard, floating Selected panel, About window (Archived list, Export data, Legacy/New switch)
- `upload.html` - Recipe upload interface (shares `styles.css`; new-interface styles are scoped under `.app`)
- `legacy/` - Frozen copy of the 2603.01.0 interface served at `/legacy/`; only change it for the Legacy/New switch or critical fixes
- `assets/js/config.js` - Version, categories, API paths
- `assets/js/planner.js` - Recipe tiles, week picker (`weekOffset` 0..4), multi-select category filter + search, per-week plan saves (`queuePlanChange`), archive, recipe mode (screen wake lock), shopping list
- `assets/js/script.js` - Ratings (server-only), dashboard, tabs (`showTab`), About window

### Key Implementation Details
- Recipe IDs use both numeric (`recipeId: 1`) and string (`id: "recipe-kebab-case"`) formats
- Dates use ISO 8601 week format: `YYYY-Www` (e.g., `2026-W05`)
- Shopping list categorization uses keyword matching in `planner.js`
- Plans are saved one week at a time with `PUT /api/plans/:isoWeek` (empty `recipeIds` removes the week); `POST /api/plans` (whole file) is kept for the legacy interface
- Archived recipes carry `"archived": true` and are hidden from the planner, filter and rating list
- Recipes with an empty `category` are treated as "Other" (`getRecipeCategory()`)

### Docker (`docker/`)
- Node.js Alpine-based container on port 3010
- Volume mounts `data/` for persistence
- Entrypoint script (`docker-entrypoint.sh`) initializes missing data files from `*.example.json` on first run
- Production images are built for `linux/amd64` (`docker build --platform linux/amd64 ...`)
- **Before building or deploying, read `docs/DEPLOYMENT.md` and `docs/DEPLOYMENT.private.md`** (site-specific build host, registry account, production paths, deployment log). The private file is age-encrypted like the data files (listed in `.age-index`); append a row to its Deployment Log after each release

## Recipe Format

```json
{
  "recipeId": 8,
  "id": "recipe-kebab-case",
  "name": "Recipe Name",
  "source": "Source Name",
  "url": "https://...",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "category": "Chicken|Beef|Pasta|...",
  "ingredients": [
    {"item": "ingredient", "amount": "1", "unit": "cup", "additional": "optional notes"}
  ],
  "instructions": ["Step 1", "Step 2"],
  "notes": ""
}
```

Add new recipes directly to `data/master_recipes.json` - they appear immediately in the app.

## Family Members

Family members are stored in `data/members.json` and loaded dynamically via the `/api/members` endpoint. The rating system and dashboard use this data to display member options.

## Versioning & Changelog

**Version format:** `YYMM.VV.P` — two-digit year + month, release number for that month (00, 01, …), patch number (e.g., `2610.00.0`)

See `VERSION_INFO.md` for complete versioning details including:
- All files that need version updates
- API endpoint for version
- Docker tagging instructions
- Quick update checklist

Document all changes in `CHANGELOG.md` under: Added, Changed, Fixed, or Removed
