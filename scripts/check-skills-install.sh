#!/usr/bin/env bash
# Tier 0: `npx skills add` (pinned) offers every skill. It skips a SKILL.md whose
# frontmatter it cannot parse (an unquoted ': ' in a description does it) with
# only a warning, so the skill never installs and nothing else fails.
set -uo pipefail
cd "$(dirname "$0")/.."

skills=(skills/*/*/SKILL.md)
out=$(NO_COLOR=1 DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 npx -y skills@1.9.0 add . --list 2>&1)
status=$?
echo "$out"
if [[ $status -ne 0 ]] || grep -q 'Skipped' <<<"$out" || ! grep -q "Found ${#skills[@]} skills" <<<"$out"; then
  echo "::error::npx skills add must offer all ${#skills[@]} skills; a description containing ': ' needs double quotes"
  exit 1
fi
