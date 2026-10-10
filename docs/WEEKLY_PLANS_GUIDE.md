# Weekly Plans Guide

How weekly meal plans work in Dinner Time.

## Overview

A weekly plan is the list of recipes chosen for one ISO week (`YYYY-Www`, Monday to Sunday). Plans are stored on the server in `data/weekly_plans.json`; the server file is the only source of truth.

## Planning a Week

1. Choose the week with the `‹ ›` arrows in the toolbar. The label shows **This week**, **Next week**, **+2 weeks** … **+4 weeks**, with the date range underneath (hover for the ISO week).
2. Click ✓ on a recipe tile to add it; click again to remove it.
3. Each change is saved to the server immediately. The tile dims while saving and the ✓ appears once the server confirms. If the server can't be reached, the selection stays as it was and an error message is shown.
4. Click **☰ Selected** to see the week's recipes, open one, remove one (✕), or generate the **🛒 Shopping List**.

Unticking every recipe for a week removes that week's plan.

## Plan History

The **History** tab lists all saved plans, most recent first, with their recipes. **Load This Plan** copies a past plan's recipes into the week currently shown in the planner and saves it.

## Multiple Devices

Each change saves only the week being edited (`PUT /api/plans/:isoWeek`), so family members planning different weeks on different devices don't overwrite each other. The planner always shows the plan as saved on the server.

## Data Format

`data/weekly_plans.json`:
```json
{
  "plans": [
    {
      "planId": 1770004356248,
      "isoWeek": "2026-W05",
      "year": 2026,
      "week": 5,
      "recipeIds": [1, 5, 7],
      "createdAt": "2026-02-02T03:52:36.248Z",
      "updatedAt": "2026-02-02T03:52:36.249Z"
    }
  ],
  "metadata": {
    "version": "1.0",
    "lastUpdated": "2026-02-02T03:52:36.249Z",
    "description": "Weekly meal plans tracking ISO week dates and selected recipes"
  }
}
```

- `recipeIds` refer to the numeric `recipeId` in `data/master_recipes.json`
- `planId` and `createdAt` are kept when a week is updated; `updatedAt` changes on every save

## API

| Method | Endpoint | Body | Result |
|--------|----------|------|--------|
| GET | `/api/plans` | — | All plans |
| PUT | `/api/plans/:isoWeek` | `{ "recipeIds": [1, 5] }` | Creates/updates that week (empty list removes it); returns all plans |
| POST | `/api/plans` | `{ "plans": [...] }` | Replaces the whole file (used by the legacy interface) |

## Code

`frontend/public/assets/js/planner.js`:
- `getISOWeek()` / `getActivePlanningWeek()` — ISO week of today shifted by the week picker (`weekOffset` 0–4)
- `queuePlanChange(isoWeek, computeIds)` — saves one week through the server, one request at a time
- `refreshSelectionFromPlans()` — rebuilds the selection from the server's plans
- `renderPlanHistory()` / `loadPlanToPlanner()` — History tab

## Backup

About → **Export data** downloads all data files, including `weekly_plans.json`, as one JSON file.
