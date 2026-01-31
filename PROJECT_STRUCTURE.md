# Dinner Time - Proper Git Project Structure

## Recommended Structure

```
dinner-time/
├── .git/                           # Git repository
├── .gitignore                      # Git ignore rules
├── .dockerignore                   # Docker ignore rules
├── .env.example                    # Example environment variables
│
├── docker/                         # Docker configuration
│   ├── Dockerfile                  # Main Dockerfile
│   ├── nginx.conf                  # Nginx configuration
│   └── docker-compose.yml          # Docker Compose orchestration
│
├── frontend/                       # Frontend web application
│   ├── public/                     # Static assets
│   │   ├── index.html
│   │   ├── upload.html
│   │   └── assets/
│   │       ├── css/
│   │       │   └── styles.css
│   │       └── js/
│   │           ├── script.js
│   │           └── planner.js
│   └── README.md
│
├── data/                          # Data layer
│   ├── recipes/                   # Recipe database
│   │   ├── master_recipes.json   # Main recipe database
│   │   └── archives/             # Historical recipes by week
│   │       ├── 2024/
│   │       │   ├── week01/
│   │       │   └── week02/
│   │       └── README.md
│   └── uploads/                   # Upload repository
│       ├── images/
│       ├── pdfs/
│       └── processed/
│
├── scripts/                       # Automation scripts
│   ├── process_recipes.sh        # Recipe processing
│   ├── backup.sh                 # Backup script
│   └── init_db.sh                # Initialize database
│
├── docs/                          # Documentation
│   ├── QUICK_START.md
│   ├── AUTOMATION_GUIDE.md
│   ├── DEPLOYMENT.md
│   └── API.md
│
├── tests/                         # Tests (future)
│   └── README.md
│
├── README.md                      # Main project documentation
├── LICENSE                        # License file
└── CONTRIBUTING.md                # Contribution guidelines
```

## Component Breakdown

### Frontend (`frontend/`)
- **Purpose**: Static web application (HTML, CSS, JS)
- **Technology**: Vanilla JavaScript (no framework currently)
- **Served by**: Nginx in Docker
- **Files**:
  - HTML pages (index, upload)
  - CSS stylesheets
  - JavaScript modules
  - Static assets (images, fonts)

### Data (`data/`)
- **Purpose**: Data persistence layer
- **Components**:
  - Recipe database (JSON)
  - Upload staging area
  - Archives/historical data
- **Mounted**: As Docker volume for persistence

### Docker (`docker/`)
- **Purpose**: Containerization and deployment
- **Components**:
  - Dockerfile: Build instructions
  - nginx.conf: Web server configuration
  - docker-compose.yml: Service orchestration
- **Features**:
  - Production-ready nginx setup
  - Volume mounts for data
  - Environment configuration

### Scripts (`scripts/`)
- **Purpose**: Automation and maintenance
- **Components**:
  - Recipe processing automation
  - Database backups
  - Initialization scripts
- **Usage**: Run from host or container

### Docs (`docs/`)
- **Purpose**: Comprehensive documentation
- **Components**:
  - User guides
  - Developer documentation
  - Deployment instructions
  - API documentation (future)

## Benefits of This Structure

### 1. Separation of Concerns
- Frontend code separate from data
- Docker config isolated
- Clear boundaries between components

### 2. Scalability
- Easy to add backend API later
- Can split into microservices
- Database layer ready for upgrade

### 3. Development Workflow
```bash
# Local development
open frontend/public/index.html

# Docker development
docker-compose up

# Production deployment
docker build -t dinner-time .
docker run -p 80:80 dinner-time
```

### 4. Version Control
- Clear .gitignore rules
- Separate data from code
- Easy to track changes

### 5. Deployment Ready
- Docker container for any platform
- Environment-based configuration
- Production nginx setup

## Migration Plan

### Phase 1: Restructure Files (1 hour)
1. Create new directory structure
2. Move files to appropriate locations
3. Update file paths in code
4. Test locally

### Phase 2: Docker Setup (1 hour)
1. Create Dockerfile
2. Configure nginx
3. Create docker-compose.yml
4. Test container locally

### Phase 3: Git Configuration (30 min)
1. Create .gitignore
2. Initialize git repository
3. Make initial commit
4. Test clone and build

### Phase 4: Documentation (30 min)
1. Update README.md
2. Create deployment docs
3. Add contribution guidelines

## Future Enhancements

### Backend API (Optional)
```
backend/
├── api/
│   ├── routes/
│   │   ├── recipes.js
│   │   ├── ratings.js
│   │   └── uploads.js
│   ├── controllers/
│   ├── models/
│   └── server.js
├── package.json
└── README.md
```

### Database Upgrade (Optional)
```
data/
├── postgres/              # PostgreSQL database
├── migrations/            # Schema migrations
└── seeds/                 # Seed data
```

### CI/CD Pipeline
```
.github/
└── workflows/
    ├── test.yml
    ├── build.yml
    └── deploy.yml
```

## Decision Points

### Current: Static Files Only
- ✅ Simple deployment
- ✅ No backend required
- ✅ Fast and lightweight
- ❌ No real-time sync
- ❌ Browser localStorage only

### Future: Add Backend API
- ✅ Centralized data storage
- ✅ Multi-device sync
- ✅ User authentication
- ❌ More complex deployment
- ❌ Requires database management

### Recommendation
**Start with static files + Docker + Nginx**
- Easiest to deploy and maintain
- Can add backend later without major refactoring
- Current structure supports this path
