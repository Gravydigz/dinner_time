# Version Information

## Current Version

**2026.01.31.02**

## Version Format

`YYYY.MM.DD.##`

- `YYYY` - Four-digit year
- `MM` - Two-digit month
- `DD` - Two-digit day
- `##` - Daily release sequence number (01, 02, 03, etc.)

Example: `2026.01.31.02` = Second release on January 31, 2026

## Files to Update

When releasing a new version, update the version string in all of the following files:

| File | Location | Format |
|------|----------|--------|
| `CHANGELOG.md` | New section at top | `## [2026.01.31.02] - 2026-01-31` |
| `server/server.js` | Line 9 | `const APP_VERSION = '2026.01.31.02';` |
| `server/package.json` | `version` field | `"version": "2026.01.31.02"` |
| `docker/Dockerfile` | Line 11 | `LABEL version="2026.01.31.02"` |
| `frontend/public/assets/js/config.js` | Top of file | `const APP_VERSION = '2026.01.31.02';` |

## Version API

The current version is available via the API:

```
GET /api/version
```

Response:
```json
{
  "version": "2026.01.31.02"
}
```

## Frontend Access

The version is available in JavaScript via:

```javascript
CONFIG.version  // Returns "2026.01.31.02"
```

## Docker Image Tags

When building Docker images, tag with both version and latest:

```bash
docker build -t gravydigz/dinner-time:2026.01.31.02 -t gravydigz/dinner-time:latest -f ./docker/Dockerfile .
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
