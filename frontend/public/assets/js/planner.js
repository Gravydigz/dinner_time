// Master recipes database
let masterRecipes = [];
let selectedRecipes = [];
let weeklyPlans = [];

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

// Load weekly plans from localStorage (simulating database)
function loadWeeklyPlans() {
    const saved = localStorage.getItem('weeklyPlans');
    weeklyPlans = saved ? JSON.parse(saved) : [];
    return weeklyPlans;
}

// Save weekly plans to localStorage
function saveWeeklyPlans() {
    localStorage.setItem('weeklyPlans', JSON.stringify(weeklyPlans));
}

// Load master recipes from JSON
async function loadMasterRecipes() {
    try {
        const response = await fetch('../../data/recipes/master_recipes.json');
        const data = await response.json();
        masterRecipes = data.recipes;
        renderMasterRecipeList();
    } catch (error) {
        console.error('Error loading master recipes:', error);
        // Fallback to hardcoded data if JSON fails to load
        masterRecipes = getFallbackRecipes();
        renderMasterRecipeList();
    }
}

// Fallback recipes if JSON doesn't load
function getFallbackRecipes() {
    return [
        {
            id: 'bourbon-glazed-steak-tips',
            name: 'Bourbon-Glazed Steak Tips',
            category: 'Beef',
            prepTime: 240,
            cookTime: 15,
            servings: 6
        },
        {
            id: 'chicken-stir-fry',
            name: 'Monday Chicken Stir Fry',
            category: 'Chicken',
            prepTime: 15,
            cookTime: 15,
            servings: 4
        },
        {
            id: 'pasta-marinara',
            name: 'Wednesday Pasta Marinara',
            category: 'Pasta',
            prepTime: 10,
            cookTime: 20,
            servings: 6
        },
        {
            id: 'tuscan-sausage-pasta',
            name: 'Tuscan Sausage Pasta',
            category: 'Pasta',
            prepTime: 10,
            cookTime: 20,
            servings: 4
        },
        {
            id: 'one-pot-ravioli-lasagna',
            name: 'One Pot Ravioli Lasagna',
            category: 'Pasta',
            prepTime: 5,
            cookTime: 20,
            servings: 4
        },
        {
            id: 'marry-me-chicken',
            name: 'Marry Me Chicken',
            category: 'Chicken',
            prepTime: 15,
            cookTime: 30,
            servings: 4
        },
        {
            id: 'marry-me-chicken-tortellini',
            name: 'Marry Me Chicken Tortellini',
            category: 'Pasta',
            prepTime: 10,
            cookTime: 15,
            servings: 6
        }
    ];
}

// Render master recipe list
function renderMasterRecipeList() {
    const container = document.getElementById('master-recipe-list');
    if (!container) return;

    container.innerHTML = masterRecipes.map(recipe => `
        <div class="recipe-card-selectable" data-recipe-id="${recipe.id}" onclick="toggleRecipeSelection('${recipe.id}')">
            <h4>${recipe.name}</h4>
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
                    <button class="remove-btn" onclick="toggleRecipeSelection('${recipe.id}')">Remove</button>
                </div>
            `).join('');
        }
    }

    // Enable/disable generate button
    const generateBtn = document.getElementById('generate-shopping-btn');
    if (generateBtn) {
        generateBtn.disabled = selectedRecipes.length === 0;
    }
}

// Save weekly plan to database
function saveWeeklyPlan() {
    const weekInfo = getISOWeek();
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

    // Render shopping list
    renderShoppingList(categories);

    // Show shopping list card
    document.getElementById('shopping-list-card').style.display = 'block';

    // Scroll to shopping list
    document.getElementById('shopping-list-card').scrollIntoView({ behavior: 'smooth' });
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

// Render shopping list
function renderShoppingList(categories) {
    const container = document.getElementById('shopping-list-content');

    let html = `<div class="selected-recipes-info">
        <h3>Recipes for this week:</h3>
        <ul>
            ${selectedRecipes.map(r => `<li><strong>${r.name}</strong> (${r.servings} servings)</li>`).join('')}
        </ul>
    </div>`;

    Object.keys(categories).forEach(category => {
        if (categories[category].length > 0) {
            html += `
                <div class="shopping-category">
                    <h3>${category}</h3>
                    <ul>
                        ${categories[category].map(ingredient => {
                            const amountStr = ingredient.amount && ingredient.amount !== 'to taste'
                                ? `${ingredient.amount} ${ingredient.unit}`
                                : ingredient.amount || '';
                            const additional = ingredient.additional ? ` (${ingredient.additional})` : '';
                            return `
                                <li>
                                    <input type="checkbox">
                                    <strong>${amountStr}</strong> ${ingredient.item}${additional}
                                </li>
                            `;
                        }).join('')}
                    </ul>
                </div>
            `;
        }
    });

    container.innerHTML = html;
}

// Render plan history
function renderPlanHistory() {
    const container = document.getElementById('plan-history-list');
    if (!container) return;

    const plans = loadWeeklyPlans();

    if (plans.length === 0) {
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
function loadPlanToPlanner(planId) {
    const plan = weeklyPlans.find(p => p.planId === planId);
    if (!plan) {
        alert('Plan not found');
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
    showTab('planner');

    alert(`Loaded ${selectedRecipes.length} recipes from ${plan.isoWeek}`);
}

// Initialize planner when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadMasterRecipes();
    loadWeeklyPlans();
});
