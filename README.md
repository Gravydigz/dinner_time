# Dinner Time - Weekly Recipe Collection & Rating System

A family dinner recipe collection with an interactive web-based meal planning, rating system, and shopping list generator.

## Project Structure

```
dinner_time/
├── recipes/
│   ├── master_recipes.json       # Master recipe database
│   ├── week1/
│   │   ├── bourbon_glazed_steak_tips.md
│   │   ├── monday_chicken_stir_fry.md
│   │   ├── wednesday_pasta_marinara.md
│   │   └── tuscan_sausage_pasta.md
│   └── week2/
│       ├── one_pot_ravioli_lasagna.md
│       ├── marry_me_chicken.md
│       └── marry_me_chicken_tortellini.md
├── uploads/
│   ├── images/                   # Upload recipe images here
│   ├── pdfs/                     # Upload recipe PDFs here
│   └── processed/                # Processed files moved here
├── web/
│   ├── index.html                # Main app
│   ├── upload.html               # Recipe upload interface
│   ├── styles.css
│   ├── script.js
│   └── planner.js
├── process_recipes.sh            # Batch processing script
├── AUTOMATION_GUIDE.md           # Automation documentation
└── README.md
```

## Features

### Master Recipe Database
- Centralized JSON database containing all recipes
- Each recipe includes:
  - Structured ingredient list with amounts and units
  - Step-by-step instructions
  - Prep time, cook time, and servings
  - Source attribution with URL
  - Category (Beef, Chicken, Pasta, etc.)

### Weekly Planner
The planner allows you to:
- Browse all recipes from the master database
- Select 3-4 recipes for the upcoming week
- View recipe details including cook time and servings
- Generate an automated shopping list

### Shopping List Generator
Automatically creates a organized shopping list:
- Aggregates ingredients from selected recipes
- Combines duplicate ingredients intelligently
- Organizes by category (Produce, Meat & Poultry, Dairy, Pantry, Spices)
- Includes checkboxes for shopping
- Print-friendly format

### Rating System
The web application allows family members to:
- Select their name (Travis, Heidi, Stella, or Dylan)
- Choose a recipe from a dropdown list
- Rate recipes on a scale of 1-5 (5 being great)
- Submit ratings with automatic date/time tracking

### Dashboard
- **Overall Favorites**: View all recipes ranked by average rating
- **Favorites by Person**: See each family member's top-rated recipes
- **Ratings History**: Complete log of all ratings with date, user, recipe, and score

## How to Use

### Planning Your Week
1. Open `web/index.html` in your web browser
2. On the "Weekly Planner" tab:
   - Browse all available recipes
   - Click on 3-4 recipes to select them for the week
   - Selected recipes appear in the "Selected Recipes" section
   - Click "Generate Shopping List"
   - Review the organized shopping list by category
   - Click "Print List" to print your shopping list

### Rating a Recipe
1. Click the "Rate a Recipe" tab
2. Select your name from the dropdown
3. Choose a recipe you've tried
4. Click a rating button (1-5)
5. Click "Submit Rating"

### Viewing the Dashboard
1. Click the "Dashboard" tab
2. View overall favorite recipes ranked by average rating
3. Click family member names to see their individual favorites
4. Scroll down to see the complete ratings history

## Data Storage

All ratings are stored locally in your browser's localStorage, including:
- User name
- Recipe name
- Score (1-5)
- Date and time of rating

## Adding New Recipes

### Option 1: Upload Interface (Recommended)

1. Open `web/upload.html` in your browser
2. Drag and drop recipe images or PDF files
3. Files are saved to `uploads/images/` or `uploads/pdfs/`
4. Use Claude Code to process:
   ```
   Read uploads/images/your-recipe.jpg
   Extract this recipe and add it to master_recipes.json
   ```
5. Recipe automatically appears in planner!

See `AUTOMATION_GUIDE.md` for automation options with n8n.

### Option 2: Manual Entry

1. Edit `recipes/master_recipes.json` and add your recipe following this structure:
   ```json
   {
     "id": "recipe-name-kebab-case",
     "name": "Recipe Display Name",
     "source": "Source Name",
     "url": "https://source-url.com/recipe",
     "prepTime": 15,
     "cookTime": 30,
     "servings": 4,
     "category": "Chicken",
     "ingredients": [
       { "item": "chicken breast", "amount": "1", "unit": "lb" },
       { "item": "olive oil", "amount": "2", "unit": "tbsp" }
     ],
     "instructions": [
       "Step 1 instructions",
       "Step 2 instructions"
     ]
   }
   ```

2. (Optional) Create a markdown file for reference:
   ```bash
   touch recipes/week1/recipe_name.md
   ```

3. The recipe will automatically appear in:
   - Weekly Planner for selection
   - Rating dropdown
   - Shopping list generator (when selected)

## Browser Compatibility

The rating system works in all modern web browsers:
- Chrome
- Firefox
- Safari
- Edge

## System Architecture

### Data Flow
1. **Master Database** (`master_recipes.json`) - Single source of truth for all recipes
2. **Weekly Planner** - Reads from master database, allows recipe selection
3. **Shopping List Generator** - Aggregates ingredients from selected recipes
4. **Rating System** - Records ratings in browser localStorage
5. **Dashboard** - Analyzes ratings to show favorites and trends

### Evolution & Extensibility
The system is designed to grow:
- Add recipes to `master_recipes.json` - they instantly appear everywhere
- Weekly folders preserve historical meal plans
- Rating data persists locally for privacy
- Shopping list can be exported/printed

## Future Enhancements

Potential features to add:
- Save and load weekly meal plans
- Export ratings and meal plans to CSV
- Recipe search and filter by category, cook time, or rating
- Ingredient substitution suggestions
- Nutrition information per recipe
- Photo uploads for recipes
- Comments and notes on recipes
- Meal prep instructions and tips
- Mobile app version
- Recipe scaling (adjust servings)

## Family Members

- Travis
- Heidi
- Stella
- Dylan

---

Enjoy discovering your family's favorite recipes!
