# Changelog

All notable changes to Dinner Time are documented in this file.

Version format: `YYYY.MM.DD.##` where `##` is the release number for that day.

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
