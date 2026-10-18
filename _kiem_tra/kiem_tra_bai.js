// Kiểm tra một bài: đáp án đạt, code ban đầu trượt, JSCPP khớp g++.
// Cách chạy:  node _kiem_tra/kiem_tra_bai.js bai01
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");
const os = require("os");

const bai = process.argv[2] || "bai01";
const root = path.join(__dirname, "..");
const GPP = "C:\\Users\\ndvuo\\tools\\mingw64\\bin\\g++.exe";

const ctx = { console, setTimeout, clearTimeout, document: {} };
ctx.window = ctx; ctx.self = ctx; ctx.global = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "engine", "JSCPP.es5.min.js"), "utf8"), ctx);
ctx.CPP = {
  stripComments: c => String(c).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""),
};
vm.runInContext(fs.readFileSync(path.join(root, "engine", "kit.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(root, bai, "lesson.js"), "utf8"), ctx);
const L = ctx.LESSON;
const sol = require(path.join(__dirname, `dap_an_${bai}.js`));

const norm = v => String(v).replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/[ \t]+$/g, "").replace(/\n+$/g, "").replace(/^\n+/, "");
// echo = true: số nhập bằng cin được in lại như màn hình Programiz (giống engine.js)
function jscpp(code, input, echo = true) {
  let out = "";
  const stdio = { write: s => { out += s; } };
  if (echo) stdio.echo = t => { out += t + "\n"; };
  try { ctx.JSCPP.run(code, input || "", { stdio, maxTimeout: 2000 }); return { ok: true, out }; }
  catch (e) { return { ok: false, out, err: String(e.message || e).split("\n")[0] }; }
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cpp8-"));
function gpp(code, input) {
  const src = path.join(tmp, "a.cpp"), exe = path.join(tmp, "a.exe");
  fs.writeFileSync(src, code);
  try { execFileSync(GPP, [src, "-static", "-o", exe], { stdio: "pipe", env: { ...process.env, PATH: path.dirname(GPP) + ";" + process.env.PATH } }); }
  catch (e) { return { ok: false, err: "compile error" }; }
  return { ok: true, out: execFileSync(exe, { input: input || "", encoding: "utf8" }) };
}

function verdict(c, code) {
  const tests = c.tests || [{ input: "", expected: c.expected }];
  for (const t of tests) {
    const r = jscpp(code, t.input);
    if (!r.ok) return `chạy lỗi: ${r.err}`;
    if (norm(r.out) !== norm(t.expected)) return `output sai: ${JSON.stringify(r.out)}`;
  }
  for (const rule of c.rules || []) if (!rule.test(code, "")) return `trượt quy tắc: ${rule.msg}`;
  if (c.bugs && !c.bugs.every(b => b.fixed(code))) return "còn bọ";
  return "ĐẠT";
}

let errors = 0;
const fail = m => { errors++; console.log("  ✗ " + m); };
for (const step of L.steps) {
  for (const c of step.challenges || []) {
    console.log(`• ${c.id} (${c.type})`);
    if (c.type === "choice") {
      if (!c.options.some(o => (typeof o === "string" ? o : o.text) === c.answer)) fail("đáp án không có trong lựa chọn");
      if (c.code) {
        const prog = /\bint\s+main\s*\(/.test(c.code)
          ? `#include <iostream>\nusing namespace std;\n\n${c.code}`
          : `#include <iostream>\nusing namespace std;\n\nint main() {\n${c.code}\n    return 0;\n}`;
        const r = jscpp(prog, c.input), g = gpp(prog, c.input), r0 = jscpp(prog, c.input, false);
        if (!r.ok || norm(r.out) !== norm(c.answer)) fail(`JSCPP ra ${JSCPP_out(r)} ≠ đáp án`);
        if (!g.ok || norm(g.out) !== norm(r0.out)) fail(`g++ ra ${JSON.stringify(g.out)} ≠ JSCPP`);
      }
      continue;
    }
    if (c.type === "sequence") {
      const prog = c.answer.join("\n");
      if (!/int main/.test(prog)) continue;
      const r = jscpp(prog), g = gpp(prog);
      if (!r.ok || !g.ok) fail("chương trình lắp đúng không chạy được");
      continue;
    }
    if (c.type !== "code") continue;
    const start = verdict(c, c.starter);
    if (start === "ĐẠT") fail("code ban đầu đã ĐẠT (quá dễ / sai đề)");
    else console.log(`  code ban đầu: ${start}`);
    if (c.bugs) {
      const fixedAtStart = c.bugs.filter(b => b.fixed(c.starter)).map(b => b.label);
      if (fixedAtStart.length) fail(`bọ đã chết sẵn: ${fixedAtStart}`);
    }
    const code = sol[c.id];
    if (!code) { fail("chưa có đáp án mẫu"); continue; }
    const v = verdict(c, code);
    if (v !== "ĐẠT") fail(`đáp án mẫu: ${v}`); else console.log("  đáp án mẫu: ĐẠT");
    for (const t of c.tests || [{ input: "", expected: c.expected }]) {
      const g = gpp(code, t.input), r0 = jscpp(code, t.input, false);
      if (!g.ok || norm(g.out) !== norm(r0.out)) fail(`g++ khác JSCPP: ${JSON.stringify(g.out)}`);
    }
  }
}
function JSCPP_out(r) { return r.ok ? JSON.stringify(r.out) : r.err; }
fs.rmSync(tmp, { recursive: true, force: true });
console.log(errors ? `\nTỔNG SỐ LỖI: ${errors}` : "\nTỔNG SỐ LỖI: 0");
process.exit(errors ? 1 : 0);
