# Getting started — the whole journey

The README gives you the three steps. This page is what actually happens in
each, which entry point is yours, and what to do when you are not starting from
scratch.

## Which entry point is yours

| You are | Architecture | Entry point |
|---|---|---|
| Starting a **new app for one organization** — yours, or a customer you deploy to (most apps) | **single-org**: the org key is pinned, one server-to-server token, members sign in with SSO | `/iblai-ui-start` → `/iblai-ui-ops-init` copies **vibe-starter** |
| Building **one deployment for many organizations**, users moving between them (the os.ibl.ai model) | **multi-org**: org in the URL, a switcher, re-auth per org | `/iblai-ui-start` → `/iblai-ui-ops-init`, then `/iblai-ui-auth` → "Going multi-org" |
| Adding ibl.ai to an **existing Next.js app** | either of the above | `/iblai-ui-start` → `/iblai-ui-auth`, then the feature skills |
| Adding ibl.ai to an **existing app that is not Next.js** | either | `/iblai-ui-start` → `/iblai-api-login`; the `iblai-api-*` skills work anywhere, the components need Next.js |
| Writing a **script, CI job, or backend** — nobody signs in | **headless**: a Platform API Token per org | `/iblai-ui-start` → `/iblai-api-login`, then the `iblai-api-*` skill for the family |

How sign-in and organizations really work: [auth-model.md](auth-model.md).
The data every app is built on: [domain-model.md](domain-model.md).

## The journey

0. **Get an organization** — sign up at [ibl.ai/join](https://ibl.ai/join); it creates your account *and your organization*. (Everyone is also in the shared `main` org — that one is not yours.) → [Platform lifecycle](platform-lifecycle.md)
1. **Get two values** — your **org key** (on [login.iblai.app/me](https://login.iblai.app/me)) and a **Platform API Token** (os.ibl.ai → Admin → Integrations → API → Add API Key). → [same doc](platform-lifecycle.md#4-value-two-a-platform-api-token)
2. **Scaffold and run** — install the skills, run `/iblai-ui-ops-init`, `pnpm dev`, sign in, pick or create your agent on `/setup`.
3. **Add the core** — profile, admin area, custom user and org data, memory, analytics, notifications: one skill each, [below](#the-core-app).
4. **Make it yours** — your pages with shadcn/ui; anything without a component through the REST API ([`/iblai-ui-api`](../skills/start/iblai-ui-api/SKILL.md)).
5. **Charge (optional)** — [`/iblai-ui-pricing`](../skills/billing/iblai-ui-pricing/SKILL.md): how you are billed, and the three ways to bill your users.
6. **Ship** — [`/iblai-ui-ops-deploy`](../skills/ship/iblai-ui-ops-deploy/SKILL.md) for a URL; [`/iblai-ui-ops-build`](../skills/ship/iblai-ui-ops-build/SKILL.md) and [`/iblai-ui-ops-release`](../skills/ship/iblai-ui-ops-release/SKILL.md) for desktop, mobile, and the stores.



Every step in detail, with what to click and what to check:
[platform-lifecycle.md](platform-lifecycle.md).

## Connecting your organization

`/iblai-ui-connect` opens `login.iblai.app/connect`: you sign in (or create
an organization), pick the organization, click **Connect**, and the agent
receives the org key, your username, and a fresh Platform API Token on a
loopback callback — it writes `iblai.env`, `.env`, and `.env.local` and never
shows the token. No browser (SSH, a container)? The same page has a manual mode
you paste into the chat. Until the hosted page ships, the skills fall back to
asking for the two values and telling you exactly where they are:
[connect-flow.md](connect-flow.md).

## The core app

What `/iblai-ui-ops-init` gives you, and the skill that owns each piece.
★ marks the six core data families almost every app reads or writes ([which scope stores what](catalogue.md#core)) — each links
its headless twin, the `iblai-api-*` skill that documents the same data over REST.

| You get | Skill | Reads / writes on the platform |
|---|---|---|
| SSO sign-in, session, org resolution (a placeholder or `main` org shows an alert, not a login loop) | [`/iblai-ui-auth`](../skills/start/iblai-ui-auth/SKILL.md) | [login](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/start/iblai-api-login/SKILL.md) |
| **Home = chat** with your agent — streaming, files, voice, canvas | [`/iblai-ui-agent-chat`](../skills/agents/iblai-ui-agent-chat/SKILL.md) (+ [sidebar](../skills/agents/iblai-ui-agent-chat-sidebar/SKILL.md), [projects](../skills/agents/iblai-ui-project/SKILL.md)) | [agent-session](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-session/SKILL.md) |
| Agents browser (favorites, featured, custom, all) | [`/iblai-ui-agent-search`](../skills/agents/iblai-ui-agent-search/SKILL.md) | [search](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-search/SKILL.md) |
| ★ Create an agent from the app; set its identity, visibility, capabilities; every settings tab | [`/iblai-ui-agent-create`](../skills/agents/iblai-ui-agent-create/SKILL.md), [`/iblai-ui-agent-setting`](../skills/agents/iblai-ui-agent-setting/SKILL.md), [`/iblai-ui-agent`](../skills/agents/iblai-ui-agent/SKILL.md) | ★ [agent-setting](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-setting/SKILL.md) |
| ★ The user's profile — name, bio, image, education, résumé | [`/iblai-ui-profile`](../skills/users/iblai-ui-profile/SKILL.md) | ★ [profile](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/users/iblai-api-profile/SKILL.md) |
| ★ **Custom data per user** — preferences, flags, onboarding, app state (no DB, no localStorage) | [`/iblai-ui-user-metadata`](../skills/users/iblai-ui-user-metadata/SKILL.md) | ★ [profile-metadata](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/users/iblai-api-profile-metadata/SKILL.md) |
| ★ **Custom data per organization** — settings, name, logos, support email | [`/iblai-ui-org-metadata`](../skills/organizations/iblai-ui-org-metadata/SKILL.md), [`/iblai-ui-account`](../skills/organizations/iblai-ui-account/SKILL.md) | ★ [org](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/organizations/iblai-api-org/SKILL.md) |
| **Users vs admins** — User/Admin view switch, admin area, invites, roles and policies | [`/iblai-ui-admin`](../skills/users/iblai-ui-admin/SKILL.md), [`/iblai-ui-invite`](../skills/users/iblai-ui-invite/SKILL.md), [`/iblai-ui-rbac`](../skills/users/iblai-ui-rbac/SKILL.md) | [management](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/users/iblai-api-management/SKILL.md), [rbac](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/users/iblai-api-rbac/SKILL.md), [invite](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/users/iblai-api-invite/SKILL.md) |
| ★ **Memory** — what agents remember about people (user-global, per agent, agent knowledge) | [`/iblai-ui-memory-guide`](../skills/users/iblai-ui-memory-guide/SKILL.md), [`/iblai-ui-memory`](../skills/users/iblai-ui-memory/SKILL.md), [`/iblai-ui-agent-memory`](../skills/agents/iblai-ui-agent-memory/SKILL.md) | ★ [agent-memory](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-memory/SKILL.md) |
| ★ **Analytics** — usage, users, topics, transcripts, costs, audit, reports; org-wide or per agent | [`/iblai-ui-analytics`](../skills/analytics/iblai-ui-analytics/SKILL.md), [`/iblai-ui-agent-audit`](../skills/agents/iblai-ui-agent-audit/SKILL.md), [`/iblai-ui-history`](../skills/users/iblai-ui-history/SKILL.md) | ★ [analytics](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/analytics/iblai-api-analytics/SKILL.md) |
| Notifications — bell, inbox, alerts, admin send | [`/iblai-ui-notification`](../skills/users/iblai-ui-notification/SKILL.md) | [notification](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/users/iblai-api-notification/SKILL.md) |
| Navbar, onboarding flow, README | [`/iblai-ui-navbar`](../skills/start/iblai-ui-navbar/SKILL.md), [`/iblai-ui-onboard`](../skills/users/iblai-ui-onboard/SKILL.md), [`/iblai-ui-readme`](../skills/ship/iblai-ui-readme/SKILL.md) | — |
| Anything with no component | [`/iblai-ui-api`](../skills/start/iblai-ui-api/SKILL.md) | any of the 51 `iblai-api-*` skills |
| Test before showing work (build, tests, a browser touch test); keep current | [`/iblai-ui-ops-test`](../skills/ship/iblai-ui-ops-test/SKILL.md), [`/iblai-ui-ops-upgrade`](../skills/start/iblai-ui-ops-upgrade/SKILL.md) | — |



## How money works

- **You** run on prepaid, rechargeable **credits** with a hard ceiling (a free trial, then a plan — Free, Pro, Max or Ultra — picked in the app; opt-in auto-recharge; no per-seat fees). Add your own LLM keys for more models; put **spend caps** on the org, an agent, or one user on one agent. When credits run out the app shows the next step: [`/iblai-ui-credit-exhaustion`](../skills/billing/iblai-ui-credit-exhaustion/SKILL.md).
- **Your users** can be charged three ways: pay-to-enter for the whole app on your own Stripe key with no commission ([`/iblai-ui-monetization-app-paywall`](../skills/monetization/iblai-ui-monetization-app-paywall/SKILL.md), the [vibe-agent](https://github.com/iblai/vibe-agent) model); per-item sales with subscriptions and revenue dashboards via Stripe Connect ([`/iblai-ui-monetization`](../skills/monetization/iblai-ui-monetization/SKILL.md) → [onboard](../skills/monetization/iblai-ui-monetization-onboard/SKILL.md), [configure](../skills/monetization/iblai-ui-monetization-configure/SKILL.md), [checkout](../skills/monetization/iblai-ui-monetization-checkout/SKILL.md), [subscription](../skills/monetization/iblai-ui-monetization-subscription/SKILL.md), [analytics](../skills/monetization/iblai-ui-monetization-analytics/SKILL.md)); or reselling platform credits ([`/iblai-ui-credit`](../skills/billing/iblai-ui-credit/SKILL.md), [`/iblai-ui-billing`](../skills/billing/iblai-ui-billing/SKILL.md), [`/iblai-ui-credit-exhaustion`](../skills/billing/iblai-ui-credit-exhaustion/SKILL.md), [`/iblai-ui-agent-billing`](../skills/agents/iblai-ui-agent-billing/SKILL.md)).
- One page decides: [`/iblai-ui-pricing`](../skills/billing/iblai-ui-pricing/SKILL.md).



## Two families of skills, one install

Every skill carries a `kind` in its frontmatter (`ui`, `api`, `guide`, `ops`,
`security` — [docs/skill-kinds.md](skill-kinds.md)). The name prefix tells
you the family; the kind tells you whether there is a screen.

| | `iblai-ui-*` — **build** (has a screen) | `iblai-api-*` — **operate** (no screen) |
|---|---|---|
| What it does | Mounts an SDK visual component in your Next.js app — a page, a tab, a dialog, a widget | Drives the platform headlessly: exact REST endpoints (method, URL, body, errors), `curl` first |
| Who it is for | Builders shipping an app | Anyone operating an organization — from a terminal, a script, CI, a server route, or an agent |
| Credentials | The signed-in user's session in the browser; `IBLAI_API_KEY` only in server routes | `IBLAI_API_KEY` (Platform API Token) as `Authorization: Api-Token`, from `.env` or `iblai.env` |
| Start | `/iblai-ui` → `/iblai-ui-ops-init` | `/iblai-api-login` |
| Also | `guide` (indexes and decision pages), `ops` (build, deploy, test, release), `security` | Tutorials in [`tutorials/`](../tutorials/); the hosted chat MCP server in [`mcp/`](../mcp/) |

Builders use both: the `ui` skill mounts the component, its **Platform data**
table names the `api` twin for anything the component doesn't cover, and
[`/iblai-ui-api`](../skills/start/iblai-ui-api/SKILL.md) is the server-route pattern
that joins them. The `iblai-api-*` family is the former
[`iblai/api`](https://github.com/iblai/base/tree/main/skills) repository, merged
here with its authoring contract intact — [docs/api-skills.md](api-skills.md).

### Headless API skills (`kind: api`)

Connect once with [`/iblai-api-login`](../skills/start/iblai-api-login/SKILL.md) (org key,
username, Platform API Token → `.env` + `iblai.env`), then any skill below is a
`/` command that calls `https://api.iblai.app` with `Authorization: Api-Token`.

| Area | Skills |
|---|---|
| **Setup** | [`/iblai-api-login`](../skills/start/iblai-api-login/SKILL.md) (start with [`/iblai-ui-start`](../skills/start/iblai-ui-start/SKILL.md) if you have not) |
| **One agent** (★ = the families most apps read or write) | ★ [`agent-setting`](../skills/agents/iblai-api-agent-setting/SKILL.md), ★ [`agent-memory`](../skills/agents/iblai-api-agent-memory/SKILL.md), [`agent-create`](../skills/agents/iblai-api-agent-create/SKILL.md), [`agent-prompt`](../skills/agents/iblai-api-agent-prompt/SKILL.md), [`agent-llm`](../skills/agents/iblai-api-agent-llm/SKILL.md), [`agent-dataset`](../skills/agents/iblai-api-agent-dataset/SKILL.md), [`agent-tool`](../skills/agents/iblai-api-agent-tool/SKILL.md), [`agent-access`](../skills/agents/iblai-api-agent-access/SKILL.md), [`agent-embed`](../skills/agents/iblai-api-agent-embed/SKILL.md), [`agent-mcp`](../skills/agents/iblai-api-agent-mcp/SKILL.md), [`agent-safety`](../skills/agents/iblai-api-agent-safety/SKILL.md), [`agent-privacy`](../skills/agents/iblai-api-agent-privacy/SKILL.md), [`agent-disclaimer`](../skills/agents/iblai-api-agent-disclaimer/SKILL.md), [`agent-history`](../skills/agents/iblai-api-agent-history/SKILL.md), [`agent-audit`](../skills/agents/iblai-api-agent-audit/SKILL.md), [`agent-eval`](../skills/agents/iblai-api-agent-eval/SKILL.md), [`agent-skill`](../skills/agents/iblai-api-agent-skill/SKILL.md), [`agent-sandbox`](../skills/agents/iblai-api-agent-sandbox/SKILL.md), [`agent-support`](../skills/agents/iblai-api-agent-support/SKILL.md) |
| **Talk to an agent** | [`agent-session`](../skills/agents/iblai-api-agent-session/SKILL.md) (REST/SSE/WebSocket), [`agent-chat`](../skills/agents/iblai-api-agent-chat/SKILL.md) (hosted MCP server), [`inference`](../skills/agents/iblai-api-inference/SKILL.md) (OpenAI-compatible `/v1`) |
| **Organization** | ★ [`org`](../skills/organizations/iblai-api-org/SKILL.md), [`management`](../skills/users/iblai-api-management/SKILL.md), [`rbac`](../skills/users/iblai-api-rbac/SKILL.md), [`invite`](../skills/users/iblai-api-invite/SKILL.md), [`scim`](../skills/users/iblai-api-scim/SKILL.md), [`token`](../skills/organizations/iblai-api-token/SKILL.md), [`integration`](../skills/organizations/iblai-api-integration/SKILL.md), [`notification`](../skills/users/iblai-api-notification/SKILL.md), [`feature`](../skills/users/iblai-api-feature/SKILL.md), [`billing`](../skills/billing/iblai-api-billing/SKILL.md), [`spend-caps`](../skills/billing/iblai-api-spend-caps/SKILL.md), [`crm`](../skills/organizations/iblai-api-crm/SKILL.md), [`external-service-proxy`](../skills/organizations/iblai-api-external-service-proxy/SKILL.md) |
| **The signed-in user** | ★ [`profile`](../skills/users/iblai-api-profile/SKILL.md), ★ [`profile-metadata`](../skills/users/iblai-api-profile-metadata/SKILL.md) |
| **Content, discovery, analytics** | ★ [`analytics`](../skills/analytics/iblai-api-analytics/SKILL.md), [`search`](../skills/agents/iblai-api-search/SKILL.md), [`catalog`](../skills/content/iblai-api-catalog/SKILL.md), [`catalog-media`](../skills/content/iblai-api-catalog-media/SKILL.md), [`catalog-invitation`](../skills/content/iblai-api-catalog-invitation/SKILL.md), [`milestone`](../skills/content/iblai-api-milestone/SKILL.md), [`credential`](../skills/content/iblai-api-credential/SKILL.md), [`apply`](../skills/content/iblai-api-apply/SKILL.md) |
| **Other LMSs** | [`canvas-course-builder`](../skills/content/iblai-api-canvas-course-builder/SKILL.md) (Canvas REST API) |
| **Guides (no endpoints)** | [`ecosystem`](../skills/ship/iblai-api-ecosystem/SKILL.md), [`infrastructure`](../skills/ship/iblai-api-infrastructure/SKILL.md) (self-hosting) |

Every name above is `/iblai-api-<name>`.

The full, tiered catalogue with one-line descriptions is in [`CLAUDE.md`](../CLAUDE.md#skill-catalogue-by-tier).
Skills are in `skills/`; `npx skills add` installs them into your project's
`.claude/skills/`. Read them, extend them, or write your own — the front door
for agents is [`/iblai-ui`](../skills/start/iblai-ui/SKILL.md).



## The ibl.ai backend

`https://api.iblai.app` powers every vibe app; you build, host, and maintain
no backend services. It provides SSO (OAuth/OIDC/SAML) with multi-org
isolation and RBAC; agents with streaming, tools, RAG, memory, voice, and any
LLM; analytics; notifications; per-user and per-org metadata; credits,
spend caps, and Stripe billing. In the browser the SDK sends the signed-in
user's session token; your server holds one org-scoped Platform API Token in
the gitignored `iblai.env` / `.env.local`. How that fits together:
[docs/security-model.md](security-model.md).

### Two MCP servers

**`@iblai/mcp`** — SDK documentation for your coding assistant (components,
hooks, RTK Query endpoints, provider setup). `.mcp.json` at the project root
(vibe-starter ships it):

```json
{
  "mcpServers": {
    "iblai": { "command": "pnpm", "args": ["dlx", "@iblai/mcp"] }
  }
}
```

(`npx -y @iblai/mcp` in npm projects.) It gives your assistant
`get_component_info`, `get_hook_info`, `get_api_query_info`,
`get_provider_setup`, `create_page_template`, `get_playwright_helper_info`.

**`iblai-agent-chat`** — a *hosted* MCP server for the one runtime capability
that is not a REST call: holding a live conversation with a deployed agent
(its tools, RAG and memory). No install; wire it with
[`/iblai-api-agent-chat`](../skills/agents/iblai-api-agent-chat/SKILL.md) or by hand from
[`mcp/iblai-agent-chat/README.md`](../mcp/iblai-agent-chat/README.md):

```bash
claude mcp add iblai-agent-chat --transport http https://asgi.data.iblai.app/mcp/agent-chat/YOUR_AGENT_UUID \
  --header "Authorization: Api-Token YOUR_API_TOKEN"
```


