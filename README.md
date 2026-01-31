# Dinner Time - Weekly Recipe Collection & Rating System

A family dinner recipe collection with an interactive web-based meal planning, rating system, and shopping list generator. Features a Node.js backend for persistent data storage and direct file uploads.

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
├── server/                       # Node.js backend server
│   ├── server.js                # Express API server
│   └── package.json             # Node.js dependencies
│
├── data/                         # Data layer (persisted by server)
│   ├── master_recipes.json      # Master recipe database
│   ├── weekly_plans.json        # Weekly meal plans by ISO week
│   ├── ratings.json             # Recipe ratings from family members
│   └── uploads/                 # Upload repository (created dynamically)
│       ├── images/              # Uploaded recipe images
│       ├── pdfs/                # Uploaded recipe PDFs
│       └── processed/           # Processed files moved here
│
├── docker/                       # Docker configuration
│   ├── Dockerfile               # Node.js Alpine container
│   ├── docker-compose.yml       # Service orchestration
│   └── docker-entrypoint.sh     # Initializes config files on first run
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
The planner allows you to:
- Browse all recipes from the master database
- Select 3-4 recipes for the upcoming week
- **Current Week / Next Week tabs** for planning ahead
- View recipe details in a modal overlay with print option
- Print individual recipes directly from recipe cards
- Save weekly plans to the server
- Generate an automated shopping list

### Shopping List Generator
Automatically creates an organized shopping list:
- Aggregates ingredients from selected recipes
- Combines duplicate ingredients intelligently
- Organizes by category (Produce, Meat & Poultry, Dairy, Pantry, Spices)
- Opens in a modal overlay for easy viewing
- Print directly without opening new tabs
- Export functionality available

### Recipe Viewing
- **Modal overlays** for viewing full recipe details
- **View icon** on each recipe card for quick access
- **Print icon** on each recipe card for direct printing
- Sticky close/print buttons while scrolling long recipes

### Rating System
The web application allows family members to:
- Select their name (Travis, Heidi, Stella, or Dylan)
- Choose a recipe from a dropdown list
- Rate recipes on a scale of 1-5 (5 being great)
- Submit ratings with automatic date/time tracking
- **Ratings are persisted to the server** (not just localStorage)

### Dashboard
- **Overall Favorites**: View all recipes ranked by average rating
- **Favorites by Person**: See each family member's top-rated recipes
- **Ratings History**: Complete log of all ratings with date, user, recipe, and score
- **Export buttons** to download plans and ratings data

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
# Visit http://localhost:3000
```

### Planning Your Week
1. Open the application in your web browser
2. On the "Current Week" tab (default):
   - Browse all available recipes from the master database
   - Click on 3-4 recipes to select them for the week
   - Use the **view icon** (eye) to see full recipe details in a modal
   - Use the **print icon** to print individual recipes
   - Selected recipes appear in the "Selected Recipes" section
   - Click "Save List" to save with ISO week date
   - Click "Generate Shopping List" to view in modal
   - Print the shopping list directly from the modal
3. Use the "Next Week" tab to plan ahead for the following week

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

### Server-Side Storage (Node.js Backend)
The application uses a Node.js Express server for persistent data storage:
- **Recipes**: `data/master_recipes.json`
- **Weekly Plans**: `data/weekly_plans.json` - Saved via API
- **Ratings**: `data/ratings.json` - Saved via API
- **Uploads**: `data/uploads/images/` and `data/uploads/pdfs/`

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recipes` | Get all recipes |
| GET | `/api/plans` | Get all weekly plans |
| POST | `/api/plans` | Save weekly plans |
| GET | `/api/ratings` | Get all ratings |
| POST | `/api/ratings` | Save all ratings |
| POST | `/api/ratings/add` | Add a single rating |
| POST | `/api/upload` | Upload a single file |
| POST | `/api/upload/multiple` | Upload multiple files |
| GET | `/api/uploads` | List uploaded files |
| DELETE | `/api/uploads/:folder/:file` | Delete uploaded file |

### Fallback to localStorage
If the server is unavailable, the frontend falls back to browser localStorage for offline functionality.

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
1. **Master Database** (`data/recipes/master_recipes.json`) - Single source of truth with sequential recipe IDs
2. **Weekly Planner** - Reads from API, saves plans via POST request
3. **Plan History** - View and reload past weekly plans by ISO week
4. **Shopping List Generator** - Aggregates and categorizes ingredients from selected recipes
5. **Rating System** - Records ratings via API with server-side persistence
6. **Dashboard** - Analyzes ratings to show favorites overall and by person
7. **File Upload** - Direct upload to server via multipart form data

### Key Features
- **Sequential Recipe IDs**: Recipes have numeric IDs for easy database management
- **ISO Week Tracking**: Plans tracked by ISO 8601 week format (YYYY-Www)
- **Modal Overlays**: Recipe viewing and shopping list in modal dialogs
- **Direct Printing**: Print recipes and lists without opening new windows
- **Planning Modes**: Current week and next week planning tabs
- **Volume Persistence**: Data directory mounted as Docker volume
- **Health Checks**: Container includes health monitoring
- **API Fallback**: Falls back to localStorage if server unavailable

### Evolution & Extensibility
The system is designed to grow:
- Add recipes to `master_recipes.json` - they instantly appear everywhere
- Weekly plans stored by ISO week for easy historical tracking
- Rating data persists on server for multi-device access
- Shopping list aggregates and organizes automatically
- Ready for database integration (PostgreSQL, MongoDB)

## Future Enhancements

### Implemented ✓
- ✓ Save and load weekly meal plans by ISO week
- ✓ Plan history viewer with reload capability
- ✓ Sequential recipe IDs for database compatibility
- ✓ Docker containerization
- ✓ Shopping list with category organization
- ✓ Node.js backend API for data persistence
- ✓ Server-side storage for ratings and plans
- ✓ Direct file upload for recipe images/PDFs
- ✓ Modal overlays for recipes and shopping list
- ✓ Print functionality without new windows
- ✓ Current week / Next week planning tabs
- ✓ Export buttons for plans and ratings
- ✓ View and print icons on recipe cards

### Planned
- Read family members from members.json
- Create browser interfaces to manually edit members.json, ratings.json (add/delete/change)
- Add favorites option with user selector and add/remove functionality
- Recipe search and filter by category, cook time, or rating
- Ingredient substitution suggestions
- Nutrition information per recipe
- Photo gallery for recipes
- Comments and notes on recipes
- Meal prep instructions and tips
- Mobile-responsive improvements
- Recipe scaling (adjust servings)
- Database integration (PostgreSQL/MongoDB)
- Multi-device sync
- User authentication

## Family Members

- Read from file

---

Enjoy discovering your family's favorite recipes!
