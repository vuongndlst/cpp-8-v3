window.CppRun = (() => {
  "use strict";
  const workerURL = new URL("cpp-worker.js", document.currentScript.src), waiting = new Map();
  workerURL.searchParams.set("v", new URL(document.currentScript.src).searchParams.get("v") || "20261027-inlinecin");
  let worker = null, id = 0;
  function stop(message = "Đã dừng chương trình.", cancelled = true) {
    worker?.terminate(); worker = null;
    for (const w of waiting.values()) { clearTimeout(w.timer); w.resolve({ ok: false, cancelled, output: w.output, error: message }); }
    waiting.clear();
  }
  function arm(w) {
    clearTimeout(w.timer);
    w.timer = setTimeout(() => stop("Chương trình quá thời gian chạy. Kiểm tra điều kiện và bước tăng/giảm rồi chạy lại.", false), 3500);
  }
  function start() {
    if (worker) return;
    worker = new Worker(workerURL);
    worker.onmessage = e => {
      const data = e.data, w = waiting.get(data.id);
      if (!w) return;
      if (data.type === "output") { w.output = data.output; w.options.onOutput?.(data.output); return; }
      if (data.type === "input" || data.type === "input-error") {
        clearTimeout(w.timer); w.requestId = data.request.requestId;
        w.options.onInput?.(data.request, data.error || ""); return;
      }
      clearTimeout(w.timer); waiting.delete(data.id); w.resolve(data.result);
    };
    worker.onerror = () => stop("Chưa tải được trình chạy C++. Kiểm tra mạng và thử lại.", false);
  }
  function create(code, input, options) {
    const rejected = error => ({ result: Promise.resolve({ ok: false, output: "", error }), submit() {}, stop() {} });
    if (!CppCloud.allowed()) return rejected("Nhập tên/lớp và mở bài trước khi chạy mã.");
    if (waiting.size) return rejected("Đang chạy mã khác. Dừng chương trình trước rồi thử lại.");
    start(); const job = ++id;
    const result = new Promise(resolve => { const w = { resolve, options, timer: 0, requestId: null, output: "" }; waiting.set(job, w); arm(w); worker.postMessage({ id: job, code, input, echo: options.echo !== false, interactive: !!options.interactive }); });
    return {
      result,
      submit(value, requestId) {
        const w = waiting.get(job);
        if (!w || w.requestId !== requestId) return;
        w.requestId = null; arm(w); worker.postMessage({ id: job, type: "input", requestId, value });
      },
      stop(message) { if (waiting.has(job)) stop(message); }
    };
  }
  return { run: (code, input = "", options = {}) => create(code, input, options).result, interactive: (code, options = {}) => create(code, "", { ...options, interactive: true }), stop };
})();
