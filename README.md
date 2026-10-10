# Dinner Time - Weekly Recipe Collection & Rating System

A family dinner recipe collection with an interactive web-based meal planning, rating system, and shopping list generator. Features a Node.js backend for persistent data storage and direct file uploads.

## Project Structure

```
dinner_time/
├── frontend/                      # Frontend web application
│   └── public/
│       ├── index.html            # Main app (planner, history, rating, dashboard)
│       ├── upload.html           # Recipe upload interface
│       ├── assets/
│       │   ├── css/
│       │   │   └── styles.css
│       │   └── js/
│       │       ├── config.js     # Version, categories, API paths
│       │       ├── script.js     # Rating, dashboard, tabs, About
│       │       └── planner.js    # Planner, filters, archive, shopping list
│       └── legacy/               # Frozen 2603.01.0 interface, served at /legacy/
│
├── server/                       # Node.js backend server
│   ├── server.js                # Express API server
│   └── package.json             # Node.js dependencies
│
├── data/                         # Data layer (persisted by server)
│   ├── *.json.cry               # Real data, age-encrypted (plaintext is gitignored)
│   ├── *.example.json           # Fake sample data (image defaults)
│   └── uploads/                 # Upload repository (created dynamically)
│       ├── images/              # Uploaded recipe images
│       ├── pdfs/                # Uploaded recipe PDFs
│       └── processed/           # Processed files moved here
│
├── docker/                       # Docker configuration
│   ├── Dockerfile               # Node.js Alpine container
│   ├── docker-compose.yml       # Service orchestration
│   └── docker-entrypoint.sh     # Initializes data files on first run
│
├── .githooks/                    # age encryption hooks (see "Data Storage")
├── scripts/                      # Automation scripts
│   └── process_recipes.sh       # Batch processing script
│
├── docs/                         # Documentation
│   ├── QUICK_START.md           # Using the app
│   ├── WEEKLY_PLANS_GUIDE.md    # How weekly plans work
│   ├── DEPLOYMENT.md            # Build, publish, deploy
│   ├── ARCHITECTURE.md          # Technical architecture
│   ├── N8N_RECIPE_PROCESSING.md # Recipe processing with n8n
│   └── AUTOMATION_GUIDE.md      # Older automation options
│
├── CLAUDE.md                     # AI assistant context file
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
The planner uses the full screen with a toolbar that stays visible while scrolling:
- **Week picker** — `‹ This week ›` with the date range; plan this week through +4 weeks
- **Category filter** — multi-select buttons built from the categories in your recipes ("All" clears the others; recipes without a category appear under "Other")
- **Search** — matches recipe names and ingredients (e.g. "broccoli" also finds stir-fries that use it)
- **Recipe tiles** — up to 4 wide; click a tile to open the recipe, click ✓ to add it to the week
- **Auto-save** — every ✓ is saved to the server immediately; there is no Save button
- **☰ Selected panel** — toggle a floating list of the week's recipes, with the **🛒 Shopping List** button
- Edit and print icons on each tile

### Shopping List Generator
Automatically creates an organized shopping list:
- Aggregates ingredients from selected recipes
- Combines duplicate ingredients intelligently
- Organizes by category (Produce, Meat & Poultry, Dairy, Pantry, Spices)
- Opens in a pop-up window for easy viewing
- Print directly without opening new tabs

### Recipe Viewing
- **Pop-up window** with ingredients in two columns
- **Recipe mode** — the screen stays awake while a recipe is open (☀ Screen on badge; requires HTTPS)
- Sticky close/print buttons while scrolling long recipes

### Recipe Archive
- Turn on the **Archived** switch beside Save in a recipe's edit window to hide it from the planner and rating list
- **About → Archived** lists archived recipes with View and Unarchive
- Nothing is deleted; history and the dashboard still show archived recipes

### Rating System
The web application allows family members to:
- Select their name from the family members list
- Choose a recipe from a dropdown list
- Rate recipes on a scale of 1-5 (5 being great)
- Submit ratings with automatic date/time tracking
- Average ratings appear as ★ stars on recipe tiles

### Dashboard
- **Overall Favorites**: View all recipes ranked by average rating
- **Favorites by Person**: See each family member's top-rated recipes
- **Ratings History**: Complete log of all ratings with date, user, recipe, and score

### About Window
- **Archived** recipes list
- **Export data** — downloads one JSON file containing all recipes, members, ratings and plans
- **Interface** switch between New and Legacy (remembered per device)

### File Upload
- **Direct server upload** for recipe images and PDFs
- Drag-and-drop interface
- Automatic file organization (images vs PDFs)
- Delete uploaded files from the web interface
- Files ready for processing with Claude Code

## How to Use

### Quick Start

**Local Development (with Node.js backend):**
```bash
cd server
npm install
npm start
# Visit http://localhost:3000
```

**Docker (Production):**
```bash
cd docker
docker-compose up --build
# Visit http://localhost:3010
```

### Planning Your Week
1. Open the application in your web browser
2. Use the `‹ ›` arrows to choose the week (this week through +4 weeks)
3. Narrow the recipes with the category buttons or the search box
4. Click a tile to read the recipe; click ✓ to add it to the week (saved automatically)
5. Click **☰ Selected** to review the week's recipes, then **🛒 Shopping List**
6. Print the shopping list directly from its window

### View Plan History
1. Click the **History** tab
2. See all your past weekly plans organized by ISO week (YYYY-Www)
3. Click "Load This Plan" to copy a previous week's recipes into the week shown in the planner

### Rating a Recipe
1. Click the **Rate** tab
2. Select your name from the dropdown
3. Choose a recipe you've tried
4. Click a rating button (1-5)
5. Click "Submit Rating"

### Viewing the Dashboard
1. Click the **Dashboard** tab
2. View overall favorite recipes ranked by average rating
3. Click family member names to see their individual favorites
4. Scroll down to see the complete ratings history

### Legacy Interface
The previous (2603.01.0) interface is kept for comparison at `/legacy/`. Switch from **About → Interface**. It still shows archived recipes and keeps its own browser-storage fallback.

## Data Storage

### Server-Side Storage (Node.js Backend)
The server's data files are the only source of truth. In the new interface, plan and rating changes apply only once the server confirms them; if the server can't be reached, nothing changes and an error message is shown.
- **Recipes**: `data/master_recipes.json`
- **Members**: `data/members.json` - Family members for ratings
- **Weekly Plans**: `data/weekly_plans.json` - Saved per week via API
- **Ratings**: `data/ratings.json` - Saved via API
- **Uploads**: `data/uploads/images/` and `data/uploads/pdfs/`

### Encrypted Data in the Repository
Real data files are never committed in plaintext. They are gitignored, listed in `.age-index`, and committed only as age-encrypted `.cry` twins by the hooks in `.githooks/`:
- Run `git config core.hooksPath .githooks` once per clone
- The age key must be at `~/.config/age/keys.txt`; `post-checkout`/`post-merge` decrypt after checkout or pull
- Never `git add -f` a listed file or commit with `--no-verify`

Fake `data/*.example.json` files are committed in plaintext and are the only data built into Docker images.

### Docker Data Persistence
Production mounts its own `data/` folder into the container. On first run the entrypoint copies the samples into any missing file; existing files are never overwritten, so deploying a new image leaves production data untouched.

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/version` | Get app version |
| GET | `/api/export` | Download all data files as one JSON |
| GET | `/api/members` | Get all family members |
| GET | `/api/recipes` | Get all recipes |
| PUT | `/api/recipes/:id` | Update a recipe (including `archived`) |
| GET | `/api/plans` | Get all weekly plans |
| PUT | `/api/plans/:isoWeek` | Save one week's recipe IDs (empty list removes the week) |
| POST | `/api/plans` | Replace all weekly plans (used by the legacy interface) |
| GET | `/api/ratings` | Get all ratings |
| POST | `/api/ratings` | Save all ratings |
| POST | `/api/ratings/add` | Add a single rating |
| POST | `/api/upload` | Upload a single file |
| POST | `/api/upload/multiple` | Upload multiple files |
| GET | `/api/uploads` | List uploaded files |
| DELETE | `/api/uploads/:folder/:file` | Delete uploaded file |

### Data Format
All data includes:
- User name
- Recipe ID and name
- Scores (1-5)
- ISO week dates (YYYY-Www)
- Timestamps

## Adding New Recipes

### Option 1: Upload Interface (Recommended)

1. Visit the upload page at `http://localhost:3000/upload.html`
2. Drag and drop recipe images or PDF files (or click to browse)
3. Files are **uploaded directly to the server**:
   - Images → `data/uploads/images/`
   - PDFs → `data/uploads/pdfs/`
4. Files appear in the upload list with delete option
5. Use Claude Code to process uploaded files:
   ```
   "Check the upload folder for new files"
   ```
   Claude will read the image/PDF and extract the recipe data
6. Recipe is added to `data/master_recipes.json`
7. Processed files are moved to `data/uploads/processed/`
8. Recipe automatically appears in the planner!

See `docs/AUTOMATION_GUIDE.md` for automation options with n8n.

### Option 2: Manual Entry

1. Edit `data/master_recipes.json` and add your recipe following this structure:
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

The app works in all modern web browsers:
- Chrome
- Firefox
- Safari
- Edge

Recipe mode (keeping the screen awake) needs the Screen Wake Lock API and an HTTPS connection; where unavailable, recipes still open normally.

## System Architecture

### Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Node.js with Express.js
- **File Uploads**: Multer middleware
- **Data**: JSON files with API persistence
- **Containerization**: Docker + Docker Compose
- **Deployment**: Docker container on any platform

### API Server
The Node.js backend provides:
- RESTful API for all data operations
- Static file serving for frontend
- File upload handling with multer
- CORS support for development
- 10MB file size limit for uploads
- Automatic directory creation for uploads

### Data Flow
1. **Master Database** (`data/master_recipes.json`) - Single source of truth with sequential recipe IDs
2. **Weekly Planner** - Reads from API; each ✓ saves that week via `PUT /api/plans/:isoWeek`
3. **Plan History** - View past weekly plans by ISO week and copy them into the planner
4. **Shopping List Generator** - Aggregates and categorizes ingredients from selected recipes
5. **Rating System** - Records ratings via API with server-side persistence
6. **Dashboard** - Analyzes ratings to show favorites overall and by person
7. **File Upload** - Direct upload to server via multipart form data

### Key Features
- **Sequential Recipe IDs**: Recipes have numeric IDs for easy database management
- **ISO Week Tracking**: Plans tracked by ISO 8601 week format (YYYY-Www)
- **Per-week saves**: Devices planning different weeks don't overwrite each other
- **Pop-up Windows**: Recipe viewing, editing and shopping list in pop-up windows
- **Direct Printing**: Print recipes and lists without opening new windows
- **Volume Persistence**: Data directory mounted as Docker volume
- **Health Checks**: Container includes health monitoring

### Evolution & Extensibility
The system is designed to grow:
- Add recipes to `master_recipes.json` - they instantly appear everywhere
- Weekly plans stored by ISO week for easy historical tracking
- Rating data persists on server for multi-device access
- Shopping list aggregates and organizes automatically
- Ready for database integration (PostgreSQL, MongoDB)

## Future Enhancements

### Planned

**Maintenance & Settings release** (its own release)
- Settings screen, with Archived recipes and Export data moved there from the About window
- Import data from an export file
- Browser interfaces to edit members.json and ratings.json (add/delete/change)
- Favorites option with user selector and add/remove functionality
- Data maintenance action to upgrade data files when a future release changes their format

**Categories & Meal Planning**
- Category validation in AI processing to prevent category changes during review
- Meal pairing (deferred) — in the Selected panel, drag sides under a main dish to pair them into a complete meal

**Recipe Features**
- Filter by cook time or rating
- Photo gallery for recipes
- Add comment when rating a recipe

**Infrastructure**
- Further mobile-responsive improvements
- Database integration (PostgreSQL/MongoDB)

### Implemented

**2610.00.0**
- New full-width planner interface with legacy interface kept at `/legacy/`
- Recipe search by name or ingredient, and multi-select category filter
- Recipe archive with an Archived list to view and restore
- Week picker (this week through +4 weeks), auto-save, floating Selected panel
- Recipe mode (screen stays awake), Export data, server-only plans and ratings

## Family Members

Family members are stored in `data/members.json` and loaded dynamically via the `/api/members` endpoint.

---

Enjoy discovering your family's favorite recipes!
