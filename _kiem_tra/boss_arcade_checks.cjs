// node _kiem_tra/boss_arcade_checks.cjs — no browser or student data needed.
"use strict";
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), assert = require("node:assert/strict");
const root = path.resolve(__dirname, ".."), read = f => fs.readFileSync(path.join(root, f), "utf8");
function lesson(number, profile, bossTry = 0) {
  const ctx = { console, window: null, PortalCloud: { profile }, CppCloud: { state: () => ({ bossTry }) }, CPP_LESSON_KEY: "bai0" + number };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(read("runtime/cpp/engine/kit.js"), ctx);
  vm.runInContext(read("runtime/cpp/engine/progress.js"), ctx);
  vm.runInContext(JSON.parse(read(`lessons/bai0${number}.json`)).source, ctx);
  return ctx;
}
async function main() {
  let combinations = 0;
  for (let number = 1; number <= 6; number++) for (let i = 0; i < 30; i++) for (const attempt of [0, 1]) {
    const ctx = lesson(number, { display_name: "hs" + i, class_label: "8A" + (i % 10 + 1) }, attempt);
    const { LESSON: L, CppProgress: P } = ctx, required = L.steps.flatMap(P.required), boss = L.steps.find(s => s.kind === "boss");
    const passed = Object.fromEntries(required.map(c => [c.id, true])), advanced = boss.challenges.filter(c => c.advanced);
    const silver = P.assess(L.steps, passed);
    assert.equal(silver.completed, true); assert.equal(silver.gold, false);
    assert.equal(silver.boss.hp, 0); assert.equal(silver.boss.completed, true); assert.equal(silver.boss.total, 6);
    for (const task of required) {
      const partial = { ...passed }; delete partial[task.id];
      advanced.forEach(c => { partial[c.id] = true; });
      const missing = P.assess(L.steps, partial);
      assert.equal(missing.completed, false, `lesson ${number}: gold cannot replace ${task.id}`);
      assert.equal(missing.gold, false); assert.equal(missing.missing.length, 1); assert.equal(missing.missing[0].id, task.id);
      if (boss.challenges.includes(task)) { assert.equal(missing.boss.hp, 17); assert.equal(missing.boss.completed, false); }
      else { assert.equal(missing.boss.hp, 0); assert.equal(missing.boss.completed, true); }
    }
    advanced.forEach(c => { passed[c.id] = true; });
    const gold = P.assess(L.steps, passed);
    assert.equal(gold.completed, true); assert.equal(gold.gold, true); assert.equal(gold.boss.hp, 0);
    combinations++;
  }
  console.log(`PASS eligibility: ${combinations} lesson/profile/attempt combinations, all missing-task cases, silver → gold`);
  // Data URLs keep the repository's ESM rules usable without a package.json change.
  const rulesSource = read("runtime/ml/assets/arcade-rules.js");
  const rulesURL = "data:text/javascript;base64," + Buffer.from(rulesSource).toString("base64");
  const rules = await import(rulesURL);
  for (const value of [undefined, null, 0, -1, NaN, Infinity, 30, 60, 90, 120]) assert.equal(rules.sessionSeconds(value), 30);
  assert.equal(rules.sessionSeconds(15), 15);
  for (const c of Object.values(rules.CATALOG)) assert.equal(c.seconds, 30);
  // Existing station assignments must shorten without changing their game, seed or consumed status.
  const selection = await import("data:text/javascript;base64," + Buffer.from(read("runtime/ml/assets/arcade-selection.js").replace(/'\.\/arcade-rules\.js\?v=[^']+'/g, JSON.stringify(rulesURL))).toString("base64"));
  const originalWindow = global.window;
  try {
    for (const status of ["assigned", "started", "ended"]) {
      let book = { assignments: { "bai03:0": { type: "maze", seed: 42, seconds: 120, status, startedAt: 77 } }, history: ["maze"], queue: [] };
      global.window = { LocalLearning: { ns: "test:", read: () => structuredClone(book), write: (key, v) => { book = structuredClone(v); } } };
      const C = { profile: { id: "test" }, packet: { lesson: { lesson_key: "bai03" } }, allowed: () => true };
      const entry = await selection.assignStation(C, 0);
      assert.deepEqual(entry, { type: "maze", seed: 42, seconds: 30, status, startedAt: 77 });
      assert.deepEqual(book.history, ["maze"]);
    }
  } finally { global.window = originalWindow; }
  console.log("PASS arcade: 30s catalog/cap; old assignments keep seed, history and consumed status");
  assert.equal(read("shared/certificate.js"), read("runtime/certificate.js"));
  console.log("PASS shared/runtime certificate sources match");
}
module.exports = { lesson, root };
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
