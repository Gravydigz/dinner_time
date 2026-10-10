# Quick Start - Dinner Time

## Run the App

**Local development** (Node.js server + frontend, http://localhost:3000):
```bash
cd server
npm install
npm start
```

**Docker** (http://localhost:3010):
```bash
cd docker
docker-compose up --build
```

The app needs the Node.js server for its `/api/*` endpoints; opening `index.html` directly or using a plain static file server will not work.

### Data for local development
Real data files in `data/` are age-encrypted in the repository (see README → Data Storage). With the age key installed and `git config core.hooksPath .githooks` set, they are decrypted automatically on checkout and pull. Without the key, use the fake samples:
```bash
for f in data/*.example.json; do cp "$f" "${f%.example.json}.json"; done
```

## Plan the Week

1. Pick the week with the `‹ This week ›` arrows (this week through +4 weeks)
2. Narrow the recipes with the category buttons (select several, or **All**) or the search box (recipe names and ingredients)
3. Click a tile to read the recipe; click ✓ to add it to the week — it saves immediately
4. Click **☰ Selected** to review the week, then **🛒 Shopping List** to see and print the list

While a recipe is open the screen stays awake (☀ Screen on), so it won't sleep while you cook.

## Rate a Recipe

1. Click the **Rate** tab
2. Choose your name, the recipe, and a score from 1 to 5
3. Click **Submit Rating** — average ratings appear as ★ on the recipe tiles

## See Family Favorites

Click the **Dashboard** tab for overall favorites, favorites by person, and the full ratings history.

## Look Back at Past Weeks

Click the **History** tab to see past plans by ISO week. **Load This Plan** copies that week's recipes into the week shown in the planner.

## Manage Recipes

- **Edit**: pencil icon on a tile
- **Archive**: turn on **Archived** beside Save in the edit window to hide a recipe from the planner and rating list
- **Restore**: About → **Archived** → Unarchive
- **Add**: the 📤 **Upload** page (images, PDFs, URLs or pasted text), or edit `data/master_recipes.json` directly

## Back Up Your Data

About → **Export data** downloads one JSON file with all recipes, members, ratings and plans.

## Legacy Interface

The previous interface is kept at `/legacy/`. Switch with About → **Interface**.

## Troubleshooting

**"Could not save to the server" / "Could not load …" messages**
- The server isn't reachable; nothing was changed. Check the container or `npm start` is running, then refresh.

**Recipe mode badge doesn't appear**
- Screen wake lock needs HTTPS (or localhost) and a supporting browser. Recipes still open normally without it.

**Recipes not loading**
- Validate the JSON: `python3 -m json.tool < data/master_recipes.json`

## More Help

- Deployment: `docs/DEPLOYMENT.md`
- Recipe processing with n8n: `docs/N8N_RECIPE_PROCESSING.md`
- Other automation options: `docs/AUTOMATION_GUIDE.md`
- Architecture: `docs/ARCHITECTURE.md`
