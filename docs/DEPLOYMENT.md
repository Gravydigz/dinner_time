# Deployment Guide - Dinner Time

This guide covers deploying the Dinner Time application in various environments.

> **Site-specific deployment details** (build host, registry account, production paths, deployment log) are in **`docs/DEPLOYMENT.private.md`**. Agents: read it before building or deploying. It is age-encrypted in the repository and decrypted by the git hooks when the key is present; without the key, see the template `docs/DEPLOYMENT.private.example.md`.

## Table of Contents

1. [Quick Start with Docker](#quick-start-with-docker)
2. [Development Setup](#development-setup)
3. [Production Deployment](#production-deployment)
4. [Cloud Deployment Options](#cloud-deployment-options)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start with Docker

### Prerequisites
- Docker installed ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (included with Docker Desktop)

### Steps

1. **Navigate to the project:**
   ```bash
   cd dinner_time
   ```

2. **Build and run with Docker Compose:**
   ```bash
   cd docker
   docker-compose up --build
   ```

3. **Access the application:**
   ```
   http://localhost:3010
   ```

4. **Stop the application:**
   ```bash
   docker-compose down
   ```

### Build, Tag, and Publish Docker Image

From the project root directory (`dinner_time/`). Production runs on `linux/amd64`, so build for that platform (required when building on an Apple Silicon Mac):

```bash
# Pull latest code
git pull origin main

# Build with version tag + latest
docker build --platform linux/amd64 -t gravydigz/dinner-time:2610.00.0 -t gravydigz/dinner-time:latest -f ./docker/Dockerfile .

# Push both tags to Docker Hub
docker push gravydigz/dinner-time:2610.00.0
docker push gravydigz/dinner-time:latest
```

Replace `2610.00.0` with the current version from `VERSION_INFO.md`. See that file for the full version format (`YYMM.VV.P`).

The image contains only the fake `data/*.example.json` sample data; `.dockerignore` keeps real data files and encrypted `.cry` files out of it.

### Deploying a New Release

On the server, in the folder holding its `docker-compose.yml` and mounted `data/` folder:

1. Back up the data folder (e.g. `cp -a data data.backup-$(date +%Y%m%d)`)
2. Change the `image:` tag in `docker-compose.yml` to the new version
3. Pull and restart:
   ```bash
   docker compose pull
   docker compose up -d
   ```
4. Check the version: `curl -s https://<your-host>/api/version`

The mounted `data/` folder is never overwritten by a new image. The entrypoint only copies sample data into files that are missing (first run).

### Docker Commands Reference

```bash
# Run container (listens on 3000 inside the container unless PORT is set)
docker run -d -p 3010:3000 -v "$(pwd)/data:/app/data" --name dinner-time gravydigz/dinner-time:latest

# View logs
docker logs dinner-time

# Stop container
docker stop dinner-time

# Remove container
docker rm dinner-time

# Access container shell
docker exec -it dinner-time sh
```

---

## Development Setup

### Local Development (No Docker)

The app needs the Node.js server for its `/api/*` endpoints; a plain static file server is not enough.

1. **Start the server:**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Access the application:**
   ```
   http://localhost:3000
   ```

Real data files in `data/` are decrypted from their `.cry` twins by the git hooks (see README → Data Storage). Without the age key, copy the `data/*.example.json` samples to the matching `data/*.json` names to run with fake data.

### Development with Docker

Enable hot-reload by uncommenting the frontend/server volume mounts in `docker/docker-compose.yml`:

```yaml
volumes:
  - ./data:/app/data
  - ../frontend:/app/frontend   # Uncomment for frontend hot-reload
  - ../server:/app/server       # Uncomment for server code changes (restart container)
```

Now changes to frontend files will reflect immediately without rebuilding.

---

## Production Deployment

### Option 1: Docker on VPS/Cloud Server

1. **Prepare server:**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Clone repository:**
   ```bash
   git clone https://github.com/yourusername/dinner-time.git
   cd dinner-time
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   nano .env
   ```

4. **Build and deploy:**
   ```bash
   cd docker
   docker-compose up -d --build
   ```

5. **Set up nginx reverse proxy (optional but recommended):**

   Create `/etc/nginx/sites-available/dinner-time`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3010;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   Enable and restart:
   ```bash
   sudo ln -s /etc/nginx/sites-available/dinner-time /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Set up SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Static Hosting (Not Supported)

Static hosts (Netlify, Vercel, GitHub Pages) can't run the app: it needs the Node.js server for its `/api/*` endpoints to load recipes and save plans and ratings. Use the Docker deployment above.

---

## Cloud Deployment Options

### AWS ECS (Elastic Container Service)

1. **Build and tag image:**
   ```bash
   docker build -t dinner-time -f docker/Dockerfile .
   docker tag dinner-time:latest YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/dinner-time:latest
   ```

2. **Push to ECR:**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
   docker push YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/dinner-time:latest
   ```

3. **Create ECS task definition and service (use AWS Console or CLI)**

### Google Cloud Run

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT/dinner-time
gcloud run deploy dinner-time --image gcr.io/YOUR_PROJECT/dinner-time --platform managed
```

### Azure Container Instances

```bash
az container create --resource-group myResourceGroup \
  --name dinner-time \
  --image YOUR_REGISTRY/dinner-time:latest \
  --dns-name-label dinner-time \
  --ports 80
```

### DigitalOcean App Platform

1. Connect GitHub repository
2. Select "Docker" as source
3. Point to `docker/Dockerfile`
4. Deploy

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Key variables:
- `PORT`: Application port (default: 3000; the compose file sets 3010)
- `TZ`: Timezone setting
- `NODE_ENV`: production or development

### Data Persistence

The `data/` directory contains:
- Recipe database (`data/master_recipes.json`)
- Members, ratings and weekly plans (`members.json`, `ratings.json`, `weekly_plans.json`)
- User uploads (`data/uploads/`)

**Important:** In Docker, mount this as a volume to persist data:

```yaml
volumes:
  - ./data:/app/data
```

Or use a named volume:

```yaml
volumes:
  - dinner-time-data:/app/data

volumes:
  dinner-time-data:
    driver: local
```

On first run the entrypoint fills any missing data file from the image's fake `*.example.json` samples; existing files are never overwritten. **About → Export data** in the app downloads all data files as one JSON for an extra backup.

### Backup Strategy

**Automated backup script:**

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup recipes database
cp data/recipes/master_recipes.json "$BACKUP_DIR/recipes_$DATE.json"

# Backup user uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" data/uploads/

# Keep only last 30 days
find "$BACKUP_DIR" -name "recipes_*.json" -mtime +30 -delete
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +30 -delete
```

Schedule with cron:
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

---

## Monitoring

### Health Checks

The Docker container includes a health check:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' dinner-time

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' dinner-time
```

### Logs

```bash
# View nginx access logs
docker exec dinner-time tail -f /var/log/nginx/dinner_time_access.log

# View nginx error logs
docker exec dinner-time tail -f /var/log/nginx/dinner_time_error.log

# View all container logs
docker logs -f dinner-time
```

### Performance Monitoring

Consider adding:
- **Uptime monitoring:** UptimeRobot, Pingdom
- **Application monitoring:** New Relic, DataDog
- **Log aggregation:** ELK Stack, Papertrail

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs dinner-time

# Check port conflicts
lsof -i :8080

# Verify Dockerfile syntax
docker build --no-cache -t dinner-time -f docker/Dockerfile .
```

### Can't access application

```bash
# Verify container is running
docker ps

# Check port mapping
docker port dinner-time

# Test locally
curl http://localhost:8080

# Check firewall
sudo ufw status
sudo ufw allow 8080
```

### Data not persisting

```bash
# Verify volume mount
docker inspect dinner-time | grep Mounts -A 10

# Check permissions
docker exec dinner-time ls -la /usr/share/nginx/html/data
```

### Recipe data not loading

1. Check browser console for errors
2. Verify `master_recipes.json` exists and is valid JSON
3. Check nginx error logs
4. Test JSON path: `curl http://localhost:8080/data/recipes/master_recipes.json`

### SSL/HTTPS Issues

```bash
# Test SSL certificate
openssl s_client -connect your-domain.com:443

# Renew Let's Encrypt certificate
sudo certbot renew --dry-run
sudo certbot renew
```

---

## Security Checklist

- [ ] Change default ports if needed
- [ ] Set up firewall rules
- [ ] Enable SSL/TLS (HTTPS)
- [ ] Configure security headers (already in nginx.conf)
- [ ] Restrict file upload types and sizes
- [ ] Regular backups configured
- [ ] Keep Docker images updated
- [ ] Set strong passwords for any future auth
- [ ] Monitor logs for suspicious activity

---

## Scaling

### Horizontal Scaling

Use a load balancer with multiple container instances:

```yaml
# docker-compose.yml
services:
  web:
    image: dinner-time
    deploy:
      replicas: 3
    # ... other config
```

### Vertical Scaling

Increase container resources:

```yaml
services:
  web:
    # ... other config
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '1'
          memory: 512M
```

---

## Next Steps

- Set up automated backups
- Configure monitoring and alerts
- Set up CI/CD pipeline
- Add analytics (Google Analytics, Plausible)
- Consider CDN for static assets
- Plan for database migration (if adding backend)

For more information, see:
- [README.md](../README.md) - Main documentation
- [QUICK_START.md](QUICK_START.md) - User guide
- [AUTOMATION_GUIDE.md](AUTOMATION_GUIDE.md) - Automation setup
- [N8N_RECIPE_PROCESSING.md](N8N_RECIPE_PROCESSING.md) - Recipe processing with n8n
- [WEEKLY_PLANS_GUIDE.md](WEEKLY_PLANS_GUIDE.md) - How weekly plans work
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical architecture
- [DEPLOYMENT.private.md](DEPLOYMENT.private.md) - Site-specific build and deploy details (encrypted; template: [DEPLOYMENT.private.example.md](DEPLOYMENT.private.example.md))
