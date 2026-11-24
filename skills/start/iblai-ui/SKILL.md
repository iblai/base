---
name: iblai-ui
description: Start here for anything on the ibl.ai platform — the map from what you want (a new app; users and admins; custom user or organization data; agents; memory; analytics; charging users; iOS, Android, macOS, Windows; operating the platform headlessly from a terminal or CI; anything with no component) to the skill that does it. Use when the user mentions ibl.ai, iblai, or vibe, points an agent at github.com/iblai/base, asks where a capability lives, which skill to use, whether a skill has a UI, or how to build or operate agents, users, organizations, memories, analytics, or billing. Two families in one install — iblai-ui-* (visual components, build, ship) and iblai-api-* (headless REST) — plus the sibling repos iblai/os (reference app) and iblai/vibe-marketing.
globs:
alwaysApply: false
metadata:
  kind: guide
---

# /iblai-ui

The single entry point to building on [ibl.ai](https://ibl.ai). Every custom
app on the platform needs the same dozen things — sign-in, an agent to talk
to, users and admins, organizations, custom data, memory, analytics,
billing — and each is a ready component plus a skill that wires it in. Read
the table, open the skill, build. This skill builds nothing itself.

> New to the platform? Read [docs/platform-lifecycle.md](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/docs/platform-lifecycle.md)
> first (join → your org → org key → API token → credits) — ten minutes.
> Words: [docs/glossary.md](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/docs/glossary.md).

## What do you want to do?

Two families, one install. **`iblai-ui-*`** (kind `ui`/`ops`/`guide`) mounts
a visual component in your app or ships it; **`iblai-api-*`** (kind `api`)
drives the same platform data headlessly — exact endpoints, `curl`, no screen.
★ = the six core families almost every app reads or writes — which scope stores
what: [docs/catalogue.md#core](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/docs/catalogue.md). Full delineation:
[docs/skill-kinds.md](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/docs/skill-kinds.md).

| You want… | With a screen (`iblai-ui-*`) | Headless (`iblai-api-*`) |
|---|---|---|
| **To start, and you have not decided** new/existing, one org or many, who signs in | `/iblai-ui-start` — four questions, recorded in `iblai.env`, then routed | same |
| **A new app** — sign-in, chat with an agent, users/admins, profile, admin area, custom data | `/iblai-ui-ops-init` (copies vibe-starter; asks only for org key + token) | — |
| **Operate an org with no app** — from a terminal, a script, CI, or your assistant | — | `/iblai-api-login` first, then the skill for the family below |
| Chat with an agent; customize the chat surface | `/iblai-ui-agent-chat` (+ `/iblai-ui-agent-chat-sidebar`, `/iblai-ui-project`) | `iblai-api-agent-session`, `agent-chat` |
| Find / browse agents | `/iblai-ui-agent-search` | `iblai-api-search` |
| ★ Create an agent; set its identity, visibility, capabilities | `/iblai-ui-agent-create` → `/iblai-ui-agent-setting`; all 26 tabs via `/iblai-ui-agent` | ★ `iblai-api-agent-setting`, `agent-create` |
| ★ The user's profile (name, bio, image, education, résumé) | `/iblai-ui-profile` | ★ `iblai-api-profile` |
| ★ Custom data per user — preferences, flags, onboarding progress, app state | `/iblai-ui-user-metadata` | ★ `iblai-api-profile-metadata` |
| ★ Custom data per organization — settings, branding, toggles | `/iblai-ui-org-metadata`, `/iblai-ui-account` | ★ `iblai-api-org` |
| Users vs admins: directory, invites, roles, a User/Admin view | `/iblai-ui-admin`, `/iblai-ui-invite`, `/iblai-ui-rbac` | `iblai-api-management`, `rbac`, `invite`, `scim` |
| ★ Memory — what agents remember about people; agent knowledge | `/iblai-ui-memory-guide` → `/iblai-ui-memory`, `/iblai-ui-agent-memory` | ★ `iblai-api-agent-memory` |
| ★ Analytics — usage, users, topics, transcripts, costs, audit, reports | `/iblai-ui-analytics`, `/iblai-ui-agent-audit`, `/iblai-ui-history` | ★ `iblai-api-analytics` |
| Notifications (bell, inbox, alerts, admin send) | `/iblai-ui-notification` | `iblai-api-notification` |
| Money — how you are billed; charging your users; what happens when credits run out | `/iblai-ui-pricing` → `/iblai-ui-credit`, `-billing`, `-credit-exhaustion`, `-agent-billing`, `-monetization-app-paywall`, `-monetization` | `iblai-api-billing`, `spend-caps` |
| A navbar, an onboarding flow, a README | `/iblai-ui-navbar`, `/iblai-ui-onboard`, `/iblai-ui-readme` | — |
| Ship: a URL; macOS / Windows / iOS / Android; the stores | `/iblai-ui-ops-deploy`, `/iblai-ui-ops-build`, `/iblai-ui-ops-release`, `/iblai-ui-windows-msix`, `/iblai-ui-iconography` | `iblai-api-infrastructure` (self-host) |
| Test before showing work (build, tests, a browser touch test); upgrade | `/iblai-ui-ops-test`, `/iblai-ui-ops-upgrade` | — |
| Courses, applications, CRM, workflows, local LLMs | `/iblai-ui-course-access`, `-course-create`, `-application`, `-crm-overview`, `-workflow`, `-local-llm` | `iblai-api-catalog`, `apply`, `crm` |
| **Anything with no component** | `/iblai-ui-api` — server route + `Api-Token` inside the app | the `iblai-api-*` skill for that family (51) |

Not sure? Run `/iblai-ui-ops-init` — the starter already has the first
eight rows wired.

## The repo map

| Repo | What it holds | Get it |
|---|---|---|
| [`iblai/base`](https://github.com/iblai/base) (this repo) | Both families: `iblai-ui-*` for building frontend apps (vibe-starter, SSO, chat, admin, metadata, memory, analytics, billing, deploy/build/release) and `iblai-api-*` for operating every platform REST family headlessly (formerly `iblai/api`), plus the hosted chat MCP server (`mcp/`) and `tutorials/` | `npx skills add iblai/vibe --all` |
| [`iblai/os`](https://github.com/iblai/os) | The Agentic OS ([os.ibl.ai](https://os.ibl.ai)) — the reference app built on this SDK, and your org's admin console until your app has one | clone / browse |
| [`iblai/vibe-agent`](https://github.com/iblai/vibe-agent) | A finished one-agent app with its own Stripe paywall — the model for "one creator, one agent, one price" | clone |
| [`iblai/vibe-marketing`](https://github.com/iblai/vibe-marketing) | 43 marketing skills + platform CLIs | `npx skills add iblai/vibe-marketing` |

## Keep the skills current

Installed skills are a copy. Re-run `npx skills add iblai/vibe --all` (or
`/iblai-ui-ops-upgrade`) when your `.claude/skills/iblai-ui/SKILL.md` is
older than two weeks or older than the
[latest release](https://github.com/iblai/base/releases/latest).

## Key links

- [CLAUDE.md](https://github.com/iblai/base/blob/main/CLAUDE.md) — agent guidance, the tiered skill catalogue
- [docs/platform-lifecycle.md](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/docs/platform-lifecycle.md) — join → org → credentials → credits → ship
- [docs/security-model.md](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/docs/security-model.md) — where each credential lives and why
- [docs/auth-model.md](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/docs/auth-model.md) — sign-in, organizations, single-org / multi-org / headless · [docs/domain-model.md](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/docs/domain-model.md) — users, agents, organizations
- [docs/skill-kinds.md](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/docs/skill-kinds.md) — the two families and five kinds · [docs/api-skills.md](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/docs/api-skills.md) — the headless contract
- [BRAND.md](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/BRAND.md) — brand guidelines
- [ibl.ai/docs](https://ibl.ai/docs) — every screen of the OS, documented
