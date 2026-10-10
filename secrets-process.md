# Secrets process

This repo uses the age + git-hooks secrets process. The real hooks and the full documentation live in the private repo **github.com/Gravydigz/secrets-process**, cloned once per machine at `~/.secrets-process` (that is, `$HOME/.secrets-process` for whatever `$HOME` git runs with). `.githooks/` here holds only wrapper shims that run those hooks. Don't edit the shims; fix the hooks in secrets-process.

## Before any secrets work (agents and humans)

Adding a secret file, editing `.age-index`, a blocked commit, a hook error: first update the process, then read its doc.

1. Update. This one line works in bash, zsh and PowerShell:
   ```
   git -C "$HOME/.secrets-process" pull --ff-only
   ```
   If the directory doesn't exist, clone it: `git clone https://github.com/Gravydigz/secrets-process.git "$HOME/.secrets-process"`. If the clone or pull fails, stop and tell the human.
2. Read `~/.secrets-process/README.md`. §8 is the agent spec and the standing rules.

## Always

- Secret files are gitignored, listed in `.age-index`, and committed only as their `.cry` twin.
- `git config core.hooksPath` must print `.githooks`. If it doesn't: `git config core.hooksPath .githooks`.
- Never `git commit --no-verify`. Never `git add -f` a path in `.age-index`.
- If a hook blocks a commit, surface the exact error to the human. Don't work around it.
