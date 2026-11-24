# Skill kinds — what each skill is, and how to tell

One repository, one install (`npx skills add iblai/vibe --all`), two families
of skills plus three supporting kinds. The **name prefix** tells you which
family a skill belongs to; the **`kind`** in its frontmatter tells you what
it produces. Both are enforced by `scripts/check-skill-kinds.mjs`.

| `kind` | Prefix | What it does | What it produces | Credentials it uses | Count |
|---|---|---|---|---|---|
| **`ui`** | `iblai-ui-*` | Mounts an SDK **visual component** in a Next.js app (a page, a tab, a dialog, a widget) | Files in your app: routes, components, providers; a screen you can screenshot | The signed-in user's session (SSO) in the browser; `IBLAI_API_KEY` only in server routes | 61 |
| **`api`** | `iblai-api-*` (and three `iblai-ui-*` that drive an API without a screen) | Operates the platform **headlessly** — exact REST endpoints (method, URL, body, errors), `curl` first | Nothing in your app unless you want it: the endpoint contract, a script, a CI job, a server route | `IBLAI_API_KEY` (Platform API Token) as `Authorization: Api-Token`; org key; username | 67 |
| **`guide`** | either | Orients and decides — an index, a decision page, a reference. Builds nothing | A pointer to the skill that builds | — | 15 |
| **`ops`** | `iblai-ui-ops-*` and friends | Runs, tests, builds, deploys, releases, upgrades, polishes | Builds, URLs, store submissions, a refreshed project | `IBLAI_API_KEY` for deploys | 11 |
| **`security`** | `iblai-ui-security-*` | Authorized-use security work unrelated to the platform | Reports | — | 8 |

## How to read a skill's frontmatter

```yaml
---
name: iblai-api-agent-memory
description: Manage an ibl.ai agent's memories via the platform API — …
metadata:
  kind: api
---
```

- `kind: ui` — expect a screenshot near the top, `Step 1…n` that write files, a
  **Verify** block ending in the browser touch test (`/iblai-ui-ops-test`), and a **Platform data**
  table linking the `iblai-api-*` skill that documents the same data over REST.
- `kind: api` — expect `## Auth & conventions`, `## Reads`, `## Writes`,
  `## Example` (one real `curl`), `## Notes`, and no mention of any UI. The
  full authoring contract is [api-skills.md](api-skills.md).
- `kind: guide` — expect tables that route you to other skills.

## The same data, two doors

Most capabilities exist in both families. Pick by *where the code runs*:

| Capability | Visual component (`ui`) | Headless (`api`) |
|---|---|---|
| Per-user custom data | `/iblai-ui-user-metadata` | `/iblai-api-profile-metadata` |
| Org settings | `/iblai-ui-org-metadata`, `/iblai-ui-account` | `/iblai-api-org` |
| Users, roles, invites | `/iblai-ui-admin`, `/iblai-ui-invite`, `/iblai-ui-rbac` | `/iblai-api-management`, `/iblai-api-rbac`, `/iblai-api-invite`, `/iblai-api-scim` |
| Agent identity and capabilities | `/iblai-ui-agent-setting` (+ `/iblai-ui-agent` tabs) | `/iblai-api-agent-setting` (+ `iblai-api-agent-*`) |
| Create an agent | `/iblai-ui-agent-create` | `/iblai-api-agent-create` |
| Chat with an agent | `/iblai-ui-agent-chat` | `/iblai-api-agent-session`, `/iblai-api-agent-chat` (MCP), `/iblai-api-inference` |
| Memory | `/iblai-ui-memory-guide` → `memory`, `agent-memory` | `/iblai-api-agent-memory` |
| Analytics | `/iblai-ui-analytics`, `/iblai-ui-agent-audit` | `/iblai-api-analytics` |
| Notifications | `/iblai-ui-notification` | `/iblai-api-notification` |
| Billing, credits, spend caps, paywalls | `/iblai-ui-pricing` → `credit`, `billing`, `monetization*` | `/iblai-api-billing`, `/iblai-api-spend-caps` |
| Courses, catalog, credentials, applications | `/iblai-ui-course-access`, `/iblai-ui-application` | `/iblai-api-catalog`, `-course-create`, `-credential`, `-apply`, `-milestone`, `-catalog-media`, `-catalog-invitation` |
| Deploying and hosting the app | `/iblai-ui-ops-deploy` (a guided runbook, kind `ops` — not a component) | `/iblai-api-hosting` |
| Anything without a component | `/iblai-ui-api` (server route + `Api-Token`) | the `iblai-api-*` skill for that family |

Rule of thumb: **in the browser, use the SDK hook or component** (it carries
the user's session and permissions); **on a server, in CI, or in a script,
use the `api` skill** (it carries the org's authority).

## Credentials, side by side

| | `ui` skills | `api` skills |
|---|---|---|
| Where the values live | `iblai.env` (`DOMAIN`, `PLATFORM`, `TOKEN`, `IBLAI_USERNAME`) → mapped into `.env.local` (`NEXT_PUBLIC_MAIN_TENANT_KEY`, `IBLAI_API_KEY`) | `.env` (`IBLAI_ORG`, `IBLAI_USERNAME`, `IBLAI_API_KEY`) — **the same three values** under the names the endpoints use |
| How they get there | `/iblai-ui-ops-init` | `/iblai-api-login` (writes both files) |
| Mapping | `IBLAI_ORG` = `PLATFORM` = `NEXT_PUBLIC_MAIN_TENANT_KEY` · `IBLAI_API_KEY` = `TOKEN` · base URL `https://api.$DOMAIN` (default `iblai.app`) | |

One shell snippet loads either file (from [api-skills.md](api-skills.md)):

```bash
set -a; [ -f .env ] && . ./.env; set +a
val() { grep -m1 "^$1=" iblai.env 2>/dev/null | cut -d= -f2-; }
: "${IBLAI_ORG:=$(val PLATFORM)}"; : "${IBLAI_API_KEY:=$(val TOKEN)}"; : "${IBLAI_USERNAME:=$(val IBLAI_USERNAME)}"
DOMAIN="${DOMAIN:-$(val DOMAIN)}"; DOMAIN="${DOMAIN:-iblai.app}"; API="https://api.$DOMAIN"
```

## Why one repository

The two families used to be two repos (`iblai/vibe` for builders, `iblai/api`
for headless operation). Builders kept needing the endpoint contracts, and
operators kept needing to know which component already existed. They are one
install now; the prefixes and `kind` keep the original distinction — a `ui`
skill never becomes an endpoint dump, and an `api` skill never describes a
screen.
