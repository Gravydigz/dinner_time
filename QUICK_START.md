# Quick Start Guide - Dinner Time

## 🚀 Getting Started (2 minutes)

### Open the App
```bash
cd /Users/travisrobertson/Code/dinner_time
open web/index.html
```

## 📅 Weekly Workflow

### 1. Plan Your Week (5 minutes)
- Click "Weekly Planner" tab
- Select 3-4 recipes for the week
- Click "Generate Shopping List"
- Print the shopping list

### 2. Shop (at the store)
- Use printed shopping list
- Check off items as you add to cart

### 3. Cook (during the week)
- Refer to recipe markdown files in `recipes/week1/` or `recipes/week2/`
- Follow ingredient amounts and instructions

### 4. Rate Recipes (after dinner)
- Click "Rate a Recipe" tab
- Select your name
- Choose the recipe you just made
- Rate 1-5 (5 = great!)
- Submit

### 5. View Dashboard
- See family favorites ranked
- Check individual preferences
- Review rating history

## 📤 Adding New Recipes

### Quick Method
1. Open `web/upload.html`
2. Drag recipe image/PDF into the upload zone
3. Open Claude Code in terminal:
   ```bash
   cd /Users/travisrobertson/Code/dinner_time
   ```
4. Tell Claude Code:
   ```
   Read uploads/images/[your-file.jpg]
   Extract this recipe and add it to master_recipes.json
   ```
5. Recipe now appears in planner automatically!

### Batch Processing
```bash
# Process all uploaded files at once
./process_recipes.sh
```

## 🔧 Common Tasks

### View All Recipes
```bash
cat recipes/master_recipes.json | python -m json.tool
```

### Check Upload Queue
```bash
ls -l uploads/images/
ls -l uploads/pdfs/
```

### See Processed Files
```bash
ls -l uploads/processed/
```

### Backup Your Data
```bash
# Backup recipes
cp recipes/master_recipes.json recipes/master_recipes_backup_$(date +%Y%m%d).json

# Browser data (ratings) is in localStorage
# Export from browser DevTools: localStorage.getItem('dinnerRatings')
```

## 🎯 Tips & Tricks

### Best Recipe Photos
- ✅ Clear, well-lit images
- ✅ Capture full recipe card
- ✅ Include ingredients AND instructions
- ✅ Readable text

### Shopping List Pro Tips
- Print in advance (not in the store)
- Organize your list by store layout
- Add custom items with a pen if needed
- Keep for meal prep reference

### Rating Strategy
- Rate right after eating (while fresh)
- Include all family members
- Be honest (helps find true favorites)
- Rate same recipe multiple times to track consistency

### Dashboard Insights
- **Overall Favorites** = What to make more often
- **Individual Favorites** = Customize when someone picks
- **Low Ratings** = Maybe skip or modify recipe

## 📁 File Locations

| What | Where |
|------|-------|
| Main App | `web/index.html` |
| Upload Interface | `web/upload.html` |
| Recipe Database | `recipes/master_recipes.json` |
| Recipe Details | `recipes/week1/`, `recipes/week2/` |
| Upload Images | `uploads/images/` |
| Upload PDFs | `uploads/pdfs/` |
| Processed Files | `uploads/processed/` |

## 🆘 Troubleshooting

### Recipe not showing in planner?
- Check `master_recipes.json` is valid JSON
- Verify recipe has all required fields
- Refresh browser page

### Can't upload files?
- Use `web/upload.html` (not `index.html`)
- Check browser allows file operations
- Try drag-and-drop instead of clicking

### Shopping list incomplete?
- Verify all selected recipes have ingredients
- Check ingredient format in JSON
- Some "to taste" items may not show amounts

### Ratings not saving?
- Check browser localStorage is enabled
- Don't use private/incognito mode
- Data is per-browser (not synced across devices)

## 📚 Learn More

- Full documentation: `README.md`
- Automation setup: `AUTOMATION_GUIDE.md`
- Recipe structure: Look at existing recipes in `master_recipes.json`

## 🎉 Enjoy!

Your Dinner Time system is ready to:
- ✅ Plan weekly menus
- ✅ Generate shopping lists
- ✅ Track family favorites
- ✅ Grow your recipe collection

Happy cooking! 👨‍🍳👩‍🍳
