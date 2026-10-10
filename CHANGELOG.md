# Changelog

All notable changes to Dinner Time are documented in this file.

Version format: `YYMM.VV.P` — YearMonth.Version.Patch

---

## [Unreleased]

### Added
- **Private deployment notes**: `docs/DEPLOYMENT.private.md` (age-encrypted, listed in `.age-index`) records the site-specific build and deploy process and a deployment log; `docs/DEPLOYMENT.private.example.md` is a public template for anyone without the key. `docs/DEPLOYMENT.md`, README and `CLAUDE.md` point to it

---

## [2610.00.0] - 2026-10-10

### Added
- **New planner interface** (default): full-width layout with a sticky toolbar
  - Week picker (`‹ This week ›` with date range) covering this week through +4 weeks, replacing the Current Week / Next Week tabs
  - Multi-select category filter built from the categories in the recipe data (recipes without a category appear under "Other"); "All" clears the others and turns back on when nothing is selected
  - Search box matching recipe names and ingredient names (every word must match)
  - Recipe tiles: up to 4 wide (3 or fewer on smaller screens); clicking a tile opens the recipe, the ✓ button adds it to the week
  - Floating **Selected** panel (toggle with **☰ Selected (N)**, hidden by default and remembered per device) listing the week's recipes, with the **🛒 Shopping List** button
- **Legacy interface**: the 2603.01.0 interface is kept at `/legacy/`; switch between Legacy and New from the About window (choice remembered per device)
- **Auto-save**: ticking or unticking a recipe saves the week immediately; unticking every recipe removes that week's plan
- **Recipe archive**: Archived switch beside Save in the edit window hides a recipe from the planner and rating list; About → **Archived** lists archived recipes with View / Unarchive
- **Recipe mode**: the screen stays awake while a recipe is open (Screen Wake Lock API, needs HTTPS); a **☀ Screen on** badge shows while active
- **Export data**: About → **Export data** downloads one JSON file containing all data files
- **Server API**: `GET /api/export`; `PUT /api/plans/:isoWeek` saves one week without touching other weeks, so devices planning different weeks don't overwrite each other
- **Sample data**: fake `data/*.example.json` files are committed and used as first-run defaults in Docker images

### Changed
- **Server is the only source of truth** for weekly plans and ratings in the new interface: changes only apply once the server confirms, and an error message is shown if it can't be reached (the browser localStorage fallback was removed; the legacy interface keeps its own)
- **Recipe tiles**: category bottom-left; average rating above time and servings bottom-right
- **Toolbar**: Planner / History / Rate / Dashboard tabs moved top right beside Upload; footer reduced to About + version
- **Pop-up windows** (recipe, edit, shopping list, About, Archived) widened to 1100px; recipe ingredients shown in two columns
- **Real data is encrypted in the repo**: `master_recipes.json`, `members.json`, `ratings.json` and `weekly_plans.json` are gitignored and committed only as age-encrypted `.cry` files; `.dockerignore` keeps real data out of images, and the entrypoint falls back to the samples on first run (mounted production data is never overwritten)
- **pre-commit hook**: only re-encrypts files whose contents changed, and allows untracking a file so it can be moved under encryption
- **Version format** in `CLAUDE.md` corrected to `YYMM.VV.P`
- **Documentation**: README, `CLAUDE.md`, `VERSION_INFO.md` and `docs/DEPLOYMENT.md` updated for this release (amd64 build command, deploying a new release, data persistence); `docs/QUICK_START.md`, `docs/ARCHITECTURE.md` and `docs/WEEKLY_PLANS_GUIDE.md` (moved into `docs/`) rewritten for the current Node.js app

### Fixed
- **Star ratings on recipe cards** (2603.01.0, never deployed): the average was returned as text, which threw an error and replaced the recipe list with "Unable to load recipes" once ratings were cached; stars also now appear on first load. The same one-line fix was applied to the legacy copy
- **Edit window**: recipes without a category no longer default to "Chicken" when saved
- **Recipe view**: recipes without a category show "Other" instead of an empty badge

### Removed
- **Save List** button (replaced by auto-save)
- Family names from `docs/ARCHITECTURE.md`
- Outdated docs from the original restructure: `GET_STARTED.md`, `PROJECT_STRUCTURE.md`, `MIGRATION_SUMMARY.md`, `PROJECT_LOCATION.md`, and root duplicates of `QUICK_START.md` and `AUTOMATION_GUIDE.md` (kept in `docs/`)
- Static-hosting deployment option (the app requires the Node.js server)

---

## [2603.01.0] - 2026-03-09

### Added
- **Star ratings on recipe cards**: Recipe tiles on the main planner page now show the family average star rating (e.g. ★ 4.2) in the bottom-right corner of each card; cards with no ratings show nothing

### Changed
- **Recipe view modal header**: Condensed from 3 lines to 2 — category badge and prep/cook/serves metadata are now combined on a single row beneath the recipe name
- **Print view**: Slimmed header to 2 lines (matching view modal); reduced padding throughout (body, header, sections, list items) to fit more recipe content per printed page

---

## [2602.04.0] - 2026-02-22

### Added
- **Paste Recipe Text input**: New textarea on the upload page for typing or pasting raw recipe text (e.g., from a cookbook or recipe card)
  - "Submit Text" button saves the text to the server and shows it in the uploaded items list
  - Stored text entries appear with a 📝 icon and an 80-character preview
  - "Process with AI" routes text entries through the n8n workflow via a new `recipeText` field
  - Extracted recipe flows into the existing "Pending Review" section for editing and saving
- **Server: text submission API** (`POST/GET/DELETE /api/texts` and `POST /api/process-text`): mirrors the existing URL import API; sends `{ recipeText, filename, callbackUrl }` to the n8n webhook
- **n8n workflow: raw text path**: New `IF recipeText?` branch (first in chain) routes text submissions to a Text Prep Code node, then into the existing Ollama Text node — no additional AI node required

---

## [2602.03.0] - 2026-02-18

### Fixed
- **URL import — original URL always preserved**: Server now injects the original submitted URL into the recipe at callback time, guaranteeing it is saved to `recipe.url` regardless of what Ollama extracted from the page

### Changed
- **Recipe categories — single source of truth**: `CONFIG.categories` in `config.js` is now the authoritative list of recipe categories; `upload.html` and `planner.js` both reference it instead of maintaining separate hardcoded lists
- **Full category list in planner edit modal**: Recipe edit modal in the main planner now shows all 12 categories (Chicken, Beef, Pork, Seafood, Pasta, Vegetarian, Soup, Salad, Side, Dessert, Breakfast, Other) — previously only showed 6
- **n8n Parse Response node**: Updated to always assign `webhook.recipeUrl` when present, rather than using it only as a fallback when Ollama didn't extract a URL
- **README Future Enhancements**: Moved implemented items (PDF processing, URL import, Side category) out of Planned; added version groupings to Implemented list; Planned now appears before Implemented; added missing entries for edit recipe feature, notes field, and About modal

---

## [2602.02.0] - 2026-02-15

### Fixed
- **About modal**: Added missing `config.js` script to `index.html` so the About link opens the modal instead of reloading the page
- **Process with AI button**: Button no longer resets to default state during polling; stays disabled with "Processing..." text until the recipe is extracted
- **Edit & Save modal**: Fixed double-stringify bug that prevented recipe fields from populating in the edit modal

---

## [2602.01.2] - 2026-02-15

### Added
- **About footer and modal**: Discrete footer at bottom of main page with "About" link and version display
  - Clicking "About" opens a modal with app description and version number
  - Reuses existing recipe modal styling for consistent look
  - Version populated dynamically from `CONFIG.version`

### Changed
- **n8n Clean HTML node**: Two-tier extraction — tries JSON-LD structured data first, falls back to text stripping
  - JSON-LD extracts `@type: Recipe` from `<script type="application/ld+json">` blocks (including `@graph` arrays)
  - Text fallback truncation increased from 8,000 to 12,000 characters
  - Output is JSON-escaped to prevent `NodeOperationError` in downstream HTTP Request node
  - New `extractionMethod` output field (`json-ld` or `text`) for debugging
- **n8n Ollama Text prompt**: Changed from "webpage text" to "recipe data" to better describe JSON-LD input
- **n8n docs**: Updated test curl example to use `filename` param, added JSON-LD troubleshooting entry
- Removed implemented "About" popup from README future ideas section

---

## [2602.01.1] - 2026-02-15

### Changed
- **Two-step URL import flow**: URL imports now follow the same submit-then-process pattern as file uploads
  - New `POST /api/urls`, `GET /api/urls`, `DELETE /api/urls/:filename` endpoints for URL CRUD
  - `POST /api/process-url` refactored to accept `{ filename }` and look up URL from store
  - URLs appear in "Uploaded Recipes" list with "Process with AI" and "Delete" buttons
  - URL entries removed automatically when n8n callback completes
  - Error feedback shown on button instead of alert dialogs
- Renamed "Uploaded Files" to "Uploaded Recipes" and "Process URL" to "Submit URL"

---

## [2602.01.0] - 2026-02-15

### Added
- **URL-based recipe import**: Paste a recipe URL to extract recipes directly from webpages
  - `POST /api/process-url` - Sends URL to n8n for webpage fetching and text extraction
  - URL input section on the upload page with status feedback
  - n8n workflow branching: IF node routes URL imports to fetch/clean/text-extract path, file uploads continue through existing vision path
  - Auto-populates recipe URL field from the source URL when Ollama doesn't extract it
  - New troubleshooting entries for URL-specific issues (JS-rendered sites, anti-scraping, large HTML)

### Changed
- Updated n8n workflow documentation with branching architecture diagram and new node configurations
- Upload page instructions updated to include URL import step

---

## [2602.00.0] - 2026-02-14

### Added
- **n8n + Ollama Recipe Processing Integration**: Automated recipe extraction from uploaded images/PDFs
  - `POST /api/process` - Triggers n8n webhook to process an uploaded file
  - `POST /api/process/result` - Receives extracted recipe JSON from n8n callback
  - `GET /api/process/pending` - Lists recipes awaiting user review
  - `DELETE /api/process/pending/:filename` - Discards a pending recipe
  - `POST /api/recipes` - Adds a new recipe with auto-assigned ID
  - "Process with AI" button on uploaded files in upload page
  - Pending review section with edit modal for reviewing extracted recipes
  - `N8N_WEBHOOK_URL` and `CALLBACK_BASE_URL` environment variables
  - `docker/.env` file for environment configuration
  - `docs/N8N_RECIPE_PROCESSING.md` - Full setup guide for n8n workflow

### Changed
- Version format changed from `YYYY.MM.DD.##` to `YYMM.VV.P` (YearMonth.Version.Patch)
- Upload page instructions updated to reflect AI processing workflow
- `docker-compose.yml` and `docker-compose.generic` updated with new environment variables

---

## [2026.01.31.02] - 2026-01-31

### Added
- **Edit Recipe Feature**: New ability to edit recipe data via a modal popup
  - Edit icon (pencil) added to recipe cards before the print icon
  - Full form modal with fields for: Name, Source, URL, Prep Time, Cook Time, Servings, Category
  - Dynamic ingredient list with add/remove functionality
  - Dynamic instruction list with add/remove functionality
  - Category dropdown with options: Beef, Chicken, Pasta, Seafood, Vegetarian, Other

- **Notes Field**: New "Notes" field for recipes
  - Textarea in edit modal for adding personal notes to recipes
  - Notes display in the view recipe modal (only when notes exist)
  - Added `notes` field to all existing recipes in `master_recipes.json`

- **API Endpoint**: `PUT /api/recipes/:id`
  - Updates recipe data in `master_recipes.json`
  - Preserves `recipeId` and `id` fields while updating other properties
  - Returns updated recipe on success

- **API Endpoint**: `GET /api/version`
  - Returns current app version as JSON

- **Version Tracking**: Centralized version management
  - `VERSION_INFO.md` - Complete versioning documentation
  - `CHANGELOG.md` - Version history and changes
  - Version displayed in server startup banner
  - Version accessible via API and frontend CONFIG

### Changed
- `server/server.js`: Added PUT endpoint for recipe updates
- `frontend/public/assets/js/planner.js`: Added edit functionality and modal
- `frontend/public/assets/css/styles.css`: Added styles for edit form modal
- `data/master_recipes.json`: Added `notes` field to recipe schema

---

## [2026.01.31.01] - 2026-01-31

### Added
- Dynamic family members loaded from `data/members.json`
- UI improvements for recipe cards and modals

### Changed
- Updated data paths and removed hardcoded fallbacks
- Updated planner subtitle text for clarity
- Updated fetch path for master recipes JSON

---

## [Prior Versions]

Initial development of Dinner Time meal planning application with:
- Weekly recipe planner with ISO week support
- Family ratings system
- Dashboard analytics
- Shopping list generation with category grouping
- Recipe view and print functionality
- Docker containerization
- Node.js Express backend API
