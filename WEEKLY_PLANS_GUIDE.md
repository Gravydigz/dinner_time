# Weekly Plans Database Guide

## Overview

The Dinner Time application now uses a database-driven approach for weekly meal planning instead of static folder structures. This allows for flexible plan management, history tracking, and easy data analysis.

## Key Changes

### ✅ What's New

1. **Sequential Recipe IDs**
   - Each recipe now has a unique `recipeId` (1, 2, 3, etc.)
   - Keeps string `id` for backwards compatibility
   - Makes database relationships simple and efficient

2. **Weekly Plans Database**
   - Plans stored in localStorage (browser database)
   - Each plan tracked by ISO week format (YYYY-Www)
   - Stores recipe IDs, creation/update timestamps

3. **Plan History Tab**
   - View all past weekly plans
   - Load previous plans to re-use
   - See what you cooked and when

4. **Automatic Saving**
   - When you generate a shopping list, the plan is automatically saved
   - Updates existing plan if you modify the same week

### ❌ What's Removed

- **week1/ and week2/ folders** - No longer needed
  - Old recipe markdown files moved to `data/recipes/archives/`
  - All recipe data now in `master_recipes.json`
  - Weekly planning now database-driven

## Data Structure

### Recipe with Sequential ID

```json
{
  "recipeId": 1,
  "id": "bourbon-glazed-steak-tips",
  "name": "Bourbon-Glazed Steak Tips",
  "source": "Beef Loving Texans",
  "url": "https://...",
  "category": "Beef",
  "prepTime": 240,
  "cookTime": 15,
  "servings": 6,
  "ingredients": [...],
  "instructions": [...]
}
```

### Weekly Plan Structure

```json
{
  "planId": 1706716800000,
  "isoWeek": "2024-W05",
  "year": 2024,
  "week": 5,
  "recipeIds": [1, 3, 5, 7],
  "createdAt": "2024-01-31T15:30:00.000Z",
  "updatedAt": "2024-01-31T15:30:00.000Z"
}
```

## ISO Week Format

The system uses **ISO 8601 week date format**:
- Format: `YYYY-Www` (e.g., "2024-W05")
- Week starts on Monday
- Week 1 is the week with the first Thursday of the year
- Ensures consistent, international date handling

### Examples

- **2024-W01** = Week 1 of 2024 (Jan 1-7)
- **2024-W05** = Week 5 of 2024 (Jan 29 - Feb 4)
- **2024-W52** = Last week of 2024

## How It Works

### 1. Planning a Week

1. Go to **Weekly Planner** tab
2. Select 3-4 recipes
3. Click **"Generate Shopping List"**
4. Plan is automatically saved with current ISO week

```javascript
// Automatic save when generating shopping list
Week: 2024-W05
Selected Recipes: [1, 3, 5, 7]
Result: Plan saved to localStorage
```

### 2. Viewing History

1. Go to **Plan History** tab
2. See all past plans sorted by week
3. Each plan shows:
   - ISO week (e.g., "2024-W05")
   - Year
   - List of recipes
   - Creation and update dates

### 3. Re-using Plans

1. In **Plan History**, click **"Load This Plan"**
2. Recipes automatically loaded into Weekly Planner
3. Modify if needed
4. Generate new shopping list

## Data Storage

### LocalStorage (Current)

- **Location:** Browser localStorage
- **Key:** `weeklyPlans`
- **Format:** JSON array
- **Persistence:** Per-browser (not synced)

```javascript
localStorage.getItem('weeklyPlans')
// Returns:
[
  {planId: 123, isoWeek: "2024-W05", recipeIds: [1,3,5,7], ...},
  {planId: 124, isoWeek: "2024-W06", recipeIds: [2,4,6], ...}
]
```

### Future: JSON File (Optional)

Create `data/weekly_plans.json` for server-side storage:

```json
{
  "plans": [
    {
      "planId": 1,
      "isoWeek": "2024-W05",
      "recipeIds": [1, 3, 5, 7],
      "createdAt": "2024-01-31T15:30:00.000Z",
      "updatedAt": "2024-01-31T15:30:00.000Z"
    }
  ],
  "nextId": 2
}
```

## Usage Examples

### Example 1: Plan This Week's Meals

```
1. Click "Weekly Planner" tab
2. Select: Bourbon Steak (ID: 1), Marry Me Chicken (ID: 6), Ravioli Lasagna (ID: 5)
3. Click "Generate Shopping List"
4. Plan saved as: 2024-W05 with recipes [1, 6, 5]
```

### Example 2: View Past Plans

```
1. Click "Plan History" tab
2. See:
   - 2024-W05: Bourbon Steak, Marry Me Chicken, Ravioli Lasagna
   - 2024-W04: Chicken Stir Fry, Tuscan Sausage Pasta
   - 2024-W03: Pasta Marinara, Marry Me Chicken Tortellini
```

### Example 3: Repeat a Favorite Week

```
1. Go to "Plan History"
2. Find week with great recipes (e.g., 2024-W04)
3. Click "Load This Plan"
4. Recipes auto-loaded into planner
5. Generate shopping list
6. New plan created for current week (2024-W05)
```

## Benefits

### ✅ Advantages

1. **Flexible History**
   - Track unlimited weeks
   - See patterns in your meal planning
   - Identify favorite combinations

2. **Easy Repetition**
   - Found a great week? Re-use it!
   - One click to load past plans
   - Modify as needed

3. **Data Analysis Ready**
   - Export plans to JSON
   - Analyze most-used recipes
   - Find seasonal patterns

4. **No File Management**
   - No folders to organize
   - No markdown files to maintain
   - Everything in structured database

5. **Future-Ready**
   - Easy to add backend API
   - Simple to migrate to real database
   - Ready for multi-device sync

### 📊 vs. Old System

| Feature | Old (Folders) | New (Database) |
|---------|--------------|----------------|
| Add Week | Create new folder | Automatic on save |
| View History | Browse folders | Dedicated tab |
| Re-use Plan | Copy files manually | One-click load |
| Storage | Markdown files | Structured JSON |
| Search | Manual | Programmatic |
| Scalability | Limited | Unlimited |

## API Functions

### JavaScript Functions Available

```javascript
// Get current ISO week
getISOWeek()
// Returns: {year: 2024, week: 5, isoWeek: "2024-W05"}

// Load all plans
loadWeeklyPlans()
// Returns: Array of plan objects

// Save current selection as plan
saveWeeklyPlan()
// Saves selectedRecipes to current week

// Render plan history
renderPlanHistory()
// Displays all plans in UI

// Load a specific plan
loadPlanToPlanner(planId)
// Loads plan's recipes into planner
```

## Migration Notes

### Old Data Preserved

Your original recipe markdown files are archived:

```
data/recipes/archives/
├── week1/
│   ├── bourbon_glazed_steak_tips.md
│   ├── chicken_stir_fry.md
│   ├── pasta_marinara.md
│   └── tuscan_sausage_pasta.md
└── week2/
    ├── one_pot_ravioli_lasagna.md
    ├── marry_me_chicken.md
    └── marry_me_chicken_tortellini.md
```

These are kept for reference but not used by the application.

### Database Migration

If you had previous plans, create them manually:

```javascript
// Example: Add a historical plan
weeklyPlans.push({
  planId: Date.now(),
  isoWeek: "2024-W04",
  year: 2024,
  week: 4,
  recipeIds: [2, 4],  // IDs of recipes you used
  createdAt: "2024-01-24T12:00:00.000Z",
  updatedAt: "2024-01-24T12:00:00.000Z"
});
saveWeeklyPlans();
```

## Backup & Export

### Backup Plans

```javascript
// Export all plans
const plans = localStorage.getItem('weeklyPlans');
console.log(plans);
// Copy and save to file
```

### Import Plans

```javascript
// Import from backup
const plansJson = '[{...}, {...}]';  // Your backup data
localStorage.setItem('weeklyPlans', plansJson);
location.reload();
```

### Export to CSV

```javascript
// Convert plans to CSV
const csv = weeklyPlans.map(p =>
  `${p.isoWeek},${p.year},${p.week},"${p.recipeIds.join(';')}",${p.createdAt}`
).join('\n');
console.log('Week,Year,WeekNum,RecipeIDs,Created\n' + csv);
```

## Future Enhancements

### Planned Features

1. **Analytics Dashboard**
   - Most popular recipes
   - Seasonal trends
   - Variety analysis

2. **Plan Templates**
   - Save favorite combinations
   - Quick-load templates
   - Share plans with family

3. **Backend Sync**
   - PostgreSQL database
   - Multi-device sync
   - Cloud backup

4. **Advanced Search**
   - Find weeks with specific recipes
   - Filter by date range
   - Search by ingredients

5. **Calendar View**
   - Visual calendar interface
   - Drag-and-drop planning
   - Month/year views

## Troubleshooting

### Plans Not Saving

```javascript
// Check localStorage
console.log(localStorage.getItem('weeklyPlans'));

// Clear and reset
localStorage.removeItem('weeklyPlans');
location.reload();
```

### Can't See History

1. Check browser localStorage is enabled
2. Don't use private/incognito mode
3. Ensure you've created at least one plan

### Wrong Week Showing

ISO weeks can be confusing:
- Week starts Monday
- Jan 1 might be previous year's week
- Use current week display in planner

## Questions?

- See main README.md for general info
- Check QUICK_START.md for usage guide
- Review planner.js for implementation details

---

**Version:** 2.0
**Last Updated:** January 31, 2024
**Status:** ✅ Production Ready
