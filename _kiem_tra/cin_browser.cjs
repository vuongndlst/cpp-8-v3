// Disposable localhost/browser test. Private reference answers are read locally, never published.
"use strict";
const fs = require("node:fs"), path = require("node:path"), http = require("node:http"), assert = require("node:assert/strict");
const { lesson, root } = require("./boss_arcade_checks.cjs"), { program } = require("./cin_checks.cjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const profile = { id: "cin-browser-check", display_name: "Kiem thu cin", class_label: "8A1" };
const privateRoot = path.resolve(root, "..", "..", "03. Lap trinh C++ V2/99. Lưu trữ/_Nguon_ChuanMoi");
const out = path.resolve(root, "..", "_KiemTra_Cin_20261027");
const normalize = s => String(s).replace(/\r\n/g, "\n").trim();
async function main() {
  const mime = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png" };
  fs.mkdirSync(out, { recursive: true });
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, "http://localhost");
    if (u.pathname === "/__blank") { res.setHeader("Content-Type", "text/html"); res.end("<!doctype html><html><body></body></html>"); return; }
    let file; try { file = path.resolve(root, "." + decodeURIComponent(u.pathname)); } catch { res.writeHead(400).end(); return; }
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    try { if (fs.statSync(file).isDirectory()) file = path.join(file, "index.html"); res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream"); res.end(fs.readFileSync(file)); }
    catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port, errors = [], findings = [];
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || "msedge" });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
    await context.route("https://cdn.jsdelivr.net/**", route => route.abort());
    await context.route("https://giphy.com/**", route => route.abort());
    async function assertInline(card) {
      const layout = await card.locator(".interactive-console").evaluate(host => {
        const transcript = host.querySelector(".terminal-transcript"), field = host.querySelector(".terminal-input"), input = field.getBoundingClientRect();
        const node = transcript.lastChild, range = document.createRange();
        let end = null;
        if (node) { range.setStart(node, node.textContent.length); range.collapse(true); end = range.getBoundingClientRect(); }
        const style = getComputedStyle(host), bounds = host.getBoundingClientRect(), pointer = host.querySelector(".terminal-pointer").getBoundingClientRect();
        return { input: { x: input.x, y: input.y, height: input.height }, end: end && { x: end.x, y: end.y, height: end.height }, origin: bounds.x + parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth), arrowX: pointer.x + 10 };
      });
      assert.ok(Math.abs(layout.input.x - (layout.end?.x ?? layout.origin)) <= 2, "caret follows the printed prompt: " + JSON.stringify(layout));
      if (layout.end) assert.ok(Math.abs((layout.input.y + layout.input.height / 2) - (layout.end.y + layout.end.height / 2)) < 5, "input stays on the prompt line: " + JSON.stringify(layout));
      assert.ok(Math.abs(layout.arrowX - layout.input.x) <= 1, "arrow points at the caret");
    }
    async function fixture(number, targetId, draft) {
      const content = lesson(number, profile), L = content.LESSON;
      const stage = L.steps.find(s => s.challenges.some(c => c.id === targetId)), target = stage.challenges.find(c => c.id === targetId);
      const passed = Object.fromEntries(L.steps.flatMap(content.CppProgress.required).filter(c => c.id !== targetId).map(c => [c.id, true]));
      const flow = stage.flow?.findIndex(sc => sc.tasks?.includes(targetId)) ?? 0;
      const state = { active: stage.id, passed, drafts: draft ? { [targetId]: draft } : {}, inputs: {}, choices: { [targetId]: 0 }, screens: { [stage.id]: flow }, xp: 100, combo: 0, bossTry: 0 };
      const page = await context.newPage(); page.on("pageerror", e => errors.push(e.message));
      await page.goto(base + "/__blank");
      await page.evaluate(({ profile, state, number }) => { const ns = "lsts-local:v1:cpp-8-v3:"; localStorage.setItem(ns + "profiles", JSON.stringify([profile])); localStorage.setItem(ns + "progress:" + profile.id + ":bai0" + number, JSON.stringify(state)); }, { profile, state, number });
      const stages = L.steps.filter(s => s.kind !== "gate" && s.kind !== "boss");
      await page.goto(base + `/runtime/lesson.html?lesson=bai0${number}&profile=${profile.id}&mode=read&` + (stage.kind === "boss" ? "cuoi=1" : "chang=" + stages.indexOf(stage)));
      await page.waitForFunction(() => !!window.CPP_ENGINE);
      const card = page.locator(`[data-card="${targetId}"]`);
      if (target.type === "doanchay") {
        const lap = stage.flow[flow].tasks.indexOf(targetId);
        await page.locator(`button[data-lap="${lap}"]`).click();
      }
      await card.waitFor({ state: "visible" });
      return { page, card, target, stage, L };
    }
    const L2 = lesson(2, profile).LESSON, codeTask = L2.steps.find(s => s.kind === "boss").challenges.find(c => c.type === "code" && !c.advanced);
    const answers2 = JSON.parse(fs.readFileSync(path.join(privateRoot, "bai02/dap_an.json"), "utf8"));
    const answer = answers2[codeTask.id], sample = (codeTask.tests || codeTask.card.tests)[0], values = sample.input.trim().split(/\s+/);
    let { page, card } = await fixture(2, codeTask.id, answer);
    assert.equal(await page.locator(".stdin-box").count(), 0);
    await card.locator('[data-act="run"]').click();
    const field = card.locator(".terminal-input"); await field.waitFor({ state: "visible" });
    assert.equal(await field.evaluate(el => el === document.activeElement), true);
    assert.ok((await card.locator(".terminal-help").textContent()).includes("cin"));
    assert.ok((await card.locator(".terminal-help").textContent()).includes("Enter"));
    assert.equal(await field.inputValue(), "");
    assert.equal(await card.locator(".terminal-label, .terminal-send").count(), 0);
    assert.equal(await card.locator(".terminal-pointer").isVisible(), true);
    const prefix = await card.locator(".terminal-transcript").textContent();
    const expectedLines = sample.expected.split("\n"), firstPrompt = expectedLines[0].slice(0, -values[0].length), secondPrompt = expectedLines[1].slice(0, -values[1].length);
    assert.equal(prefix, firstPrompt, "second question must not appear before the first Enter");
    assert.equal(await card.locator(".terminal-help").evaluate(el => getComputedStyle(el).clipPath), "inset(50%)", "waiting guidance is only the arrow, with accessible text kept offscreen");
    await assertInline(card);
    await field.fill("abc"); await field.press("Enter");
    assert.equal(await card.locator(".terminal-error").isVisible(), true);
    assert.equal(await card.locator(".terminal-transcript").textContent(), prefix);
    await field.fill(""); await page.waitForTimeout(3800);
    assert.equal(await field.isVisible(), true, "waiting does not trigger the old 3.5s timeout");
    await page.screenshot({ path: path.join(out, "cin-waiting.png"), caret: "initial" });
    await field.fill(values[0]); await field.press("Enter");
    await page.waitForFunction(({ id, prefix }) => document.querySelector(`[data-card="${id}"] .terminal-transcript`).textContent.length > prefix.length && !document.querySelector(`[data-card="${id}"] .terminal-input-row`).hidden, { id: codeTask.id, prefix });
    assert.equal(await field.inputValue(), ""); assert.equal(await field.evaluate(el => el === document.activeElement), true);
    assert.equal(await card.locator(".terminal-transcript").textContent(), expectedLines[0] + "\n" + secondPrompt);
    await assertInline(card);
    await page.screenshot({ path: path.join(out, "cin-second-value.png"), caret: "initial" });
    await card.locator(".console-shell").screenshot({ path: path.join(out, "terminal-inline.png"), caret: "initial" });
    await field.fill(values[1]); await field.press("Enter");
    await page.waitForFunction(id => !document.querySelector(`[data-card="${id}"] [data-act="run"]`).disabled, codeTask.id);
    assert.equal(normalize(await card.locator(".terminal-transcript").textContent()), normalize(sample.expected));
    await card.locator('[data-act="run"]').click(); await field.waitFor({ state: "visible" });
    assert.equal(await field.inputValue(), ""); assert.equal(await card.locator(".terminal-transcript").textContent(), prefix);
    await card.locator(".terminal-stop").click();
    await page.waitForFunction(id => !document.querySelector(`[data-card="${id}"] .code-editor`).readOnly, codeTask.id);
    assert.equal(await field.isVisible(), false);
    await page.evaluate(() => { const s = PortalCloud.peek(); s.inputs = {}; PortalCloud.save("bai02", s); CPP_ENGINE.remoteState(); });
    card = page.locator(`[data-card="${codeTask.id}"]`);
    await card.locator('[data-act="check"]').click();
    await card.waitFor(); await page.waitForFunction(id => document.querySelector(`[data-card="${id}"]`).classList.contains("passed"), codeTask.id);
    assert.equal(await page.evaluate(() => CPP_ENGINE.progress().completed), true);
    assert.equal(await page.evaluate(() => CPP_ENGINE.progress().gold), false);
    findings.push("Two prompts read one value each; focus, inline caret and arrow, Enter, validation, wait >3.5s, fresh Run, Stop, and grading without stdin all work.");
    console.log("PASS real worker + two-value terminal + independent grading");
    await page.close();
    // Chained extraction, loops/functions and zero iterations through the actual Worker API.
    ({ page, card } = await fixture(2, codeTask.id, answer));
    for (const [code, values, expected] of [
      [program('int a,b;cin>>a>>b;cout<<a+b;'), ["5", "8"], "5\n8\n13"],
      [program('int n,s=0;cin>>n;for(int i=0;i<n;i++){int x;cout<<"Value: ";cin>>x;s+=x;}cout<<s;'), ["3", "2", "4", "6"], "3\nValue: 2\nValue: 4\nValue: 6\n12"],
      [program('int n;cin>>n;for(int i=0;i<n;i++){int x;cin>>x;}cout<<"Done";'), ["0"], "0\nDone"]
    ]) {
      const result = await page.evaluate(async ({ code, values }) => { let count = 0, run; run = CppRun.interactive(code, { onInput: request => run.submit(values[count++], request.requestId) }); const r = await run.result; return { ...r, count }; }, { code, values });
      assert.equal(result.ok, true); assert.equal(result.count, values.length); assert.equal(normalize(result.output), expected);
    }
    // Actual page navigation must cancel a waiting run and restore the editor.
    await page.close();
    ({ page, card } = await fixture(2, "c2-viet", answers2["c2-viet"]));
    await card.locator('[data-act="run"]').click(); await card.locator(".terminal-input").waitFor({ state: "visible" });
    await page.locator('[data-flow="back"]').click();
    const afterNavigation = await page.evaluate(code => CppRun.run(code), program('cout<<"OK";'));
    assert.equal(afterNavigation.ok, true); assert.equal(afterNavigation.output, "OK");
    assert.equal(await page.evaluate(() => !!PortalCloud.peek().passed["c2-viet"]), false);
    await page.close();
    // Boss expiry while input is pending cannot re-enable controls or award a pass.
    ({ page, card } = await fixture(2, codeTask.id, answer));
    await page.clock.install();
    await page.evaluate(() => { const s = PortalCloud.peek(), boss = LESSON.steps.find(s => s.kind === "boss"); s.bossStartAt = Date.now() - (boss.thoiGian || 12) * 60000 + 1500; PortalCloud.save("bai02", s); CPP_ENGINE.remoteState(); });
    await card.locator('[data-act="run"]').click(); await card.locator(".terminal-input").waitFor({ state: "visible" });
    await page.clock.fastForward(2500);
    await page.waitForFunction(() => PortalCloud.peek().bossLost === true);
    assert.equal(await card.locator('[data-act="run"]').isDisabled(), true);
    assert.equal(await card.locator(".terminal-input").isVisible(), false);
    assert.equal(await page.evaluate(id => !!PortalCloud.peek().passed[id], codeTask.id), false);
    await page.close();
    console.log("PASS chained/loop input, navigation cancellation and Boss-expiry lock");
    // Every authored cin trace must wait before changing memory or using its fixed sample.
    let demos = 0;
    for (let n = 1; n <= 6; n++) {
      const L = lesson(n, profile).LESSON;
      for (const target of L.steps.flatMap(s => s.challenges).filter(c => c.type === "doanchay" && (c.trace || []).some(t => t.nhap != null))) {
        const f = await fixture(n, target.id), trace = target.trace, inputIndex = trace.findIndex(t => t.nhap != null), input = trace[inputIndex];
        for (let i = 0; i <= inputIndex; i++) await f.card.locator('[data-act="dc-step"]').click();
        await f.card.locator(".terminal-input").waitFor({ state: "visible" });
        await assertInline(f.card);
        const memory = await f.card.locator(".dc-mem").textContent();
        await f.card.locator(".terminal-input").fill(String(Number(input.nhap) + 1)); await f.card.locator(".terminal-input").press("Enter");
        assert.equal(await f.card.locator(".terminal-error").isVisible(), true); assert.equal(await f.card.locator(".dc-mem").textContent(), memory);
        await f.card.locator(".terminal-input").fill(String(input.nhap)); await f.card.locator(".terminal-input").press("Enter");
        for (let i = inputIndex + 1; i < trace.length; i++) await f.card.locator('[data-act="dc-step"]').click();
        assert.ok((await f.card.getAttribute("class")).includes("passed"));
        const expected = trace.map(t => (t.out || "") + (t.nhap != null ? t.nhap + "\n" : "")).join("");
        assert.equal(normalize(await f.card.locator(".terminal-transcript").textContent()), normalize(expected));
        await f.page.close(); demos++;
      }
    }
    assert.equal(demos, 13);
    const demo = await fixture(2, "c2-dc2");
    await demo.card.locator('[data-act="dc-all"]').click(); await demo.card.locator(".terminal-input").waitFor({ state: "visible" });
    await demo.card.locator('[data-act="dc-reset"]').click();
    assert.equal(await demo.card.locator(".terminal-input").isVisible(), false); assert.equal(await demo.card.locator(".terminal-transcript").textContent(), "");
    await demo.card.locator('[data-act="dc-all"]').click(); await demo.card.locator(".terminal-input").waitFor({ state: "visible" });
    await demo.card.locator(".terminal-input").fill("2"); await demo.card.locator(".terminal-input").press("Enter");
    await demo.page.waitForFunction(id => document.querySelector(`[data-card="${id}"]`).classList.contains("passed"), "c2-dc2");
    await demo.page.close();
    const leaving = await fixture(2, "c2-dc2");
    await leaving.card.locator('[data-act="dc-all"]').click();
    await leaving.page.locator('[data-flow="back"]').click();
    const stoppedOutput = await leaving.card.locator(".terminal-transcript").textContent();
    await leaving.page.waitForTimeout(900);
    assert.equal(await leaving.card.locator(".terminal-transcript").textContent(), stoppedOutput);
    assert.equal(await leaving.page.evaluate(() => !!PortalCloud.peek().passed["c2-dc2"]), false);
    await leaving.page.close();
    findings.push("All 13 guided cin examples pause, reject a wrong scenario value without changing memory, resume with the expected output; Run all also waits and Reset cancels.");
    console.log("PASS all 13 guided examples + Run all/Reset");
    // Narrow viewport: highlighted field, help and send action remain reachable.
    ({ page, card } = await fixture(2, codeTask.id, answer)); await page.setViewportSize({ width: 390, height: 844 });
    await card.locator('[data-act="run"]').click(); await card.locator(".terminal-input").waitFor({ state: "visible" });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const box = await card.locator(".terminal-input").boundingBox(); assert.ok(box.y > 120 && box.y + box.height < 844);
    await assertInline(card);
    await page.screenshot({ path: path.join(out, "cin-mobile.png"), caret: "initial" }); await page.close();
    assert.deepEqual(errors, []);
    findings.push("Mobile terminal fits the viewport and keeps the focused value field visible below Boss; no page errors.");
    fs.writeFileSync(path.join(out, "browser-results.json"), JSON.stringify({ passed: true, guidedExamples: demos, findings, errors }, null, 2));
    findings.forEach(s => console.log("PASS " + s)); await context.close();
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
