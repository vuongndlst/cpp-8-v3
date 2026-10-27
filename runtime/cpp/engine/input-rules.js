/* Shared by terminal and worker: reject a bad value before consuming cin. */
(function (root) {
  "use strict";
  function validate(value, spec = {}) {
    const text = String(value ?? "").trim();
    if (!text) return "Chưa có giá trị. Nhập giá trị rồi nhấn Enter.";
    if (spec.expected != null && text !== String(spec.expected)) return `Theo tình huống này, hãy nhập ${spec.expected} rồi nhấn Enter.`;
    if (spec.kind === "integer") {
      if (!/^[+-]?\d+$/.test(text)) return "Mỗi lần nhập một số nguyên, ví dụ 5. Không nhập chữ, số thập phân hoặc hai số cùng lúc.";
      const n = Number(text);
      if (!Number.isSafeInteger(n) || n < spec.min || n > spec.max) return `Nhập số nguyên từ ${spec.min} đến ${spec.max}.`;
    } else if (spec.kind === "number") {
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text) || !Number.isFinite(Number(text))) return "Nhập một số; phần thập phân dùng dấu chấm, ví dụ 8.5.";
    } else if (spec.kind === "char" && text.length !== 1) return "Lệnh cin này cần một ký tự.";
    else if (spec.kind === "bool" && !["true", "false"].includes(text)) return "Nhập true hoặc false.";
    else if (spec.kind === "text" && /\s/.test(text)) return "Lệnh cin này đọc một từ. Nhập một từ rồi nhấn Enter.";
    return "";
  }
  root.CppInput = { validate };
})(typeof self === "object" ? self : window);
