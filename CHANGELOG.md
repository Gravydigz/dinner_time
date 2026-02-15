# Changelog

All notable changes to Dinner Time are documented in this file.

Version format: `YYMM.VV.P` — YearMonth.Version.Patch

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
