/* Pinned-JSCPP adapter: no source rewriting, replay, or bundle patch.
   JSCPP delegates operator iterators but recognizes its regenerator constructor.
   Tag our native iterator with that constructor while keeping native next/return.
   Each yield holds the real stack before an empty istream extraction. */
(function (root) {
  "use strict";
  function create(JSCPP, code, callbacks = {}) {
    let output = "", pending = null, input = "", spent = 0, requests = 0, exitCode = 0;
    const started = performance.now();
    const append = value => {
      const text = String(value);
      if (output.length + text.length > 32768) throw Error("Output limit exceeded");
      output += text;
    };
    const debug = JSCPP.run(code, "", { debug: true, stdio: { write: append, echo: t => append(t + "\n") } });
    spent = performance.now() - started;
    const rt = debug.rt, cin = rt.scope[0].variables.cin;
    function specFor(target) {
      const type = rt.makeTypeString(target.t), name = target.t.name || "", limits = rt.config.limits[name];
      const kind = /^(signed |unsigned )?char$/.test(name) ? "char" : name === "bool" ? "bool"
        : /float|double/.test(name) ? "number" : limits ? "integer" : "text";
      return { requestId: ++requests, kind, type, min: limits?.min, max: limits?.max, line: debug.nextNode()?.sLine || 0 };
    }
    if (cin) {
      const handler = rt.types[rt.getTypeSignature(cin.t)].handlers[rt.makeOperatorFuncName(">>")];
      const wrap = original => function (...args) {
        const stream = args[1], target = args[2];
        const iterator = (function* () {
          while (!/\S/.test(stream.v.buf)) { pending = { spec: specFor(target), stream }; yield null; }
          return original(...args);
        })();
        Object.defineProperty(iterator, "constructor", { value: debug.gen.constructor });
        return iterator;
      };
      if (handler?.default) handler.default = wrap(handler.default);
      for (const key of Object.keys(handler?.functions || {})) handler.functions[key] = wrap(handler.functions[key]);
    }
    function pump() {
      const slice = performance.now();
      try {
        while (!debug.done && !pending) {
          const value = debug.next();
          if (debug.done) exitCode = value?.v ?? value ?? 0;
          if (spent + performance.now() - slice > 2000) throw Error("Time limit exceeded.");
          if (performance.now() - slice >= 8) break;
        }
      } finally { spent += performance.now() - slice; }
      callbacks.output?.(output);
      return pending ? { status: "input", request: pending.spec } : debug.done ? { status: "done", exitCode } : { status: "running" };
    }
    function submit(requestId, value) {
      if (!pending || pending.spec.requestId !== requestId) return { stale: true };
      const error = root.CppInput.validate(value, pending.spec);
      if (error) return { error, request: pending.spec };
      const text = String(value).trim();
      pending.stream.v.buf += text + "\n"; input += text + "\n"; pending = null;
      return { accepted: true };
    }
    return { pump, submit, get output() { return output; }, get input() { return input; } };
  }
  root.CppInteractive = { create };
})(typeof self === "object" ? self : window);
