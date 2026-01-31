# Architecture Documentation - Dinner Time

## System Overview

Dinner Time is a static web application for meal planning, recipe management, and family rating aggregation. It consists of a frontend interface served by nginx, with data persistence through JSON files and browser localStorage.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  ┌────────────┐  ┌────────────┐  ┌───────────────────────┐ │
│  │   Planner  │  │   Rating   │  │      Dashboard        │ │
│  │    Tab     │  │    Tab     │  │        Tab            │ │
│  └─────┬──────┘  └─────┬──────┘  └──────────┬────────────┘ │
│        │                │                     │              │
│        └────────────────┴─────────────────────┘              │
│                         │                                    │
│              ┌──────────▼───────────┐                        │
│              │  JavaScript Modules   │                        │
│              │  - planner.js        │                        │
│              │  - script.js         │                        │
│              │  - config.js         │                        │
│              └──────────┬───────────┘                        │
└────────────────────────┼────────────────────────────────────┘
                         │
                    HTTP Requests
                         │
┌────────────────────────┼────────────────────────────────────┐
│                        │          Docker Container          │
│              ┌─────────▼─────────┐                          │
│              │      Nginx         │                          │
│              │  (Web Server)      │                          │
│              └────────┬───────────┘                          │
│                       │                                      │
│       ┌───────────────┴────────────────┐                    │
│       │                                 │                    │
│  ┌────▼──────┐                   ┌─────▼─────┐             │
│  │  Frontend  │                   │    Data    │             │
│  │   /public │                   │   /data    │             │
│  │           │                   │            │             │
│  │ HTML/CSS  │                   │  Recipes   │             │
│  │    JS     │                   │  Uploads   │             │
│  └───────────┘                   └────────────┘             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                         │
                    Volume Mount
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Host Filesystem                           │
│                                                              │
│  data/recipes/master_recipes.json  ← Recipe Database        │
│  data/uploads/                     ← User Uploads           │
└──────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Layer

#### 1. HTML Pages
- **index.html**: Main application interface
  - Weekly planner
  - Recipe rating system
  - Dashboard/analytics
- **upload.html**: File upload interface for new recipes

#### 2. CSS
- **styles.css**: Unified stylesheet
  - Responsive design
  - Print-friendly layouts
  - Mobile-first approach

#### 3. JavaScript Modules

**planner.js**
- Loads recipes from master database
- Handles recipe selection for weekly planning
- Generates shopping lists
- Aggregates and organizes ingredients

**script.js**
- Rating submission and storage
- Dashboard data processing
- Analytics and visualization
- localStorage management

**config.js**
- Environment configuration
- API paths
- Feature flags

### Data Layer

#### Recipe Database
**Format:** JSON (`data/recipes/master_recipes.json`)

```json
{
  "recipes": [
    {
      "id": "unique-kebab-case-id",
      "name": "Display Name",
      "source": "Source Attribution",
      "url": "https://original-recipe-url.com",
      "prepTime": 15,
      "cookTime": 30,
      "servings": 4,
      "category": "Category Name",
      "ingredients": [
        {
          "item": "ingredient name",
          "amount": "quantity",
          "unit": "measurement",
          "additional": "optional notes"
        }
      ],
      "instructions": [
        "Step 1",
        "Step 2"
      ]
    }
  ]
}
```

#### User Data Storage
- **Location:** Browser localStorage
- **Data**: Recipe ratings, user preferences
- **Scope:** Per-browser, not synced

### Infrastructure Layer

#### Docker Container
- **Base Image:** nginx:alpine
- **Web Server:** Nginx 1.x
- **Exposed Port:** 80 (mapped to 8080 on host)
- **Volumes:** Data directory mounted for persistence

#### Nginx Configuration
- Static file serving
- Gzip compression
- Security headers
- Caching strategies
- Access logs

## Data Flow Diagrams

### Weekly Planning Flow

```
User selects recipes
        ↓
JavaScript reads master_recipes.json
        ↓
Displays recipe cards with metadata
        ↓
User selects 3-4 recipes
        ↓
"Generate Shopping List" clicked
        ↓
Aggregate ingredients from selected recipes
        ↓
Combine duplicate ingredients
        ↓
Categorize by type (Produce, Meat, Dairy, etc.)
        ↓
Display organized shopping list
        ↓
User can print or view on mobile
```

### Recipe Rating Flow

```
User selects name (Travis/Heidi/Stella/Dylan)
        ↓
Selects recipe from dropdown
        ↓
Chooses rating (1-5)
        ↓
Submits rating
        ↓
JavaScript creates rating object:
{
  user, recipe, score, date, dateFormatted
}
        ↓
Appends to localStorage array "dinnerRatings"
        ↓
Success message displayed
        ↓
Dashboard automatically updates
```

### Recipe Upload & Processing Flow

```
User uploads image/PDF via upload.html
        ↓
File saved to data/uploads/images/ or /pdfs/
        ↓
File metadata stored in localStorage
        ↓
User (or automated system) processes:
        ├─→ Manual: Claude Code reads file
        ├─→ Semi-auto: Batch script processes files
        └─→ Fully auto: n8n watches folder
        ↓
Claude Code extracts recipe data
        ↓
Adds to master_recipes.json
        ↓
File moved to data/uploads/processed/
        ↓
Recipe instantly available in planner
```

## Security Architecture

### Current Implementation

1. **Client-Side Security**
   - No sensitive data stored
   - Data isolated per-browser
   - Input validation on forms

2. **Server-Side Security (Nginx)**
   - Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
   - No directory listing
   - Hidden files blocked (.*files)
   - Sensitive file extensions blocked (.env, .git, .sh)

3. **Docker Security**
   - Non-root user (nginx)
   - Read-only filesystem (except data directory)
   - No shell access needed in production
   - Health checks for availability

### Future Enhancements

1. **Authentication & Authorization**
   - User login system
   - Role-based access control
   - API keys for automation

2. **Data Encryption**
   - HTTPS/TLS (via reverse proxy)
   - Encrypted data at rest
   - Secure API communication

3. **Input Validation**
   - File type validation
   - File size limits
   - XSS prevention
   - SQL injection prevention (if adding database)

## Scalability Considerations

### Current Limitations

1. **Single-Instance Deployment**
   - One container handles all traffic
   - No load balancing

2. **File-Based Database**
   - JSON file for recipes
   - No concurrent write protection
   - Limited query capabilities

3. **Browser Storage**
   - Ratings not synced across devices
   - Storage limit (~5-10MB)
   - Lost if browser data cleared

### Scaling Path

#### Phase 1: Current (Static Application)
- **Users:** 1-10 (family)
- **Traffic:** Low
- **Cost:** Minimal

#### Phase 2: Add Backend API
```
Frontend → API Server → Database
                   ↓
            File Storage (S3)
```
- Centralized data storage
- Multi-device sync
- User authentication

#### Phase 3: Microservices
```
Frontend → API Gateway
             ├→ Recipe Service → Recipe DB
             ├→ Rating Service → Rating DB
             ├→ Upload Service → File Storage
             └→ Analytics Service → Analytics DB
```
- Independent scaling
- Service isolation
- Better reliability

## Technology Stack

### Current Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) | - |
| Web Server | Nginx | Alpine |
| Container | Docker | 20+ |
| Orchestration | Docker Compose | v3.8 |

### Future Stack Options

| Component | Options |
|-----------|---------|
| Backend API | Node.js/Express, Python/Flask, Go |
| Database | PostgreSQL, MongoDB, MySQL |
| File Storage | AWS S3, MinIO, Local |
| Cache | Redis, Memcached |
| Search | Elasticsearch, Algolia |
| Analytics | Google Analytics, Plausible |

## Performance Metrics

### Current Performance

- **Initial Load:** < 2 seconds
- **Recipe Load:** < 500ms (cached), < 1s (fresh)
- **Shopping List Generation:** < 100ms
- **Rating Submission:** < 50ms (localStorage write)

### Optimization Strategies

1. **Frontend**
   - Minify CSS/JS
   - Lazy load images
   - Service worker for offline support
   - Code splitting

2. **Backend (Nginx)**
   - Gzip compression (enabled)
   - Browser caching (configured)
   - HTTP/2 support
   - CDN for static assets

3. **Docker**
   - Multi-stage builds
   - Layer caching
   - Alpine base images
   - Resource limits

## Monitoring & Observability

### Current Monitoring

1. **Docker Health Checks**
   - HTTP endpoint polling
   - Container status

2. **Nginx Logs**
   - Access logs
   - Error logs

### Future Monitoring

1. **Application Metrics**
   - Page load times
   - API response times
   - Error rates
   - User engagement

2. **Infrastructure Metrics**
   - CPU/Memory usage
   - Disk I/O
   - Network traffic
   - Container health

3. **Alerting**
   - Downtime alerts
   - Error rate spikes
   - Resource exhaustion
   - Security incidents

## Deployment Topology

### Development
```
Local Machine
└── Docker Container (port 8080)
    └── Nginx → Frontend + Data (mounted volumes)
```

### Production (Simple)
```
VPS/Cloud Server
└── Docker Container (port 8080)
    └── Nginx → Frontend + Data (persistent volume)
```

### Production (Advanced)
```
Load Balancer
├── Container 1 (nginx)
├── Container 2 (nginx)
└── Container 3 (nginx)
    ↓
Shared Storage (NFS/S3)
└── Recipe Data
```

## Extension Points

### Adding New Features

1. **New Frontend Tab**
   - Add HTML section in index.html
   - Add tab button in nav
   - Create JavaScript module
   - Import in index.html

2. **New Recipe Source**
   - Add to master_recipes.json
   - Update categorization logic
   - Add source-specific metadata

3. **New Data Type**
   - Define JSON schema
   - Create data file
   - Add JavaScript handler
   - Update documentation

### API Endpoints (Future)

```
GET    /api/recipes          - List all recipes
GET    /api/recipes/:id      - Get recipe details
POST   /api/recipes          - Add new recipe
PUT    /api/recipes/:id      - Update recipe
DELETE /api/recipes/:id      - Delete recipe

GET    /api/ratings          - List all ratings
POST   /api/ratings          - Submit rating

POST   /api/uploads          - Upload recipe file
GET    /api/uploads/:id      - Get upload status

GET    /api/shopping-list    - Generate shopping list
POST   /api/weekly-plan      - Save weekly plan
```

## Backup & Recovery

### Backup Strategy

1. **Recipe Database**
   - Daily automated backups
   - Keep 30-day history
   - Store off-site

2. **User Uploads**
   - Weekly backups
   - Compress with tar/gzip
   - Sync to cloud storage

3. **User Ratings**
   - Export functionality
   - CSV download option
   - Manual backup capability

### Disaster Recovery

1. **Data Loss**
   - Restore from latest backup
   - Re-index if needed
   - Verify data integrity

2. **Container Failure**
   - Auto-restart policy
   - Health check monitoring
   - Rollback to previous image

3. **Complete System Failure**
   - Deploy from Git repository
   - Restore data from backup
   - Verify functionality
   - Update DNS if needed

---

For implementation details, see:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [README.md](../README.md) - Main documentation
- [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) - File organization
