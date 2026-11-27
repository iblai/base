# The browser for the touch test

`/iblai-vibe-ops-test` drives the running app through the agent's browser
tools — Claude in Chrome or the Chrome DevTools MCP, whichever the session has —
or headless through the Chrome DevTools command line
([The whole app, headless](#the-whole-app-headless)).

## Claude in Chrome (`claude --chrome`)

Claude Code's own integration: the built-in `claude-in-chrome` MCP server
drives the user's signed-in Chrome in a visible window.

- Turn it on per session with `claude --chrome`, or once under `/chrome` →
  "Enabled by default". Needs the Claude in Chrome extension (1.0.36 or later),
  a claude.ai sign-in (`/login` — an API key turns it off), Chrome or Edge; not
  on WSL. A project cannot turn it on: a value in `.claude/settings.json` is
  ignored.
- It pauses on sign-in pages and CAPTCHAs for the user, and a JavaScript dialog
  blocks it until the user dismisses it.
- Tool names: `/mcp` → `claude-in-chrome` → View tools. The documented ones are
  `tabs_context_mcp` (with `createIfEmpty`), `browser_batch` and a screenshot
  tool with `save_to_disk`; map the rest from their names, never from memory.

## Chrome DevTools MCP

Google's [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp):
one `.mcp.json` entry, any MCP client, its own Chrome with a persistent profile
(the user signs in once per machine).

Claude Code — `.mcp.json` at the project root (vibe-starter and the scaffold
ship it, with a `.claude/settings.json` whose `enabledMcpjsonServers` pre-approves
the servers once the folder is trusted; elsewhere Claude Code asks once):

```json
{
  "mcpServers": {
    "chrome-devtools": { "command": "npx", "args": ["-y", "chrome-devtools-mcp@latest", "--redactNetworkHeaders"] }
  }
}
```

For every project instead: `claude mcp add --scope user chrome-devtools -- npx -y chrome-devtools-mcp@latest --redactNetworkHeaders`.
The first `npx` start can exceed the MCP startup timeout — `MCP_TIMEOUT=60000 claude`.
To skip the per-call prompts the user may add `"mcp__chrome-devtools__*"` to
`permissions.allow` in `.claude/settings.json` — their choice, not the skill's,
since it also pre-approves `evaluate_script`.

Codex — `.codex/config.toml` in the project (vibe-starter and the scaffold ship
it; Codex reads it in a trusted project), or `~/.codex/config.toml` for every project:

```toml
[mcp_servers.chrome-devtools]
command = "npx"
args = ["-y", "chrome-devtools-mcp@latest", "--redactNetworkHeaders"]
```

Cursor — `.cursor/mcp.json`, the same shape as `.mcp.json` (vibe-starter and the
scaffold ship it). Restart the agent after adding a server.

opencode — `opencode.json` at the project root, an `mcp` block with `type: "local"`
and a `command` array (vibe-starter and the scaffold ship it; the ibl.ai desktop
app's Code mode runs opencode in the project directory, so it reads the file):

```json
{ "mcp": { "chrome-devtools": { "type": "local", "command": ["npx", "-y", "chrome-devtools-mcp@latest", "--redactNetworkHeaders"], "enabled": true } } }
```

Flags (`npx -y chrome-devtools-mcp@latest --help`): `--headless` (no window —
only routes that need no sign-in can be touched), `--isolated` (a throwaway
profile, so the sign-in is lost), `--browserUrl http://127.0.0.1:9222` (attach
to a Chrome started with `--remote-debugging-port=9222` and its own
`--user-data-dir` — the sandbox and CI option, never the main profile),
`--channel`, `--executablePath`, and `--redactNetworkHeaders` (every config on
this page sets it: without it `get_network_request` prints the request headers,
the session token included).

### The tools, step by step

| Step | Chrome DevTools MCP | Command line (`cdt`, below) | Claude in Chrome |
|---|---|---|---|
| Find the tab | `list_pages`, `select_page`, `new_page` | `cdt list_pages`, `cdt new_page <url>` | `tabs_context_mcp` |
| Open the route | `navigate_page` | `cdt navigate_page 1 --url <url>` | the navigate tool |
| Read the page | `take_snapshot` (a11y tree with uids) | `cdt take_snapshot 1 --filePath <file>` | the read-page / find tool |
| Act | `click`, `fill`, `fill_form`, `press_key`, `type_text`, `hover`, `upload_file`, `handle_dialog` | `cdt click 1 <uid>`, `cdt fill 1 <uid> <value>`, `cdt type_text 1 <text>`, `cdt press_key 1 Escape`, `cdt handle_dialog 1 dismiss` (no `fill_form`) | the click / type / form tools |
| Wait | `wait_for` (text) | none: `--includeSnapshot true` on the action, or `sleep` and a snapshot | — |
| Console, network | `list_console_messages`, `list_network_requests`, `get_network_request` | `cdt list_console_messages 1`, `cdt list_network_requests 1 --resourceTypes fetch`, `cdt get_network_request 1 --reqid <n>` | the console / network tools |
| Phone width | `emulate` viewport `412x915x2,mobile,touch`; `""` clears | `cdt emulate 1 --viewport 412x915x2,mobile,touch`; `cdt emulate 1` clears | resize the window |
| Run JS | `evaluate_script` | `cdt evaluate_script "<function>" --pageId 1` | the JavaScript tool |
| Evidence | `take_screenshot` | `cdt take_screenshot 1 --filePath <file>` | the screenshot tool |

### Headless and CI

Headless, in a session or in CI, is the command line in
[The whole app, headless](#the-whole-app-headless), signed in as the test
accounts. The Playwright suite (`pnpm test:e2e`) stays the CI test.

## The whole app, headless

For "touch test everything", "headless touch test", a yes to the new-app
question, or a session with no browser tool. It runs for a long while in the
background — about 5 s a control, for each account and each width, an hour or
more for a mid-sized app: say so before you start, and ask the user to keep the
computer on and awake until you report. A run that stops picks up where it
stopped. The browser is the Chrome DevTools command line — the `chrome-devtools` program in the `chrome-devtools-mcp`
package — never a loaded MCP server: a server may be headed and take the user's
keystrokes, and nothing in its tool list says which. `cdt` below stands for
`npx -y -p chrome-devtools-mcp@1.14.0 chrome-devtools`; define it at the top of
each shell call: `cdt() { npx -y -p chrome-devtools-mcp@1.14.0 chrome-devtools "$@"; }`.

### The command line

- A background daemon holds one Chrome, and its pages survive between calls.
  Every `cdt <tool>` reuses the running daemon with whatever flags it was
  started with (a `cd4a` config file can set flags too), so begin with
  `cdt start …`: it restarts the daemon with yours — and ends any other
  session's command-line browser. `cdt status` prints the flags it runs with;
  `cdt stop` ends it.
- Required arguments are positional, the rest are flags: `cdt click 1 1_5`,
  `cdt fill 1 1_7 "E2E touch note"`, `cdt navigate_page 1 --url <url>`,
  `cdt evaluate_script "() => document.title" --pageId 1`; `cdt <tool> --help`
  prints one tool's arguments. There is no `wait_for` and no `fill_form`: add
  `--includeSnapshot true` to an action to get the page after it, or wait with a
  short `sleep` and a snapshot.
- `cdt take_snapshot 1 --filePath playwright/.touch/<route>.txt` writes the page
  to a file; read the controls from it rather than printing every snapshot.
- Each `npx` call costs about 3 s. For a long pass resolve the program once —
  `CDT=$(npx -y -p chrome-devtools-mcp@1.14.0 sh -c 'command -v chrome-devtools')`,
  then `cdt() { node "$CDT" "$@"; }` — about 0.1 s a call.

### Sign in as the test accounts

The headless browser cannot wait for anyone to sign in. It takes the sessions
the e2e setup saves: `playwright/.auth/user-setup-chromium.json` (the admin)
and `member-chromium.json` (the member).

1. Refresh them through the real login page:
   `pnpm exec playwright test --config e2e/playwright.config.ts --project=setup-chromium`
   (it creates the accounts first when they are missing). On another origin — a
   second port, the live URL — put `APP_HOST=<origin>` in front; a sign-in that
   never comes back means the origin is not in the organization's allowed
   redirect origins. If the app's global teardown deletes test records, skip
   that sweep while another run may be live.
2. Copy each into a fresh profile. Playwright writes it, cookies included — page
   JavaScript cannot set the login host's HttpOnly session cookie — and fresh
   every run, since an old profile keeps an old service worker. The admin's,
   then the same with `member-chromium.json` into `playwright/.touch/member`
   (both under the gitignored `/playwright/`):

   ```bash
   node -e '
   const { chromium } = require("@playwright/test")
   const [file, dir] = process.argv.slice(1)
   const state = require(require("path").resolve(file))
   ;(async () => {
     require("fs").rmSync(dir, { recursive: true, force: true })
     const ctx = await chromium.launchPersistentContext(dir, { channel: "chrome", headless: true })
     await ctx.addCookies(state.cookies)
     const page = ctx.pages()[0] ?? (await ctx.newPage())
     await page.route("**/*", (r) => r.fulfill({ contentType: "text/html", body: "" }))
     for (const o of state.origins) {
       await page.goto(o.origin + "/")
       await page.evaluate((items) => items.forEach((i) => localStorage.setItem(i.name, i.value)), o.localStorage)
     }
     await ctx.close()
   })()' playwright/.auth/user-setup-chromium.json "$PWD/playwright/.touch/admin"
   ```

3. `cdt start --headless --userDataDir "$PWD/playwright/.touch/admin" --redactNetworkHeaders --no-usage-statistics`
   (`--no-usage-statistics` keeps the run out of Google's usage statistics).

No test accounts (not vibe-starter): start once with `--headless=false
--userDataDir "$PWD/playwright/.touch/me"`, let the user sign in in that window
and tell you, `cdt stop`, then start headless on the same profile and keep it.

### Prove it, then plan

- `cdt evaluate_script "() => navigator.userAgent" --pageId 1` must contain
  `HeadlessChrome`. Anything else: `cdt stop`, say so, and report nothing from it.
- `cdt navigate_page 1 --url <app>/` must stay on the app, signed in, and
  `cdt get_network_request 1 --reqid <a platform call>` must show
  `authorization:<redacted>` before anything from the network is quoted.
- The window is 1280 px wide; `cdt emulate 1 --viewport 412x915x2,mobile,touch`
  is the phone, a bare `cdt emulate 1` the desktop again.

Then plan, before the first click, with this skill's `scripts/touch.mjs`. It
lives next to this file; from the app root,
`TOUCH=$(find .claude/skills .agents/skills ~/.claude/plugins -name touch.mjs -path '*iblai-vibe-ops-test*' 2>/dev/null | head -1)`.

1. Write `playwright/.touch/routes.json`: every `app/**/page.tsx`, dynamic
   segments filled with real ids —
   `{ "base": "http://localhost:3000", "routes": { "home": "/", "agents": "/agents", "agent": "/agents/<a real id>" } }`.
2. `node "$TOUCH" snap` snapshots each route (one that lands elsewhere says
   so); `node "$TOUCH" plan` writes `playwright/.touch/plan.md`: every control of
   every route, the shell once, marked `e2e` when a spec under `e2e/` names it,
   else `beyond` (a quick sort, not proof), and `(by hand)` when it saves,
   deletes, sends or marks; then the journeys in `e2e/coverage.json`, if any,
   and the states the e2e skips.
3. Under `## workflows`, write each task end to end across pages: the first
   run; each kind of record created, found, edited and deleted; a setting saved
   and read back after a reload.

### Run it, then the report

`node "$TOUCH" run admin-desktop`, in the background, drives every line that
only opens, navigates or filters, `beyond` lines first, one result per line in
`playwright/.touch/results-admin-desktop.jsonl` (the same command resumes it).
Per line it clicks — hovering first when nothing changed — reads what changed,
the console errors and the failed requests, and closes what opened: `ok`,
`check` (an error, a failed request, error text, sideways scroll, a dialog
wider than the screen), `no effect`, `disabled`, `already selected`,
`not on screen`, `by hand`. Then `run admin-phone --phone` (412 px after every
load); then the member, `cdt start` on its profile and `run member-desktop`.
Nothing else drives that browser meanwhile.

You run the `(by hand)` lines, the workflows and the states. Harmless values
only. A destructive control — delete, revoke, archive, invite, email, payment,
sign out — is opened and cancelled; it is confirmed only on what the test made,
named `E2E touch …` and deleted through the UI before the end. A switch that
saves is read before and after, and put back. Quote URLs and status codes only.
`node "$TOUCH" report` lists each `check` and `no effect` line to look at and
the `beyond` lines that worked. Last, `cdt stop` and delete the two profiles:
they hold live sessions.

```text
Touch test: the whole app, headless (chrome-devtools <version>, HeadlessChrome/<n>)
Plan: <n> routes, <n> workflows, <n> journeys, <n> controls (<n> beyond the e2e), as <admin> + <member>
Touched: <n> ✓, <n> ✗ — <control> → <what happened>; …
Beyond the e2e: <what only this pass found> | nothing new
Console: clean | <errors>. Network: clean | <url → status>
Phone 412 px: no sideways scroll | <what overflowed>
Not touched: <control>, <why>
Into the e2e: <n> checkpoints (<n> for ✗, <n> for working `beyond` lines); beyond <before> → <after>
```

### Into the e2e, then again

The pass ends in the e2e, written as Step 4 writes it:

- Each ✗ becomes a checkpoint for the right behaviour, in the journey of its
  route and in `e2e/coverage.json`. It fails until the fix lands: fix the app
  and run it again. When the fix is not yours to make, ask the user before a
  failing checkpoint is committed; `test.fixme` names the finding meanwhile.
  Run it once without `fixme` first: it must fail while the defect is there (an
  absence asserted before the page renders passes too early).
- Each `beyond` line that worked becomes a checkpoint asserting what it did.
- `pnpm e2e:coverage`, then `pnpm test:e2e`.

Each run re-plans against the specs, so the next one starts from what is still
`beyond`: run it again after the e2e grows, until only `(by hand)` lines are
left `beyond`.

## What to look for

- Broken layouts — overlapping elements, overflow, collapsed (0 px) sections
- Missing content — blank cards, stuck `Loading…`, placeholder text; an empty
  SDK Management panel usually means `enableRbac` without `rbacPermissions`
- Style — wrong brand color (primary `#0058cc`), the system font instead of
  Open Sans, unstyled raw HTML, invisible text
- Responsive — horizontal scrollbar, content cut off at 412 px
- SDK components — rendering outside their white card wrapper, missing
  borders or rounding
- Navigation — navbar absent, active tab not highlighted
- Console — React errors (`Minified React error`, `Hydration failed`), 401 or
  403 on the platform API

## Troubleshooting

| Symptom | Fix |
|---|---|
| "No page found" after a DevTools call | Its Chrome restarted: `list_pages`, then navigate again |
| "browser is already running" | Another session holds the profile: close it, or `--isolated` (forgets the sign-in); on the command line, `cdt stop` and start again |
| The user agent has no `HeadlessChrome` | A daemon started earlier, or a `cd4a` config, runs it headed: `cdt start --headless …` restarts it; still headed → stop |
| The headless app opens on the sign-in page | The saved session expired: rerun the setup project and the copy |
| `cdt` says "Unknown argument" | Required arguments are positional (`cdt click 1 1_5`), the rest flags; `cdt <tool> --help` |
| `cdt click` succeeds and nothing changes (a switch or button inside a tooltip trigger) | The click lands before any hover: `cdt hover 1 <uid>`, wait a second, click again. Always read the result back (`aria-checked`, the URL, the dialog) — a switch whose name flips ("Turn X on" → "Turn X off") is found again by its new name |
| Sign-in never comes back to the app | The origin (port included) is not in the organization's allowed redirect origins |
| A snapshot is cut off | Snapshot the route, not the whole app; `MAX_MCP_OUTPUT_TOKENS` raises the cap |
| `resize_page` stays near 850 px | Use `emulate` for a phone |
| The chat composer ignores `fill` | Click the box and `type_text`; Enter does not send — click `Send message`; the reply is done when its `Copy to Clipboard` appears |
| Claude in Chrome "not available" | Only the user can turn it on: `claude --chrome`, or `/chrome` |
