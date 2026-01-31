# Project Location

## Current Location

**Path:** `/Users/travisrobertson/Code/dinner_time`

The project has been moved to the Code directory for better organization.

## Quick Access

```bash
# Navigate to project
cd /Users/travisrobertson/Code/dinner_time

# Or use alias (add to ~/.zshrc or ~/.bashrc)
alias dinner="cd /Users/travisrobertson/Code/dinner_time"
```

## Updated Paths

### Shell Scripts
All shell scripts now use **relative paths** instead of absolute paths:
- Works from any location
- Docker-compatible
- Portable across systems

Example:
```bash
# Old (absolute)
UPLOAD_IMAGES="/Users/travisrobertson/dinner_time/uploads/images"

# New (relative)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
UPLOAD_IMAGES="$PROJECT_DIR/data/uploads/images"
```

### Documentation
All documentation files have been updated with the new path.

## Docker Usage

Docker paths remain unchanged as they use container paths:
```bash
# Build from new location
cd /Users/travisrobertson/Code/dinner_time
docker build -t dinner-time -f docker/Dockerfile .

# Run with docker-compose
cd /Users/travisrobertson/Code/dinner_time/docker
docker-compose up
```

## Git Repository

If you initialize Git, do it from the project root:
```bash
cd /Users/travisrobertson/Code/dinner_time
git init
git add .
git commit -m "Initial commit"
```

## Access Application

### Local Development
```bash
cd /Users/travisrobertson/Code/dinner_time/frontend/public
python3 -m http.server 8000
# Visit http://localhost:8000
```

### Docker
```bash
cd /Users/travisrobertson/Code/dinner_time/docker
docker-compose up
# Visit http://localhost:8080
```

## Notes

- All relative paths work correctly from any location
- Docker containers use internal paths (not affected by host location)
- Documentation updated automatically
- Scripts work in both local and containerized environments

---

**Last Updated:** January 31, 2024
