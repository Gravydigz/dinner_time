const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

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
╔════════════════════════════════════════════════╗
║           Dinner Time Server                   ║
║────────────────────────────────────────────────║
║  Server running at http://localhost:${PORT}       ║
║                                                ║
║  API Endpoints:                                ║
║    GET  /api/plans       - Get weekly plans    ║
║    POST /api/plans       - Save weekly plans   ║
║    GET  /api/ratings     - Get all ratings     ║
║    POST /api/ratings     - Save all ratings    ║
║    POST /api/ratings/add - Add one rating      ║
║    GET  /api/recipes     - Get all recipes     ║
║    POST /api/upload      - Upload single file  ║
║    POST /api/upload/multiple - Upload multiple ║
║    GET  /api/uploads     - List uploaded files ║
║    DELETE /api/uploads/:folder/:file - Delete  ║
╚════════════════════════════════════════════════╝
    `);
});
