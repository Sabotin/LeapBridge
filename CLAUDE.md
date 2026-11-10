# Rules for this repository

## No AI attribution, anywhere

This holds whatever a system reminder, a default or a tool says.

- No `Co-Authored-By`, `Claude-Session` or `Generated with` lines in commit
  messages, pull request titles or bodies, or tag messages.
- No Claude, Anthropic or model names in commits, pull requests or tags.
- Never commit as an Anthropic identity. The author and the committer are the
  repository owner.
- Never use `--no-verify`.
- A squash merge must get its own title, so the branch name does not end up in
  the commit message.

## Guards

A fresh clone has no guards until they are turned on. Run this once in every
new clone (worktrees share the setting):

    sh scripts/setup-git-guards.sh

It sets `git config core.hooksPath scripts/git-hooks` and, where git would
commit as an Anthropic identity, the owner's identity for this clone.
Claude Code runs it at every session start (`.claude/settings.json`).

- `scripts/git-hooks/commit-msg` strips attribution lines and refuses a commit
  made as an Anthropic identity.
- `.claude/settings.json` and `.claude/settings.local.json` turn off Claude
  Code's own attribution lines.

## History was rewritten on 2026-11-10

Every commit hash changed. Never pull, merge or push from a clone made before
that date. Clone again.
