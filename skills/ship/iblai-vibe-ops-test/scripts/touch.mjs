#!/usr/bin/env node
// Headless whole-app touch pass for /iblai-vibe-ops-test, driven through the chrome-devtools command line.
// Run from the app root, with the daemon already started headless (see references/browser-touch-test.md):
//   node touch.mjs snap                    snapshot every route in playwright/.touch/routes.json
//   node touch.mjs plan                    write playwright/.touch/plan.md (each control `e2e` or `beyond`)
//   node touch.mjs run <label> [--phone] [route…]   drive every plan line that only opens, navigates or filters; resumable
//   node touch.mjs report                  counts, the lines to look at, the `beyond` lines that became e2e work
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const DIR = "playwright/.touch";
const ROLES = "button|link|tab|menuitem|switch|checkbox|combobox|textbox|searchbox|radio|slider|option";
const CONTROL = new RegExp(`^\\s*uid=(\\S+) (${ROLES}) "([^"]*)"`);
// A loop never drives these: anything that saves, deletes, sends or marks, and every switch (switches save).
export const HAND_RUN =
  /\b(delete|remove|archive|revoke|sign ?out|log ?out|disconnect|reset|discard|invite|send|pay|upgrade|purchase|subscribe|leave|deactivate|save|create|apply|confirm|submit|merge|import|export|duplicate|restore|transfer|won|lost)\b|^(mark|add) /i;
export const STATES = [
  "reload and Back on every route",
  "Escape and the close button on every dialog and sheet",
  "empty, invalid and very long (300 characters) input in every form",
  "a double click on every submit: one record, not two",
  "deep links: a detail page by URL, a deleted id, a malformed id",
  "a member opening every admin URL",
  "every dialog and sheet at 412 px",
  "the keyboard alone: Tab to a list row and open it, Enter and Space on buttons",
  "an unknown route; the sign-in landing with nothing in its URL",
];

export const parseControls = (text) =>
  text.split("\n").flatMap((l) => {
    const m = l.match(CONTROL);
    return m ? [{ uid: m[1], role: m[2], name: m[3] }] : [];
  });
export const isHandRun = (c) => c.role === "switch" || HAND_RUN.test(c.name);
export const inE2e = (name, specs) => {
  const n = name.toLowerCase().replace(/\s+/g, " ").trim();
  return n.length > 1 && specs.includes(n);
};
const isRow = (c) => c.role === "link" && c.name.split(" ").length >= 4;
const key = (c) => `${c.role}\t${c.name}`;

/** snaps: { route: snapshot text }, first route first; specs: every e2e file, lower-cased; journeys: coverage.json's. */
export function buildPlan(snaps, specs, journeys = []) {
  const routes = Object.keys(snaps);
  const lists = Object.fromEntries(
    routes.map((r) => {
      const all = [...new Map(parseControls(snaps[r]).map((c) => [key(c), c])).values()];
      const rows = all.filter(isRow);
      return [r, [...all.filter((c) => !isRow(c)), ...rows.slice(0, 1)]]; // one record row per route stands for all
    }),
  );
  const seen = {};
  for (const l of Object.values(lists)) for (const c of l) seen[key(c)] = (seen[key(c)] || 0) + 1;
  const shell = new Set(routes.length > 2 ? Object.keys(seen).filter((k) => seen[k] >= Math.ceil(routes.length * 0.75)) : []);
  const counts = { controls: 0, beyond: 0, byHand: 0 };
  const line = (c) => {
    const e2e = inE2e(c.name, specs);
    counts.controls++;
    if (!e2e) counts.beyond++;
    if (isHandRun(c)) counts.byHand++;
    return `- [ ] ${e2e ? "e2e   " : "beyond"} ${c.role} "${c.name}"${isHandRun(c) ? " (by hand)" : ""} →`;
  };
  let md = `# Touch plan — ${new Date().toISOString().slice(0, 10)}\n\nAs the admin, then the member; desktop, then 412 px. After each →: ✓ or ✗ and what happened.\n`;
  const shellList = (lists[routes[0]] || []).filter((c) => shell.has(key(c)));
  if (shellList.length) md += `\n## shell (on ${routes[0]})\n${shellList.map(line).join("\n")}\n`;
  for (const r of routes) {
    const own = lists[r].filter((c) => !shell.has(key(c)));
    md += `\n## ${r}\n${own.map(line).join("\n")}\n`;
  }
  md += `\n## journeys (${journeys.length})\n${journeys.map((j) => `- [ ] ${j.id} · ${j.name} (${j.checkpoints?.length ?? 0} checkpoints)`).join("\n")}\n`;
  md += `\n## workflows\n- [ ] W1 … one line per task, end to end across pages (write these)\n`;
  md += `\n## states the e2e skips\n${STATES.map((s) => `- [ ] ${s}`).join("\n")}\n`;
  return { md, counts: { routes: routes.length, shell: shellList.length, ...counts } };
}

/** The plan's route sections as { route: [{ mark, role, name }] }; the shell belongs to the first route. */
export function parsePlan(md) {
  const out = {};
  let cur = null;
  for (const l of md.split("\n")) {
    const h = l.match(/^## (\S+)(?: \(on (\S+)\))?/);
    if (h) {
      cur = h[1] === "shell" ? h[2] : ["journeys", "workflows", "states"].includes(h[1]) ? null : h[1];
      if (cur) out[cur] ??= [];
      continue;
    }
    const m = cur && l.match(/^- \[ \] (e2e|beyond)\s+(\w+) "(.*)"( \(by hand\))? →$/);
    if (m) out[cur].push({ mark: m[1], role: m[2], name: m[3], byHand: !!m[4] });
  }
  return out;
}

// ---- the browser side (needs the daemon) ----

const read = (f) => fs.readFileSync(path.join(DIR, f), "utf8");
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// `node <bin>` takes about 0.1 s a call, `npx` about 3 s: resolve the program once and keep its path.
function cdtCommand() {
  if (process.env.CDT_BIN) return ["node", [process.env.CDT_BIN]];
  const cache = path.join(DIR, "cdt-bin");
  try {
    const bin = fs.existsSync(cache)
      ? fs.readFileSync(cache, "utf8").trim()
      : execFileSync("npx", ["-y", "-p", "chrome-devtools-mcp@1.14.0", "sh", "-c", "command -v chrome-devtools"], { encoding: "utf8" }).trim();
    if (bin && fs.existsSync(bin)) {
      fs.writeFileSync(cache, bin);
      return ["node", [bin]];
    }
  } catch {}
  return ["npx", ["-y", "-p", "chrome-devtools-mcp@1.14.0", "chrome-devtools"]];
}
let CDT;
const cdt = (...a) => {
  CDT ??= cdtCommand();
  try {
    return execFileSync(CDT[0], [...CDT[1], ...a], { encoding: "utf8", timeout: 90000, stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    return `ERR ${String(e.stderr || e.message).slice(0, 200)}`;
  }
};
const json = (out) => {
  const m = out.match(/```json\n([\s\S]*?)\n```/);
  try {
    return m ? JSON.parse(m[1]) : null;
  } catch {
    return null;
  }
};
const js = (fn, uid) => json(cdt("evaluate_script", fn, "--pageId", "1", ...(uid ? ["--args", uid] : [])));

function assertHeadless() {
  const ua = js("() => navigator.userAgent") || "";
  if (!/HeadlessChrome/.test(ua)) {
    console.error(`Not headless (user agent: ${ua || "no browser"}). Start it first:\n  cdt start --headless --userDataDir "$PWD/${DIR}/admin" --redactNetworkHeaders --no-usage-statistics`);
    process.exit(1);
  }
}
function config() {
  const c = JSON.parse(read("routes.json"));
  const bad = Object.entries(c.routes || {}).filter(([, u]) => typeof u !== "string" || !u.startsWith("/"));
  if (!/^https?:\/\//.test(c.base || "") || bad.length) {
    console.error(`${DIR}/routes.json needs { "base": "http://localhost:3000", "routes": { "<name>": "/<path>" } }${bad.length ? ` — not a path: ${bad.map(([n]) => n).join(", ")}` : ""}`);
    process.exit(1);
  }
  return c;
}
const PHONE = "412x915x2,mobile,touch";
function go(base, url, phone) {
  const out = cdt("navigate_page", "1", "--url", base + url, "--timeout", "30000");
  if (!/Successfully navigated/.test(out)) return false;
  if (phone) cdt("emulate", "1", "--viewport", PHONE);
  sleep(Number(process.env.TOUCH_SETTLE_MS || 3500));
  return true;
}
const snap = (file) => (cdt("take_snapshot", "1", "--filePath", path.join(DIR, file)), read(file));
const uidOf = (text, c) => parseControls(text).find((x) => x.role === c.role && x.name === c.name)?.uid;
const errorCount = () => Number((cdt("list_console_messages", "1", "--types", "error").match(/of (\d+)/) || [0, 0])[1]);
const failed = () =>
  cdt("list_network_requests", "1", "--pageSize", "500")
    .split("\n")
    .filter((l) => /\[(4\d\d|5\d\d|failed[^\]]*)\]/.test(l))
    .map((l) => l.replace(/^reqid=\d+ /, "").slice(0, 160));
const STATE = `(el) => el ? ({ disabled: !!el.disabled || el.getAttribute('aria-disabled') === 'true', selected: ['aria-selected', 'aria-pressed', 'aria-current'].some((a) => ['true', 'page'].includes(el.getAttribute(a))) || el.getAttribute('data-state') === 'active', href: el.getAttribute('href') || '' }) : null`;
// What a click may change: the URL, anything that opened, the element's own state, the page text, toasts.
const SIG = `(el) => { const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length); const open = [...document.querySelectorAll('[role=dialog],[role=alertdialog],[role=menu],[role=listbox],[role=tooltip],[data-open],[data-popup-open]')].filter(vis).length; const own = el ? ['aria-expanded','aria-pressed','aria-checked','aria-selected','data-state'].map((k) => el.getAttribute(k)).join('|') : ''; const side = [...document.querySelectorAll('[data-state][data-collapsible], [data-sidebar=sidebar]')].map((e) => e.getAttribute('data-state')).join(''); const m = (document.querySelector('main') || document.body).innerText; return location.pathname + location.search + '#' + open + '#' + own + '#' + side + '#' + m.length + ':' + m.slice(0, 80) + '#' + document.querySelectorAll('[data-sonner-toast]').length; }`;
const DIGEST = `() => { const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length); const d = [...document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open]')].filter(vis).pop(); const r = d && d.getBoundingClientRect(); const t = document.body.innerText; const bad = t.match(/couldn.t load|application error|something went wrong|unhandled runtime error|this page couldn.t load/i); return { path: location.pathname + location.search, dialog: d ? (d.getAttribute('aria-label') || d.querySelector('h1,h2,h3,[id$=title]')?.textContent || 'dialog').trim().slice(0, 70) : null, dialogFits: d ? r.left >= -1 && r.right <= innerWidth + 1 : null, sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, errorText: bad ? t.slice(Math.max(0, bad.index - 40), bad.index + 60).replace(/\\s+/g, ' ') : null }; }`;

function doSnap() {
  assertHeadless();
  const { base, routes } = config();
  for (const [name, url] of Object.entries(routes)) {
    if (!go(base, url)) { console.log(`${name.padEnd(24)} ✗ could not open ${url}`); continue; }
    const where = js("() => location.pathname + location.search");
    const n = parseControls(snap(`snap-${name}.txt`)).length;
    console.log(`${name.padEnd(24)} ${n} controls${where && where !== url ? `  → landed on ${where}` : ""}`);
  }
}

function doPlan() {
  const { routes } = config();
  const snaps = Object.fromEntries(Object.keys(routes).filter((r) => fs.existsSync(path.join(DIR, `snap-${r}.txt`))).map((r) => [r, read(`snap-${r}.txt`)]));
  const files = [];
  const walk = (d) => fs.existsSync(d) && fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? e.name !== "node_modules" && walk(path.join(d, e.name)) : /\.(ts|tsx|js|mjs)$/.test(e.name) && files.push(path.join(d, e.name))));
  walk("e2e");
  const specs = files.map((f) => fs.readFileSync(f, "utf8").toLowerCase()).join("\n");
  const journeys = fs.existsSync("e2e/coverage.json") ? JSON.parse(fs.readFileSync("e2e/coverage.json", "utf8")).journeys ?? [] : [];
  const { md, counts } = buildPlan(snaps, specs, journeys);
  fs.writeFileSync(path.join(DIR, "plan.md"), md);
  console.log(`${DIR}/plan.md: ${counts.routes} routes, ${counts.controls} controls (${counts.beyond} beyond the e2e, ${counts.byHand} by hand), ${journeys.length} journeys`);
}

function doRun(label, phone, only = []) {
  assertHeadless();
  const { base, routes } = config();
  const out = path.join(DIR, `results-${label}.jsonl`);
  const done = new Set(fs.existsSync(out) ? fs.readFileSync(out, "utf8").trim().split("\n").filter(Boolean).map((l) => { const r = JSON.parse(l); return `${r.route}|${r.role}|${r.name}`; }) : []);
  const write = (rec) => fs.appendFileSync(out, JSON.stringify(rec) + "\n");
  for (const [route, list] of Object.entries(parsePlan(read("plan.md")))) {
    if (!(route in routes) || (only.length && !only.includes(route))) continue;
    let fresh = false;
    for (const c of [...list.filter((x) => x.mark === "beyond"), ...list.filter((x) => x.mark === "e2e")]) {
      if (done.has(`${route}|${c.role}|${c.name}`)) continue;
      const rec = { route, mark: c.mark, role: c.role, name: c.name, at: label };
      if (c.byHand || isHandRun(c)) { write({ ...rec, result: "by hand" }); continue; }
      if (!fresh && !go(base, routes[route], phone)) { write({ ...rec, result: "route did not open" }); continue; }
      fresh = false;
      const e0 = errorCount(), n0 = failed();
      const uid = uidOf(snap(`run-${label}.txt`), c);
      if (!uid) { write({ ...rec, result: "not on screen" }); continue; }
      const st = js(STATE, uid);
      if (st?.disabled) { write({ ...rec, result: "disabled" }); fresh = true; continue; }
      if (/^(mailto|tel):/.test(st?.href || "")) { write({ ...rec, result: "mail or phone link" }); fresh = true; continue; }
      if (c.role === "textbox" || c.role === "searchbox") {
        cdt("fill", "1", uid, "E2E touch probe");
        sleep(1500);
        rec.effect = true;
      } else {
        const before = js(SIG, uid);
        cdt("click", "1", uid);
        sleep(1800);
        let after = js(SIG, uid);
        if (after === before) { // a click that lands before any hover can be swallowed (a control inside a tooltip trigger)
          cdt("hover", "1", uid);
          sleep(1200);
          cdt("click", "1", uid);
          sleep(1800);
          after = js(SIG, uid);
          rec.hoverRetry = true;
        }
        rec.effect = after !== before;
      }
      rec.after = js(DIGEST);
      const pages = [...cdt("list_pages").matchAll(/^(\d+): /gm)].map((m) => m[1]).filter((p) => p !== "1");
      for (const p of pages) cdt("close_page", p);
      if (pages.length) rec.newTab = true;
      rec.consoleErrors = errorCount() - e0;
      rec.failed = failed().filter((l) => !n0.includes(l));
      rec.result = !rec.effect
        ? st?.selected ? "already selected" : "no effect"
        : rec.consoleErrors > 0 || rec.failed.length || rec.after?.errorText || rec.after?.sideways || rec.after?.dialogFits === false ? "check" : "ok";
      write(rec);
      cdt("press_key", "1", "Escape");
      sleep(600);
      const now = js("() => location.pathname + location.search + '#' + document.querySelectorAll('[role=dialog],[role=menu],[role=listbox]').length");
      fresh = now === `${routes[route]}#0` && !["textbox", "searchbox", "combobox"].includes(c.role);
    }
  }
  report([label]);
}

function report(labels) {
  const files = labels?.length ? labels.map((l) => `results-${l}.jsonl`) : fs.readdirSync(DIR).filter((f) => /^results-.*\.jsonl$/.test(f));
  for (const f of files) {
    if (!fs.existsSync(path.join(DIR, f))) continue;
    const rows = read(f).trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
    const by = {};
    for (const r of rows) by[r.result] = (by[r.result] || 0) + 1;
    console.log(`\n${f}: ${rows.length} lines — ${Object.entries(by).map(([k, v]) => `${k} ${v}`).join(", ")}`);
    for (const r of rows.filter((x) => ["check", "no effect"].includes(x.result)))
      console.log(`  ${r.result.padEnd(9)} ${r.route} ${r.role} "${r.name}" ${JSON.stringify({ path: r.after?.path, dialog: r.after?.dialog, errorText: r.after?.errorText, console: r.consoleErrors || undefined, failed: r.failed?.length ? r.failed : undefined })}`);
    const todo = rows.filter((x) => x.mark === "beyond" && x.result === "ok");
    if (todo.length) console.log(`  beyond the e2e and working — each becomes a checkpoint:\n${todo.map((r) => `    ${r.route} ${r.role} "${r.name}" → ${r.after?.dialog ? `opens "${r.after.dialog}"` : r.after?.path}`).join("\n")}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, ...rest] = process.argv.slice(2);
  fs.mkdirSync(DIR, { recursive: true });
  if (cmd === "snap") doSnap();
  else if (cmd === "plan") doPlan();
  else if (cmd === "run" && rest[0]) doRun(rest[0], rest.includes("--phone"), rest.slice(1).filter((a) => a !== "--phone"));
  else if (cmd === "report") report(rest);
  else {
    console.error("usage: node touch.mjs snap | plan | run <label> [--phone] [route…] | report [label…]");
    process.exit(2);
  }
}
