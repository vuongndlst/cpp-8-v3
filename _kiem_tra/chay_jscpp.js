// Chạy C++ bằng JSCPP (giống web): đọc JSON {code, input, echo} từ stdin, in JSON {ok, out, err}.
// Dùng bởi _Tools/_Chung/lib_bai_v2.py để lấy "màn hình" giống hệt web/Programiz (có vọng số nhập).
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ctx = { console, setTimeout, clearTimeout, document: {} };
ctx.window = ctx; ctx.self = ctx; ctx.global = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "engine", "JSCPP.es5.min.js"), "utf8"), ctx);
const job = JSON.parse(fs.readFileSync(0, "utf8").replace(/^﻿/, ""));
let out = "";
const stdio = { write: s => { out += s; } };
if (job.echo !== false) stdio.echo = t => { out += t + "\n"; };
try {
  ctx.JSCPP.run(job.code, job.input || "", { stdio, maxTimeout: 2000 });
  process.stdout.write(JSON.stringify({ ok: true, out }));
} catch (e) {
  process.stdout.write(JSON.stringify({ ok: false, out, err: String(e.message || e).split("\n")[0] }));
}
