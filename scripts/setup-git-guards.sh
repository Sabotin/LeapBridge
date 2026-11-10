#!/bin/sh
# Turn on this repo's commit guards. A fresh clone has none until this runs.
# Safe to run again. Claude Code runs it at every session start.
cd "$(dirname "$0")/.." || exit 0
git config core.hooksPath scripts/git-hooks

# A cloud session commits as an Anthropic identity by default.
# Replace it with the owner's identity, for this clone only.
at='@'
case "$(git config user.email)" in
  *anthropic.com|'')
    git config user.name 'Sabotin'
    git config user.email "157064768+Sabotin${at}users.noreply.github.com"
    ;;
esac
exit 0
