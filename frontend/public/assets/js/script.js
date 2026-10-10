let selectedRating = null;
let currentPerson = null;
let ratingsLoaded = false;
let members = [];
let ratings = []; // loaded from the server; the server file is the only source of truth

// Initialize the app
async function init() {
    await loadMembers();
    await loadRatingsFromFile();
    // Recipe tiles may have rendered before ratings arrived — redraw for star ratings
    if (typeof renderMasterRecipeList === 'function' && masterRecipes.length > 0) {
        renderMasterRecipeList();
    }
    loadRecipesForRating();
    setupRatingButtons();
    loadDashboard();
}

// Load members from API
async function loadMembers() {
    try {
        const response = await fetch('/api/members');
        if (response.ok) {
            const data = await response.json();
            members = data.members || [];
            if (members.length > 0) {
                currentPerson = members[0].name;
            }
            populateUserSelect();
            populatePersonTabs();
            return;
        }
    } catch (error) {
        console.error('Error loading members:', error);
    }

    // Show error if members can't be loaded
    const userSelect = document.getElementById('user-select');
    if (userSelect) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Error: Could not load members';
        option.disabled = true;
        userSelect.appendChild(option);
    }
}

// Populate user select dropdown with members
function populateUserSelect() {
    const select = document.getElementById('user-select');
    if (!select || members.length === 0) return;

    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.name;
        option.textContent = member.name;
        select.appendChild(option);
    });
}

// Populate person tabs on dashboard with members
function populatePersonTabs() {
    const container = document.getElementById('person-tabs');
    if (!container || members.length === 0) return;

    container.innerHTML = members.map((member, index) => `
        <button class="person-btn${index === 0 ? ' active' : ''}" onclick="showPersonStats('${member.name}')">${member.name}</button>
    `).join('');
}

// Load ratings from the server
async function loadRatingsFromFile() {
    try {
        const response = await fetch('/api/ratings');
        if (!response.ok) throw new Error('Server returned ' + response.status);
        const data = await response.json();
        ratings = data.ratings || [];
    } catch (error) {
        console.error('Error loading ratings:', error);
        showAppError('Could not load ratings from the server. Refresh to try again.');
    }
    ratingsLoaded = true;
}

// Add a single rating via API; returns true only if the server saved it
async function addRatingToServer(rating) {
    try {
        const response = await fetch('/api/ratings/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rating)
        });
        return response.ok;
    } catch (error) {
        console.error('Error saving rating:', error);
        return false;
    }
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
        data.recipes.filter(recipe => !recipe.archived).forEach(recipe => {
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

    // Only count the rating once the server has saved it; keep the form filled on failure
    const submitBtn = document.querySelector('#rating-tab .submit-btn');
    submitBtn.disabled = true;
    const saved = await addRatingToServer(rating);
    submitBtn.disabled = false;
    if (!saved) {
        showAppError('Could not save to the server — your rating was not recorded.');
        return;
    }
    ratings.push(rating);
    if (typeof renderMasterRecipeList === 'function') renderMasterRecipeList();

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

// Get ratings loaded from the server
function getRatings() {
    return ratings;
}

// Switch tabs
function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + '-tab').classList.add('active');

    // Week picker, filter, search and shopping list only apply to the planner
    document.body.classList.toggle('planner-active', tabName === 'planner');

    if (tabName === 'dashboard') {
        loadDashboard();
    } else if (tabName === 'history') {
        if (typeof renderPlanHistory === 'function') {
            renderPlanHistory();
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

// About modal
function openAboutModal() {
    document.getElementById('about-version').textContent = CONFIG.version;
    if (typeof renderArchivedList === 'function') renderArchivedList();
    document.getElementById('about-modal').style.display = 'flex';
}

function closeAboutModal(event) {
    if (!event || event.target === event.currentTarget) {
        document.getElementById('about-modal').style.display = 'none';
    }
}

// Initialize on page load
init();

// Set footer version
document.addEventListener('DOMContentLoaded', function() {
    const footerVersion = document.getElementById('footer-version');
    if (footerVersion) {
        footerVersion.textContent = 'v' + CONFIG.version;
    }
});
