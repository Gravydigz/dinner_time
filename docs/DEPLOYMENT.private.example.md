# Private Deployment Notes - Template

The real site-specific deployment notes live in `docs/DEPLOYMENT.private.md`, which is committed only in age-encrypted form (`docs/DEPLOYMENT.private.md.cry`). With the age key installed and `git config core.hooksPath .githooks` set, the git hooks decrypt it automatically on checkout and pull.

If you can't decrypt it (no key, or your own deployment), copy this template to `docs/DEPLOYMENT.private.md` and fill it in. That path is gitignored, so your notes stay local unless you set up your own encryption.

Follow `docs/DEPLOYMENT.md` for the general build and deploy steps.

## Overview

| Role | Where | Notes |
|------|-------|-------|
| Build host | `<build-host>` | Architecture (amd64 / ARM — ARM needs `tonistiigi/binfmt --install amd64`) |
| Build user | `<user>` | Clone location |
| Image registry | `<registry account>` | Repository and tags |
| Production host | `<production-host>` | Reverse proxy / HTTPS |
| Compose folder | `<path>` | |
| Data mount | `<path>/data` → `/app/data` | Live data; never in git or the image |
| Backup & compose update | `<how>` | |

## Build and Publish

1. Check out the release tag on the build host
2. Build: `docker build --platform linux/amd64 -t <registry>/dinner-time:<version> -t <registry>/dinner-time:latest -f ./docker/Dockerfile .`
3. Verify the image holds only samples: `docker run --rm --platform linux/amd64 --entrypoint ls <registry>/dinner-time:<version> /app/tmp`
4. Push both tags

## Deploy

1. Back up the live data folder
2. Change the compose `image:` tag, then `docker compose pull && docker compose up -d`
3. Verify `/api/version` and the footer version

## Deployment Log

| Date | Version | Notes |
|------|---------|-------|
| | | |
