/* C++ Journey 8 — bộ khối nội dung dùng chung cho lesson.js (nạp TRƯỚC lesson.js).
   giaiMa(): bảng "Lệnh C++ | Nghĩa là | Khối Scratch" — không lặp nhãn ở từng dòng.
   scratch(): khối Scratch 3 tiếng Việt, viết bằng cú pháp scratchblocks tiếng Anh, engine tự vẽ + dịch.
*/
"use strict";
(function () {
  const esc = s => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const W3 = slug => `https://www.w3schools.com/cpp/cpp_${slug}.asp`;

  const scratch = (text, cap = "") =>
    `<figure class="sb-fig"><pre class="sb">${esc(text)}</pre>${cap ? `<figcaption>${cap}</figcaption>` : ""}</figure>`;

  const KIT = {
    W3,
    esc,
    scratch,
    // Đoạn code mẫu (chỉ đọc)
    demo: (code, label = "Ví dụ") => `
      <div class="code-demo"><div class="code-demo-header"><span><span class="window-dots">● ● ●</span> &nbsp; ${label}</span><span>main.cpp</span></div>
      <pre><code>${esc(code)}</code></pre></div>`,
    // Code bên trái, màn hình bên phải
    codeVaManHinh: (code, man, label = "Ví dụ", nhap = "") => `
      <div class="pair-view">
        ${KIT.demo(code, label)}
        <div class="screen-card"><div class="screen-head">🖥 MÀN HÌNH${nhap ? ` · nhập <code>${esc(nhap)}</code>` : ""}</div><pre>${esc(man)}</pre></div>
      </div>`,
    // rows: [{code, y, nho?, sb?}] — sb = cú pháp scratchblocks (tuỳ chọn)
    giaiMa: (tieuDe, rows) => {
      const coSb = rows.some(r => r.sb);
      return `<div class="gm">
        <div class="gm-title">${tieuDe}</div>
        <div class="gm-head ${coSb ? "with-sb" : ""}"><span>Lệnh C++</span><span>Nghĩa là</span>${coSb ? "<span>Giống khối Scratch</span>" : ""}</div>
        ${rows.map(r => `<div class="gm-row ${coSb ? "with-sb" : ""} ${r.nhan ? "focus" : ""}">
          <code>${esc(r.code)}</code>
          <div>${r.y}${r.nho ? `<small>${r.nho}</small>` : ""}</div>
          ${coSb ? `<div class="gm-sb">${r.sb ? `<pre class="sb">${esc(r.sb)}</pre>` : `<span class="muted">—</span>`}</div>` : ""}
        </div>`).join("")}
      </div>`;
    },
    // Thẻ CÚ PHÁP: dạng tổng quát của lệnh. Chỗ cần thay viết trong ‹ › (tô màu riêng).
    // { ten, mau: chuỗi | [chuỗi], phan?: [[‹…›, giải thích]], quyTac?: [html], viDu?: code, man?: màn hình, nhap? }
    cuPhap: ({ ten, mau, phan = [], quyTac = [], viDu = "", man = "", nhap = "" }) => {
      const hl = s => esc(s).replace(/‹([^›]*)›/g, '<span class="ph">‹$1›</span>');
      return `<div class="cp-card">
        <div class="cp-head">📐 CÚ PHÁP · ${ten}</div>
        <div class="cp-body ${viDu ? "" : "no-vd"}">
          <div class="cp-main">
            ${[].concat(mau).map(m => `<pre class="cp-mau">${hl(m)}</pre>`).join("")}
            ${phan.length ? `<dl class="cp-phan">${phan.map(([k, v]) => `<div><dt>${hl(k)}</dt><dd>${v}</dd></div>`).join("")}</dl>` : ""}
            ${quyTac.length ? `<div class="cp-label">Quy tắc</div><ul class="cp-rules">${quyTac.map(r => `<li>${r}</li>`).join("")}</ul>` : ""}
          </div>
          ${viDu ? `<div class="cp-vidu"><div class="cp-label">Ví dụ</div><pre class="cp-code">${esc(viDu)}</pre>
            ${man ? `<div class="cp-label">Màn hình${nhap ? ` (nhập ${esc(nhap)})` : ""}</div><pre class="cp-man">${esc(man)}</pre>` : ""}</div>` : ""}
        </div></div>`;
    },
    // Quy tắc đặt tên biến + ví dụ đúng/sai
    tenBien: () => `<div class="cp-card ten-bien">
      <div class="cp-head">🏷️ QUY TẮC ĐẶT TÊN BIẾN</div>
      <div class="cp-body">
        <div class="cp-main"><ol class="cp-rules num">
          <li>Chỉ dùng <strong>chữ cái tiếng Anh</strong> (a–z, A–Z), <strong>chữ số</strong> (0–9) và dấu gạch dưới <code>_</code>.</li>
          <li><strong>Không bắt đầu bằng chữ số.</strong></li>
          <li>Không có <strong>dấu cách</strong>, không có <strong>dấu tiếng Việt</strong>, không có ký tự đặc biệt như <code>- @ # !</code></li>
          <li>Không trùng <strong>từ khoá</strong> của C++: <code>int</code>, <code>return</code>, <code>if</code>, <code>for</code>…</li>
          <li><strong>Phân biệt chữ hoa, chữ thường</strong>: <code>soKeo</code> và <code>sokeo</code> là hai biến khác nhau.</li>
          <li>Nên đặt tên <strong>có nghĩa</strong>, viết kiểu <strong>camelCase</strong>: từ đầu viết thường, các từ sau viết hoa chữ cái đầu.</li>
        </ol></div>
        <div class="cp-vidu"><div class="cp-label">Ví dụ</div>
          <table class="tb-table">
            ${[["soKeo", 1, "camelCase, có nghĩa"], ["diem1", 1, "chữ số đứng sau được"], ["tien_com", 1, "có dấu _ được"],
               ["so keo", 0, "có dấu cách"], ["2keo", 0, "bắt đầu bằng chữ số"], ["so-keo", 0, "có dấu -"],
               ["sốKẹo", 0, "có dấu tiếng Việt"], ["int", 0, "trùng từ khoá"]]
              .map(([t, ok, ly]) => `<tr class="${ok ? "ok" : "sai"}"><td><code>${esc(t)}</code></td><td>${ok ? "✅ Đúng" : "❌ Sai"}</td><td>${ly}</td></tr>`).join("")}
          </table></div>
      </div></div>`,
    // Phần "Tìm hiểu thêm" (không bắt buộc, không kiểm tra) — thu gọn, bấm mới mở
    moRong: (tieuDe, html) => `<details class="mo-rong"><summary>🚀 <strong>Tìm hiểu thêm (không bắt buộc):</strong> ${tieuDe}
      <span class="mo-rong-btn">Mở ra</span></summary><div class="mo-rong-body">${html}</div></details>`,
    // Ô "Đoán trước" — bấm mới hiện đáp án
    doan: (cauHoi, dapAn) => `<details class="guess"><summary>🧠 <strong>Đoán trước:</strong> ${cauHoi} <span class="guess-btn">Xem đáp án</span></summary><div>${dapAn}</div></details>`,
    meo: html => `<div class="tip-strip">✨ ${html}</div>`,
    docThem: (links, tieuDe = "📚 Đọc thêm trên W3Schools") => `
      <div class="read-more-box"><div><strong>${tieuDe}</strong><span>Mở ở tab mới, đọc xong quay lại.</span></div>
      <div class="resource-links">${links.map(([slug, label]) => `<a href="${W3(slug)}" target="_blank" rel="noopener">${label} ↗</a>`).join("")}</div></div>`,
    // Chặng chứng chỉ: rút n câu từ ngân hàng, cố định theo tên + lớp (mở lại vẫn ra đúng bộ câu đó).
    rut: (pool, n) => {
      const p = (window.PortalCloud && window.PortalCloud.profile) || {};
      let s = 2166136261;
      for (const ch of `${p.display_name || ""}|${p.class_label || ""}`) { s ^= ch.charCodeAt(0); s = Math.imul(s, 16777619); }
      const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      const a = [...pool];
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      // Ưu tiên mỗi câu một dạng khác nhau (chọn màn hình, điền khuyết, kéo thả...), thiếu mới lấy trùng dạng.
      const picked = [], used = new Set();
      for (const q of a) if (picked.length < n && !used.has(q.type)) { picked.push(q); used.add(q.type); }
      for (const q of a) if (picked.length < n && !picked.includes(q)) picked.push(q);
      return picked;
    },
    /* ---------- Chuẩn 2 (19/10/2026): khối trình bày dùng chung cho Bài 1–4 ---------- */
    boiCanh: (big, html) => `<div class="scene-card"><div class="scene-big">${big}</div>${html}</div>`,
    // Bảng tra: tiêu đề + hàng tiêu đề cột + các dòng (ô là HTML).
    bang: (tieuDe, cot, dong) => `<div class="ky-title">${tieuDe}</div><table class="ky-table"><tr>${cot.map(c => `<th>${c}</th>`).join("")}</tr>
      ${dong.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>`,
    // Ghi nhớ: khung "Ghi vào vở" đúng 3 ý (trùng slide chốt), một lưu ý, rồi các bảng chi tiết không cần chép.
    ghiVo: y => `<div class="ghi-vo"><div class="ghi-vo-tieu">📒 Ghi vào vở</div><ol>${y.map(t => `<li>${t}</li>`).join("")}</ol></div>`,
    luuY: t => `<div class="luu-y"><b class="nhan">⚠ Lưu ý:</b> ${t}</div>`,
    chiTiet: `<p style="margin:18px 0 4px;color:var(--muted)">Các bảng dưới đây giải thích chi tiết hơn, dùng để đọc hiểu và tra lại khi làm bài. <strong>Không cần chép.</strong></p>`,
    timThem: links => `<div class="ky-title">Tìm hiểu thêm <small style="font-weight:600;color:var(--muted)">(không bắt buộc, mở ở tab mới)</small></div>
      <div class="tim-them">${links.map(([u, t]) => `<a href="${u}" target="_blank" rel="noopener">${t} ↗</a>`).join("")}</div>`,
    sauTab: kiem => `<div class="mission-row" style="grid-template-columns:repeat(auto-fit,minmax(96px,1fr))">
      ${["Bối cảnh", "Đoán rồi chạy", kiem, "Ghi nhớ", "Luyện tập", "Phản tư"].map((t, i) => `<div>${i + 1}<small>${t}</small></div>`).join("")}</div>`,
    // Hướng dẫn tab Đoán rồi chạy. coNhap: chương trình có cin (số khách gõ hiện tô vàng trên Màn hình).
    huongDanDoan: (n, coNhap = false) => `<p>Bạn sẽ gặp ${n} lần chạy. Mỗi lần làm hai bước:</p>
      <ol><li><strong>Đoán:</strong> đọc code ở khung bên trái, rồi chọn phương án bạn nghĩ là đúng. Bấm <strong>Chốt dự đoán</strong>.</li>
      <li><strong>Chạy để kiểm tra:</strong> bấm <strong>▶ Chạy từng dòng</strong>. Mỗi lần bấm, máy thực hiện một bước: dòng đang chạy có mũi tên màu cam, bảng <strong>Bộ nhớ</strong> cho biết giá trị từng biến, chữ in ra hiện dần ở khung <strong>Màn hình</strong>, và phần giải thích cho biết máy vừa làm gì.</li></ol>
      ${coNhap ? `<p>Khi gặp câu lệnh <code>cin</code>, máy dừng và chờ người dùng gõ số. Số được gõ hiện <span class="dc-typed" style="background:#fde68a;border-radius:4px;padding:0 4px;font-weight:700">tô vàng</span> trên Màn hình, giống khi chạy trên Programiz.</p>` : ""}
      <p>Đoán sai không bị trừ điểm. Chạy xong, bấm <strong>Tiếp tục</strong> để sang lần sau.</p>`,
    bonBuoc: dong => `<p>Làm theo <strong>4 bước của lập trình viên</strong>:</p><ol class="think-steps">${dong.map(([a, b]) => `<li><strong>${a}:</strong> ${b}</li>`).join("")}</ol>`,
    tuCham: "Với mỗi câu dưới đây, chọn mức đúng với bạn lúc này. Thầy dùng kết quả để biết cần giảng lại phần nào cho cả lớp.",
    // Dùng trong quy tắc kiểm tra code
    khongCo: (code, pattern) => !new RegExp(pattern).test(window.CPP.stripComments(code)),
    demLenh: (code, ten) => (window.CPP.stripComments(code).match(new RegExp("\\b" + ten + "\\b", "g")) || []).length
  };
  window.KIT = KIT;
})();
