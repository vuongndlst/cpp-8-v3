"use strict";

const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const path = require("node:path");
const { setTimeout: wait } = require("node:timers/promises");

async function main() {
  assert.ok(process.env.GEMINI_API_KEY?.trim(), "GEMINI_API_KEY must be configured as an environment secret");
  const port = "18765", base = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, [path.join(__dirname, "server.cjs")], {
    env: { ...process.env, CPP_WORKSHOP_PORT: port }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true
  });
  const exited = once(server, "exit");
  let startup;
  try {
    for (let attempt = 0; attempt < 30; attempt++) {
      try { startup = await fetch(base, { signal: AbortSignal.timeout(500) }); break; }
      catch { await wait(200); }
    }
    assert.equal(startup?.status, 200, "Workshop server did not start");
    const home = await startup.text();
    const samples = JSON.parse(home.match(/<script type="application\/json" id="examples">([\s\S]*?)<\/script>/)[1]);
    const code = samples[0].state.drafts["c1-sua"];
    assert.equal((await fetch(`${base}/.env`)).status, 404);
    assert.equal((await fetch(`${base}/workshop/server.cjs`)).status, 404);
    const response = await fetch(`${base}/_workshop/feedback`, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({ taskId: "c1-sua", code, kind: "output", topic: "boundary", input: "3",
        actual: "Nhap so ly: 3\nCam on quy khach!", error: "" })
    });
    assert.equal(response.status, 200, "Gemini workshop feedback failed");
    const answer = await response.json();
    assert.ok(answer.observation?.length > 10 && answer.nextStep?.length > 10, "Missing feedback");
    console.log("PASS workshop startup, protected files, and real Gemini feedback for a synthetic code example.");
  } finally {
    server.kill();
    await exited;
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
