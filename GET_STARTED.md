# 🚀 Get Started - Dinner Time

Welcome to your restructured Dinner Time project! This guide will help you get up and running in 5 minutes.

## ✅ What's New

Your project now has:
- ✅ **Professional Git structure** - Ready for version control
- ✅ **Docker containerization** - Deploy anywhere
- ✅ **Production nginx setup** - Optimized web server
- ✅ **Comprehensive documentation** - Everything you need to know
- ✅ **Clean separation** - Frontend, data, infrastructure, scripts

## 🎯 Quick Start (Choose One)

### Option 1: Open Locally (Fastest)

```bash
cd /Users/travisrobertson/Code/dinner_time/frontend/public
open index.html
```

✅ **Pro:** Instant, no setup needed
❌ **Con:** Some features may need a server

### Option 2: Run with Python (Best for Development)

```bash
cd /Users/travisrobertson/Code/dinner_time/frontend/public
python3 -m http.server 8000
```

Then visit: **http://localhost:8000**

✅ **Pro:** Full functionality, easy to use
✅ **Pro:** See changes immediately

### Option 3: Run with Docker (Production-Like)

```bash
cd /Users/travisrobertson/Code/dinner_time/docker
docker-compose up
```

Then visit: **http://localhost:8080**

✅ **Pro:** Exactly like production
✅ **Pro:** Includes nginx optimization
❌ **Con:** Requires Docker installed

## 📁 New Project Structure

```
dinner-time/
├── frontend/public/          ← Your web app
│   ├── index.html           ← Main application
│   ├── upload.html          ← Recipe upload
│   └── assets/
│       ├── css/styles.css
│       └── js/
│           ├── planner.js   ← Weekly planning
│           ├── script.js    ← Ratings & dashboard
│           └── config.js    ← Configuration
│
├── data/                     ← All data files
│   ├── recipes/
│   │   ├── master_recipes.json    ← Recipe database
│   │   └── archives/              ← Historical recipes
│   └── uploads/              ← Upload staging
│
├── docker/                   ← Docker setup
│   ├── Dockerfile           ← Container build
│   ├── nginx.conf           ← Web server config
│   └── docker-compose.yml   ← Easy deployment
│
├── scripts/                  ← Automation
│   └── process_recipes.sh   ← Batch processing
│
└── docs/                     ← Documentation
    ├── QUICK_START.md       ← User guide
    ├── AUTOMATION_GUIDE.md  ← Automation setup
    ├── DEPLOYMENT.md        ← How to deploy
    └── ARCHITECTURE.md      ← Technical details
```

## 🔥 What Can You Do Now?

### 1. Plan This Week's Meals (2 minutes)
1. Open the app (using any option above)
2. Click **"Weekly Planner"** tab
3. Select 3-4 recipes
4. Click **"Generate Shopping List"**
5. Print and shop! 🛒

### 2. Rate a Recipe (30 seconds)
1. Click **"Rate a Recipe"** tab
2. Select your name
3. Choose the recipe
4. Rate it 1-5 stars
5. Submit!

### 3. View Family Favorites (instant)
1. Click **"Dashboard"** tab
2. See overall favorites
3. Check individual preferences
4. View rating history

### 4. Upload a New Recipe (1 minute)
1. Click **"📤 Upload New Recipes"** link
2. Drag and drop recipe image/PDF
3. File is saved to `data/uploads/`
4. Process with Claude Code:
   ```
   Read data/uploads/images/your-recipe.jpg
   Extract this recipe and add it to data/recipes/master_recipes.json
   ```
5. Recipe appears automatically in planner!

## 🚢 Deploy to Production

### Quick Deploy (5 minutes)

**On any server with Docker:**
```bash
# Clone or copy your project
cd dinner-time

# Start it up
cd docker
docker-compose up -d

# Access at http://your-server:8080
```

**Want a domain name?**
- Set up nginx reverse proxy
- Add SSL with Let's Encrypt
- Point domain to your server

See **docs/DEPLOYMENT.md** for detailed instructions.

## 📚 Documentation Guide

| Need to... | Read this... |
|------------|-------------|
| Use the app | **docs/QUICK_START.md** |
| Set up automation | **docs/AUTOMATION_GUIDE.md** |
| Deploy to server | **docs/DEPLOYMENT.md** |
| Understand architecture | **docs/ARCHITECTURE.md** |
| See what changed | **MIGRATION_SUMMARY.md** |
| Understand structure | **PROJECT_STRUCTURE.md** |

## 🐳 Docker Commands Cheat Sheet

```bash
# Build and run
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## 🔧 Common Tasks

### Add a New Recipe Manually

Edit `data/recipes/master_recipes.json`:
```json
{
  "id": "new-recipe-name",
  "name": "New Recipe Display Name",
  "source": "Source Name",
  "url": "https://recipe-url.com",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "category": "Chicken",
  "ingredients": [
    {"item": "chicken breast", "amount": "2", "unit": "lbs"}
  ],
  "instructions": [
    "Step 1",
    "Step 2"
  ]
}
```

### Backup Your Data

```bash
# Backup recipes
cp data/recipes/master_recipes.json ~/backups/recipes_$(date +%Y%m%d).json

# Backup uploads
tar -czf ~/backups/uploads_$(date +%Y%m%d).tar.gz data/uploads/

# Backup ratings (from browser)
# Open DevTools (F12) → Console → Run:
localStorage.getItem('dinnerRatings')
# Copy and save the output
```

### Initialize Git

```bash
cd /Users/travisrobertson/Code/dinner_time

# Initialize
git init

# Add files
git add .

# Commit
git commit -m "Initial commit: Dinner Time v1.0"

# Connect to GitHub (create repo first)
git remote add origin https://github.com/yourusername/dinner-time.git
git push -u origin main
```

## ⚠️ Important Notes

### Old Files Still Present

The original structure is still there:
- `web/` (old)
- `recipes/` (old - not in data/)
- `uploads/` (old - not in data/)

**Once you verify everything works, you can delete them:**
```bash
rm -rf web/ recipes/ uploads/
rm AUTOMATION_GUIDE.md QUICK_START.md process_recipes.sh
```

### Paths Have Changed

- **HTML assets:** Now in `assets/css/` and `assets/js/`
- **Recipe data:** Now in `data/recipes/master_recipes.json`
- **Uploads:** Now in `data/uploads/`

All files have been updated to use the new paths.

## 🆘 Troubleshooting

### App doesn't load?
- Check browser console (F12)
- Look for 404 errors
- Verify you're in the right directory

### Recipes don't appear?
- Check `data/recipes/master_recipes.json` exists
- Verify JSON is valid: `python3 -m json.tool < data/recipes/master_recipes.json`
- Check browser console for fetch errors

### Docker won't start?
- Check port 8080 is free: `lsof -i :8080`
- View logs: `docker-compose logs`
- Try rebuild: `docker-compose build --no-cache`

### Ratings not saving?
- Check browser localStorage is enabled
- Don't use private/incognito mode
- Try different browser

## 🎉 Next Steps

1. **Test everything works** ✅
2. **Initialize Git repository** 📦
3. **Clean up old files** 🧹
4. **Deploy to production** 🚀
5. **Set up automation** 🤖
6. **Enjoy cooking!** 👨‍🍳

## 💡 Pro Tips

1. **Mobile Access:** Access from your phone while shopping!
2. **Print Shopping Lists:** Use Print button for paper lists
3. **Rate Consistently:** Rate right after eating for best results
4. **Batch Upload:** Upload multiple recipes at once
5. **Backup Regularly:** Keep your recipes safe

## 📞 Get Help

- Read the docs in `docs/` folder
- Check **MIGRATION_SUMMARY.md** for changes
- Use Claude Code for questions
- Report issues on GitHub (once you push)

---

**Status:** ✅ Ready to Use
**Version:** 1.0.0
**Last Updated:** January 31, 2024

Happy cooking! 🍽️
