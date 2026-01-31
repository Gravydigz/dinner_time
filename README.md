# Dinner Time - Weekly Recipe Collection & Rating System

A family dinner recipe collection with an interactive web-based meal planning, rating system, and shopping list generator.

## Project Structure

```
dinner_time/
├── frontend/                      # Frontend web application
│   └── public/
│       ├── index.html            # Main app (planner, rating, dashboard, history)
│       ├── upload.html           # Recipe upload interface
│       └── assets/
│           ├── css/
│           │   └── styles.css
│           └── js/
│               ├── config.js
│               ├── script.js     # Rating & dashboard logic
│               └── planner.js    # Weekly planner & shopping list
│
├── data/                         # Data layer
│   ├── recipes/
│   │   ├── master_recipes.json  # Master recipe database (7 recipes)
│   │   └── archives/            # Historical recipe markdown files
│   │       ├── week1/
│   │       └── week2/
│   ├── weekly_plans.json        # Weekly meal plans by ISO week
│   └── uploads/                 # Upload repository
│       ├── images/              # Upload recipe images here
│       ├── pdfs/                # Upload recipe PDFs here
│       └── processed/           # Processed files moved here
│
├── docker/                       # Docker configuration
│   ├── Dockerfile               # Nginx Alpine container
│   ├── nginx.conf               # Web server configuration
│   └── docker-compose.yml       # Service orchestration
│
├── scripts/                      # Automation scripts
│   └── process_recipes.sh       # Batch processing script
│
├── docs/                         # Documentation
│   ├── QUICK_START.md
│   ├── AUTOMATION_GUIDE.md
│   ├── DEPLOYMENT.md
│   └── ARCHITECTURE.md
│
└── README.md                     # This file
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

### Quick Start

**Local Development:**
```bash
cd frontend/public
python3 -m http.server 8000
# Visit http://localhost:8000
```

**Docker (Production):**
```bash
cd docker
docker-compose up
# Visit http://localhost:8080
```

### Planning Your Week
1. Open the application in your web browser
2. On the "Weekly Planner" tab:
   - Browse all available recipes from the master database
   - Click on 3-4 recipes to select them for the week
   - Selected recipes appear in the "Selected Recipes" section
   - Click "Save Weekly Plan" to save with ISO week date
   - Click "Generate Shopping List"
   - Review the organized shopping list by category
   - Click "Print List" to print your shopping list

### View Plan History
1. Click the "Plan History" tab
2. See all your past weekly plans organized by ISO week (YYYY-Www)
3. Click "Load This Plan" to reuse a previous week's selections

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

### Browser Storage (Current)
- **Ratings**: Stored in browser localStorage
- **Weekly Plans**: Stored in browser localStorage
- **Format**: JSON objects with timestamps

### File Storage
- **Recipes**: `data/recipes/master_recipes.json` (7 recipes with sequential IDs)
- **Plans**: `data/weekly_plans.json` (template for future server-side storage)

### Data Format
All data includes:
- User name
- Recipe ID and name
- Scores (1-5)
- ISO week dates (YYYY-Www)
- Timestamps

## Adding New Recipes

### Option 1: Upload Interface (Recommended)

1. Visit the upload page at `http://localhost:8000/upload.html` (or `/upload.html` in Docker)
2. Drag and drop recipe images or PDF files
3. Files are saved to `data/uploads/images/` or `data/uploads/pdfs/`
4. Use Claude Code to process:
   ```bash
   # From project root
   cd /Users/travisrobertson/Code/dinner_time
   # Or run the batch script
   bash scripts/process_recipes.sh
   ```
5. Manually add extracted recipe to `data/recipes/master_recipes.json`
6. Recipe automatically appears in planner!

See `docs/AUTOMATION_GUIDE.md` for automation options with n8n.

### Option 2: Manual Entry

1. Edit `data/recipes/master_recipes.json` and add your recipe following this structure:
   ```json
   {
     "recipeId": 8,                      # Next sequential ID
     "id": "recipe-name-kebab-case",     # Kebab-case string ID
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

2. The recipe will automatically appear in:
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

### Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Web Server**: Nginx (Alpine Linux)
- **Data**: JSON files + browser localStorage
- **Containerization**: Docker + Docker Compose
- **Deployment**: Docker container on any platform

### Data Flow
1. **Master Database** (`data/recipes/master_recipes.json`) - Single source of truth with sequential recipe IDs
2. **Weekly Planner** - Reads from master database, saves plans with ISO week dates
3. **Plan History** - View and reload past weekly plans by ISO week
4. **Shopping List Generator** - Aggregates and categorizes ingredients from selected recipes
5. **Rating System** - Records ratings in browser localStorage with timestamps
6. **Dashboard** - Analyzes ratings to show favorites overall and by person

### Key Features
- **Sequential Recipe IDs**: Recipes have numeric IDs (1-7) for easy database management
- **ISO Week Tracking**: Plans tracked by ISO 8601 week format (YYYY-Www)
- **Portable Scripts**: All scripts use relative paths for Docker compatibility
- **Volume Persistence**: Data directory mounted as Docker volume
- **Health Checks**: Container includes health monitoring

### Evolution & Extensibility
The system is designed to grow:
- Add recipes to `master_recipes.json` - they instantly appear everywhere
- Weekly plans stored by ISO week for easy historical tracking
- Rating data persists locally for privacy
- Shopping list aggregates and organizes automatically
- Ready for backend API integration (PostgreSQL, Node.js)

## Future Enhancements

### Implemented ✓
- ✓ Save and load weekly meal plans by ISO week
- ✓ Plan history viewer with reload capability
- ✓ Sequential recipe IDs for database compatibility
- ✓ Docker containerization
- ✓ Shopping list with category organization

### Planned
- Export ratings and meal plans to CSV
- Recipe search and filter by category, cook time, or rating
- Ingredient substitution suggestions
- Nutrition information per recipe
- Photo gallery for recipes
- Comments and notes on recipes
- Meal prep instructions and tips
- Mobile-responsive improvements
- Recipe scaling (adjust servings)
- Backend API with PostgreSQL
- Multi-device sync
- User authentication

## Family Members

- Travis
- Heidi
- Stella
- Dylan

---

Enjoy discovering your family's favorite recipes!
