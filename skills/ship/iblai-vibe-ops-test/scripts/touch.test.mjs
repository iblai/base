// Tests for touch.mjs — the pure parts run without a browser.
// Run: node --test skills/ship/iblai-vibe-ops-test/scripts/touch.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import { buildPlan, inE2e, isHandRun, parseControls, parsePlan, specRegexes } from "./touch.mjs";

const snap = (...lines) => lines.map((l, i) => `  uid=1_${i} ${l}`).join("\n");
const shell = ['button "People"', 'button "Deals"', 'switch "Admin mode"'];

test("parseControls reads role and name from a snapshot", () => {
  assert.deepEqual(parseControls(snap('button "New person"', 'heading "People" level="1"', 'textbox "Search people"')), [
    { uid: "1_0", role: "button", name: "New person" },
    { uid: "1_2", role: "textbox", name: "Search people" },
  ]);
});

test("isHandRun keeps saving, deleting, sending and marking out of the loop, and every switch", () => {
  for (const name of ["Delete tag Important", "Save changes", "Send invitation", "Mark as done", "Add stage", "Lost reason"])
    assert.equal(isHandRun({ role: "button", name }), true, name);
  for (const name of ["Important", "Change the color of Important", "New person", "Invites", "Open board"])
    assert.equal(isHandRun({ role: "button", name }), false, name);
  assert.equal(isHandRun({ role: "switch", name: "Admin mode" }), true);
});

test("inE2e finds a control's name in the (lower-cased) specs whatever its case", () => {
  const specs = `getbyrole("button", { name: "new person" })`;
  assert.equal(inE2e("New  Person", specs), true);
  assert.equal(inE2e("Filter", specs), false);
  assert.equal(inE2e("x", "x"), false); // one letter proves nothing
});

test("buildPlan groups the shell once, marks e2e or beyond, keeps one record row, and parsePlan reads it back", () => {
  const snaps = {
    home: snap(...shell, 'button "New deal"', 'link "CS Charles Smith Head of Computing"', 'link "TO Tom Head of Computing Lead"'),
    people: snap(...shell, 'button "New person"', 'button "Delete person"'),
    deals: snap(...shell, 'button "Filter"'),
  };
  const specs = `getbyrole("button", { name: "new person" }) getbyrole("button", { name: "people" })`;
  const { md, counts } = buildPlan(snaps, specs, [{ id: "P", name: "people journey", checkpoints: [1, 2] }]);
  assert.match(md, /## shell \(on home\)\n- \[ \] e2e {4}button "People" →/);
  assert.match(md, /switch "Admin mode" \(by hand\) →/);
  assert.match(md, /## people\n- \[ \] e2e {4}button "New person" →\n- \[ \] beyond button "Delete person" \(by hand\) →/);
  assert.equal((md.match(/link "/g) || []).length, 1, "one record row stands for the rest");
  assert.match(md, /## journeys \(1\)\n- \[ \] P · people journey \(2 checkpoints\)/);
  assert.deepEqual(counts, { routes: 3, shell: 3, controls: 8, beyond: 6, byHand: 2 });

  const parsed = parsePlan(md);
  assert.deepEqual(Object.keys(parsed), ["home", "people", "deals"]);
  assert.deepEqual(parsed.home.slice(0, 1), [{ mark: "e2e", role: "button", name: "People", byHand: false }]);
  assert.deepEqual(parsed.people.map((c) => [c.name, c.mark, c.byHand]), [["New person", "e2e", false], ["Delete person", "beyond", true]]);
  assert.equal(parsed.workflows, undefined);
});

test("a rerun after new checkpoints names those controls e2e", () => {
  const snaps = { people: snap('button "New person"', 'button "Filter"') };
  assert.equal(buildPlan(snaps, "").counts.beyond, 2);
  assert.equal(buildPlan(snaps, `getbyrole("button", { name: "filter" })`).counts.beyond, 1);
});

test("a regex locator in a spec counts the controls it matches as e2e", () => {
  const rx = specRegexes(`page.getByRole("button", { name: /^About / }); getByRole("alertdialog", { name: /^Delete stage/i })`);
  assert.equal(rx.length, 2);
  assert.equal(inE2e("About open deals", "", rx), true);
  assert.equal(inE2e("delete stage Won", "", rx), true);
  assert.equal(inE2e("Open board", "", rx), false);
  assert.equal(buildPlan({ home: snap('button "About people"', 'button "Open board"') }, "", [], rx).counts.beyond, 1);
});
