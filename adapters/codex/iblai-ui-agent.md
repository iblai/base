# iblai-ui-agent

> Family index for configuring one ibl.ai agent from your app — the AgentSettingsProvider layout every tab needs, the suggested route layout, and the map of all 26 agent settings tabs (settings, prompts, LLM, datasets, memory, tools, access, analytics, API, billing, embed, evals, grader, history, LTI, MCP, privacy, safety, sandbox, screen sharing, skills, support, tasks, voice, audit, disclaimers) with the skill that mounts each. Use when the user wants to edit, configure, or manage an agent, or asks which agent tab does what. For creating an agent see /iblai-ui-agent-create; for chatting see /iblai-ui-agent-chat; for browsing agents see /iblai-ui-agent-search.

# /iblai-ui-agent

> **First time here?** If `iblai.env` has no `ARCHITECTURE=`, run `/iblai-ui-start` first (four questions; two minutes) — it decides single-org / multi-org / headless and who signs in, and every skill reads the answer.

Everything about **configuring an agent** lives behind one provider and one
route layout. Set the provider up once (§1), then mount only the tabs your app
needs (§2). Most apps need five or six; the rest are there when asked for.

![Settings tab](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-ui-agent-setting/iblai-ui-agent-setting.png)

> **Common setup (brand, conventions, env files, verification):** see [docs/skill-setup.md](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/docs/skill-setup.md).

## Prerequisites

- Auth in place (`/iblai-ui-auth`, or vibe-starter).
- A real agent UUID — the last path segment of `https://os.ibl.ai/platform/<org-key>/<agent-uuid>`, or one created with `/iblai-ui-agent-create`. **Never invent one.**
- The signed-in user must be the agent's owner, an org admin, or hold an editor role on it (`/iblai-ui-agent-access`); otherwise tabs render "no access".

## 1. The provider (once)

```tsx
// app/(app)/agents/[mentorId]/layout.tsx
"use client";

import { AgentSettingsProvider } from "@iblai/iblai-js/web-containers/next";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { resolveAppTenant } from "@/lib/iblai/tenant";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const { mentorId } = useParams<{ mentorId: string }>();
  const [tenantKey, setTenantKey] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("userData");
      if (raw) setUsername(JSON.parse(raw).user_nicename ?? "");
    } catch {}
    setTenantKey(resolveAppTenant());
  }, []);

  if (!tenantKey || !username) return null;

  return (
    <AgentSettingsProvider tenantKey={tenantKey} mentorId={mentorId} username={username} enableRBAC={false}>
      {/* Tabs that size their lists to the space they get need a bounded height. */}
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-4 border-b px-4 py-2">
          <nav className="flex gap-4 text-sm">
            <Link href={`/agents/${mentorId}/settings`}>Settings</Link>
            <Link href={`/agents/${mentorId}/tasks`}>Tasks</Link>
          </nav>
          <div data-activity-info-slot />
        </header>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </AgentSettingsProvider>
  );
}
```

Suggested routes: `app/(app)/agents/[mentorId]/<tab>/page.tsx`, one per tab,
with the layout's header holding the tab strip (plain links here, or shadcn
`Tabs`). Each tab component reads the agent from context — no props needed for
the basics.

The layout must fill the height it is given (`flex h-full flex-col`) and hand
the rest to the tab (`min-h-0 flex-1`): the Tasks, Support and Evals tabs count
how many rows fit, and in a wrapper with no height they fall to a 240px floor
(two tasks or one ticket a page on a desktop). The empty
`<div data-activity-info-slot />` in the header is where, on phones, those tabs
move their explanation into an info button. Without it the explanation stays
above the tab.

## 2. The tabs

Start with the **core six** (bold). Add the others only when the user asks.

| Tab | What it does | Skill | REST twin (`iblai-api-*`, kind `api`) |
|---|---|---|---|
| **Settings** | Basic, Discovery, Capabilities, Welcome Screen sub-tabs; copy to another org; delete | `/iblai-ui-agent-setting` | [agent-setting](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-setting/SKILL.md) |
| **Prompts** | system prompt, proactive/study/guided prompts, suggested prompts | `/iblai-ui-agent-prompt` | [agent-prompt](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-prompt/SKILL.md) |
| **LLM** | provider + model selection (incl. the org's own keys); Allow In-Chat Model Change; which models users can pick (admins) | `/iblai-ui-agent-llm` | [agent-llm](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-llm/SKILL.md) |
| **Datasets** | RAG: files, URLs, YouTube, crawl, GitHub; train/retrain | `/iblai-ui-agent-dataset` | [agent-dataset](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-dataset/SKILL.md) |
| **Memory** | enable memory; manage memories and categories | `/iblai-ui-agent-memory` (guide: `/iblai-ui-memory-guide`) | [agent-memory](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-memory/SKILL.md) |
| **Tools** | enable/disable the agent's tools | `/iblai-ui-agent-tool` | [agent-tool](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-tool/SKILL.md) |
| Access | RBAC sharing: editor / chat / analytics roles for users and groups | `/iblai-ui-agent-access` | [agent-access](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-access/SKILL.md) |
| Analytics | report cards (overview, users, topics, transcripts, costs, …) that open your analytics pages for this agent | `/iblai-ui-agent-analytics` | [analytics](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/analytics/iblai-api-analytics/SKILL.md) |
| API | the organization's API keys, used to call the agent from code (create, shown once, delete) | `/iblai-ui-agent-api` | [api-token](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/organizations/iblai-api-token/SKILL.md) |
| Billing | spend cap for the agent and per user | `/iblai-ui-agent-billing` | [spend-caps](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/billing/iblai-api-spend-caps/SKILL.md) |
| Embed | embed code, styling, shareable links | `/iblai-ui-agent-embed` | [agent-embed](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-embed/SKILL.md) |
| Evals | benchmarks, LLM-as-Judge reviews, manual scores, CSV export | `/iblai-ui-agent-evals` | [agent-eval](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-eval/SKILL.md) |
| Grader | rubric-based grading with overrides | `/iblai-ui-agent-grader` | — |
| History | conversation history with filters and export | `/iblai-ui-agent-history` | [agent-history](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-history/SKILL.md) |
| LTI | LTI 1.3 launch, keys, tools, endpoints | `/iblai-ui-agent-lti` | — |
| MCP | connectors (Featured + Directory) on/off per agent, sign-in scope, own OAuth app, the chat's MCP panel | `/iblai-ui-agent-mcp` | [agent-mcp](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-mcp/SKILL.md) |
| Privacy | PII filtering (allow / redact / mask / block) and the Incognito policy | `/iblai-ui-agent-privacy` | [agent-privacy](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-privacy/SKILL.md) |
| Safety | moderation prompts, flagged content | `/iblai-ui-agent-safety` | [agent-safety](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-safety/SKILL.md) |
| Sandbox | computing runtime / VM shell / Claw instances | `/iblai-ui-agent-sandbox` | [agent-sandbox](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-sandbox/SKILL.md) |
| Screen | screen sharing on voice calls: on/off, in-call instructions, opening line | `/iblai-ui-agent-screenshare` | [agent-voice](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-voice/SKILL.md) |
| Skills | reusable Agent Skills, per-agent assignment, chat `/` picker | `/iblai-ui-agent-skills` | [agent-skill](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-skill/SKILL.md) |
| Support | human support ticket inbox | `/iblai-ui-agent-support` | [agent-support](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-support/SKILL.md) |
| Tasks | scheduled periodic agent tasks with run logs | `/iblai-ui-agent-task` | — |
| Voice | voice calls on/off; chat voice and voice instructions; call style, language, provider; dictation | `/iblai-ui-agent-voice` | [agent-voice](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-voice/SKILL.md) |
| Audit | who changed what and when | `/iblai-ui-agent-audit` | [agent-audit](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-audit/SKILL.md) |
| Disclaimers | user agreement and advisory text | `/iblai-ui-agent-disclaimer` | [agent-disclaimer](https://raw.githubusercontent.com/iblai/vibe/refs/heads/main/skills/agents/iblai-api-agent-disclaimer/SKILL.md) |

Every tab skill has screenshots of the surface it mounts — open the skill before promising the user what they will see.

## 3. Not tabs, but agent-related

| Need | Skill |
|---|---|
| Create an agent from the app | `/iblai-ui-agent-create` |
| Chat with an agent | `/iblai-ui-agent-chat` (+ `/iblai-ui-agent-chat-sidebar`) |
| Browse / star agents | `/iblai-ui-agent-search` |
| Agent-scoped analytics dashboards (the pages the Analytics tab opens) | `/iblai-ui-analytics` ("One agent instead of the org") |

## Verify

Run `/iblai-ui-ops-test` before telling the user the work is ready, and give
every page, control and state this skill added its own checkpoint — one Playwright
test titled `<ID> · …` in `e2e/journeys/`, listed in `e2e/coverage.json`;
`pnpm e2e:coverage` must pass:
`pnpm build`, `pnpm test`, then Touch test `/agents/<uuid>/settings` in the browser as `/iblai-ui-ops-test` says: every tab, the console, the phone width.