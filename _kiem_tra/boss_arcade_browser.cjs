// PLAYWRIGHT_MODULE=/path/to/playwright node _kiem_tra/boss_arcade_browser.cjs
// Uses only a disposable browser profile and a localhost server. Never reads real student progress.
"use strict";
const fs = require("node:fs"), path = require("node:path"), http = require("node:http"), assert = require("node:assert/strict");
const { lesson, root } = require("./boss_arcade_checks.cjs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const out = path.resolve(root, "..", "_KiemTra_Boss_20261027");
const profile = { id: "browser-check", display_name: "Kiem thu C++", class_label: "8A1" };
const ctx = lesson(3, profile), L = ctx.LESSON, boss = L.steps.find(s => s.kind === "boss");
const choice = boss.challenges.find(c => c.type === "choice"), advanced = boss.challenges.find(c => c.advanced);
assert.ok(choice && advanced);
const all = Object.fromEntries(L.steps.flatMap(ctx.CppProgress.required).map(c => [c.id, true]));
const initial = { active: "boss", passed: { ...all }, attempts: {}, drafts: {}, inputs: {}, xp: 200, combo: 0, bossTry: 0 };
delete initial.passed[choice.id];
const mime = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".glb": "model/gltf-binary" };
async function main() {
  fs.mkdirSync(out, { recursive: true });
  const three = await (await fetch("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js", { signal: AbortSignal.timeout(20000) })).text();
  assert.ok(three.length > 100000, "exact pinned Three.js bundle is available");
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, "http://localhost");
    if (u.pathname === "/__blank") { res.setHeader("Content-Type", "text/html"); res.end("<!doctype html><html><body></body></html>"); return; }
    if (u.pathname === "/__arcade-test") {
      res.setHeader("Content-Type", "text/html");
      res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/runtime/ml/assets/quest3d.css"><script type="importmap">{"imports":{"three":"/.__three.js"}}</script></head><body><script type="module">
        import {stationGame} from '/runtime/ml/assets/station-arcade.js?v=v3-20261027';
        const q=new URLSearchParams(location.search); window.entered=0; window.reason=null;
        window.game=stationGame({theme:'workshop',seed:42,gameType:q.get('type')||'jump',level:Number(q.get('level'))||3,seconds:120,sound:false,onStart:()=>true,onFinish:r=>window.reason=r,onEnter:()=>window.entered++});window.gameReady=true;
      </script></body></html>`); return;
    }
    if (u.pathname === "/__iframe-test") { res.setHeader("Content-Type", "text/html"); res.end('<iframe style="position:fixed;inset:0;width:100%;height:100%;border:0" src="/runtime/lesson.html?lesson=bai03&profile=browser-check&mode=read&cuoi=1"></iframe>'); return; }
    if (u.pathname === "/.__three.js") { res.setHeader("Content-Type", "text/javascript"); res.end(three); return; }
    let file; try { file = path.resolve(root, "." + decodeURIComponent(u.pathname)); } catch { res.writeHead(400).end(); return; }
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    try { if (fs.statSync(file).isDirectory()) file = path.join(file, "index.html"); res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream"); res.end(fs.readFileSync(file)); }
    catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  let browser;
  const errors = [], findings = [];
  try {
    browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || "msedge", args: ["--enable-unsafe-swiftshader"] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
    await context.route("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js", route => route.fulfill({ contentType: "text/javascript", body: three, headers: { "Access-Control-Allow-Origin": "*" } }));
    await context.route("https://giphy.com/**", route => route.abort());
    await context.addInitScript(({ profile, initial }) => {
      if (!localStorage.getItem("boss-check-seeded")) {
        const ns = "lsts-local:v1:cpp-8-v3:";
        localStorage.setItem(ns + "profiles", JSON.stringify([profile]));
        localStorage.setItem(ns + "progress:" + profile.id + ":bai03", JSON.stringify(initial));
        localStorage.setItem("boss-check-seeded", "1");
      }
      window.certDrawTexts = [];
      const fill = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (text, ...args) { if (this.canvas.id === "certCanvas") window.certDrawTexts.push(text); return fill.call(this, text, ...args); };
    }, { profile, initial });
    const page = await context.newPage(); page.on("pageerror", e => errors.push(e.message));
    const url = base + "/runtime/lesson.html?lesson=bai03&profile=browser-check&mode=read&cuoi=1";
    await page.goto(url); await page.waitForSelector("#bossProgress");
    assert.equal(await page.locator("#hpText").textContent(), "17%");
    assert.equal(await page.locator("#certBtn").isDisabled(), true);
    const initialBox = await page.locator("#bossDock").boundingBox();
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForFunction(() => window.scrollY > 500);
    const scrollBox = await page.locator("#bossDock").boundingBox();
    assert.ok(scrollBox.y >= 0 && scrollBox.y < 40, JSON.stringify({ initialBox, scrollBox }));
    assert.ok(scrollBox.x > 950, "desktop Boss is in the right column");
    const codeBox = await page.locator(".boss-work .code-lab").first().boundingBox();
    assert.ok(codeBox.x + codeBox.width <= scrollBox.x, "Boss does not cover the editor");
    await page.screenshot({ path: path.join(out, "boss-desktop.png") });
    const answer = await page.evaluate(id => { const c = LESSON.steps.find(s => s.kind === "boss").challenges.find(c => c.id === id); return c.options.findIndex(o => (typeof o === "string" ? o : o.text) === c.answer); }, choice.id);
    const card = page.locator(`[data-card="${choice.id}"]`);
    await card.locator(".choice-option").nth(answer).click(); await card.locator('[data-act="choice"]').click();
    await page.waitForFunction(() => CPP_ENGINE.progress().completed);
    assert.equal(await page.locator("#hpText").textContent(), "0%");
    assert.equal(await page.locator("#bossGio").isVisible(), false);
    assert.equal(await page.locator("#certBtn").isDisabled(), false);
    assert.equal(await page.evaluate(() => CPP_ENGINE.progress().gold), false);
    assert.equal(await page.locator(`[data-card="${advanced.id}"]`).getAttribute("class").then(s => s.includes("passed")), false);
    const positions = await page.evaluate(() => ({ cert: document.querySelector("#certBtn").compareDocumentPosition(document.querySelector(".advanced-section")) }));
    assert.ok(positions.cert & 4, "silver certificate button precedes optional gold work");
    // Use the real completion popup if present; otherwise the inline button.
    try { await page.waitForSelector(".celebration-dialog[open]", { timeout: 5000 }); await page.locator(".celebration-secondary").click(); } catch { /* no popup when replaying already-recorded celebrations */ }
    await page.locator("#certBtn").click(); await page.waitForSelector("#certDialog[open]");
    assert.ok(await page.evaluate(() => certDrawTexts.includes("HUY HIỆU BẠC")));
    await page.screenshot({ path: path.join(out, "certificate-silver.png") });
    await page.locator('#certDialog [data-close]').click();
    await page.locator(".focus-certificate").click(); await page.waitForSelector("#certDialog[open]");
    assert.equal(await page.locator(".certificate-modal").count(), 1);
    await page.locator('#certDialog [data-close]').click();
    const xp = await page.evaluate(() => PortalCloud.peek().xp);
    await page.reload(); await page.waitForSelector("#bossProgress");
    assert.equal(await page.locator("#hpText").textContent(), "0%");
    assert.equal(await page.evaluate(() => PortalCloud.peek().xp), xp);
    await page.evaluate(id => { const s = PortalCloud.peek(); s.passed[id] = true; PortalCloud.save("bai03", s); CPP_ENGINE.remoteState(); }, advanced.id);
    await page.locator(".focus-certificate").click(); await page.waitForSelector("#certDialog[open]");
    assert.ok(await page.evaluate(() => certDrawTexts.includes("HUY HIỆU VÀNG")));
    await page.screenshot({ path: path.join(out, "certificate-gold.png") });
    await page.locator('#certDialog [data-close]').click();
    const priorTask = L.steps.find(s => s.kind === "stage").challenges.find(c => !c.advanced && !c.bonus).id;
    await page.evaluate(id => { const s = PortalCloud.peek(); delete s.passed[id]; PortalCloud.save("bai03", s); CPP_ENGINE.remoteState(); }, priorTask);
    assert.equal(await page.locator("#certBtn").isDisabled(), true);
    assert.equal(await page.locator(".focus-certificate").isVisible(), false);
    assert.ok((await page.locator("#stageNote").textContent()).includes("chặng trước"));
    assert.ok((await page.locator("#bossMissingList").textContent()).includes("Chặng 1"));
    findings.push("Desktop scrolling and no editor overlap; real final answer grants silver with gold untouched; both certificate buttons use silver/gold renderer; reload preserves XP; missing prerequisite cannot be replaced by gold.");
    console.log("PASS desktop and silver/gold certificate flow");
    // Restore silver state, then check a narrow screen and a nested lesson iframe.
    await page.evaluate(({ all }) => { const s = PortalCloud.peek(); s.passed = all; PortalCloud.save("bai03", s); CPP_ENGINE.remoteState(); }, { all });
    await page.waitForSelector(".celebration-dialog.stage[open]");
    await page.locator(".celebration-secondary").click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 1000));
    const mobileBox = await page.locator("#bossDock").boundingBox();
    assert.ok(mobileBox.y >= 0 && mobileBox.y < 20, JSON.stringify(mobileBox));
    assert.equal(await page.locator("#boss3d").isVisible(), false);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator(".boss-toggle").click(); assert.equal(await page.locator("#boss3d").isVisible(), true);
    await page.locator(".boss-toggle").click();
    await page.screenshot({ path: path.join(out, "boss-mobile.png") });
    await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(base + "/__iframe-test");
    const frame = page.frameLocator("iframe"); await frame.locator("#bossProgress").waitFor();
    await frame.locator("body").evaluate(() => window.scrollTo(0, 1200));
    const nestedBox = await frame.locator("#bossDock").boundingBox(); assert.ok(nestedBox.y >= 0 && nestedBox.y < 50);
    findings.push("Narrow screen has collapsible Boss and no horizontal overflow; sticky also works inside a lesson iframe.");
    console.log("PASS mobile and nested iframe scrolling");
    await page.close();
    // The layout lives in the shared engine: verify every lesson's Boss on both screen sizes.
    for (let number = 1; number <= 6; number++) {
      const key = "bai0" + number, data = lesson(number, profile).LESSON;
      const previousPassed = Object.fromEntries(data.steps.filter(s => s.kind !== "boss").flatMap(ctx.CppProgress.required).map(c => [c.id, true]));
      const lessonPage = await context.newPage(); lessonPage.on("pageerror", e => errors.push(key + ": " + e.message));
      await lessonPage.goto(base + "/__blank");
      await lessonPage.evaluate(({ key, passed, profile }) => localStorage.setItem("lsts-local:v1:cpp-8-v3:progress:" + profile.id + ":" + key, JSON.stringify({ active: "boss", passed, attempts: {}, drafts: {}, xp: 200, combo: 0, bossTry: 0 })), { key, passed: previousPassed, profile });
      await lessonPage.goto(base + "/runtime/lesson.html?lesson=" + key + "&profile=browser-check&mode=read&cuoi=1");
      await lessonPage.waitForSelector("#bossDock");
      assert.equal(await lessonPage.locator("#hpText").textContent(), "100%");
      await lessonPage.evaluate(() => window.scrollTo(0, 1200));
      const desktop = await lessonPage.locator("#bossDock").boundingBox();
      assert.ok(desktop.y >= 0 && desktop.y < 40 && desktop.x > 950, key + ": desktop Boss follows scrolling");
      await lessonPage.screenshot({ path: path.join(out, "boss-" + key + ".png") });
      await lessonPage.setViewportSize({ width: 390, height: 844 });
      await lessonPage.evaluate(() => window.scrollTo(0, 1000));
      const mobile = await lessonPage.locator("#bossDock").boundingBox();
      assert.ok(mobile.y >= 0 && mobile.y < 20, key + ": mobile Boss follows scrolling");
      assert.ok(await lessonPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), key + ": no horizontal overflow");
      await lessonPage.locator(".boss-toggle").click(); assert.equal(await lessonPage.locator("#boss3d").isVisible(), true);
      await lessonPage.locator(".boss-toggle").click(); assert.equal(await lessonPage.locator("#boss3d").isVisible(), false);
      console.log("PASS shared Boss scrolling desktop/mobile " + key);
      await lessonPage.close();
    }
    findings.push("All six lessons: Boss follows desktop/mobile scrolling, uses a right column on desktop, collapses on mobile and creates no horizontal overflow.");
    // Render each of the ten assignable games using the actual pinned Three.js renderer.
    for (const type of ["jump", "flight", "snake", "tetris", "breakout", "g2048", "memory", "maze", "caro", "sudoku"]) {
      const gamePage = await context.newPage(); gamePage.on("pageerror", e => errors.push(type + ": " + e.message));
      await gamePage.goto(base + "/__arcade-test?type=" + type + "&level=5");
      await gamePage.waitForFunction(() => window.gameReady);
      assert.ok((await gamePage.locator(".game-timer").textContent()).includes("0:30"));
      assert.equal(await gamePage.locator(".game-scene canvas").count(), 1, type + " uses WebGL rather than fallback");
      assert.equal(await gamePage.locator(".game-play").textContent(), "Bắt đầu");
      await gamePage.locator(".game-enter").click(); assert.equal(await gamePage.evaluate(() => window.entered), 1);
      console.log("PASS arcade renderer " + type);
      await gamePage.close();
    }
    // A real collision/retry shares the original 30-second budget. Clock controls avoid a slow wall-clock wait.
    const gamePage = await context.newPage(); gamePage.on("pageerror", e => errors.push(e.message));
    await gamePage.clock.install(); await gamePage.goto(base + "/__arcade-test?type=jump"); await gamePage.waitForFunction(() => window.gameReady);
    await gamePage.clock.runFor(100); await gamePage.locator(".game-play").click();
    await gamePage.clock.runFor(9000);
    assert.equal(await gamePage.locator(".game-play").textContent(), "Thử lại");
    await gamePage.locator(".game-play").click();
    const retryTimer = await gamePage.locator(".game-timer").textContent(); assert.notEqual(retryTimer, "0:30");
    await gamePage.clock.fastForward(22000); await gamePage.clock.runFor(700);
    assert.equal(await gamePage.evaluate(() => window.entered), 1); assert.equal(await gamePage.evaluate(() => window.reason), "timeout");
    findings.push("All ten games render at level 5 with a 30s cap and instant skip; real retry keeps elapsed time and timeout enters the lesson exactly once.");
    await gamePage.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, "browser-results.json"), JSON.stringify({ passed: true, findings, errors }, null, 2));
    findings.forEach(s => console.log("PASS " + s));
    await context.close();
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
