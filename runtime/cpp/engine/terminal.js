/* One real input control, shared by live cin and authored guided traces. */
window.CppTerminal = (() => {
  "use strict";
  const terminals = new WeakMap(), active = new Set(); let nextId = 0;
  const observer = new MutationObserver(() => {
    for (const t of [...active]) if (!t.host.isConnected || t.host.closest("[hidden]")) t.stop("Đã dừng vì bạn chuyển phần học.");
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  function mount(host, options = {}) {
    if (terminals.has(host)) return terminals.get(host);
    const original = host.textContent, id = "cin-value-" + ++nextId;
    host.classList.add("interactive-console");
    host.innerHTML = `<span class="terminal-transcript"></span><span class="terminal-input-row" hidden><input id="${id}" class="terminal-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="enter" aria-label="Nhập giá trị cho cin rồi nhấn Enter" aria-describedby="${id}-help ${id}-error"><svg class="terminal-pointer" aria-hidden="true" focusable="false" viewBox="0 0 32 32"><path d="M27 27C14 27 10 19 10 5M4 11L10 5L16 11"/></svg></span>
      <div class="terminal-guide"><p class="terminal-help" id="${id}-help" role="status"></p><p class="terminal-error" id="${id}-error" role="alert" hidden></p><button type="button" class="terminal-stop" hidden>■ Dừng</button></div>`;
    const transcript = host.querySelector(".terminal-transcript"), entry = host.querySelector(".terminal-input-row"), field = host.querySelector("input");
    const help = host.querySelector(".terminal-help"), error = host.querySelector(".terminal-error"), stopButton = host.querySelector(".terminal-stop");
    let session = null, resolvePrompt = null, request = null, generation = 0;
    transcript.textContent = original;
    help.textContent = "";
    const hideInput = () => { entry.hidden = true; request = null; error.hidden = true; host.classList.remove("waiting-input"); };
    const cancelPrompt = () => { const resolve = resolvePrompt; resolvePrompt = null; hideInput(); resolve?.(null); };
    const output = text => { transcript.textContent = text; };
    function showResult(r) {
      cancelPrompt(); stopButton.hidden = true; active.delete(api);
      host.classList.toggle("error", !r.ok && !r.cancelled);
      transcript.textContent = r.cancelled ? (r.output || "") : r.ok ? (r.output || "(Chương trình chạy xong nhưng không in gì ra.)") : (r.output ? r.output + "\n" : "") + "⚠ LỖI\n" + r.error;
      help.textContent = r.cancelled ? r.error : r.ok ? "Đã chạy xong." : "Sửa code rồi bấm Chạy lại.";
    }
    function prompt(spec, message = "") {
      cancelPrompt(); request = spec; active.add(api);
      entry.hidden = false; field.disabled = false; field.value = ""; field.style.width = "1ch"; field.removeAttribute("aria-invalid"); host.classList.add("waiting-input");
      field.inputMode = spec.kind === "integer" ? "numeric" : spec.kind === "number" ? "decimal" : "text";
      field.placeholder = "";
      help.textContent = spec.expected != null
        ? `cin${spec.line ? " dòng " + spec.line : ""}: nhập ${spec.expected} rồi nhấn Enter.`
        : `cin${spec.line ? " dòng " + spec.line : ""}: nhập ${spec.kind === "integer" ? "một số nguyên" : "giá trị"} rồi nhấn Enter.`;
      field.setAttribute("aria-label", help.textContent);
      error.hidden = !message; error.textContent = message;
      entry.scrollIntoView({ block: "nearest", behavior: "instant" }); field.focus({ preventScroll: true });
      return new Promise(resolve => { resolvePrompt = resolve; });
    }
    function submit() {
      if (!request || !resolvePrompt) return;
      const message = CppInput.validate(field.value, request);
      if (message) { error.textContent = message; error.hidden = false; field.setAttribute("aria-invalid", "true"); field.focus(); return; }
      const value = field.value.trim(), resolve = resolvePrompt;
      field.removeAttribute("aria-invalid"); resolvePrompt = null; hideInput(); help.textContent = "Đang chạy tiếp…"; resolve(value);
    }
    field.addEventListener("keydown", e => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); submit(); } });
    field.addEventListener("input", () => { field.style.width = Math.max(1, field.value.length + 1) + "ch"; });
    host.addEventListener("click", e => {
      if (request && !e.target.closest("button, a") && getSelection()?.isCollapsed !== false) field.focus({ preventScroll: true });
    });
    async function run(code, options = {}) {
      api.stop(); const token = ++generation; output(""); host.classList.remove("error"); active.add(api);
      help.textContent = "Đang chạy chương trình…"; stopButton.hidden = false;
      session = CppRun.interactive(code, {
        onOutput: output,
        onInput: (spec, message) => {
          if (token !== generation) return;
          const current = session;
          const adjusted = options.min != null && spec.kind === "integer" ? { ...spec, min: Math.max(spec.min, options.min) } : spec;
          prompt(adjusted, message).then(value => { if (value !== null && token === generation) current.submit(value, spec.requestId); });
        }
      });
      const result = await session.result;
      if (!result.ok && !result.cancelled && options.formatError) result.error = options.formatError(result.error);
      if (token === generation) { session = null; showResult(result); }
      return result;
    }
    const api = {
      host, run, prompt, output, showResult,
      append: text => { transcript.append(String(text)); },
      reset: (text = "") => { api.stop(); host.classList.remove("error"); output(text); help.textContent = ""; },
      finish: () => { cancelPrompt(); active.delete(api); stopButton.hidden = true; help.textContent = "Đã chạy xong."; },
      get output() { return transcript.textContent; },
      stop(message = "Đã dừng chương trình.") {
        generation++; cancelPrompt(); session?.stop(message); session = null; active.delete(api); stopButton.hidden = true; help.textContent = message;
      }
    };
    stopButton.onclick = () => api.stop(); terminals.set(host, api); return api;
  }
  function stopAll(message) { for (const t of [...active]) t.stop(message); }
  addEventListener("pagehide", () => stopAll());
  return { mount, get: host => terminals.get(host), stopAll };
})();
