# Version Information

## Current Version

**2602.00.0**

## Version Format

`YYMM.VV.P`

- `YYMM` - Two-digit year + two-digit month
- `VV` - Version/release number for that month (00, 01, 02, etc.)
- `P` - Patch number (0, 1, 2, etc.)

Example: `2602.00.0` = February 2026, first version, no patches
Example: `2602.01.2` = February 2026, second version, third patch

## Files to Update

When releasing a new version, update the version string in all of the following files:

| File | Location | Format |
|------|----------|--------|
| `CHANGELOG.md` | New section at top | `## [2602.00.0] - 2026-02-14` |
| `server/server.js` | Line 9 | `const APP_VERSION = '2602.00.0';` |
| `server/package.json` | `version` field | `"version": "2602.00.0"` |
| `docker/Dockerfile` | Line 11 | `LABEL version="2602.00.0"` |
| `frontend/public/assets/js/config.js` | Top of file | `const APP_VERSION = '2602.00.0';` |

## Version API

The current version is available via the API:

```
GET /api/version
```

Response:
```json
{
  "version": "2602.00.0"
}
```

## Frontend Access

The version is available in JavaScript via:

```javascript
CONFIG.version  // Returns "2602.00.0"
```

## Docker Image Tags

When building Docker images, tag with both version and latest:

```bash
docker build -t gravydigz/dinner-time:2602.00.0 -t gravydigz/dinner-time:latest -f ./docker/Dockerfile .
```

## Changelog

All version history and changes are documented in `CHANGELOG.md`.

Each version entry should include sections for:
- **Added** - New features
- **Changed** - Changes to existing functionality
- **Fixed** - Bug fixes
- **Removed** - Removed features

## Quick Update Checklist

- [ ] Update `CHANGELOG.md` with new version and changes
- [ ] Update `server/server.js` - `APP_VERSION`
- [ ] Update `server/package.json` - `version`
- [ ] Update `docker/Dockerfile` - `LABEL version`
- [ ] Update `frontend/public/assets/js/config.js` - `APP_VERSION`
- [ ] Build and tag Docker image
- [ ] Commit changes with version in commit message
