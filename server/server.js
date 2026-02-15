const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_VERSION = '2602.01.2';

// n8n webhook configuration
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';
const CALLBACK_BASE_URL = process.env.CALLBACK_BASE_URL || 'http://dinner-time:3010';

// In-memory store for pending recipe extractions from n8n
const pendingRecipes = new Map();

// In-memory store for submitted URLs awaiting processing
const submittedUrls = new Map();

// Paths to data files
const DATA_DIR = path.join(__dirname, '..', 'data');
const WEEKLY_PLANS_FILE = path.join(DATA_DIR, 'weekly_plans.json');
const RATINGS_FILE = path.join(DATA_DIR, 'ratings.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Ensure upload directories exist
const ensureUploadDirs = () => {
    const dirs = [
        path.join(UPLOADS_DIR, 'images'),
        path.join(UPLOADS_DIR, 'pdfs'),
        path.join(UPLOADS_DIR, 'processed')
    ];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};
ensureUploadDirs();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isPdf = file.mimetype === 'application/pdf';
        const uploadPath = isPdf
            ? path.join(UPLOADS_DIR, 'pdfs')
            : path.join(UPLOADS_DIR, 'images');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Keep original filename, add timestamp to avoid conflicts
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        const timestamp = Date.now();
        cb(null, `${basename}-${timestamp}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images and PDFs only
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend/public
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// Serve data files (for reading)
app.use('/data', express.static(DATA_DIR));

// Helper function to read JSON file
function readJsonFile(filePath, defaultData) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
    }
    return defaultData;
}

// Helper function to write JSON file
function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

// ============ Weekly Plans API ============

// GET all weekly plans
app.get('/api/plans', (req, res) => {
    const data = readJsonFile(WEEKLY_PLANS_FILE, { plans: [], metadata: {} });
    res.json(data);
});

// POST save weekly plans
app.post('/api/plans', (req, res) => {
    const { plans } = req.body;

    if (!Array.isArray(plans)) {
        return res.status(400).json({ error: 'Invalid data: plans must be an array' });
    }

    const data = {
        plans: plans,
        metadata: {
            version: "1.0",
            lastUpdated: new Date().toISOString(),
            description: "Weekly meal plans tracking ISO week dates and selected recipes"
        }
    };

    if (writeJsonFile(WEEKLY_PLANS_FILE, data)) {
        res.json({ success: true, message: 'Weekly plans saved', count: plans.length });
    } else {
        res.status(500).json({ error: 'Failed to save weekly plans' });
    }
});

// ============ Ratings API ============

// GET all ratings
app.get('/api/ratings', (req, res) => {
    const data = readJsonFile(RATINGS_FILE, { ratings: [], metadata: {} });
    res.json(data);
});

// POST save all ratings
app.post('/api/ratings', (req, res) => {
    const { ratings } = req.body;

    if (!Array.isArray(ratings)) {
        return res.status(400).json({ error: 'Invalid data: ratings must be an array' });
    }

    const data = {
        ratings: ratings,
        metadata: {
            version: "1.0",
            lastUpdated: new Date().toISOString(),
            description: "Recipe ratings from family members"
        }
    };

    if (writeJsonFile(RATINGS_FILE, data)) {
        res.json({ success: true, message: 'Ratings saved', count: ratings.length });
    } else {
        res.status(500).json({ error: 'Failed to save ratings' });
    }
});

// POST add a single rating
app.post('/api/ratings/add', (req, res) => {
    const rating = req.body;

    if (!rating.user || !rating.recipe || !rating.score) {
        return res.status(400).json({ error: 'Invalid rating: requires user, recipe, and score' });
    }

    const data = readJsonFile(RATINGS_FILE, { ratings: [], metadata: {} });
    data.ratings.push(rating);
    data.metadata = {
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        description: "Recipe ratings from family members"
    };

    if (writeJsonFile(RATINGS_FILE, data)) {
        res.json({ success: true, message: 'Rating added', rating: rating });
    } else {
        res.status(500).json({ error: 'Failed to save rating' });
    }
});

// ============ Version API ============

// GET app version
app.get('/api/version', (req, res) => {
    res.json({ version: APP_VERSION });
});

// ============ Members API ============

// GET all members
app.get('/api/members', (req, res) => {
    const membersFile = path.join(DATA_DIR, 'members.json');
    const data = readJsonFile(membersFile, { members: [] });
    res.json(data);
});

// ============ Recipes API ============

// GET all recipes
app.get('/api/recipes', (req, res) => {
    const recipesFile = path.join(DATA_DIR, 'master_recipes.json');
    const data = readJsonFile(recipesFile, { recipes: [] });
    res.json(data);
});

// PUT update a recipe
app.put('/api/recipes/:id', (req, res) => {
    const recipeId = req.params.id;
    const updatedRecipe = req.body;

    const recipesFile = path.join(DATA_DIR, 'master_recipes.json');
    const data = readJsonFile(recipesFile, { recipes: [] });

    const index = data.recipes.findIndex(r => r.id === recipeId);
    if (index === -1) {
        return res.status(404).json({ error: 'Recipe not found' });
    }

    // Preserve recipeId and id, update other fields
    data.recipes[index] = { ...data.recipes[index], ...updatedRecipe };

    if (writeJsonFile(recipesFile, data)) {
        res.json({ success: true, recipe: data.recipes[index] });
    } else {
        res.status(500).json({ error: 'Failed to save recipe' });
    }
});

// ============ File Upload API ============

// POST upload file (image or PDF)
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const isPdf = req.file.mimetype === 'application/pdf';
    const folder = isPdf ? 'pdfs' : 'images';

    res.json({
        success: true,
        message: 'File uploaded successfully',
        file: {
            originalName: req.file.originalname,
            savedName: req.file.filename,
            path: `data/uploads/${folder}/${req.file.filename}`,
            size: req.file.size,
            mimetype: req.file.mimetype
        }
    });
});

// POST upload multiple files
app.post('/api/upload/multiple', upload.array('files', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => {
        const isPdf = file.mimetype === 'application/pdf';
        const folder = isPdf ? 'pdfs' : 'images';
        return {
            originalName: file.originalname,
            savedName: file.filename,
            path: `data/uploads/${folder}/${file.filename}`,
            size: file.size,
            mimetype: file.mimetype
        };
    });

    res.json({
        success: true,
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        files: uploadedFiles
    });
});

// GET list uploaded files
app.get('/api/uploads', (req, res) => {
    const images = [];
    const pdfs = [];

    const imagesDir = path.join(UPLOADS_DIR, 'images');
    const pdfsDir = path.join(UPLOADS_DIR, 'pdfs');

    try {
        if (fs.existsSync(imagesDir)) {
            fs.readdirSync(imagesDir).forEach(file => {
                if (!file.startsWith('.')) {
                    const stats = fs.statSync(path.join(imagesDir, file));
                    images.push({
                        name: file,
                        path: `data/uploads/images/${file}`,
                        size: stats.size,
                        uploaded: stats.mtime
                    });
                }
            });
        }

        if (fs.existsSync(pdfsDir)) {
            fs.readdirSync(pdfsDir).forEach(file => {
                if (!file.startsWith('.')) {
                    const stats = fs.statSync(path.join(pdfsDir, file));
                    pdfs.push({
                        name: file,
                        path: `data/uploads/pdfs/${file}`,
                        size: stats.size,
                        uploaded: stats.mtime
                    });
                }
            });
        }
    } catch (error) {
        console.error('Error reading uploads:', error);
    }

    res.json({ images, pdfs });
});

// DELETE remove uploaded file
app.delete('/api/uploads/:folder/:filename', (req, res) => {
    const { folder, filename } = req.params;

    if (!['images', 'pdfs', 'processed'].includes(folder)) {
        return res.status(400).json({ error: 'Invalid folder' });
    }

    const filePath = path.join(UPLOADS_DIR, folder, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    try {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'File deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// ============ Add Recipe API ============

// POST add a new recipe
app.post('/api/recipes', (req, res) => {
    const newRecipe = req.body;

    if (!newRecipe.name) {
        return res.status(400).json({ error: 'Recipe name is required' });
    }

    const recipesFile = path.join(DATA_DIR, 'master_recipes.json');
    const data = readJsonFile(recipesFile, { recipes: [] });

    // Auto-assign next recipeId
    const maxId = data.recipes.reduce((max, r) => Math.max(max, r.recipeId || 0), 0);
    newRecipe.recipeId = maxId + 1;

    // Generate kebab-case id from name
    newRecipe.id = 'recipe-' + newRecipe.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    data.recipes.push(newRecipe);

    if (writeJsonFile(recipesFile, data)) {
        res.json({ success: true, recipe: newRecipe });
    } else {
        res.status(500).json({ error: 'Failed to save recipe' });
    }
});

// ============ Recipe Processing API (n8n Integration) ============

// POST trigger n8n webhook to process an uploaded file
app.post('/api/process', async (req, res) => {
    const { folder, filename } = req.body;

    if (!folder || !filename) {
        return res.status(400).json({ error: 'folder and filename are required' });
    }

    if (!['images', 'pdfs'].includes(folder)) {
        return res.status(400).json({ error: 'Invalid folder' });
    }

    const filePath = path.join(UPLOADS_DIR, folder, filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    if (!N8N_WEBHOOK_URL) {
        return res.status(503).json({ error: 'N8N_WEBHOOK_URL not configured' });
    }

    // Determine mime type from extension
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.png': 'image/png', '.gif': 'image/gif',
        '.webp': 'image/webp', '.pdf': 'application/pdf'
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    // Build URLs using the configured base URL
    const callbackUrl = `${CALLBACK_BASE_URL}/api/process/result`;
    const fileUrl = `${CALLBACK_BASE_URL}/data/uploads/${folder}/${filename}`;

    const payload = {
        filename,
        fileUrl,
        mimeType,
        callbackUrl
    };

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`n8n responded with status ${response.status}`);
        }

        console.log(`Processing triggered for ${filename} via n8n webhook`);
        res.json({ success: true, message: 'Processing started' });
    } catch (error) {
        console.error('Failed to trigger n8n webhook:', error.message);
        res.status(502).json({ error: `Failed to reach n8n: ${error.message}` });
    }
});

// ============ URL Submission API ============

// POST submit a URL for later processing
app.post('/api/urls', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'url is required' });
    }

    // Validate URL format
    try {
        new URL(url);
    } catch (e) {
        return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Generate tracking filename from URL path
    const urlPath = new URL(url).pathname
        .replace(/\/$/, '')
        .split('/')
        .pop() || 'recipe';
    const slug = urlPath
        .toLowerCase()
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 60);
    const filename = `url-${slug}-${Date.now()}`;

    const entry = { filename, url, submittedAt: new Date().toISOString() };
    submittedUrls.set(filename, entry);

    console.log(`URL submitted: ${url} (${filename})`);
    res.json({ success: true, entry });
});

// GET list all submitted URLs
app.get('/api/urls', (req, res) => {
    res.json({ urls: Array.from(submittedUrls.values()) });
});

// DELETE remove a submitted URL
app.delete('/api/urls/:filename', (req, res) => {
    const { filename } = req.params;

    if (!submittedUrls.has(filename)) {
        return res.status(404).json({ error: 'URL entry not found' });
    }

    submittedUrls.delete(filename);
    res.json({ success: true, message: 'URL entry removed' });
});

// POST trigger n8n webhook to process a submitted URL
app.post('/api/process-url', async (req, res) => {
    const { filename } = req.body;

    if (!filename) {
        return res.status(400).json({ error: 'filename is required' });
    }

    const entry = submittedUrls.get(filename);
    if (!entry) {
        return res.status(404).json({ error: 'URL entry not found' });
    }

    if (!N8N_WEBHOOK_URL) {
        return res.status(503).json({ error: 'N8N_WEBHOOK_URL not configured' });
    }

    const callbackUrl = `${CALLBACK_BASE_URL}/api/process/result`;

    const payload = {
        recipeUrl: entry.url,
        filename,
        callbackUrl
    };

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`n8n responded with status ${response.status}`);
        }

        console.log(`URL processing triggered for ${entry.url} via n8n webhook (${filename})`);
        res.json({ success: true, message: 'URL processing started', filename });
    } catch (error) {
        console.error('Failed to trigger n8n webhook:', error.message);
        res.status(502).json({ error: `Failed to reach n8n: ${error.message}` });
    }
});

// POST receive processed recipe from n8n callback
app.post('/api/process/result', (req, res) => {
    const { filename, recipe } = req.body;

    if (!filename || !recipe) {
        return res.status(400).json({ error: 'filename and recipe are required' });
    }

    // Store as pending review
    pendingRecipes.set(filename, {
        filename,
        recipe,
        receivedAt: new Date().toISOString()
    });

    // Remove from submitted URLs if it was a URL entry
    if (submittedUrls.has(filename)) {
        submittedUrls.delete(filename);
        console.log(`Removed URL entry ${filename} from submitted URLs`);
    }

    // Move source file to processed folder (for file uploads)
    const possibleFolders = ['images', 'pdfs'];
    for (const folder of possibleFolders) {
        const sourcePath = path.join(UPLOADS_DIR, folder, filename);
        if (fs.existsSync(sourcePath)) {
            const destPath = path.join(UPLOADS_DIR, 'processed', filename);
            try {
                fs.renameSync(sourcePath, destPath);
                console.log(`Moved ${filename} to processed/`);
            } catch (err) {
                console.error(`Failed to move ${filename}:`, err.message);
            }
            break;
        }
    }

    console.log(`Received processed recipe for ${filename}`);
    res.json({ success: true, message: 'Recipe received for review' });
});

// GET all pending recipes awaiting review
app.get('/api/process/pending', (req, res) => {
    const pending = Array.from(pendingRecipes.values());
    res.json({ pending });
});

// DELETE discard a pending recipe
app.delete('/api/process/pending/:filename', (req, res) => {
    const { filename } = req.params;

    if (!pendingRecipes.has(filename)) {
        return res.status(404).json({ error: 'No pending recipe found for this filename' });
    }

    pendingRecipes.delete(filename);
    res.json({ success: true, message: 'Pending recipe discarded' });
});

// Error handling for multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});

// Catch-all: serve index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║           Dinner Time Server                       ║
║            Version ${APP_VERSION}                   ║
║────────────────────────────────────────────────────║
║  Server running at http://localhost:${PORT}           ║
║                                                    ║
║  API Endpoints:                                    ║
║    GET    /api/version          - Get app version  ║
║    GET    /api/plans            - Get weekly plans  ║
║    POST   /api/plans            - Save weekly plans ║
║    GET    /api/ratings          - Get all ratings   ║
║    POST   /api/ratings          - Save all ratings  ║
║    POST   /api/ratings/add      - Add one rating   ║
║    GET    /api/recipes          - Get all recipes   ║
║    POST   /api/recipes          - Add new recipe   ║
║    PUT    /api/recipes/:id      - Update a recipe  ║
║    POST   /api/upload           - Upload file      ║
║    POST   /api/upload/multiple  - Upload multiple  ║
║    GET    /api/uploads          - List uploads     ║
║    DELETE /api/uploads/:f/:file - Delete upload    ║
║    POST   /api/process          - Trigger AI proc  ║
║    POST   /api/urls             - Submit URL        ║
║    GET    /api/urls             - List URLs         ║
║    DELETE /api/urls/:f          - Delete URL        ║
║    POST   /api/process-url      - Process URL      ║
║    POST   /api/process/result   - n8n callback     ║
║    GET    /api/process/pending  - Pending reviews  ║
║    DELETE /api/process/pending/:f - Discard pending║
║                                                    ║
║  n8n Webhook:  ${N8N_WEBHOOK_URL || '(not configured)'}
║  Callback URL: ${CALLBACK_BASE_URL}
╚════════════════════════════════════════════════════╝
    `);
});
