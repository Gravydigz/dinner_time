// Master recipes database
let masterRecipes = [];
let selectedRecipes = [];
let weeklyPlans = [];
let planningMode = 'current'; // 'current' or 'next'

// Get ISO week number and year
function getISOWeek(date = new Date()) {
    const target = new Date(date.valueOf());
    const dayNumber = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNumber + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return {
        year: target.getFullYear(),
        week: 1 + Math.ceil((firstThursday - target) / 604800000),
        isoWeek: `${target.getFullYear()}-W${String(1 + Math.ceil((firstThursday - target) / 604800000)).padStart(2, '0')}`
    };
}

// Get ISO week for next week
function getNextISOWeek() {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return getISOWeek(nextWeek);
}

// Get the active planning week based on mode
function getActivePlanningWeek() {
    return planningMode === 'next' ? getNextISOWeek() : getISOWeek();
}

// Switch planning mode (current or next week)
function switchPlanningMode(mode) {
    planningMode = mode;

    // Update UI titles
    const title = document.getElementById('planner-title');
    const subtitle = document.getElementById('planner-subtitle');
    const weekInfo = getActivePlanningWeek();

    if (mode === 'next') {
        title.textContent = `Planning for ${weekInfo.isoWeek} (Next Week)`;
        subtitle.textContent = 'Select 3-4 recipes for next week';
    } else {
        title.textContent = `Planning for ${weekInfo.isoWeek} (Current Week)`;
        subtitle.textContent = 'Select 3-4 recipes for this week';
    }

    // Clear current selection and load saved plan for the target week
    selectedRecipes = [];
    loadPlanForWeek(weekInfo.isoWeek);
    updateRecipeSelection();
}

// Load plan for a specific week
function loadPlanForWeek(isoWeek) {
    const plan = weeklyPlans.find(p => p.isoWeek === isoWeek);

    if (plan) {
        plan.recipeIds.forEach(recipeId => {
            const recipe = masterRecipes.find(r => r.recipeId === recipeId);
            if (recipe && !selectedRecipes.find(r => r.id === recipe.id)) {
                selectedRecipes.push(recipe);
            }
        });
    }
}

// Load weekly plans from API (with localStorage fallback)
async function loadWeeklyPlans() {
    try {
        const response = await fetch('/api/plans');
        if (response.ok) {
            const data = await response.json();
            weeklyPlans = data.plans || [];
            // Also save to localStorage as backup
            localStorage.setItem('weeklyPlans', JSON.stringify(weeklyPlans));
            return weeklyPlans;
        }
    } catch (error) {
        console.log('API not available, falling back to localStorage');
    }

    // Fallback to localStorage
    const localSaved = localStorage.getItem('weeklyPlans');
    weeklyPlans = localSaved ? JSON.parse(localSaved) : [];
    return weeklyPlans;
}

// Save weekly plans to API (with localStorage fallback)
async function saveWeeklyPlans() {
    // Always save to localStorage as backup
    localStorage.setItem('weeklyPlans', JSON.stringify(weeklyPlans));

    // Try to save to API
    try {
        const response = await fetch('/api/plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plans: weeklyPlans })
        });
        if (response.ok) {
            console.log('Weekly plans saved to server');
        }
    } catch (error) {
        console.log('Could not save to API, saved to localStorage only');
    }
}

// Load master recipes from API
async function loadMasterRecipes() {
    try {
        const response = await fetch('/api/recipes');
        if (!response.ok) throw new Error('Server returned ' + response.status);
        const data = await response.json();
        masterRecipes = data.recipes;
        renderMasterRecipeList();
        loadCurrentWeekPlan();
    } catch (error) {
        console.error('Error loading master recipes:', error);
        showRecipeLoadError();
    }
}

// Show error when recipes cannot be loaded
function showRecipeLoadError() {
    const container = document.getElementById('master-recipe-list');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <h3>Unable to load recipes</h3>
                <p>Could not connect to the server. Please ensure the server is running and try refreshing the page.</p>
            </div>
        `;
    }
}

// Render master recipe list
function renderMasterRecipeList() {
    const container = document.getElementById('master-recipe-list');
    if (!container) return;

    container.innerHTML = masterRecipes.map(recipe => `
        <div class="recipe-card-selectable" data-recipe-id="${recipe.id}" onclick="toggleRecipeSelection('${recipe.id}')">
            <div class="recipe-card-header">
                <h4>${recipe.name}</h4>
                <div class="recipe-card-actions">
                    <button class="view-icon-btn" onclick="event.stopPropagation(); printRecipe('${recipe.id}')" title="Print Recipe">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                    </button>
                    <button class="view-icon-btn" onclick="event.stopPropagation(); viewRecipe('${recipe.id}')" title="View Recipe">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="recipe-meta">
                <span>⏱️ ${recipe.prepTime + recipe.cookTime} min</span>
                <span>👥 ${recipe.servings} servings</span>
            </div>
            <span class="recipe-category">${recipe.category}</span>
        </div>
    `).join('');
}

// Toggle recipe selection
function toggleRecipeSelection(recipeId) {
    const recipe = masterRecipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const index = selectedRecipes.findIndex(r => r.id === recipeId);

    if (index > -1) {
        // Remove from selection
        selectedRecipes.splice(index, 1);
    } else {
        // Add to selection
        selectedRecipes.push(recipe);
    }

    updateRecipeSelection();
}

// Update recipe selection display
function updateRecipeSelection() {
    // Update visual selection in recipe cards
    document.querySelectorAll('.recipe-card-selectable').forEach(card => {
        const recipeId = card.dataset.recipeId;
        if (selectedRecipes.find(r => r.id === recipeId)) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });

    // Update selected count
    const countEl = document.getElementById('selected-count');
    if (countEl) {
        countEl.textContent = selectedRecipes.length;
    }

    // Update selected recipes list
    const listContainer = document.getElementById('selected-recipes-list');
    if (listContainer) {
        if (selectedRecipes.length === 0) {
            listContainer.innerHTML = '<p class="no-data">No recipes selected yet</p>';
        } else {
            listContainer.innerHTML = selectedRecipes.map(recipe => `
                <div class="selected-recipe-item">
                    <span class="name">${recipe.name}</span>
                    <div class="recipe-actions">
                        <button class="view-btn" onclick="viewRecipe('${recipe.id}')">View</button>
                        <button class="remove-btn" onclick="toggleRecipeSelection('${recipe.id}')">Remove</button>
                    </div>
                </div>
            `).join('');
        }
    }

    // Enable/disable buttons
    const generateBtn = document.getElementById('generate-shopping-btn');
    if (generateBtn) {
        generateBtn.disabled = selectedRecipes.length === 0;
    }
    // Save button is always enabled to allow saving empty lists
    const saveBtn = document.getElementById('save-list-btn');
    if (saveBtn) {
        saveBtn.disabled = false;
    }
}

// Save weekly plan to database
function saveWeeklyPlan() {
    const weekInfo = getActivePlanningWeek();
    const recipeIds = selectedRecipes.map(r => r.recipeId);

    // Check if plan already exists for this week
    const existingPlanIndex = weeklyPlans.findIndex(p => p.isoWeek === weekInfo.isoWeek);

    const plan = {
        planId: existingPlanIndex >= 0 ? weeklyPlans[existingPlanIndex].planId : Date.now(),
        isoWeek: weekInfo.isoWeek,
        year: weekInfo.year,
        week: weekInfo.week,
        recipeIds: recipeIds,
        createdAt: existingPlanIndex >= 0 ? weeklyPlans[existingPlanIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (existingPlanIndex >= 0) {
        // Update existing plan
        weeklyPlans[existingPlanIndex] = plan;
    } else {
        // Add new plan
        weeklyPlans.push(plan);
    }

    saveWeeklyPlans();
    console.log('Weekly plan saved:', plan);
    return plan;
}

// View recipe in a modal overlay
function viewRecipe(recipeId) {
    const recipe = masterRecipes.find(r => r.id === recipeId);
    if (!recipe) {
        alert('Recipe not found');
        return;
    }

    const ingredientsList = recipe.ingredients ? recipe.ingredients.map(ing => {
        const amount = ing.amount && ing.amount !== 'to taste' ? `${ing.amount} ${ing.unit}` : (ing.amount || '');
        const additional = ing.additional ? ` (${ing.additional})` : '';
        return `<li>${amount} ${ing.item}${additional}</li>`;
    }).join('') : '<li>No ingredients listed</li>';

    const instructionsList = recipe.instructions ? recipe.instructions.map((step, i) =>
        `<li>${step}</li>`
    ).join('') : '<li>No instructions listed</li>';

    const sourceInfo = recipe.url ?
        `<p><strong>Source:</strong> <a href="${recipe.url}" target="_blank">${recipe.source}</a></p>` :
        (recipe.source ? `<p><strong>Source:</strong> ${recipe.source}</p>` : '');

    // Remove existing modal if present
    const existingModal = document.getElementById('recipe-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modalHtml = `
        <div id="recipe-modal" class="recipe-modal-overlay" onclick="closeRecipeModal(event)">
            <div class="recipe-modal-content" onclick="event.stopPropagation()">
                <div class="recipe-modal-actions">
                    <button class="recipe-modal-icon-btn" onclick="printRecipe('${recipe.id}')" title="Print Recipe">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                    </button>
                    <button class="recipe-modal-icon-btn" onclick="closeRecipeModal()" title="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div class="recipe-modal-header">
                    <h1>${recipe.name}</h1>
                    <span class="recipe-modal-category">${recipe.category}</span>
                    <div class="recipe-modal-meta">
                        <span>Prep: ${recipe.prepTime} min</span>
                        <span>Cook: ${recipe.cookTime} min</span>
                        <span>Serves: ${recipe.servings}</span>
                    </div>
                </div>

                <div class="recipe-modal-source">
                    ${sourceInfo}
                </div>

                <div class="recipe-modal-section">
                    <h2>Ingredients</h2>
                    <ul>${ingredientsList}</ul>
                </div>

                <div class="recipe-modal-section">
                    <h2>Instructions</h2>
                    <ol>${instructionsList}</ol>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
}

// Close recipe modal
function closeRecipeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('recipe-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// Print recipe using hidden iframe (no new tab/window)
function printRecipe(recipeId) {
    const recipe = masterRecipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const ingredientsList = recipe.ingredients ? recipe.ingredients.map(ing => {
        const amount = ing.amount && ing.amount !== 'to taste' ? `${ing.amount} ${ing.unit}` : (ing.amount || '');
        const additional = ing.additional ? ` (${ing.additional})` : '';
        return `<li>${amount} ${ing.item}${additional}</li>`;
    }).join('') : '<li>No ingredients listed</li>';

    const instructionsList = recipe.instructions ? recipe.instructions.map((step, i) =>
        `<li>${step}</li>`
    ).join('') : '<li>No instructions listed</li>';

    const sourceInfo = recipe.url ?
        `<p><strong>Source:</strong> <a href="${recipe.url}" target="_blank">${recipe.source}</a></p>` :
        (recipe.source ? `<p><strong>Source:</strong> ${recipe.source}</p>` : '');

    const printContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${recipe.name} - Dinner Time</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 30px;
        }
        .recipe-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 25px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .recipe-header h1 { margin-bottom: 10px; }
        .recipe-meta { display: flex; gap: 20px; flex-wrap: wrap; margin-top: 15px; font-size: 0.95rem; }
        .recipe-meta span { background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 5px; }
        .category-badge { display: inline-block; background: white; color: #667eea; padding: 5px 12px; border-radius: 5px; font-weight: 600; margin-top: 10px; }
        .source-info { margin-bottom: 20px; color: #666; }
        .source-info a { color: #667eea; }
        .section { background: #f8f9fa; border-radius: 10px; padding: 25px; margin-bottom: 20px; }
        .section h2 { color: #667eea; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea; }
        ul, ol { padding-left: 25px; }
        li { padding: 8px 0; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="recipe-header">
        <h1>${recipe.name}</h1>
        <span class="category-badge">${recipe.category}</span>
        <div class="recipe-meta">
            <span>Prep: ${recipe.prepTime} min</span>
            <span>Cook: ${recipe.cookTime} min</span>
            <span>Serves: ${recipe.servings}</span>
        </div>
    </div>
    <div class="source-info">${sourceInfo}</div>
    <div class="section"><h2>Ingredients</h2><ul>${ingredientsList}</ul></div>
    <div class="section"><h2>Instructions</h2><ol>${instructionsList}</ol></div>
</body>
</html>`;

    // Create hidden iframe for printing
    let printFrame = document.getElementById('print-frame');
    if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'print-frame';
        printFrame.style.position = 'absolute';
        printFrame.style.top = '-9999px';
        printFrame.style.left = '-9999px';
        document.body.appendChild(printFrame);
    }

    printFrame.contentDocument.open();
    printFrame.contentDocument.write(printContent);
    printFrame.contentDocument.close();

    // Wait for content to load then print
    printFrame.onload = function() {
        printFrame.contentWindow.print();
    };
}

// Save current week plan with user feedback
function saveCurrentWeekPlan() {
    const plan = saveWeeklyPlan();
    if (selectedRecipes.length === 0) {
        alert(`Cleared plan for ${plan.isoWeek}`);
    } else {
        alert(`Saved ${selectedRecipes.length} recipes for ${plan.isoWeek}`);
    }
}

// Generate shopping list
function generateShoppingList() {
    if (selectedRecipes.length === 0) {
        alert('Please select at least one recipe');
        return;
    }

    // Save the weekly plan
    saveWeeklyPlan();

    const shoppingList = {};

    // Aggregate ingredients from selected recipes
    selectedRecipes.forEach(recipe => {
        if (!recipe.ingredients) return;

        recipe.ingredients.forEach(ingredient => {
            const key = ingredient.item.toLowerCase();

            if (!shoppingList[key]) {
                shoppingList[key] = {
                    item: ingredient.item,
                    amount: ingredient.amount,
                    unit: ingredient.unit,
                    additional: ingredient.additional || '',
                    recipes: [recipe.name]
                };
            } else {
                // If same unit, try to add amounts
                if (shoppingList[key].unit === ingredient.unit) {
                    const currentAmount = parseFloat(shoppingList[key].amount);
                    const newAmount = parseFloat(ingredient.amount);

                    if (!isNaN(currentAmount) && !isNaN(newAmount)) {
                        shoppingList[key].amount = (currentAmount + newAmount).toString();
                    } else {
                        shoppingList[key].amount = `${shoppingList[key].amount} + ${ingredient.amount}`;
                    }
                } else {
                    shoppingList[key].amount = `${shoppingList[key].amount} ${shoppingList[key].unit} + ${ingredient.amount} ${ingredient.unit}`;
                    shoppingList[key].unit = '';
                }

                if (!shoppingList[key].recipes.includes(recipe.name)) {
                    shoppingList[key].recipes.push(recipe.name);
                }
            }
        });
    });

    // Categorize ingredients
    const categories = categorizeIngredients(Object.values(shoppingList));

    // Render shopping list in modal
    renderShoppingListModal(categories);
}

// Categorize ingredients
function categorizeIngredients(ingredients) {
    const categories = {
        'Produce': [],
        'Meat & Poultry': [],
        'Dairy & Eggs': [],
        'Pantry': [],
        'Spices & Seasonings': [],
        'Other': []
    };

    const produceKeywords = ['onion', 'garlic', 'tomato', 'spinach', 'kale', 'pepper', 'vegetable', 'carrot', 'broccoli', 'basil', 'lemon', 'shallot'];
    const meatKeywords = ['chicken', 'beef', 'sausage', 'steak'];
    const dairyKeywords = ['cream', 'cheese', 'butter', 'ricotta', 'mozzarella', 'parmesan', 'milk'];
    const pantryKeywords = ['pasta', 'rice', 'flour', 'oil', 'sauce', 'broth', 'stock', 'vinegar', 'mustard', 'bourbon', 'wine', 'tortellini', 'ravioli', 'honey'];
    const spiceKeywords = ['salt', 'pepper', 'seasoning', 'paprika', 'basil', 'oregano', 'flakes', 'bouillon'];

    ingredients.forEach(ingredient => {
        const itemLower = ingredient.item.toLowerCase();

        if (produceKeywords.some(keyword => itemLower.includes(keyword))) {
            categories['Produce'].push(ingredient);
        } else if (meatKeywords.some(keyword => itemLower.includes(keyword))) {
            categories['Meat & Poultry'].push(ingredient);
        } else if (dairyKeywords.some(keyword => itemLower.includes(keyword))) {
            categories['Dairy & Eggs'].push(ingredient);
        } else if (spiceKeywords.some(keyword => itemLower.includes(keyword))) {
            categories['Spices & Seasonings'].push(ingredient);
        } else if (pantryKeywords.some(keyword => itemLower.includes(keyword))) {
            categories['Pantry'].push(ingredient);
        } else {
            categories['Other'].push(ingredient);
        }
    });

    return categories;
}

// Render shopping list in modal
function renderShoppingListModal(categories) {
    // Remove existing modal if present
    const existingModal = document.getElementById('shopping-list-modal');
    if (existingModal) {
        existingModal.remove();
    }

    let categoriesHtml = '';
    Object.keys(categories).forEach(category => {
        if (categories[category].length > 0) {
            categoriesHtml += `
                <div class="shopping-modal-category">
                    <h3>${category}</h3>
                    <ul>
                        ${categories[category].map(ingredient => {
                            const amountStr = ingredient.amount && ingredient.amount !== 'to taste'
                                ? `${ingredient.amount} ${ingredient.unit}`
                                : ingredient.amount || '';
                            const additional = ingredient.additional ? ` (${ingredient.additional})` : '';
                            const recipeNames = ingredient.recipes.join(', ');
                            return `
                                <li>
                                    <input type="checkbox">
                                    <span class="ingredient-info"><strong>${amountStr}</strong> ${ingredient.item}${additional}</span>
                                    <span class="ingredient-recipes">${recipeNames}</span>
                                </li>
                            `;
                        }).join('')}
                    </ul>
                </div>
            `;
        }
    });

    const weekInfo = getActivePlanningWeek();
    const modalHtml = `
        <div id="shopping-list-modal" class="recipe-modal-overlay" onclick="closeShoppingListModal(event)">
            <div class="recipe-modal-content" onclick="event.stopPropagation()">
                <div class="recipe-modal-actions">
                    <button class="recipe-modal-icon-btn" onclick="printShoppingList()" title="Print Shopping List">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                    </button>
                    <button class="recipe-modal-icon-btn" onclick="closeShoppingListModal()" title="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div class="recipe-modal-header">
                    <h1>Shopping List</h1>
                    <div class="recipe-modal-meta">
                        <span>Week: ${weekInfo.isoWeek}</span>
                        <span>${selectedRecipes.length} Recipes</span>
                    </div>
                </div>

                <div class="shopping-modal-recipes">
                    <h3>Recipes for this week:</h3>
                    <ul>
                        ${selectedRecipes.map(r => `<li><strong>${r.name}</strong> (${r.servings} servings)</li>`).join('')}
                    </ul>
                </div>

                ${categoriesHtml}
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
}

// Close shopping list modal
function closeShoppingListModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('shopping-list-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// Print shopping list
function printShoppingList() {
    const categories = {};
    const shoppingList = {};

    selectedRecipes.forEach(recipe => {
        if (!recipe.ingredients) return;
        recipe.ingredients.forEach(ingredient => {
            const key = ingredient.item.toLowerCase();
            if (!shoppingList[key]) {
                shoppingList[key] = {
                    item: ingredient.item,
                    amount: ingredient.amount,
                    unit: ingredient.unit,
                    additional: ingredient.additional || '',
                    recipes: [recipe.name]
                };
            } else {
                if (shoppingList[key].unit === ingredient.unit) {
                    const currentAmount = parseFloat(shoppingList[key].amount);
                    const newAmount = parseFloat(ingredient.amount);
                    if (!isNaN(currentAmount) && !isNaN(newAmount)) {
                        shoppingList[key].amount = (currentAmount + newAmount).toString();
                    } else {
                        shoppingList[key].amount = `${shoppingList[key].amount} + ${ingredient.amount}`;
                    }
                } else {
                    shoppingList[key].amount = `${shoppingList[key].amount} ${shoppingList[key].unit} + ${ingredient.amount} ${ingredient.unit}`;
                    shoppingList[key].unit = '';
                }
                if (!shoppingList[key].recipes.includes(recipe.name)) {
                    shoppingList[key].recipes.push(recipe.name);
                }
            }
        });
    });

    const categorizedList = categorizeIngredients(Object.values(shoppingList));

    let categoriesHtml = '';
    Object.keys(categorizedList).forEach(category => {
        if (categorizedList[category].length > 0) {
            categoriesHtml += `
                <div class="shopping-category">
                    <h3>${category}</h3>
                    <ul>
                        ${categorizedList[category].map(ingredient => {
                            const amountStr = ingredient.amount && ingredient.amount !== 'to taste'
                                ? `${ingredient.amount} ${ingredient.unit}`
                                : ingredient.amount || '';
                            const additional = ingredient.additional ? ` (${ingredient.additional})` : '';
                            const recipeNames = ingredient.recipes.join(', ');
                            return `<li><strong>${amountStr}</strong> ${ingredient.item}${additional} <span style="color:#888;font-style:italic;float:right;">${recipeNames}</span></li>`;
                        }).join('')}
                    </ul>
                </div>
            `;
        }
    });

    const weekInfo = getActivePlanningWeek();
    const printContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Shopping List - ${weekInfo.isoWeek}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; }
        h1 { color: #667eea; margin-bottom: 5px; }
        .week-info { color: #666; margin-bottom: 20px; }
        .shopping-category { margin-bottom: 25px; }
        .shopping-category h3 { color: #667eea; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #667eea; }
        .shopping-category ul { list-style: none; padding-left: 0; }
        .shopping-category li { padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .shopping-category li:last-child { border-bottom: none; }
    </style>
</head>
<body>
    <h1>Shopping List</h1>
    <p class="week-info">Week: ${weekInfo.isoWeek} | ${selectedRecipes.length} Recipes</p>
    ${categoriesHtml}
</body>
</html>`;

    // Create hidden iframe for printing
    let printFrame = document.getElementById('print-frame');
    if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'print-frame';
        printFrame.style.position = 'absolute';
        printFrame.style.top = '-9999px';
        printFrame.style.left = '-9999px';
        document.body.appendChild(printFrame);
    }

    printFrame.contentDocument.open();
    printFrame.contentDocument.write(printContent);
    printFrame.contentDocument.close();

    // Wait for content to load then print
    printFrame.onload = function() {
        printFrame.contentWindow.print();
    };
}

// Render plan history
async function renderPlanHistory() {
    const container = document.getElementById('plan-history-list');
    if (!container) return;

    const plans = await loadWeeklyPlans();

    if (!plans || plans.length === 0) {
        container.innerHTML = '<p class="no-data">No weekly plans yet. Create your first plan in the Weekly Planner tab!</p>';
        return;
    }

    // Sort by week descending (most recent first)
    const sortedPlans = [...plans].sort((a, b) => b.isoWeek.localeCompare(a.isoWeek));

    container.innerHTML = sortedPlans.map(plan => {
        // Get recipe details
        const planRecipes = plan.recipeIds
            .map(id => masterRecipes.find(r => r.recipeId === id))
            .filter(r => r); // Remove any not found

        const createdDate = new Date(plan.createdAt).toLocaleDateString();
        const updatedDate = new Date(plan.updatedAt).toLocaleDateString();

        return `
            <div class="plan-history-item">
                <div class="plan-header">
                    <h3>${plan.isoWeek} (${plan.year})</h3>
                    <span class="plan-meta">Created: ${createdDate} | Updated: ${updatedDate}</span>
                </div>
                <div class="plan-recipes">
                    <h4>Recipes (${planRecipes.length}):</h4>
                    <ul>
                        ${planRecipes.map(recipe => `
                            <li>
                                <strong>${recipe.name}</strong>
                                <span class="recipe-details"> - ${recipe.category} | ${recipe.servings} servings</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <button class="load-plan-btn" onclick="loadPlanToPlanner(${plan.planId})">
                    Load This Plan
                </button>
            </div>
        `;
    }).join('');
}

// Load a plan into the planner
function loadPlanToPlanner(planId, silent = false) {
    const plan = weeklyPlans.find(p => p.planId === planId);
    if (!plan) {
        if (!silent) alert('Plan not found');
        return;
    }

    // Clear current selection
    selectedRecipes = [];

    // Load recipes from plan
    plan.recipeIds.forEach(recipeId => {
        const recipe = masterRecipes.find(r => r.recipeId === recipeId);
        if (recipe) {
            selectedRecipes.push(recipe);
        }
    });

    // Update UI
    updateRecipeSelection();

    // Switch to planner tab
    if (!silent) {
        showTab('planner');
        alert(`Loaded ${selectedRecipes.length} recipes from ${plan.isoWeek}`);
    }
}

// Load current week's plan if it exists
function loadCurrentWeekPlan() {
    const weekInfo = getISOWeek();

    // Update title and subtitle with week info
    const title = document.getElementById('planner-title');
    const subtitle = document.getElementById('planner-subtitle');
    if (title) {
        title.textContent = `Planning for ${weekInfo.isoWeek} (Current Week)`;
    }
    if (subtitle) {
        subtitle.textContent = 'Select 3-4 recipes for this week';
    }

    const currentPlan = weeklyPlans.find(p => p.isoWeek === weekInfo.isoWeek);

    if (currentPlan) {
        loadPlanToPlanner(currentPlan.planId, true);
    }
}

// Initialize planner when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await loadWeeklyPlans();
    loadMasterRecipes();
});
