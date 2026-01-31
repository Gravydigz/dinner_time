# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dinner Time is a family meal planning web application with weekly recipe planning, family ratings, dashboard analytics, and shopping list generation. It uses a Node.js Express backend for API persistence with a vanilla JavaScript frontend and Docker containerization for deployment.

## Development Commands

```bash
# Start local development server
cd frontend/public && python3 -m http.server 8000

# Run with Docker (production-like)
cd docker && docker-compose up --build

# Validate recipe JSON
python3 -m json.tool < data/master_recipes.json

# Process uploaded recipes
bash scripts/process_recipes.sh
```

There is no build step, test suite, or linter configured. The app runs directly as static files.

## Architecture

### Data Layer
- **Master recipe database:** `data/master_recipes.json` - single source of truth for all recipes
- **Server storage:** `data/ratings.json` and `data/weekly_plans.json` for persistent API storage
- **Client fallback:** Browser localStorage used if server unavailable
- **Uploads:** `data/uploads/` for recipe images/PDFs awaiting processing

### Frontend (`frontend/public/`)
- `index.html` - Main app with tabs: Weekly Planner, Ratings, Dashboard, Plan History
- `upload.html` - Recipe upload interface
- `assets/js/config.js` - Environment detection, API paths
- `assets/js/planner.js` - Recipe loading, shopping list generation, ISO week handling
- `assets/js/script.js` - Rating submission, dashboard rendering

### Key Implementation Details
- Recipe IDs use both numeric (`recipeId: 1`) and string (`id: "recipe-kebab-case"`) formats
- Dates use ISO 8601 week format: `YYYY-Www` (e.g., `2026-W05`)
- Shopping list categorization uses keyword matching in `planner.js`
- Data persisted server-side via Node.js API with localStorage fallback

### Docker (`docker/`)
- Node.js Alpine-based container on port 3000
- Volume mounts `data/` for persistence
- Entrypoint script (`docker-entrypoint.sh`) initializes config files on first run

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
  "instructions": ["Step 1", "Step 2"]
}
```

Add new recipes directly to `data/master_recipes.json` - they appear immediately in the app.

## Family Members

The rating system tracks preferences for: Travis, Heidi, Stella, Dylan
