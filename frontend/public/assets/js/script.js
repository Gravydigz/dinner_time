let selectedRating = null;
let currentPerson = 'Travis';
let ratingsLoaded = false;

// Initialize the app
async function init() {
    await loadRatingsFromFile();
    loadRecipesForRating();
    setupRatingButtons();
    loadDashboard();
}

// Load ratings from API (with localStorage fallback)
async function loadRatingsFromFile() {
    try {
        const response = await fetch('/api/ratings');
        if (response.ok) {
            const data = await response.json();
            const ratings = data.ratings || [];
            // Save to localStorage as backup
            localStorage.setItem('dinnerRatings', JSON.stringify(ratings));
            ratingsLoaded = true;
            return;
        }
    } catch (error) {
        console.log('API not available, falling back to localStorage');
    }

    ratingsLoaded = true;
}

// Save ratings to API (with localStorage fallback)
async function saveRatings(ratings) {
    // Always save to localStorage as backup
    localStorage.setItem('dinnerRatings', JSON.stringify(ratings));

    // Try to save to API
    try {
        const response = await fetch('/api/ratings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ratings: ratings })
        });
        if (response.ok) {
            console.log('Ratings saved to server');
        }
    } catch (error) {
        console.log('Could not save to API, saved to localStorage only');
    }
}

// Add a single rating via API
async function addRatingToServer(rating) {
    try {
        const response = await fetch('/api/ratings/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rating)
        });
        if (response.ok) {
            console.log('Rating added to server');
            return true;
        }
    } catch (error) {
        console.log('Could not add rating to API');
    }
    return false;
}

// Export ratings as downloadable JSON file
function exportRatings() {
    const ratings = getRatings();
    const exportData = {
        ratings: ratings,
        metadata: {
            version: "1.0",
            lastUpdated: new Date().toISOString(),
            description: "Recipe ratings from family members"
        }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ratings.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Load recipes from master database for rating dropdown
async function loadRecipesForRating() {
    const select = document.getElementById('recipe-select');
    if (!select) return;

    try {
        const response = await fetch('/api/recipes');
        const data = await response.json();

        // Group by category
        const categories = {};
        data.recipes.forEach(recipe => {
            if (!categories[recipe.category]) {
                categories[recipe.category] = [];
            }
            categories[recipe.category].push(recipe.name);
        });

        // Populate dropdown with optgroups
        Object.keys(categories).sort().forEach(category => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category;

            categories[category].forEach(recipeName => {
                const option = document.createElement('option');
                option.value = recipeName;
                option.textContent = recipeName;
                optgroup.appendChild(option);
            });

            select.appendChild(optgroup);
        });
    } catch (error) {
        console.error('Error loading recipes:', error);
        // Show error in dropdown
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Error: Could not load recipes';
        option.disabled = true;
        select.appendChild(option);
    }
}

// Setup rating button selection
function setupRatingButtons() {
    const buttons = document.querySelectorAll('.rating-btn');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedRating = parseInt(button.dataset.rating);
        });
    });
}

// Submit rating
async function submitRating() {
    const userName = document.getElementById('user-select').value;
    const recipe = document.getElementById('recipe-select').value;

    if (!userName) {
        alert('Please select your name');
        return;
    }

    if (!recipe) {
        alert('Please select a recipe');
        return;
    }

    if (!selectedRating) {
        alert('Please select a rating');
        return;
    }

    const rating = {
        user: userName,
        recipe: recipe,
        score: selectedRating,
        date: new Date().toISOString(),
        dateFormatted: new Date().toLocaleString()
    };

    // Save to localStorage as backup
    let ratings = getRatings();
    ratings.push(rating);
    localStorage.setItem('dinnerRatings', JSON.stringify(ratings));

    // Save to API
    addRatingToServer(rating);

    // Show success message
    const successMsg = document.getElementById('success-message');
    successMsg.classList.add('show');
    setTimeout(() => successMsg.classList.remove('show'), 3000);

    // Reset form
    document.getElementById('user-select').value = '';
    document.getElementById('recipe-select').value = '';
    document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('selected'));
    selectedRating = null;

    // Reload dashboard if it's visible
    if (document.getElementById('dashboard-tab').classList.contains('active')) {
        loadDashboard();
    }
}

// Get ratings from localStorage
function getRatings() {
    const saved = localStorage.getItem('dinnerRatings');
    return saved ? JSON.parse(saved) : [];
}

// Switch tabs
function showTab(tabName, weekMode) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');

    if (tabName === 'dashboard') {
        loadDashboard();
    } else if (tabName === 'history') {
        if (typeof renderPlanHistory === 'function') {
            renderPlanHistory();
        }
    } else if (tabName === 'planner' && weekMode) {
        if (typeof switchPlanningMode === 'function') {
            switchPlanningMode(weekMode);
        }
    }
}

// Load dashboard data
function loadDashboard() {
    loadOverallFavorites();
    loadPersonFavorites(currentPerson);
    loadRatingsHistory();
}

// Calculate average rating for a recipe
function calculateAverageRating(ratings, recipe) {
    const recipeRatings = ratings.filter(r => r.recipe === recipe);
    if (recipeRatings.length === 0) return 0;

    const sum = recipeRatings.reduce((total, r) => total + r.score, 0);
    return (sum / recipeRatings.length).toFixed(1);
}

// Load overall favorites
function loadOverallFavorites() {
    const container = document.getElementById('overall-favorites');
    const ratings = getRatings();

    if (ratings.length === 0) {
        container.innerHTML = '<div class="no-data">No ratings yet. Start rating some recipes!</div>';
        return;
    }

    // Get all unique recipes
    const allRecipes = [...new Set(ratings.map(r => r.recipe))];

    // Calculate average for each recipe
    const recipeStats = allRecipes.map(recipe => {
        const recipeRatings = ratings.filter(r => r.recipe === recipe);
        const average = calculateAverageRating(ratings, recipe);
        return {
            recipe: recipe,
            average: parseFloat(average),
            count: recipeRatings.length
        };
    });

    // Sort by average rating
    recipeStats.sort((a, b) => b.average - a.average);

    container.innerHTML = recipeStats.map((stat, index) => `
        <div class="recipe-item">
            <div>
                <h4>${index + 1}. ${stat.recipe}</h4>
                <div class="details">${stat.count} rating${stat.count !== 1 ? 's' : ''}</div>
            </div>
            <div class="rating">${stat.average} / 5 ⭐</div>
        </div>
    `).join('');
}

// Show person stats
function showPersonStats(person) {
    currentPerson = person;

    document.querySelectorAll('.person-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    loadPersonFavorites(person);
}

// Load favorites by person
function loadPersonFavorites(person) {
    const container = document.getElementById('person-favorites');
    const ratings = getRatings();
    const personRatings = ratings.filter(r => r.user === person);

    if (personRatings.length === 0) {
        container.innerHTML = `<div class="no-data">${person} hasn't rated any recipes yet.</div>`;
        return;
    }

    // Get unique recipes rated by this person
    const uniqueRecipes = [...new Set(personRatings.map(r => r.recipe))];

    // Calculate average for each recipe
    const recipeStats = uniqueRecipes.map(recipe => {
        const recipeRatings = personRatings.filter(r => r.recipe === recipe);
        const sum = recipeRatings.reduce((total, r) => total + r.score, 0);
        const average = (sum / recipeRatings.length).toFixed(1);
        return {
            recipe: recipe,
            average: parseFloat(average),
            count: recipeRatings.length
        };
    });

    // Sort by average rating
    recipeStats.sort((a, b) => b.average - a.average);

    container.innerHTML = recipeStats.map((stat, index) => `
        <div class="recipe-item">
            <div>
                <h4>${index + 1}. ${stat.recipe}</h4>
                <div class="details">${stat.count} rating${stat.count !== 1 ? 's' : ''}</div>
            </div>
            <div class="rating">${stat.average} / 5 ⭐</div>
        </div>
    `).join('');
}

// Load ratings history
function loadRatingsHistory() {
    const container = document.getElementById('ratings-history');
    const ratings = getRatings();

    if (ratings.length === 0) {
        container.innerHTML = '<div class="no-data">No ratings yet.</div>';
        return;
    }

    // Sort by date (newest first)
    ratings.sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = ratings.map(rating => `
        <div class="history-item">
            <div class="info">
                <div class="name">${rating.user}</div>
                <div class="recipe">${rating.recipe}</div>
                <div class="date">${rating.dateFormatted}</div>
            </div>
            <div class="rating">${rating.score} / 5</div>
        </div>
    `).join('');
}

// Initialize on page load
init();
