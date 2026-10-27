// node _kiem_tra/cin_checks.cjs — exercises the pinned interpreter, not a mock C++ runner.
"use strict";
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), assert = require("node:assert/strict");
const root = path.resolve(__dirname, ".."), eng = path.join(root, "runtime/cpp/engine");
function interpreter() {
  const c = { console, document: {}, performance }; c.self = c; c.window = c; vm.createContext(c);
  for (const name of ["JSCPP.es5.min.js", "main-shim.js", "input-rules.js", "interactive-runtime.js"]) vm.runInContext(fs.readFileSync(path.join(eng, name), "utf8"), c, { filename: name });
  return c;
}
function untilBoundary(runtime) { let step; do { step = runtime.pump(); } while (step.status === "running"); return step; }
const program = body => "#include <iostream>\nusing namespace std;\nint main() {\n" + body + "\nreturn 0;\n}";
function execute(c, code, values) {
  const runtime = c.CppInteractive.create(c.JSCPP, c.cppMainWithImplicitReturn(code)); let step, used = 0;
  while ((step = untilBoundary(runtime)).status === "input") {
    assert.ok(used < values.length, "program requested more input than supplied");
    assert.equal(runtime.submit(step.request.requestId, values[used++]).accepted, true);
  }
  assert.equal(used, values.length); return runtime.output;
}
async function main() {
  const c = interpreter();
  const r = c.CppInteractive.create(c.JSCPP, program('int a,b; cout << "A: "; cin >> a; cout << "B: "; cin >> b; cout << a+b;'));
  let step = untilBoundary(r); assert.equal(step.status, "input"); assert.equal(r.output, "A: ");
  for (const value of ["", "abc", "1.5", "5 8", "2147483648"]) assert.ok(r.submit(step.request.requestId, value).error);
  assert.equal(r.submit(step.request.requestId + 100, "5").stale, true);
  await new Promise(resolve => setTimeout(resolve, 3700));
  assert.equal(r.submit(step.request.requestId, "5").accepted, true);
  step = untilBoundary(r); assert.equal(step.status, "input"); assert.equal(r.output, "A: 5\nB: ");
  assert.equal(r.submit(step.request.requestId, "8").accepted, true); assert.equal(untilBoundary(r).status, "done"); assert.equal(r.output, "A: 5\nB: 8\n13");
  assert.equal(execute(c, program('int a,b;cin>>a>>b;cout<<a+b;'), ["5", "8"]), "5\n8\n13");
  assert.equal(execute(c, program('int n;cin>>n;if(n>0){int x;cin>>x;cout<<x;}else cout<<"none";'), ["0"]), "0\nnone");
  assert.equal(execute(c, program('int n,sum=0;cout<<"N: ";cin>>n;for(int i=1;i<=n;i++){int x;cout<<"Item "<<i<<": ";cin>>x;sum+=x;}cout<<sum;'), ["3", "5", "7", "8"]), "N: 3\nItem 1: 5\nItem 2: 7\nItem 3: 8\n20");
  const functionCode = '#include <iostream>\nusing namespace std;\nint ask(){int x;cout<<"X: ";cin>>x;return x;}\nint main(){cout<<ask()+ask();return 0;}';
  assert.equal(execute(c, functionCode, ["2", "4"]), "X: 2\nX: 4\n6");
  assert.equal(execute(c, program('int x;cin>>x;cout<<x;'), ["-2147483648"]), "-2147483648\n-2147483648");
  assert.equal(execute(c, program('double x;cin>>x;cout<<x;'), ["8.5"]), "8.5\n8.5");
  console.log("PASS real suspension/resume, prompts, validation, no 3.5s input timeout, chained cin, skipped branch, loop, function and numeric types");
  const outputLimit = c.CppInteractive.create(c.JSCPP, program('while(true)cout<<"1234567890";'));
  assert.throws(() => untilBoundary(outputLimit), /Output limit/); assert.ok(outputLimit.output.length <= 32768);
  const timeout = c.CppInteractive.create(c.JSCPP, program('while(true){}'));
  assert.throws(() => untilBoundary(timeout), /Time limit/);
  console.log("PASS runaway output and compute limits");
  // Main-thread watchdog pauses for input, resumes on submit and distinguishes Stop from failure.
  let serial = 0, worker; const timers = new Map();
  const runner = { URL, document: { currentScript: { src: "https://example.test/cpp-runner.js?v=cin-test" } }, CppCloud: { allowed: () => true },
    setTimeout: fn => { timers.set(++serial, fn); return serial; }, clearTimeout: id => timers.delete(id),
    Worker: class { constructor() { worker = this; } postMessage(data) { this.sent = data; } terminate() {} } };
  runner.window = runner; vm.createContext(runner); vm.runInContext(fs.readFileSync(path.join(eng, "cpp-runner.js"), "utf8"), runner);
  let session = runner.CppRun.interactive("code"), job = worker.sent.id;
  worker.onmessage({ data: { id: job, type: "input", request: { requestId: 1 } } });
  assert.equal(timers.size, 0); session.submit("5", 1); assert.equal(timers.size, 1);
  [...timers.values()][0](); let result = await session.result;
  assert.equal(result.ok, false); assert.equal(result.cancelled, false);
  session = runner.CppRun.interactive("code"); session.stop(); result = await session.result; assert.equal(result.cancelled, true);
  console.log("PASS worker watchdog pause/resume and timeout versus user cancellation");
  const privateRoot = path.resolve(root, "..", "..", "03. Lap trinh C++ V2/99. Lưu trữ/_Nguon_ChuanMoi");
  if (fs.existsSync(privateRoot)) {
    let tasks = 0, cases = 0;
    const normalize = text => String(text).replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
    for (let n = 1; n <= 6; n++) {
      const key = "bai0" + n, payload = JSON.parse(fs.readFileSync(path.join(root, "lessons", key + ".json"), "utf8"));
      const answers = JSON.parse(fs.readFileSync(path.join(privateRoot, key, "dap_an.json"), "utf8"));
      const content = { console, window: null, CPP: { stripComments: code => code } }; content.window = content; vm.createContext(content);
      vm.runInContext(fs.readFileSync(path.join(eng, "kit.js"), "utf8"), content);
      const pools = [], draw = content.KIT.rut; content.KIT.rut = (...args) => { pools.push(...args[0]); return draw(...args); };
      vm.runInContext(payload.source, content);
      const all = [...new Map([...content.LESSON.steps.flatMap(s => s.challenges || []), ...pools].map(t => [t.id, t])).values()];
      for (const task of all.filter(t => t.type === "code")) {
        const tests = task.tests || task.card?.tests || [];
        if (!tests.some(t => t.input)) continue;
        tasks++;
        for (const test of tests) {
          const output = execute(c, answers[task.id], String(test.input || "").trim().split(/\s+/).filter(Boolean));
          assert.equal(normalize(output), normalize(test.expected), key + "/" + task.id); cases++;
        }
      }
    }
    assert.equal(tasks, 28); console.log(`PASS all ${tasks} input tasks, ${cases} authored cases, including all Boss alternatives`);
  } else console.log("SKIP private curriculum corpus (not distributed with the public site)");
}
module.exports = { interpreter, untilBoundary, execute, program };
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
