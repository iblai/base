# Keep your skills current

This repository changes often — the SDK bumps daily, and skills are corrected as
the platform's endpoints and components move. Installed skills are a **copy**;
they do not update themselves.

- **Refresh** with the same command that installed them (idempotent):

  ```bash
  npx skills add iblai/vibe --all
  ```

  In Claude Code, `/iblai-ui-ops-upgrade` does this and also bumps the SDK,
  then summarizes what changed. Since v3.0.0 the `iblai-vibe-*` skills are
  `iblai-ui-*`; it also removes the old copies once.
- **Know what you have.** The latest release is
  [github.com/iblai/base/releases/latest](https://github.com/iblai/base/releases/latest);
  every change is listed in [`CHANGELOG.md`](../CHANGELOG.md). Your copy's age is the
  modification time of `.claude/skills/iblai-ui/SKILL.md`.
- **Agents check for you.** The project `CLAUDE.md` that `/iblai-ui-ops-init`
  writes asks the assistant to suggest a refresh when the installed skills are
  older than two weeks or older than the latest release.
- **Adapters** for Cursor and Codex are regenerated from the same sources on
  every change (`adapters/`), so every editor sees the same skill.


