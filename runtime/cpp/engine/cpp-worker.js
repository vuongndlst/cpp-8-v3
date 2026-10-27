/* CPU/output limits remain active; waiting for a pupil is not CPU time. */
self.window = self;
self.document = {};
const version = new URL(self.location.href).searchParams.get("v") || "20261027-inlinecin";
importScripts("JSCPP.es5.min.js?v=" + version, "main-shim.js?v=" + version, "input-rules.js?v=" + version, "interactive-runtime.js?v=" + version);
let active = null;
function complete(job, result) {
  if (active !== job) return;
  active = null;
  self.postMessage({ id: job.id, type: "done", result: { ...result, input: job.runtime?.input || "" } });
}
function pump(job) {
  if (active !== job) return;
  try {
    const step = job.runtime.pump();
    if (step.status === "input") self.postMessage({ id: job.id, type: "input", request: step.request });
    else if (step.status === "done") complete(job, { ok: true, output: job.runtime.output, exitCode: step.exitCode });
    else setTimeout(() => pump(job), 0);
  } catch (err) { complete(job, { ok: false, output: job.runtime.output, error: String(err?.message || err) }); }
}
self.onmessage = e => {
  const data = e.data;
  if (data.type === "input") {
    const job = active;
    if (!job || job.id !== data.id || !job.runtime) return;
    const result = job.runtime.submit(data.requestId, data.value);
    if (result.error) self.postMessage({ id: job.id, type: "input-error", error: result.error, request: result.request });
    else if (result.accepted) pump(job);
    return;
  }
  if (active) return;
  const { id, code, input = "", echo = true, interactive = false } = data;
  const job = active = { id, runtime: null };
  if (interactive) {
    let lastOutput = "";
    try {
      job.runtime = CppInteractive.create(JSCPP, cppMainWithImplicitReturn(code), { output: output => {
        if (output === lastOutput) return;
        lastOutput = output; self.postMessage({ id, type: "output", output });
      } });
      pump(job);
    } catch (err) { complete(job, { ok: false, output: "", error: String(err?.message || err) }); }
    return;
  }
  let output = "";
  const append = s => { if (output.length + s.length > 32768) throw Error("Output limit exceeded"); output += s; };
  try {
    const exitCode = JSCPP.run(cppMainWithImplicitReturn(code), input, { stdio: { write: append, echo: t => { if (echo) append(t + "\n"); } }, maxTimeout: 2000 });
    complete(job, { ok: true, output, exitCode });
  } catch (err) { complete(job, { ok: false, output, error: String(err?.message || err) }); }
};
