(()=>{
/* C++ Journey 8 — V2 engine (dùng chung cho Bài 1–5)
   - Nội dung từng bài: window.LESSON (bai0N/lesson.js), khối nội dung dùng chung: engine/kit.js
   - Học sinh: localStorage, mỗi bài một khoá riêng
   - Chạy C++: JSCPP (lưu sẵn, đã vá để vọng số nhập giống Programiz)
   - Robot Bit nổi ở góc màn hình, đi theo khi cuộn, nói lời dẫn và phản hồi (gọi học sinh là "bạn")
   - Lớp trò chơi: bản đồ, ổ khoá theo mã, Ngôi sao hi vọng (như Đường lên đỉnh Olympia), săn bọ, combo, pháo giấy,
     BOSS có thanh máu, huy hiệu
   - Khung code: tắt dán/kéo-thả/sao chép để học sinh tự gõ (tập gõ code)
*/
"use strict";

const L = window.LESSON;
// Góp ý 19/10: xáo phương án để đáp án đúng chia đều A/B/C/D (chặng chứng chỉ đã xáo trong KIT.rut).
L.steps.forEach(s => { if (s.kind === "stage" && window.KIT?.xao) window.KIT.xao(s.challenges || [], L.id + "|" + s.id); });
// Thẻ nhiệm vụ: test case khai báo một lần trong card, dùng cho cả hiển thị lẫn chấm.
L.steps.forEach(s => (s.challenges || []).forEach(c => {
  if (c.card?.tests && !c.tests) c.tests = c.card.tests.map(t => ({ input: t.input || "", expected: t.expected }));
}));
const CFG = { schoolName: "", teacherName: "", canvasSubmissionUrl: "", ...(window.CPP_JOURNEY_CONFIG || {}) };
const PREFIX = "cpp8v2";
const CLASSES = ["8A1", "8A2", "8A3", "8A4", "8A5", "8A6", "8A7", "8A8", "8A9", "8A10"];
const XP_PASS = 10, XP_FIRST_TRY = 5, STAR_LOSS = 10;

const STEPS = L.steps.filter(step=>step.kind!=='gate'||!selfStudy());

let state = null, cppBusy=false;

/* ---------- tiện ích ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(v = "") {
  return String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function hashText(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

// Mã mở khoá: so sánh băm, không phân biệt hoa/thường, bỏ khoảng trắng.
function codeHash(code) { return hashText("cpp8v2|" + String(code).toUpperCase().replace(/\s+/g, "")); }
function studentKey(student) { return hashText(`${student.name}|${student.className}`.toLowerCase()); }
function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key, val) { try { localStorage.setItem(key, val); } catch { /* bỏ qua */ } }

function normalizeOutput(v = "") {
  return String(v).replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/[ \t]+$/g, "").replace(/\n+$/g, "").replace(/^\n+/, "");
}

function stripComments(code) {
  return String(code).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

window.CPP = { stripComments, normalizeOutput }; // lesson.js / kit.js dùng trong quy tắc kiểm tra

/* ---------- lưu trạng thái ---------- */
function freshState(student) {
  return { student, active: STEPS[0].id, passed: {}, attempts: {}, drafts: {}, inputs: {}, gates: {}, xaoV: 1,
    xp: 0, combo: 0, stars: {}, startedAt: new Date().toISOString(), completedAt: null };
}
function save() {
 if(!state||!CppCloud.allowed())return;
 state.student=CPPAccount.student();state.completed=allRequiredDone();
 if(state.completed)state.badge=isGold()?"gold":"silver";
 CppCloud.save(L.id,state);
}
function load(student){const remote={...CppCloud.state(L.id)},q=new URLSearchParams(location.search),steps=L.steps.filter(s=>s.kind!=='gate'&&(q.has('cuoi')||s.kind!=='boss')),index=q.has('cuoi')?steps.findIndex(s=>s.kind==='boss'):Number(q.get('chang'));if(q.has('chang')||q.has('cuoi'))remote.active=steps[index]?.id||steps[0].id;state={...freshState(student),...remote,student};const oldIndex=L.steps.findIndex(s=>s.id===state.active);if(oldIndex>=0&&L.steps[oldIndex].kind==='gate')state.active=L.steps.slice(oldIndex+1).find(s=>s.kind!=='gate')?.id||STEPS[0].id;for(const f of ["passed","attempts","drafts","inputs","gates","stars","waitingChoice"])if(!state[f]||typeof state[f]!=="object"||Array.isArray(state[f]))state[f]={};
 // Bài đã làm trước khi xáo phương án: đổi chỉ số đã chọn sang thứ tự mới để ô đã chọn vẫn đúng.
 if(!state.xaoV){for(const s of L.steps)for(const c of s.challenges||[])if(c._goc&&state.choices?.[c.id]!=null){const i=c._goc.indexOf(Number(state.choices[c.id]));if(i>=0)state.choices[c.id]=i;}state.xaoV=1;}}
function selfStudy(){return Boolean(window.PORTAL_SELF_STUDY);}

/* ---------- tiến độ ---------- */
function stepDone(step) {
  if (step.kind === "gate") return Boolean(state.gates[step.id]);
  return step.challenges.filter(c => !c.advanced && !c.bonus).every(c => state.passed[c.id]);
}
function stepUnlocked(index) { return Boolean(state.completedAt) || STEPS.slice(0,index).every(stepDone); }
function bossStep() { return STEPS.find(s => s.kind === "boss"); }
function completionStatus() { return CppProgress.assess(STEPS, state?.passed || {}); }
function allRequiredDone() { return completionStatus().completed; }
function isGold() { return completionStatus().gold; }
function activeStep() { return STEPS.find(s => s.id === state.active); }
function lockedByBoss() { return Boolean(state?.bossLost && activeStep()?.kind === "boss"); }

/* ---------- chạy C++ ---------- */
// JSCPP cho gọi hàm viết SAU main mà không khai báo trước; g++ (Programiz) thì báo lỗi → web cũng báo lỗi.
function functionOrderError(code) {
  const c = stripComments(code);
  const mainAt = c.search(/\bint\s+main\s*\(/);
  if (mainAt < 0) return null;
  const defRe = /\b(?:void|int)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{/g;
  let m;
  while ((m = defRe.exec(c))) {
    const name = m[1];
    if (name === "main" || m.index < mainAt) continue;
    const truoc = c.slice(0, mainAt);
    if (new RegExp("\\b(?:void|int)\\s+" + name + "\\s*\\([^)]*\\)\\s*;").test(truoc)) continue;
    const goi = new RegExp("\\b" + name + "\\s*\\(").exec(c.slice(mainAt, m.index));
    if (goi) {
      const line = c.slice(0, mainAt + goi.index).split("\n").length;
      return `Máy chưa biết hàm "${name}" ở dòng ${line}: hàm này được viết SAU main().\n` +
        `👉 Đưa cả hàm ${name} lên TRÊN main(), hoặc khai báo trước main: ${m[0].replace(/\s*\{$/, "")};`;
    }
  }
  return null;
}

// JSCPP chạy được cả khi thiếu #include <iostream> hoặc using namespace std;, còn g++ (Programiz) báo lỗi.
// Web báo lỗi giống g++ để học sinh quen khung chương trình đúng: #include → using namespace std; → int main().
function frameError(code) {
  const c = stripComments(code), dung = c.match(/\b(cout|cin|endl)\b/);
  if (!dung) return null;
  const dong = c.slice(0, dung.index).split("\n").length;
  const inc = c.search(/#\s*include\s*<iostream>/), use = c.search(/\busing\s+namespace\s+std\s*;/), main = c.search(/\bint\s+main\s*\(/);
  if (inc < 0) return `Thiếu dòng #include <iostream> ở đầu chương trình.\n👉 Không có dòng này, máy không dùng được ${dung[1]}.`;
  if (use < 0) return `Máy không biết tên "${dung[1]}" ở khoảng dòng ${dong}.\n👉 Thiếu dòng using namespace std; — thêm NGAY SAU #include <iostream>.`;
  if (use < inc) return "Dòng using namespace std; phải đặt NGAY SAU #include <iostream>.";
  if (main >= 0 && use > main) return "Dòng using namespace std; phải đặt trước int main(), ngay sau #include <iostream>.";
  return null;
}

async function runCpp(code,input="") {
 const frameErr=frameError(code);if(frameErr)return {ok:false,output:"",error:frameErr};
 const orderErr=functionOrderError(code);if(orderErr)return {ok:false,output:"",error:orderErr};
 const r=await CppRun.run(code,input);if(!r.ok)r.error=/Output limit/.test(r.error)?"In quá nhiều dữ liệu. Giảm số lần lặp hoặc số dòng in.":friendlyError(r.error,code);return r;
}
// Lỗi logic hay gặp với if: chương trình vẫn chạy nhưng sai. Trả về lời nhắc ngắn hoặc "".
function ifHint(code) {
  const c = stripComments(code);
  if (/\bif\s*\((?:[^()]|\([^()]*\))*\)\s*;/.test(c)) return "Có dấu ; ngay sau if (…): câu if kết thúc luôn nên khối { } chạy với mọi trường hợp. Xoá dấu ; đó.";
  if (/\bif\s*\((?:[^()=!<>]|\([^()]*\))*[^=!<>]=[^=](?:[^()]|\([^()]*\))*\)/.test(c)) return "Trong điều kiện, so sánh bằng phải viết == (hai dấu bằng). Một dấu = là phép gán.";
  return "";
}

// Dịch thông báo lỗi của JSCPP sang lời dễ hiểu cho học sinh lớp 8.
function friendlyError(msg, code) {
  if (/\belse\s*\(/.test(stripComments(code))) return "else không có điều kiện.\n👉 Viết } else { … }. Điều kiện chỉ đặt sau if.";
  const lineMatch = msg.match(/line (\d+)/) || msg.match(/^(\d+):(\d+)/);
  const line = lineMatch ? Number(lineMatch[1]) : null;
  const lineText = line ? ` ở khoảng dòng ${line}` : "";
  if (/Parsing Failure/i.test(msg)) {
    return `Lỗi cú pháp${lineText}.\n👉 Thường gặp: thiếu dấu ; ở cuối dòng phía trên, thiếu dấu " hoặc thiếu ngoặc { } ( ).` +
      (line ? `\n👉 Xem dòng ${line} và dòng ngay trước nó.` : "");
  }
  const notExist = msg.match(/variable (\w+) does not exist/);
  if (notExist) {
    const name = notExist[1], lower = name.toLowerCase();
    const tip = ["cout", "cin", "endl"].includes(lower) && name !== lower
      ? `C++ phân biệt chữ hoa/thường: phải viết ${lower}, không phải ${name}.`
      : `Kiểm tra cách viết tên "${name}" (chữ hoa/thường, đúng từng chữ) và đã khai báo biến này chưa.`;
    return `Máy không biết tên "${name}"${lineText}.\n👉 ${tip}`;
  }
  if (/already declared|redefin/i.test(msg)) {
    return `Một biến bị khai báo hai lần${lineText}.\n👉 Mỗi tên biến chỉ khai báo (int ...) một lần; lần sau chỉ gán giá trị.`;
  }
  if (/Time limit exceeded/i.test(msg)) {
    return "Chương trình chạy mãi không dừng (quá 2 giây).\n👉 Kiểm tra điều kiện và bước tăng/giảm của vòng lặp.";
  }
  if (/must return a value/i.test(msg)) {
    return `Một hàm kiểu int chưa trả về giá trị${lineText}.\n👉 Hàm int phải có lệnh return ...; (main thì return 0;).`;
  }
  const noMethod = msg.match(/no method (\w+) in/);
  if (noMethod) {
    return `Gọi hàm "${noMethod[1]}" chưa đúng${lineText}.\n👉 Truyền đủ số giá trị, đúng thứ tự như các tham số khi viết hàm (kể cả cặp ngoặc tròn).`;
  }
  if (/cannot find|not found|include/i.test(msg) && !/#include\s*<iostream>/.test(code)) {
    return "Thiếu dòng #include <iostream> ở đầu chương trình.";
  }
  return `Chương trình bị lỗi${lineText}.\nThông báo gốc: ${msg.split("\n")[0].slice(0, 160)}`;
}

/* ---------- âm thanh & pháo giấy ---------- */
let audioCtx = null;
function soundOn() { return safeGet(`${PREFIX}:sound`) !== "off"; }
function beep(kind) {
  if (!soundOn()) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = { good: [660, 880], bad: [220, 180], win: [523, 659, 784, 1047], unlock: [440, 660, 880] }[kind] || [440];
    notes.forEach((f, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = kind === "bad" ? "square" : "triangle";
      o.frequency.value = f;
      const t = audioCtx.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t); o.stop(t + 0.18);
    });
  } catch { /* trình duyệt chặn âm thanh: bỏ qua */ }
}

// Pháo giấy: nhỏ (bắn từ nút vừa bấm) mỗi lần đúng; lớn khi mở khoá / hạ BOSS.
function confetti(origin = null, big = false) {
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  const c = document.createElement("canvas");
  c.className = "confetti-layer";
  c.width = innerWidth; c.height = innerHeight;
  document.body.appendChild(c);
  const ctx = c.getContext("2d");
  const colors = ["#2076d2", "#ef8a17", "#7451c7", "#168f67", "#f4c542", "#d94c55"];
  const ox = origin ? origin.x : c.width / 2, oy = origin ? origin.y : c.height * 0.35;
  const n = big ? 200 : 70;
  const parts = Array.from({ length: n }, () => {
    const a = big ? Math.random() * Math.PI * 2 : -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    const v = (big ? 6 : 5) + Math.random() * (big ? 8 : 6);
    return { x: big ? Math.random() * c.width : ox, y: big ? -20 - Math.random() * 200 : oy,
      vx: big ? (Math.random() - 0.5) * 4 : Math.cos(a) * v, vy: big ? 2 + Math.random() * 4 : Math.sin(a) * v,
      r: 5 + Math.random() * 6, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3,
      col: colors[Math.floor(Math.random() * colors.length)] };
  });
  const t0 = performance.now(), dur = big ? 2800 : 1500;
  (function frame(t) {
    ctx.clearRect(0, 0, c.width, c.height);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.vx *= 0.99; p.a += p.va;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
      ctx.globalAlpha = Math.max(0, 1 - (t - t0) / dur);
      ctx.fillStyle = p.col; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore();
    });
    if (t - t0 < dur) requestAnimationFrame(frame); else c.remove();
  })(t0);
}

/* ---------- robot Bit (nổi ở góc, đi theo khi cuộn) ---------- */
function bitSvg(mood = "happy") {
  const mouth = mood === "sad" ? '<path d="M24 44 q8 -6 16 0" stroke="#17304f" stroke-width="3" fill="none" stroke-linecap="round"/>'
    : mood === "wow" ? '<circle cx="32" cy="43" r="4" fill="#17304f"/>'
    : '<path d="M24 41 q8 7 16 0" stroke="#17304f" stroke-width="3" fill="none" stroke-linecap="round"/>';
  const eyes = mood === "sad"
    ? '<path d="M18 30 h10 M36 30 h10" stroke="#17304f" stroke-width="4" stroke-linecap="round"/>'
    : '<circle cx="23" cy="31" r="5" fill="#17304f"/><circle cx="41" cy="31" r="5" fill="#17304f"/><circle cx="25" cy="29" r="1.6" fill="#fff"/><circle cx="43" cy="29" r="1.6" fill="#fff"/>';
  return `<svg class="bit-svg" viewBox="0 0 64 72" aria-hidden="true">
    <line x1="32" y1="4" x2="32" y2="14" stroke="#17304f" stroke-width="3"/>
    <circle cx="32" cy="5" r="4" fill="${mood === "sad" ? "#d94c55" : "#ef8a17"}"/>
    <rect x="8" y="14" width="48" height="40" rx="12" fill="#eaf4ff" stroke="#17304f" stroke-width="3"/>
    ${eyes}${mouth}
    <rect x="18" y="56" width="28" height="12" rx="5" fill="#2076d2" stroke="#17304f" stroke-width="3"/>
  </svg>`;
}

let bitTimer = null, bitLast = "";
function bitSay(html, mood = "happy", ms = 0) {
  const dock = $("#bitDock"), bubble = $("#bitBubble");
  if (!dock) return;
  bitLast = html;
  $("#bitText").innerHTML = html;
  $("#bitFace").innerHTML = bitSvg(mood);
  bubble.className = `bit-bubble-dock ${mood}`;
  if(sessionStorage.getItem('lsts-hints-open:'+PortalCloud.user.id)!=='1')bubble.classList.add('hidden');
  dock.classList.remove("jump"); void dock.offsetWidth; dock.classList.add("jump");
  clearTimeout(bitTimer);
  if (ms) bitTimer = setTimeout(() => bubble.classList.add("hidden"), ms);
}

/* ---------- khung trang ---------- */
function shell() {
  document.title = `Bài ${L.number}: ${L.title} | C++ Journey 8`;
  document.body.innerHTML = `
  <header class="topbar">
    <a class="brand" href="../index.html" title="Về trang các bài">
      <div class="brand-badge">C++</div>
      <div><div class="eyebrow">C++ JOURNEY 8 · BÀI ${L.number}</div><h1>${esc(L.story)}</h1></div>
    </a>
    <div class="top-actions">
      <span class="xp-pill" id="xpPill" title="Điểm kinh nghiệm">⚡ 0 XP</span>
      <button id="errorsBtn" class="top-btn" type="button" title="Bảng lỗi thường gặp">🧰 Bảng lỗi</button>
      <button id="soundBtn" class="top-btn" type="button" title="Bật/tắt âm thanh"></button>
      <button id="studentBtn" class="student-chip" type="button"><span>👤</span><span id="studentText">Chưa có tên</span></button>
      <button id="newStudentBtn" class="new-student-button" type="button">Người học</button>
    </div>
  </header>
  <nav class="journey-map" id="journeyMap" aria-label="Bản đồ hành trình"></nav>
  <main class="main-wrap"><div id="stepContainer"></div></main>
  <footer class="site-footer">
    <p>C++ Journey 8 · Bài ${L.number} · Khối Scratch vẽ bằng scratchblocks (MIT).</p>
    <button id="resetBtn" class="text-button danger-link" type="button">Người học / tải bản sao bài làm</button>
  </footer>
  <div class="bit-dock" id="bitDock">
    <div class="bit-bubble-dock hidden" id="bitBubble" role="status" aria-live="polite">
      <button class="bit-close" type="button" aria-label="Ẩn lời Bit">×</button>
      <div id="bitText"></div>
    </div>
    <button class="bit-face" id="bitFace" type="button" title="Bit — bấm để nghe lại">${bitSvg()}</button>
  </div>
  <dialog id="errorsDialog" class="modal errors-modal">
    <div class="modal-card">
      <button class="icon-button close-button" type="button" data-close>×</button>
      <p class="eyebrow">QUY TẮC "3 TRƯỚC THẦY"</p>
      <h2>🧰 Bảng lỗi thường gặp</h2>
      <p class="muted">① Đọc thông báo lỗi → ② tìm trong bảng này → ③ hỏi bạn bên cạnh. Kẹt quá 3 phút thì giơ tay.</p>
      <div class="table-wrap"><table class="error-table">
        <thead><tr><th>Thông báo / dấu hiệu</th><th>Nguyên nhân</th><th>Cách sửa</th></tr></thead>
        <tbody>${L.errorTable.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</tbody>
      </table></div>
    </div>
  </dialog>
  <dialog id="typeDialog" class="modal type-modal">
    <form method="dialog" class="modal-card type-card">
      <div class="type-bit">${bitSvg("wow")}</div>
      <h2>Ối, bạn ơi! ✋</h2>
      <p>Mình không cho sao chép hay dán code đâu nè. Bạn <strong>tự gõ từng dòng</strong> nhé —
        gõ tay giúp bạn nhớ lệnh và nhanh tay hơn. Sai chỗ nào mình chỉ cho!</p>
      <button class="primary-button wide" type="submit">OK, mình tự gõ 💪</button>
    </form>
  </dialog>
  <dialog id="certDialog" class="modal certificate-modal">
    <div class="modal-card certificate-card">
      <button class="icon-button close-button" type="button" data-close>×</button>
      <p class="eyebrow">BOSS ĐÃ BỊ HẠ GỤC</p>
      <h2>Chứng chỉ Bài ${L.number} 🎓</h2>
      <p>Lưu ảnh PNG rồi nộp lên Canvas.</p>
      <canvas id="certCanvas" width="1600" height="1131" aria-label="Chứng chỉ"></canvas>
      <div class="certificate-actions">
        <button id="savePng" class="primary-button" type="button">⬇ Lưu PNG</button>
        <button id="printPdf" class="secondary-button" type="button">🖨 In / Lưu PDF</button>
        <a id="canvasLink" class="secondary-button hidden" href="#" target="_blank" rel="noopener">↗ Mở Canvas để nộp</a>
      </div>
    </div>
  </dialog>`;
}

/* ---------- bản đồ ---------- */
function stepProgress(step) {
  if (step.kind === "gate") return "";
  const req = step.challenges.filter(c => !c.advanced && !c.bonus);
  return `${req.filter(c => state.passed[c.id]).length}/${req.length}`;
}
function renderMap() {
  const map = $("#journeyMap");
  map.innerHTML = `<div class="study-mode"><button id="studyMode" class="secondary-button">${selfStudy()?"Học theo lớp":"Tự học / học bù"}</button><span>Mọi chặng đều mở. Trên lớp, dừng theo hướng dẫn của giáo viên.</span></div><div class="map-track">${STEPS.map((step, i) => {
    const unlocked = stepUnlocked(i), done = stepDone(step), active = state.active === step.id;
    const icon = step.kind === "gate" ? (done ? "🔓" : "⏸") : step.kind === "boss" ? "👾" : done ? "✓" : step.number;
    const cls = ["map-node", step.kind, done ? "done" : "", active ? "active" : "", unlocked ? "" : "locked"].join(" ");
    const prog = unlocked && !done && step.kind !== "gate" ? `<span class="node-prog">${stepProgress(step)}</span>` : "";
    return `${i ? `<span class="map-link ${unlocked ? "lit" : ""}"></span>` : ""}
      <button class="${cls}" type="button" data-step="${step.id}" ${unlocked ? "" : "disabled"}>
        <span class="node-dot">${unlocked ? icon : "🔒"}${prog}</span>
        <span class="node-label">${esc(step.nav)}</span>
      </button>`;
  }).join("")}</div>`;
  $("#studyMode").onclick=()=>{state.navigationMode=selfStudy()?"guided":"self-study";save();renderAll(true)};
  $$(".map-node", map).forEach(btn => btn.addEventListener("click", () => go(btn.dataset.step)));
  const act = $(".map-node.active", map);
  if (act) map.scrollLeft = act.offsetLeft - (map.clientWidth - act.offsetWidth) / 2;
}

function go(stepId) {
  state.active = stepId;
  save();
  renderAll(true);
  window.scrollTo({ top: 0, behavior: "instant" });
}

function updateTop() {
  $("#xpPill").textContent = `⚡ ${state.xp} XP` + (state.combo >= 2 ? ` · 🔥x${state.combo}` : "");
  $("#studentText").textContent = `${state.student.name} · ${state.student.className}`;
  $("#soundBtn").textContent = soundOn() ? "🔊" : "🔇";
}

/* ---------- khối Scratch (scratchblocks, tiếng Việt) ---------- */
function renderScratch(root) {
  const sb = window.scratchblocks;
  if (sb && sb.appendStyles && !renderScratch.styled) { sb.appendStyles(); renderScratch.styled = true; }
  $$("pre.sb", root).forEach(pre => {
    if (!sb) { pre.classList.add("sb-fallback"); return; }
    try {
      const doc = sb.parse(pre.textContent, { languages: ["en"] });
      if (sb.allLanguages && sb.allLanguages.vi) doc.translate(sb.allLanguages.vi);
      const svg = sb.render(doc, { style: "scratch3", scale: 0.95 });
      svg.classList.add("sb-svg");
      pre.replaceWith(svg);
    } catch { pre.classList.add("sb-fallback"); }
  });
}

/* ---------- trang từng bước ---------- */
function renderAll(entering = false) {
  CppTerminal.stopAll("Đã dừng vì bạn chuyển chặng."); CppRun.stop();
  const idx = STEPS.findIndex(s => s.id === state.active);
  if (idx < 0 || !stepUnlocked(idx)) {
    const last = [...STEPS].reverse().find(s => stepUnlocked(STEPS.indexOf(s)));
    state.active = last.id;
  }
  if (allRequiredDone() && !state.completedAt) {
    state.completedAt = new Date().toISOString();
    saveBadge(); save();
  }
  updateTop();
  renderMap();
  const step = activeStep();
  if (step.kind === "gate") renderGate(step); else renderStage(step);
  renderScratch($("#stepContainer"));
  if (entering || !bitLast) {
    const msg = step.kind === "gate"
      ? (stepDone(step) ? "Đã mở khoá! Đi tiếp thôi bạn ơi." : "Dừng lại một chút nhé! Nhìn lên bảng, nghe thầy chốt rồi cùng luyện tập với bạn bên cạnh.")
      : step.bit;
    if (msg) bitSay(msg, step.kind === "boss" ? "wow" : "happy", 8000);
  }
}

function renderStage(step) {
  if (step.flow) return renderFlow(step);
  const isBoss = step.kind === "boss";
  const idx = STEPS.indexOf(step);
  const next = STEPS[idx + 1];
  const required = step.challenges.filter(c => !c.advanced && !c.bonus);
  const advanced = step.challenges.filter(c => c.advanced);
  const footer = `<div class="stage-footer">
    <div class="stage-complete-note" id="stageNote" role="status"></div>
    ${next ? `<button id="nextBtn" class="primary-button big" type="button">${nextLabel(next)}</button>`
           : `<button id="certBtn" class="certificate-button" type="button">🏆 Nhận chứng chỉ bạc</button>`}
  </div>`;
  $("#stepContainer").innerHTML = `
  <article class="stage-page ${isBoss ? "boss-stage" : ""}" data-stage="${esc(step.id)}">
    <header class="stage-hero">
      <div class="stage-kicker">${esc(step.kicker)}</div>
      <h2>${esc(step.title)}</h2>
      ${step.objectives ? `<div class="stage-objectives">${step.objectives.map(o => `<span>🎯 ${esc(o)}</span>`).join("")}</div>` : ""}
    </header>
    <div class="lesson-body ${isBoss ? "boss-layout" : ""}">
      ${isBoss ? `<aside class="boss-sidebar" aria-label="Tiến độ Boss">${bossDock(step)}</aside><div class="boss-work">` : (step.lesson || "")}
      <section class="challenge-section">
        <h3 class="section-heading"><span class="doodle">${isBoss ? "👾" : "⚡"}</span>${isBoss ? "Hạ BOSS" : "Nhiệm vụ của chặng"}
          <span class="section-count">${isBoss ? "Bạc: " : ""}${required.filter(c => state.passed[c.id]).length}/${required.length} xong</span></h3>
        <div class="challenge-list">${required.map(renderChallenge).join("")}</div>
      </section>
      ${isBoss ? footer : ""}
      ${advanced.length ? `<section class="challenge-section advanced-section">
        <h3 class="section-heading"><span class="doodle">🥇</span>Nâng cao — tùy chọn để nhận chứng chỉ vàng</h3>
        <p class="advanced-note">Phần này không bắt buộc để hạ Boss hoặc nhận chứng chỉ bạc.</p>
        <div class="challenge-list">${advanced.map(renderChallenge).join("")}</div>
      </section>` : ""}
      ${isBoss ? "</div>" : footer}
    </div>
  </article>`;
  const media=document.createElement("div");$("#stepContainer .challenge-section").before(media);CPPMedia.mount(media,L.media,step.id);
  step.challenges.filter(c=>!c.waitingBank).forEach(bindChallenge);mountWaitingBank(step);
  $("#nextBtn")?.addEventListener("click", () => { if (stepDone(step)) go(next.id); });
  $("#certBtn")?.addEventListener("click", openCertificate);
  const bossToggle = $(".boss-toggle");
  bossToggle?.addEventListener("click", () => {
    const expanded = bossToggle.getAttribute("aria-expanded") !== "true";
    bossToggle.setAttribute("aria-expanded", String(expanded));
    $("#bossDock").dataset.expanded = String(expanded);
    bossToggle.textContent = expanded ? "Thu gọn Boss" : "Hiện Boss";
  });
  refreshFooter(step);
  if (isBoss) bossBatDau(step);
}

/* ---------- chặng theo PRIMM: mỗi phần một tab. Làm xong phần đang mở thì nút "Tiếp" ở cuối tab sáng lên;
   tab sau chỉ mở khi xong tab trước. Hết chặng mới có nút sang chặng sau. ---------- */
function screenTasks(step, sc) { return (sc.tasks || []).map(id => step.challenges.find(c => c.id === id)).filter(Boolean); }
function screenDone(step, sc) { return screenTasks(step, sc).filter(c => !c.advanced && !c.bonus).every(c => state.passed[c.id]); }
function flowReach(step) { let i = 0; while (i < step.flow.length - 1 && screenDone(step, step.flow[i])) i++; return i; }
function flowAt(step) { state.screens = state.screens || {}; return Math.min(state.screens[step.id] ?? flowReach(step), flowReach(step)); }
function flowTab(step, k) {
  CppTerminal.stopAll("Đã dừng vì bạn chuyển phần học."); CppRun.stop();
  state.screens = state.screens || {}; state.screens[step.id] = k; save();
  flowRefresh(step);
  $(".flow-hero")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const sc = step.flow[k];
  if (sc.bit) bitSay(sc.bit, sc.stop ? "wow" : "happy", 8000);
}

function stopSummary(step) {
  const pred = step.challenges.filter(c => c.predict);
  const optText = o => (typeof o === "string" ? o : o.text);
  const firstTry = pred.filter(c => state.choices?.[c.id] != null && optText(c.options[state.choices[c.id]]) === c.answer).length;
  const req = step.challenges.filter(c => !c.advanced && !c.bonus && c.type !== "self");
  const self = step.challenges.find(c => c.type === "self"), lv = self?.levels || ["Chưa chắc", "Khá chắc", "Chắc chắn"];
  const got = self ? (state.self?.[self.id] || []) : [];
  return `<div class="stop-sum">
    ${pred.length ? `<span>🔮 Đoán đúng ngay lần đầu: <strong>${firstTry}/${pred.length}</strong></span>` : ""}
    <span>⭐ Nhiệm vụ: <strong>${req.filter(c => state.passed[c.id]).length}/${req.length}</strong></span>
    ${self ? self.items.map((t, i) => `<span class="lv-${got[i] || 0}">${t.replace(/<[^>]+>/g, "")}: <strong>${got[i] ? lv[got[i] - 1] : "—"}</strong></span>`).join("") : ""}
  </div>`;
}

function flowSection(step, k) {
  const sc = step.flow[k], tasks = screenTasks(step, sc);
  return `<section class="flow-screen ${sc.stop ? "flow-stop" : ""}" id="flow-sec-${k}" data-sec="${k}" hidden>
    <div class="flow-sec-head"><span class="flow-sec-no">${k + 1}</span><span class="flow-sec-label">${esc(sc.label)}</span></div>
    ${sc.title ? `<h3 class="flow-title">${sc.title}</h3>` : ""}
    ${sc.html || ""}
    ${sc.code && !tasks.some(t => t.type === "doanchay") ? `<div class="flow-split"><aside class="flow-code"><div class="flow-code-label">📌 Đoạn code dùng cho các câu bên cạnh</div><div class="flow-code-body">${codeLines(sc.code, sc.focus || [])}</div></aside>
      <div class="challenge-list">${tasks.map(renderChallenge).join("")}</div></div>`
      : tasks.length ? `<div class="challenge-list">${tasks.map(renderChallenge).join("")}</div>` : ""}
    ${sc.stop ? `<div class="stop-card hidden" id="stopCard"></div>` : ""}
  </section>`;
}

function renderFlow(step) {
  const reach = flowReach(step);
  step._shown = reach;
  state.screens = state.screens || {};
  // Lần đầu vào chặng: mở tab 1 (Bối cảnh). Vào lại bài: mở tab xa nhất đã tới.
  if (state.screens[step.id] == null) state.screens[step.id] = step.challenges.some(c => state.passed[c.id]) ? reach : 0;
  $("#stepContainer").innerHTML = `
  <article class="stage-page flow-page" data-stage="${esc(step.id)}">
    <header class="stage-hero flow-hero">
      <div class="stage-kicker">${esc(step.kicker)}</div>
      <h2>${esc(step.title)}</h2>
      ${step.objectives ? `<div class="flow-goal"><strong>🎯 Mục tiêu của chặng</strong><ul>${step.objectives.map(o => `<li>${esc(o)}</li>`).join("")}</ul></div>` : ""}
      <ol class="flow-steps flow-tabs" role="tablist">${step.flow.map((s, k) => `<li><button type="button" role="tab" data-screen="${k}">
        <span class="flow-dot">${k + 1}</span><span class="flow-name">${esc(s.label)}</span></button></li>`).join("")}</ol>
    </header>
    <div class="lesson-body flow-body" id="flowBody">
      ${step.flow.slice(0, reach + 1).map((_, k) => flowSection(step, k)).join("")}
    </div>
    <div class="flow-tabnav">
      <button type="button" class="secondary-button" data-flow="back">← Phần trước</button>
      <span class="flow-why" id="flowWhy"></span>
      <button type="button" class="primary-button big" data-flow="next">Tiếp →</button>
    </div>
  </article>`;
  step.flow.slice(0, reach + 1).forEach(sc => screenTasks(step, sc).forEach(bindChallenge));
  $$("[data-screen]").forEach(b => b.addEventListener("click", () => { if (!b.disabled) flowTab(step, Number(b.dataset.screen)); }));
  $('[data-flow="back"]').addEventListener("click", () => { const i = flowAt(step); if (i > 0) flowTab(step, i - 1); });
  $('[data-flow="next"]').addEventListener("click", () => { const i = flowAt(step); if (screenDone(step, step.flow[i]) && i < step.flow.length - 1) flowTab(step, i + 1); });
  flowRefresh(step);
}

function flowRefresh(step) {
  const reach = flowReach(step), last = step.flow.length - 1, next = STEPS[STEPS.indexOf(step) + 1];
  // Tab mới mở: thêm vào (ẩn), không vẽ lại tab cũ để giữ code học sinh đang gõ.
  if (reach > (step._shown ?? reach)) {
    const body = $("#flowBody");
    for (let k = step._shown + 1; k <= reach; k++) {
      body.insertAdjacentHTML("beforeend", flowSection(step, k));
      screenTasks(step, step.flow[k]).forEach(bindChallenge);
    }
    step._shown = reach;
    renderScratch($("#stepContainer"));
  }
  const i = flowAt(step), ok = screenDone(step, step.flow[i]);
  $$(".challenge-card[data-after]").forEach(el => el.classList.toggle("dc-locked", !state.passed[el.dataset.after]));
  $$(".flow-screen[data-sec]").forEach(sec => {
    const cards = $$(".challenge-card[data-dc]", sec);
    if (cards.length < 2) return;
    const ids = cards.map(el => el.dataset.card);
    if (sec.dataset.lap == null) { const k = ids.findIndex(id => !state.passed[id]); sec.dataset.lap = String(k < 0 ? 0 : k); }
    const cur = Number(sec.dataset.lap);
    let bar = $(".dc-laps", sec);
    if (!bar) { bar = document.createElement("div"); bar.className = "dc-laps"; cards[0].parentElement.before(bar); }
    bar.innerHTML = ids.map((id, i) => {
      const khoa = i > 0 && !state.passed[ids[i - 1]];
      const ten = (step.challenges.find(x => x.id === id)?.title || "Lần " + (i + 1)).split(" · ")[0];
      return `<button type="button" data-lap="${i}" class="${i === cur ? "on" : ""} ${state.passed[id] ? "done" : ""}" ${khoa ? "disabled" : ""}>${khoa ? "🔒 " : ""}${esc(ten)}${state.passed[id] ? " ✓" : ""}</button>`;
    }).join("");
    cards.forEach((el, i) => { el.hidden = i !== cur; });
    $$("button", bar).forEach(b => b.addEventListener("click", () => { if (b.disabled) return; sec.dataset.lap = b.dataset.lap; flowRefresh(step); }));
  });
  $$(".flow-screen[data-sec]").forEach(sec => { sec.hidden = Number(sec.dataset.sec) !== i; });
  $$("[data-screen]").forEach(b => {
    const k = Number(b.dataset.screen), done = k < reach || (k === last && stepDone(step));
    b.disabled = k > reach; b.classList.toggle("done", done); b.classList.toggle("now", k === i);
    b.setAttribute("aria-selected", k === i ? "true" : "false");
    $(".flow-dot", b).textContent = done ? "✓" : k + 1;
  });
  const back = $('[data-flow="back"]'), btn = $('[data-flow="next"]'), why = $("#flowWhy");
  if (back) back.disabled = i === 0;
  if (btn) {
    btn.hidden = i === last;
    btn.disabled = !ok;
    if (i < last) btn.textContent = `Tiếp: ${step.flow[i + 1].label} →`;
  }
  if (why) why.textContent = i === last ? "" : ok ? "✓ Xong phần này." : (step.flow[i].wait || "Làm xong các câu trong phần này để mở phần tiếp theo.");
  const stop = $("#stopCard");
  if (stop) {
    const done = screenDone(step, step.flow[last]);
    stop.classList.toggle("hidden", !done);
    stop.innerHTML = `<div class="stop-hand">✋</div><h3>Hết chặng — dừng ở đây</h3>
      <p><strong>Lời thầy:</strong> ${step.stopText || "Con hướng lên bảng để cả lớp cùng trao đổi. Chưa làm tiếp khi thầy chưa giao."}</p>
      ${stopSummary(step)}
      ${next && stepDone(step) ? `<button type="button" class="primary-button stop-next" data-stop-next>${next.kind === "boss" ? "Khi thầy cho phép: vào Chặng chứng chỉ 👾" : `Khi thầy cho phép: sang Chặng ${next.number} →`}</button>` : ""}`;
    $("[data-stop-next]", stop)?.addEventListener("click", () => { go(next.id); window.scrollTo({ top: 0 }); });
  }
}

function nextLabel(next) {
  return next.kind === "gate" ? "Đến điểm dừng ⏸" : next.kind === "boss" ? "Vào BOSS 👾" : `Sang Chặng ${next.number} →`;
}

/* ---------- BOSS 3D + hẹn giờ (góp ý thầy 19/10/2026) ----------
   Con boss dính ở đầu danh sách câu, đi theo khi cuộn. Đúng một câu: boss trúng đòn, mất máu, nói câu hài.
   Sai: boss cười trêu. Hết giờ: boss phá khung code, báo thua; làm lại thì rút bộ câu và bài code khác. */
const BOSS_KIEU = { 1: "bo", 2: "quai", 3: "rong", 4: "robot", 5: "trum", 6: "mach" };
const BOSS_LOI = {
  trung: ["Ối! Đòn đó trúng ngay chỗ hiểm rồi!", "Á á, sao bạn biết đáp án hay vậy?", "Khoan khoan, cho tôi thở cái đã!", "Ui da, đọc code kỹ thế à?"],
  truot: ["Hehe, trượt rồi! Đọc lại từng dòng xem nào.", "Ha ha, máy in khác kìa!", "Suýt nữa thì trúng. Thử lại đi!"],
  gap: ["Nhanh lên, đồng hồ sắp hết rồi đó!", "Còn chưa tới 2 phút, tôi sắp thắng rồi!"],
  thang: ["Được rồi, được rồi, tôi chịu thua! Bạn giỏi thật đấy.", "Choáng quá… Bạn thắng rồi, nhận chứng chỉ đi!"],
  thua: ["Hết giờ! Tôi phá khung code rồi nhé. Làm lại ván mới đi!", "Ha ha, ván này tôi thắng! Làm lại với bộ câu mới nào."]
};
let bossVat = null, bossDem = 0, bossTheo = null;
function bossReq(step) { return CppProgress.required(step); }
function bossHp(step) { return completionStatus().boss.hp; }
function bossXong(step) { return completionStatus().boss.completed; }
function bossGiay(step) { return Math.round((step.thoiGian || 12) * 60); }
function bossConLai(step) { return state.bossStartAt ? Math.max(0, bossGiay(step) - Math.floor((Date.now() - state.bossStartAt) / 1000)) : bossGiay(step); }
function bossLoi(step, loai) { const ds = step.bossLines?.[loai] || BOSS_LOI[loai]; return ds[Math.floor(Math.random() * ds.length)]; }
const mmss = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function bossDock(step) {
  const hp = bossHp(step), n = bossReq(step).length;
  return `<div class="boss-dock" id="bossDock" data-expanded="false">
    <div class="boss-3d" id="boss3d"></div>
    <div class="boss-info">
      <div class="boss-ten">${esc(step.bossName || "BOSS")}</div>
      <button type="button" class="boss-toggle small-button" aria-expanded="false" aria-controls="boss3d bossNoi">Hiện Boss</button>
      <div class="hp-label">Máu <strong id="hpText">${hp}%</strong><span class="boss-cau" id="bossCau">Câu 1/${n}</span></div>
      <div class="hp-track"><div class="hp-bar ${hp <= 34 ? "thap" : ""}" id="hpBar" style="width:${hp}%"></div></div>
      <div class="boss-gio" id="bossGio" ${bossXong(step) ? "hidden" : ""}>⏱ Còn <strong>${mmss(bossConLai(step))}</strong></div>
      <p class="boss-progress" id="bossProgress" role="status"></p>
      <details class="boss-missing" id="bossMissing"><summary id="bossMissingSummary">Nhiệm vụ còn thiếu</summary><ul id="bossMissingList"></ul></details>
      <div class="b3-noi" id="bossNoi"></div>
    </div>
  </div>`;
}

function bossBatDau(step) {
  clearInterval(bossDem); bossTheo?.disconnect();
  bossVat?.huy?.(); bossVat = null;
  const host = $("#boss3d");
  if (!host) return;
  bossVat = window.Boss3D ? window.Boss3D.mount(host, { kieu: step.bossKieu || BOSS_KIEU[L.number] || "quai", mau: step.bossMau }) : null;
  bossTheoCau(step);
  if (bossXong(step)) { bossVat?.thang(); bossVat?.noi(bossLoi(step, "thang")); return; }
  if (state.bossLost) { bossVat?.thua(); bossVat?.noi(bossLoi(step, "thua")); bossPha(step, false); return; }
  if (!state.bossStartAt) { state.bossStartAt = Date.now(); save(); }
  const phut = step.thoiGian || 12;
  bossVat?.noi(step.bossChao || `Tôi là ${esc(step.bossName || "BOSS")}. Bạn có <strong>${phut} phút</strong> để hạ tôi. Bắt đầu!`);
  let daGap = false;
  const tick = () => {
    if (!host.isConnected) { clearInterval(bossDem); return; }
    if (bossXong(step)) { clearInterval(bossDem); $("#bossGio")?.setAttribute("hidden", ""); bossVat?.gap(false); return; }
    const conLai = bossConLai(step), el = $("#bossGio");
    if (el) { $("strong", el).textContent = mmss(conLai); el.classList.toggle("gap", conLai <= 120); }
    if (conLai <= 120 && !daGap) { daGap = true; bossVat?.gap(true); bossVat?.noi(bossLoi(step, "gap")); }
    if (conLai <= 0) { clearInterval(bossDem); bossThua(step); }
  };
  tick(); bossDem = setInterval(tick, 1000);
}

// "Câu i/6": câu đang nằm giữa màn hình.
function bossTheoCau(step) {
  const cards = $$(".boss-stage .challenge-section:not(.advanced-section) .challenge-card"), nhan = $("#bossCau");
  if (!cards.length || !nhan || !("IntersectionObserver" in window)) return;
  bossTheo = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) nhan.textContent = `Câu ${cards.indexOf(e.target) + 1}/${cards.length}`;
  }), { rootMargin: "-35% 0px -55% 0px" });
  cards.forEach(c => bossTheo.observe(c));
}

function bossDanh(step, c) {
  if (c.advanced || c.bonus) return;
  bossVat?.dmg(Math.round(100 / bossReq(step).length));
  if (bossXong(step)) {
    clearInterval(bossDem); $("#bossGio")?.setAttribute("hidden", "");
    const currentBoss = bossVat;
    setTimeout(() => { if (state && currentBoss === bossVat && activeStep() === step) { bossVat?.gap(false); bossVat?.thang(); bossVat?.noi(bossLoi(step, "thang")); } }, 650);
  } else bossVat?.noi(bossLoi(step, "trung"));
}

function bossThua(step) {
  if (bossXong(step) || state.bossLost) return;
  state.bossLost = true; save();
  bossVat?.thua(); bossVat?.noi(bossLoi(step, "thua")); beep("bad");
  bossPha(step, true);
}

// Hết giờ: khung code rung rồi nứt vỡ, mọi ô làm bài bị khoá, hiện bảng thua + nút làm lại.
function bossPha(step, hieuUng) {
  CppTerminal.stopAll("Boss đã hết giờ. Chương trình được dừng và bài làm nháp được giữ."); CppRun.stop();
  $$(".boss-stage .challenge-card").forEach(card => {
    card.classList.add(hieuUng ? "bi-pha" : "da-pha");
    $$("input, textarea, select, button", card).forEach(x => { x.disabled = true; });
  });
  let box = $("#bossThuaBox");
  if (!box) { box = document.createElement("div"); box.id = "bossThuaBox"; box.className = "boss-thua"; $("#bossDock")?.after(box); }
  box.innerHTML = `<div class="boss-thua-icon">⏰</div>
    <h3>Hết giờ! ${esc(step.bossName || "BOSS")} thắng ván này</h3>
    <p>Khung code đã bị phá. Bạn làm lại với <strong>bộ câu hỏi mới</strong> và <strong>bài code mới</strong>. Đồng hồ chạy lại từ đầu.</p>
    <button type="button" class="primary-button big" id="bossLamLai">🔁 Làm lại với bộ câu mới</button>`;
  $("#bossLamLai").addEventListener("click", () => bossLamLai(step));
  if (hieuUng) setTimeout(() => box.scrollIntoView({ behavior: "smooth", block: "center" }), 900);
}

async function bossLamLai(step) {
  const btn = $("#bossLamLai"); if (btn) { btn.disabled = true; btn.textContent = "Đang rút bộ câu mới…"; }
  for (const c of step.challenges) {
    delete state.passed[c.id]; delete state.attempts[c.id]; delete state.drafts[c.id]; delete state.inputs[c.id];
    if (state.choices) delete state.choices[c.id];
  }
  state.bossTry = (state.bossTry || 0) + 1;
  delete state.bossStartAt; delete state.bossLost;
  save();
  try { await CppCloud.flush?.(); } catch { /* vẫn tải lại */ }
  location.reload();
}

function bossBar(step) {
  const req = step.challenges.filter(c => !c.advanced && !c.bonus);
  const hit = req.filter(c => state.passed[c.id]).length;
  const hp = Math.round(100 * (1 - hit / req.length));
  return `<div class="boss-hp"><span class="boss-face">👾</span>
    <div class="hp-wrap"><div class="hp-label">${esc(step.bossName || "BOSS")} · máu <strong id="hpText">${hp}%</strong></div>
    <div class="hp-track"><div class="hp-bar" id="hpBar" style="width:${hp}%"></div></div></div></div>`;
}

function refreshFooter(step) {
  const note = $("#stageNote");
  const done = stepDone(step);
  const next = $("#nextBtn");
  if (next) next.disabled = !done;
  const req = step.challenges.filter(c => !c.advanced && !c.bonus);
  const cnt = $(".section-count");
  if (cnt) cnt.textContent = `${step.kind === "boss" ? "Bạc: " : ""}${req.filter(c => state.passed[c.id]).length}/${req.length} xong`;
  if (step.kind === "boss") {
    const progress = completionStatus(), { hp, done: hit, total } = progress.boss;
    if ($("#hpBar")) { $("#hpBar").style.width = `${hp}%`; $("#hpText").textContent = `${hp}%`; $("#hpBar").classList.toggle("thap", hp <= 34); }
    const cert = $("#certBtn");
    if (cert) { cert.disabled = !progress.completed; cert.textContent = progress.gold ? "🥇 Nhận chứng chỉ vàng" : "🏆 Nhận chứng chỉ bạc"; }
    if (note) note.textContent = progress.completed
      ? (progress.gold ? "Đã đạt chứng chỉ vàng. Bạn có thể lưu và nộp." : "Đã đạt chứng chỉ bạc! Bạn có thể nhận ngay, không cần làm phần nâng cao.")
      : progress.boss.completed ? "Đã hạ Boss. Hoàn thành các nhiệm vụ còn thiếu ở chặng trước để nhận bạc." : `Còn ${total - hit} nhiệm vụ bắt buộc để hạ Boss. Phần vàng là tùy chọn.`;
    const label = $("#bossProgress"), missing = $("#bossMissing"), list = $("#bossMissingList");
    if (label) label.textContent = progress.completed ? (progress.gold ? "Đã đạt vàng" : "Đã đạt bạc · vàng là tùy chọn") : `Bạc: ${hit}/${total} nhiệm vụ Boss`;
    const remaining = progress.boss.completed ? progress.missing : progress.boss.missing;
    if (missing) missing.hidden = remaining.length === 0;
    if (list) list.innerHTML = remaining.map(c => `<li>${esc(c.stage === step.id ? c.title : c.stageTitle + ": " + c.title)}</li>`).join("");
    if (progress.boss.completed) { clearInterval(bossDem); $("#bossGio")?.setAttribute("hidden", ""); }
    window.dispatchEvent(new Event("cpp-progress-change"));
    return;
  }
  if (note) note.textContent = done ? "⭐ Hoàn thành chặng!" : "Làm xong các nhiệm vụ ở trên là bạn đi tiếp được nhé!";
}

function renderGate(step) {
  const done = stepDone(step);
  const next = STEPS[STEPS.indexOf(step) + 1];
  $("#stepContainer").innerHTML = `
  <article class="stage-page gate-page">
    <div class="gate-hero ${done ? "open" : ""}">
      <div class="gate-icon">${done ? "🔓" : "⏸"}</div>
      <div>
        <div class="stage-kicker">${esc(step.kicker)}</div>
        <h2>${done ? "Đã mở khoá!" : "DỪNG LẠI — NHÌN LÊN BẢNG"}</h2>
        <p>${done ? "Bạn đi tiếp được rồi." : "Cả lớp cùng dừng ở đây. Đừng làm tiếp một mình nhé."}</p>
      </div>
    </div>
    <div class="lesson-body">
      <ol class="gate-steps">${(selfStudy()?["Tự tóm tắt kiến thức vừa học bằng lời của bạn.","Chạy lại ví dụ và đối chiếu kết quả; nếu cần, chọn một bài trong xưởng thử thách.","Ghi câu hỏi chưa hiểu để hỏi giáo viên trong buổi kế tiếp.","Tiếp tục học mà không cần mã đồng bộ; nhiệm vụ chính vẫn phải hoàn thành thật."]:step.todo).map((t, i) => `<li><span>${i + 1}</span><div>${t}</div></li>`).join("")}</ol>
      <div class="unlock-box">
        ${done || selfStudy()
          ? `<button id="gateNext" class="primary-button big" type="button">${nextLabel(next)}</button>`
          : `<label for="gateCode"><strong>🔑 Mã mở khoá</strong> <span class="muted">(thầy hiện trên slide sau phần luyện tập)</span></label>
             <div class="unlock-row"><input id="gateCode" type="text" autocomplete="off" placeholder="Nhập mã…" maxlength="20" />
             <button id="gateBtn" class="primary-button" type="button">Mở khoá</button></div>
             <div id="gateMsg" class="result-line hidden" role="status"></div>`}
      </div>
      ${step.challenges && step.challenges.length ? `
      <section class="challenge-section bonus-section">
        <h3 class="section-heading"><span class="doodle">🎁</span>Trong lúc chờ: nhiệm vụ phụ (không bắt buộc, +XP)</h3>
        <div class="challenge-list">${step.challenges.filter(c=>!c.waitingBank).map(renderChallenge).join("")}</div>
      </section>` : ""}
    </div>
  </article>`;
  step.challenges?.filter(c=>!c.waitingBank).forEach(bindChallenge);
  mountWaitingBank(step);
  $("#gateNext")?.addEventListener("click", () => go(next.id));
  const tryCode = () => {
    if (codeHash($("#gateCode").value) === step.codeHash) {
      state.gates[step.id] = true;
      save(); beep("unlock"); confetti(null, true);
      renderAll(true);
    } else {
      const m = $("#gateMsg");
      m.className = "result-line bad"; m.textContent = "❌ Mã chưa đúng. Chờ thầy hiện mã trên slide nhé.";
      bitSay("Mã này chưa đúng rồi. Chờ thầy hiện mã trên slide nhé!", "sad", 5000);
      beep("bad");
    }
  };
  $("#gateBtn")?.addEventListener("click", tryCode);
  $("#gateCode")?.addEventListener("keydown", e => { if (e.key === "Enter") tryCode(); });
}

/* ---------- nhiệm vụ ---------- */

function mountWaitingBank(step){
 const tasks=(step.challenges||[]).filter(c=>c.waitingBank);if(!tasks.length)return;
 const area=document.createElement("section");area.className="waiting-bank";area.innerHTML=`<h3>🚀 Xưởng thử thách trong lúc chờ</h3><p>Ưu tiên nhiệm vụ chính. Khi đã làm xong, chọn một bài phù hợp; không cần hoàn thành cả ngân hàng. Khi thầy chốt kiến thức, hãy dừng và nghe hướng dẫn.</p><label class="field">Chọn thử thách<select id="waiting-task">${tasks.map(c=>`<option value="${esc(c.id)}">${esc(c.tier)} · ${c.minutes} phút · ${esc(c.title)}${state.passed[c.id]?" ✓":""}</option>`).join("")}</select></label><div id="waiting-card"></div>`;$("#stepContainer article").append(area);
 const select=area.querySelector('select'),holder=area.querySelector('#waiting-card');select.value=tasks.some(c=>c.id===state.waitingChoice[step.id])?state.waitingChoice[step.id]:tasks[0].id;
 const filter=document.createElement('label');filter.className='field';filter.innerHTML=`Lọc độ khó<select id="waiting-tier"><option value="">Tất cả mức</option>${[...new Set(tasks.map(c=>c.tier))].map(t=>`<option>${esc(t)}</option>`).join('')}</select>`;area.insertBefore(filter,select.closest('label'));
 const skills=document.createElement('p');skills.textContent='Kĩ năng của bài: '+L.skills.join(' · ');area.insertBefore(skills,filter);
 const show=()=>{state.waitingChoice[step.id]=select.value;save();const c=tasks.find(c=>c.id===select.value);if(c){holder.innerHTML=renderChallenge(c);bindChallenge(c)}};select.onchange=show;
 filter.querySelector('select').onchange=e=>{const filtered=tasks.filter(c=>!e.target.value||c.tier===e.target.value),old=select.value;select.innerHTML=filtered.map(c=>`<option value="${esc(c.id)}">${esc(c.tier)} · ${c.minutes} phút · ${esc(c.title)}${state.passed[c.id]?" ✓":""}</option>`).join('');select.value=filtered.some(c=>c.id===old)?old:filtered[0].id;show()};show();
}

function renderChallenge(c) {
  const passed = Boolean(state.passed[c.id]);
  const tag = c.waitingBank ? "🚀 "+c.tier : c.bonus ? "+XP" : c.advanced ? "🥇 NÂNG CAO" : "1 SAO";
  let body = "", actions = "";

  if (c.type === "choice") {
    const opts = c.options.map(o => (typeof o === "string" ? { text: o } : o));
    body = `
      ${c.code ? (c.numbered || c.focus ? codeLines(c.code, c.focus, c.input) : codeBlock(c.code, c.input)) : ""}
      ${c.bet && !passed && !state.attempts[c.id] ? starRow(c) : ""}
      <div class="choice-grid ${c.mono ? "mono-grid" : ""} ${c.screens ? "screen-grid" : ""}">${opts.map((o, i) => `
        <label class="choice-option ${c.screens ? "screen-option" : ""} ${c.predict && state.choices?.[c.id] === i ? "guess" : ""}"><input type="radio" name="${c.id}" value="${i}" ${c.predict && state.choices?.[c.id] != null ? `disabled ${state.choices[c.id] === i ? "checked" : ""}` : ""} />
        ${c.screens ? `<span class="opt-name">Màn hình ${"ABCDEF"[i]}</span><span class="opt-screen">${esc(o.text) || "&nbsp;"}</span>`
          : `<span class="${c.mono ? "mono" : ""}">${c.predict ? `<strong>${"ABCDEF"[i]}.</strong> ` : ""}${esc(o.text)}</span>`}</label>`).join("")}</div>`;
    actions = `<button class="primary-button" data-act="choice" type="button">Kiểm tra đáp án</button>`;
  }

  if (c.type === "sequence") {
    const items = c.shuffle || c.answer;
    body = `
      <div class="seq-wrap">
        <div><div class="mini-label">Các dòng (bấm theo thứ tự)</div>
          <div class="sequence-pool">${items.map((it, i) => `<button type="button" class="sequence-button ${c.mono ? "mono" : ""}" data-i="${i}">${esc(it)}</button>`).join("")}</div></div>
        <div><div class="mini-label">Chương trình của bạn</div>
          <div class="sequence-answer ${c.mono ? "as-code" : ""}" aria-live="polite"><span class="muted">Chưa có dòng nào.</span></div></div>
      </div>`;
    actions = `<button class="primary-button" data-act="seq-check" type="button">Kiểm tra</button>
      <button class="secondary-button" data-act="seq-undo" type="button">↶ Bỏ dòng cuối</button>
      <button class="secondary-button" data-act="seq-reset" type="button">Làm lại</button>`;
  }

  if (c.type === "code") {
    const draft = state.drafts[c.id] ?? c.starter;
    const tests = c.tests || [{ input: "", expected: c.expected }];
    const target = tests.length > 1
      ? `<table class="test-table"><tr><th>Nhập</th><th>Màn hình cần đạt</th></tr>
          ${tests.map(t => `<tr><td><code>${esc(t.input || "(không)")}</code></td><td><pre>${esc(t.expected)}</pre></td></tr>`).join("")}</table>`
      : `<pre class="expected-output">${esc(tests[0].expected)}</pre>`;
    body = `
      ${c.card ? taskCard(c.card) : `<div class="task-grid">
        <div class="requirement-box">
          <div class="requirement-title">🎯 BIT NHỜ BẠN</div>
          <ul>${(c.requirements || []).map(r => `<li>${esc(r)}</li>`).join("")}</ul>
        </div>
        <div class="target-box"><div class="expected-label">${tests.length > 1 ? "Các test case" : "Màn hình Bit cần thấy"}${tests[0].input && tests.length === 1 ? ` (nhập <code>${esc(tests[0].input)}</code>)` : ""}</div>${target}</div>
      </div>`}
      ${c.bugs ? `<div class="bug-board">${c.bugs.map((b, i) => `<span class="bug" data-bug="${i}">🐛 <small>${esc(b.label)}</small></span>`).join("")}</div>` : ""}
      <div class="code-lab">
        <div class="editor-shell">
          <div class="editor-toolbar"><span>main.cpp</span>
            <button type="button" class="small-button" data-act="reset-code">↺ Code ban đầu</button></div>
          <div class="editor-body"><pre class="gutter" aria-hidden="true"></pre>
          <textarea class="code-editor" wrap="off" spellcheck="false" aria-label="Trình soạn thảo C++">${esc(draft)}</textarea></div>
        </div>
        <div class="console-shell">
          <div class="console-toolbar"><span>🖥 MÀN HÌNH</span></div>
          <div class="console-output">Bấm “▶ Chạy” để xem.</div>
        </div>
      </div>`;
    actions = `<button class="secondary-button" data-act="run" type="button">▶ Chạy</button>
      <button class="primary-button" data-act="check" type="button">⭐ Kiểm tra test case & nhận sao</button>`;
  }

  if (c.type === "truefalse") {
    body = `${c.code ? codeLines(c.code, c.focus, c.input) : ""}
      <div class="tf-list">${c.items.map((it, i) => `<div class="tf-row" data-i="${i}"><span class="tf-text">${it.text}</span>
        <span class="tf-btns"><button type="button" class="tf-btn" data-v="1">Đúng</button><button type="button" class="tf-btn" data-v="0">Sai</button></span></div>`).join("")}</div>`;
    actions = `<button class="primary-button" data-act="tf" type="button">Kiểm tra</button>`;
  }

  if (c.type === "fill") {
    const color = window.CppSyntax ? window.CppSyntax.color : esc;
    const parts = c.template.split(/\[\[(\d+)\]\]/);
    const html = parts.map((p, i) => {
      if (i % 2 === 0) return color(p);
      const b = c.blanks[Number(p)], w = Math.max(3, b.width || Math.max(...b.answers.map(a => a.length)) + 1);
      return b.options
        ? `<select class="fill-in" data-b="${p}" aria-label="Chỗ trống ${Number(p) + 1}"><option value="">…</option>${b.options.map(o => `<option>${esc(o)}</option>`).join("")}</select>`
        : `<input class="fill-in" data-b="${p}" style="width:${w + 1}ch" autocomplete="off" spellcheck="false" autocapitalize="off" aria-label="Chỗ trống ${Number(p) + 1}" />`;
    }).join("");
    body = `<div class="code-demo fill-demo"><div class="code-demo-header"><span><span class="window-dots">● ● ●</span> &nbsp; Điền vào chỗ trống</span><span>main.cpp</span></div><pre class="fill-code cpp-syntax">${html}</pre></div>
      ${c.screen != null ? `<div class="screen-card fill-screen"><div class="screen-head">🖥 MÀN HÌNH CẦN CÓ</div><pre>${esc(c.screen)}</pre></div>` : ""}`;
    actions = `<button class="primary-button" data-act="fill" type="button">Kiểm tra</button>`;
  }

  if (c.type === "parsons") {
    const items = shuffled([...c.lines.map((t, k) => ({ t, k })), ...(c.distractors || []).map((d, j) => ({ t: d.text, k: "d" + j }))], c.id);
    body = `<div class="dnd-wrap">
        <div><div class="mini-label">Các dòng · kéo sang phải hoặc bấm vào dòng</div>
          <ul class="dnd-zone dnd-pool" data-zone="pool">${items.map(it => `<li class="dnd-item" draggable="true" data-k="${it.k}">${esc(it.t)}</li>`).join("")}</ul></div>
        <div><div class="mini-label">Chương trình của bạn · kéo lên xuống để đổi thứ tự</div>
          <ol class="dnd-zone dnd-answer" data-zone="answer"></ol></div>
      </div>`;
    actions = `<button class="primary-button" data-act="parsons" type="button">Kiểm tra</button>
      <button class="secondary-button" data-act="parsons-reset" type="button">Làm lại</button>`;
  }

  if (c.type === "match") {
    const chips = shuffled(c.pairs.map((p, r) => ({ t: p[1], r })), c.id);
    body = `<div class="match-grid">${c.pairs.map((p, i) => `<div class="match-row"><div class="match-left">${p[0]}</div><div class="match-slot dnd-zone" data-zone="slot" data-slot="${i}"><span class="slot-hint">Thả vào đây</span></div></div>`).join("")}</div>
      <div class="mini-label">Thẻ cần ghép · kéo vào ô hoặc bấm thẻ rồi bấm ô</div>
      <div class="match-pool dnd-zone" data-zone="mpool">${chips.map(ch => `<span class="match-chip" draggable="true" data-r="${ch.r}">${ch.t}</span>`).join("")}</div>`;
    actions = `<button class="primary-button" data-act="match" type="button">Kiểm tra</button>
      <button class="secondary-button" data-act="match-reset" type="button">Làm lại</button>`;
  }

  if (c.type === "line") {
    body = `${codeLines(c.code, [], c.input, true)}<p class="muted line-note">${c.answer.length > 1 ? `Bấm chọn đủ ${c.answer.length} dòng.` : "Bấm vào một dòng."}</p>`;
    actions = `<button class="primary-button" data-act="line" type="button">Kiểm tra</button>`;
  }

  if (c.type === "run") {
    body = `<div class="run-buttons">${c.runs.map((r, i) => `<button type="button" class="run-btn ${state.runs?.[c.id]?.[i] ? "ran" : ""}" data-run="${i}">▶ ${esc(r.label)}</button>`).join("")}</div>
      <div class="pair-view run-view"><div class="run-code">${codeLines(c.runs[0].code, [], c.runs[0].input)}</div>
        <div><div class="screen-card"><div class="screen-head">🖥 MÀN HÌNH</div><pre class="run-out">Bấm một nút ▶ ở trên để chạy.</pre></div>
        <div class="run-compare result-line hidden" role="status"></div></div></div>`;
  }

  if (c.type === "doanchay") {
    // Giao diện "phòng thí nghiệm" (thầy duyệt mẫu 19/10): code bên trái; bên phải là Đoán → Bộ nhớ + Màn hình + giải thích từng dòng.
    const opts = c.options.map(o => (typeof o === "string" ? { text: o } : o)), g = state.choices?.[c.id];
    const scr = c.screens !== false, real = Boolean(c.run && c.run.real), N = "ABCDEF";
    const coBoNho = dcTrace(c).some(t => t.mem);
    body = `
      <div class="dc-lab">
        <div class="dc-panel dc-left">
          <div class="dc-ph"><span>Chương trình · main.cpp</span>${c.input ? `<span>Dữ liệu nhập: ${esc(c.input).replace(/\n/g, " rồi ")}</span>` : ""}</div>
          <div class="run-code dc-code">${codeLines(c.code, c.focus || [], "")}</div>
          <div class="dc-controls">${real
            ? `<button type="button" class="dc-btn pri" data-act="dc-real" disabled>▶ Biên dịch và chạy</button>`
            : `<button type="button" class="dc-btn pri" data-act="dc-step" disabled>▶ Chạy từng dòng</button><button type="button" class="dc-btn sec" data-act="dc-all" disabled>⏭ Chạy hết</button>`}
            <button type="button" class="dc-btn sec" data-act="dc-reset" disabled>↺ Chạy lại</button></div>
        </div>
        <div class="dc-right">
          <div class="dc-panel dc-predict"><div class="dc-ph"><span>Bước 1 · Đoán</span></div><div class="dc-pbody">
            <p class="dc-ask">${c.ask || "Theo bạn, màn hình sẽ hiện gì?"}</p>
            <div class="dc-choices">${opts.map((o, i) => `
              <label class="choice-option dc-opt ${scr ? "screen-option" : ""}"><input type="radio" name="${c.id}" value="${i}" ${g != null ? `disabled ${g === i ? "checked" : ""}` : ""} />
                <span class="dc-letter">${N[i]}</span>${scr ? `<pre class="opt-screen">${esc(o.text) || "&nbsp;"}</pre>` : `<span class="dc-otext">${esc(o.text)}</span>`}</label>`).join("")}</div>
            <button type="button" class="dc-btn go" data-act="dc-lock" disabled>Chốt dự đoán và sang bước 2</button>
          </div></div>
          <div class="dc-runview hidden">
            <div class="dc-guess"></div>
            ${coBoNho ? `<div class="dc-panel dc-mem"><div class="dc-ph"><span>Bộ nhớ · các biến</span></div>
              <table><thead><tr><th>Tên biến</th><th>Kiểu</th><th>Giá trị</th></tr></thead><tbody></tbody></table>
              <div class="dc-empty">Chưa có biến nào. Bấm “Chạy từng dòng”.</div></div>` : ""}
            <div class="dc-panel"><div class="dc-ph"><span>Màn hình</span></div><div class="run-out dc-screen"></div></div>
            <div class="dc-explain"></div>
            <div class="run-compare result-line hidden" role="status"></div>
          </div>
        </div>
      </div>`;
  }

  if (c.type === "self") {
    const lv = c.levels || ["Chưa chắc", "Khá chắc", "Chắc chắn"], got = state.self?.[c.id] || [];
    body = `<div class="self-list">${c.items.map((t, i) => `<div class="self-row"><span>${t}</span><span class="self-lv">${lv.map((l, j) => `<button type="button" data-i="${i}" data-v="${j + 1}" class="${got[i] === j + 1 ? "pick" : ""}">${esc(l)}</button>`).join("")}</span></div>`).join("")}</div>`;
    actions = `<button class="primary-button" data-act="self" type="button">Lưu tự chấm</button>`;
  }

  const hints = c.hints || (c.hint ? [c.hint] : []);
  const hintBlock = hints.length && !passed
    ? `<button class="hint-btn" type="button" data-act="hint">🛟 Cần gợi ý?</button>` : "";

  return `
  <article class="challenge-card ${passed ? "passed" : ""} ${c.advanced ? "advanced" : ""} ${c.bonus ? "bonus" : ""}" data-card="${c.id}">
    <header class="challenge-header">
      <div class="challenge-title-wrap"><div class="challenge-icon">${passed ? "✅" : c.icon || "⭐"}</div>
        <div><h4>${esc(c.title)}</h4><p>${c.prompt}</p></div></div>
      <span class="challenge-badge">${passed ? "⭐ ĐÃ XONG" : tag}</span>
    </header>
    <div class="challenge-content">
      ${body}
      <div class="action-row">${actions}${hintBlock}</div>
      <div class="result-line hidden" data-result role="status"></div>
      <div class="hint-list" data-hints></div>
    </div>
  </article>`;
}

function codeBlock(code, input) {
  return `<div class="code-demo"><div class="code-demo-header"><span><span class="window-dots">● ● ●</span></span><span>main.cpp${input ? ` · nhập: ${esc(input)}` : ""}</span></div><pre><code>${esc(code)}</code></pre></div>`;
}

// Code có số dòng để câu hỏi chỉ thẳng vào "dòng 4"; focus = các dòng cần tô (đếm từ 1).
// Các bước chạy của "Đoán rồi chạy". Bài mới dùng c.trace; bài cũ dùng c.run.steps = [dòng, chữ in, nhãn, loại].
function dcTrace(c) {
  if (c.trace) return c.trace;
  return (c.run?.steps || []).map(([l, out, badge]) => ({ l, out: out || "", why: badge ? esc(badge) : "" }));
}

function codeLines(code, focus = [], input = "", pickable = false) {
  const color = window.CppSyntax ? window.CppSyntax.color : esc;
  return `<div class="code-demo numbered cpp-syntax ${pickable ? "pickable" : ""}"><div class="code-demo-header"><span><span class="window-dots">● ● ●</span></span><span>main.cpp${input ? ` · nhập: ${esc(input)}` : ""}</span></div>
    <div class="code-lines">${String(code).split("\n").map((ln, i) => `<div class="cl ${(focus || []).includes(i + 1) ? "focus" : ""}" data-line="${i + 1}" ${pickable ? `role="button" tabindex="0"` : ""}><i>${i + 1}</i><pre>${color(ln) || " "}</pre></div>`).join("")}</div></div>`;
}

// Thẻ nhiệm vụ chuẩn: bối cảnh, biến (khai báo, kiểu, ý nghĩa), nhập/câu dẫn, xử lý, xuất, test case kèm lý do chọn.
function taskCard(k) {
  const row = (label, html) => html ? `<div class="tc-row"><span class="tc-k">${label}</span><div class="tc-v">${html}</div></div>` : "";
  const vars = (k.bien || []).length
    ? `<table class="tc-vars"><tr><th>Khai báo</th><th>Kiểu</th><th>Ý nghĩa</th></tr>${k.bien.map(v => `<tr><td><code>${esc(v[0])}</code></td><td><code>${esc(v[1])}</code></td><td>${v[2]}</td></tr>`).join("")}</table>`
    : (k.bienText || "");
  return `<div class="task-card">
    <div class="tc-title">📋 THẺ NHIỆM VỤ</div>
    ${row("Bối cảnh", k.boiCanh)}${row("Biến cần dùng", vars)}${row("Nhập", k.nhap)}${row("Xử lý", k.xuLy)}${row("Xuất", k.xuat)}
    <table class="test-table tc-tests"><tr><th>Nhập</th><th>Màn hình mong đợi</th><th>Vì sao thử</th></tr>
      ${k.tests.map(t => `<tr><td><code>${esc(t.input || "(không nhập)")}</code></td><td><pre>${esc(t.expected)}</pre></td><td>${t.why || ""}</td></tr>`).join("")}</table>
    ${k.dat ? `<div class="tc-pass">✅ <strong>Đạt khi:</strong> ${k.dat}</div>` : ""}
  </div>`;
}

// Trộn cố định theo id để mỗi lần mở lại vẫn giữ thứ tự (không đổi chỗ khi học sinh tải lại trang).
function shuffled(arr, seedText) {
  let s = parseInt(hashText(String(seedText)), 16) || 1;
  const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* Kéo thả dùng chung (chuột + cảm ứng qua bấm): item kéo được vào các vùng .dnd-zone trong một thẻ. */
function dragInsert(zone, el, y) {
  const after = [...zone.children].filter(x => x !== el && x.matches(".dnd-item,.match-chip")).find(x => { const r = x.getBoundingClientRect(); return y < r.top + r.height / 2; });
  if (after) zone.insertBefore(el, after); else zone.append(el);
}
function enableDrag(card, onChange) {
  let dragged = null;
  card.addEventListener("dragstart", e => { const it = e.target.closest(".dnd-item,.match-chip"); if (!it) return; dragged = it; it.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", "x"); } catch { /* bỏ qua */ } });
  card.addEventListener("dragend", () => { dragged?.classList.remove("dragging"); dragged = null; $$(".dnd-zone", card).forEach(z => z.classList.remove("over")); });
  $$(".dnd-zone", card).forEach(zone => {
    zone.addEventListener("dragover", e => { if (!dragged) return; e.preventDefault(); zone.classList.add("over"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("over"));
    zone.addEventListener("drop", e => { if (!dragged) return; e.preventDefault(); zone.classList.remove("over"); onChange(dragged, zone, e.clientY); });
  });
}

// Ngôi sao hi vọng (như Đường lên đỉnh Olympia): chọn TRƯỚC khi trả lời, mỗi chặng 1 lần.
// Đúng ngay lần này: XP câu này ×2. Sai: −10 XP.
function stepOf(c) { return STEPS.find(s => (s.challenges || []).some(x => x.id === c.id)); }
function starRow(c) {
  const used = state.stars[stepOf(c).id];
  if (used || state.attempts[c.id] || state.passed[c.id]) return `<div class="star-row used">⭐ Chặng này bạn đã dùng Ngôi sao hi vọng rồi.</div>`;
  return `<div class="star-row" data-star>
    <button type="button" class="star-toggle" aria-pressed="false"><span class="star-icon">☆</span> Chọn Ngôi sao hi vọng</button>
    <span class="star-rule">Đúng ngay lần này: <strong>XP ×2</strong> · Sai: <strong>−${STAR_LOSS} XP</strong> · Mỗi chặng chỉ <strong>1 ngôi sao</strong></span>
  </div>`;
}

// Kết quả hiện NGAY DƯỚI NÚT bấm; Bit ở góc nói lời ngắn.
function result(card, type, msg, extraHtml = "") {
  const el = $("[data-result]", card);
  el.className = `result-line ${type}`;
  el.innerHTML = `<span class="result-icon">${type === "good" ? "✅" : type === "bad" ? "❌" : "💡"}</span><div class="result-text">${esc(msg)}${extraHtml}</div>`;
  el.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function bindChallenge(c) {
  const card = $(`[data-card="${c.id}"]`);
  if (!card) return;

  const hints = c.hints || (c.hint ? [c.hint] : []);
  let shown = 0;
  $('[data-act="hint"]', card)?.addEventListener("click", e => {
    if (shown >= hints.length) return;
    $("[data-hints]", card).insertAdjacentHTML("beforeend", `<div class="hint-item"><strong>Gợi ý ${shown + 1}:</strong> ${esc(hints[shown])}</div>`);
    shown++;
    e.target.textContent = shown < hints.length ? "🛟 Gợi ý rõ hơn" : "🛟 Hết gợi ý";
    e.target.disabled = shown >= hints.length;
  });

  if (c.type === "choice") {
    const starControl=HopeStars.nativeMount(card,state,stepOf(c).id,c.id,save);
    $('[data-act="choice"]', card).addEventListener("click", ev => {
      const sel = $(`input[name="${c.id}"]:checked`, card);
      if (!sel) return result(card, "info", "Chọn một đáp án trước nhé.");
      const opts = c.options.map(o => (typeof o === "string" ? { text: o } : o));
      const picked = opts[Number(sel.value)];
      const right = picked.text === c.answer;
      const starNow = starControl?.selected() && !state.passed[c.id] && !state.attempts[c.id] && !state.stars[stepOf(c).id];
      if (starNow) state.stars[stepOf(c).id] = c.id;
      if(starNow)delete state.starSelections[stepOf(c).id];
      $("[data-star]", card)?.remove();
      // Giữ lựa chọn đầu tiên để bước Chạy so lại với dự đoán.
      state.choices = state.choices || {};
      if (!(c.id in state.choices)) state.choices[c.id] = Number(sel.value);
      attempt(c.id);
      // Câu "Đoán" (PRIMM): chỉ ghi lại dự đoán, không chấm đúng/sai; bước Chạy sẽ so lại.
      if (c.predict) {
        $$(".choice-option", card).forEach(l => l.classList.remove("right", "wrong", "guess"));
        sel.closest(".choice-option").classList.add("guess");
        $$(`input[name="${c.id}"]`, card).forEach(i => { i.disabled = true; });
        return pass(c, card, "Đã ghi dự đoán. Sang phần Chạy thử để so lại.", ev.currentTarget);
      }
      $$(".choice-option", card).forEach(l => l.classList.remove("right", "wrong"));
      sel.closest(".choice-option").classList.add(right ? "right" : "wrong");
      if (right) pass(c, card, c.why || "Chính xác!", ev.currentTarget, starNow);
      else {
        let msg = picked.why || "Chưa đúng. Đọc lại phần giải thích phía trên rồi thử lại.";
        if (starNow) { state.xp = Math.max(0, state.xp - STAR_LOSS); msg += ` ⭐ Ngôi sao chưa thành công: −${STAR_LOSS} XP.`; }
        miss(card, msg);
      }
    });
  }

  if (c.type === "sequence") {
    const items = c.shuffle || c.answer;
    let picked = [];
    const box = $(".sequence-answer", card);
    const draw = () => {
      box.innerHTML = picked.length
        ? picked.map((i, n) => `<span class="picked ${c.mono ? "mono" : ""}">${c.mono ? "" : `${n + 1}. `}${esc(items[i])}</span>`).join("")
        : `<span class="muted">Chưa có dòng nào.</span>`;
      $$(".sequence-button", card).forEach(b => b.classList.toggle("selected", picked.includes(Number(b.dataset.i))));
    };
    $$(".sequence-button", card).forEach(btn => btn.addEventListener("click", () => {
      if (!picked.includes(Number(btn.dataset.i))) { picked.push(Number(btn.dataset.i)); draw(); }
    }));
    $('[data-act="seq-undo"]', card).addEventListener("click", () => { picked.pop(); draw(); });
    $('[data-act="seq-reset"]', card).addEventListener("click", () => { picked = []; draw(); $("[data-result]", card).classList.add("hidden"); });
    $('[data-act="seq-check"]', card).addEventListener("click", ev => {
      if (picked.length !== c.answer.length) return result(card, "info", "Chọn đủ tất cả các dòng nhé.");
      attempt(c.id);
      const order = picked.map(i => items[i]);
      const wrongAt = order.findIndex((v, i) => v !== c.answer[i]);
      if (wrongAt < 0) pass(c, card, c.why || "Đúng thứ tự!", ev.currentTarget);
      else miss(card, `Dòng thứ ${wrongAt + 1} chưa đúng chỗ. ${c.hintWrong || "Nghĩ xem dòng nào máy cần đọc trước."}`);
    });
  }

  if (c.type === "code") {
    const ed = $(".code-editor", card), gut = $(".gutter", card), out = $(".console-output", card);
    const terminal = CppTerminal.mount(out);
    const lock = () => {
      const buttons = [...card.querySelectorAll("button")].filter(b => !b.closest(".interactive-console"));
      const previous = buttons.map(b => b.disabled), readOnly = ed.readOnly;
      buttons.forEach(b => b.disabled = true); ed.readOnly = true;
      return () => { if (card.isConnected && state && !lockedByBoss() && CppCloud.allowed()) { buttons.forEach((b, i) => b.disabled = previous[i]); ed.readOnly = readOnly; } };
    };
    // Retain the starter's original editor size; longer drafts scroll inside it.
    ed.rows = Math.max(6, String(c.starter || "").split("\n").length + 1);
    ed.closest(".editor-body").style.setProperty("--cpp-editor-rows", ed.rows);
    const sync = () => {
      const n = ed.value.split("\n").length;
      gut.textContent = Array.from({ length: Math.max(n, ed.rows) }, (_, i) => i + 1).join("\n");
      updateBugs(c, card, ed.value);
    };
    sync();
    ed.addEventListener("input", () => { state.drafts[c.id] = ed.value; save(); sync(); result(card, "info", "Mã đã thay đổi. Bấm Kiểm tra test case để chấm lại."); });
    guardTyping(ed);
    // Chèn chữ bằng insertText để Ctrl+Z (hoàn tác) vẫn dùng được; xoá trước `back` ký tự nếu cần.
    const put = (text, back = 0) => {
      ed.setSelectionRange(ed.selectionStart - back, ed.selectionEnd);
      if (!document.execCommand("insertText", false, text)) {
        const s = ed.selectionStart;
        ed.value = ed.value.slice(0, s) + text + ed.value.slice(ed.selectionEnd);
        ed.selectionStart = ed.selectionEnd = s + text.length;
        ed.dispatchEvent(new Event("input"));
      }
    };
    const lineBefore = () => { const b = ed.value.slice(0, ed.selectionStart); return b.slice(b.lastIndexOf("\n") + 1); };
    // Gõ } ở đầu dòng: tự lùi lề 4 dấu cách
    ed.addEventListener("beforeinput", e => {
      if (e.inputType === "insertText" && e.data === "}" && ed.selectionStart === ed.selectionEnd && /^ {4,}$/.test(lineBefore())) {
        e.preventDefault(); put("}", 4);
      }
    });
    ed.addEventListener("keydown", e => {
      if (ed.readOnly) return;
      if (e.key === "Tab") { e.preventDefault(); put("    "); }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('[data-act="run"]', card).click(); return; }
      if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
        // Xuống dòng giữ lề dòng trên; sau dấu { thì thụt thêm 4 dấu cách (giống Programiz)
        e.preventDefault();
        const line = lineBefore();
        put("\n" + line.match(/^ */)[0] + (/\{\s*$/.test(line) ? "    " : ""));
      }
    });
    $('[data-act="reset-code"]', card).addEventListener("click", () => {
      ed.value = c.starter; state.drafts[c.id] = c.starter; save(); sync();
      terminal.reset("Đã trả về code ban đầu.");
    });
    $('[data-act="run"]', card).addEventListener("click", async () => {
      if(cppBusy||!CppCloud.allowed()||lockedByBoss())return;cppBusy=true;const unlock=lock(),code=ed.value;
      try {
        const invalid=frameError(code)||functionOrderError(code);
        const r=invalid?{ok:false,output:"",error:invalid}:await terminal.run(code,{min:c.inputSpec?.min,formatError:error=>/Output limit/.test(error)?"In quá nhiều dữ liệu. Giảm số lần lặp hoặc số dòng in.":friendlyError(error,code)});
        if(state&&CppCloud.allowed()&&card.isConnected&&!card.closest("[hidden]")&&!lockedByBoss()){
          if(invalid)showRun(out,r);
          if(r.ok){state.inputs[c.id]=r.input||"";save();}
          result(card,r.cancelled?"info":r.ok?"info":"bad",r.cancelled?r.error:r.ok?"Đã chạy xong. Bấm Kiểm tra test case để chấm mã C++.":r.error);
        }
      } finally {cppBusy=false;unlock();}
    });
    $(' [data-act="check"]'.trim(), card).addEventListener("click", async ev => {
      if(cppBusy||!CppCloud.allowed()||lockedByBoss())return;cppBusy=true;const unlock=lock();
      try {
      attempt(c.id);
      const v = await checkCode(c, ed.value);
      if(!state||!CppCloud.allowed()||!card.isConnected||card.closest("[hidden]")||lockedByBoss())return;
      showRun(out, v.run);
      if (v.ok) pass(c, card, v.msg, card.querySelector('[data-act="check"]')); else miss(card, v.msg);
      }finally{cppBusy=false;unlock();}
    });
  }

  if (c.type === "truefalse") {
    const pick = {};
    $$(".tf-row", card).forEach(row => $$(".tf-btn", row).forEach(b => b.addEventListener("click", () => {
      pick[row.dataset.i] = b.dataset.v === "1";
      $$(".tf-btn", row).forEach(x => x.classList.toggle("pick", x === b));
      row.classList.remove("ok", "no");
    })));
    $('[data-act="tf"]', card).addEventListener("click", ev => {
      if (c.items.some((_, i) => !(i in pick))) return result(card, "info", "Chọn Đúng hoặc Sai cho tất cả các câu nhé.");
      attempt(c.id);
      const wrong = c.items.filter((it, i) => pick[i] !== it.answer);
      $$(".tf-row", card).forEach(row => { const ok = pick[row.dataset.i] === c.items[row.dataset.i].answer; row.classList.toggle("ok", ok); row.classList.toggle("no", !ok); });
      if (!wrong.length) pass(c, card, c.why || "Đúng hết rồi!", ev.currentTarget);
      else miss(card, `Còn ${wrong.length} câu chưa đúng (tô đỏ). ${wrong[0].why || ""}`);
    });
  }

  if (c.type === "fill") {
    const norm = s => String(s).trim().replace(/\s+/g, " ");
    const fields = $$(".fill-in", card);
    fields.forEach(f => {
      f.addEventListener("input", () => f.classList.remove("ok", "no"));
      f.addEventListener("change", () => f.classList.remove("ok", "no"));
      if (f.tagName === "INPUT") ["paste", "drop"].forEach(ev => f.addEventListener(ev, e => { e.preventDefault(); noPasteMsg(); }));
    });
    $('[data-act="fill"]', card).addEventListener("click", ev => {
      if (fields.some(f => !f.value.trim())) return result(card, "info", "Điền đủ tất cả chỗ trống nhé.");
      attempt(c.id);
      const bad = fields.filter(f => {
        const ok = c.blanks[Number(f.dataset.b)].answers.map(norm).includes(norm(f.value));
        f.classList.toggle("ok", ok); f.classList.toggle("no", !ok); return !ok;
      });
      if (!bad.length) pass(c, card, c.why || "Điền đúng hết!", ev.currentTarget);
      else miss(card, `Còn ${bad.length} chỗ chưa đúng (tô đỏ). ${c.blanks[Number(bad[0].dataset.b)].why || ""}`);
    });
  }

  if (c.type === "parsons") {
    const pool = $(".dnd-pool", card), ans = $(".dnd-answer", card);
    const text = k => String(k).startsWith("d") ? c.distractors[Number(String(k).slice(1))].text : c.lines[Number(k)];
    const move = (el, zone, y) => {
      if (y == null) zone.append(el); else dragInsert(zone, el, y);
      $$(".dnd-item", card).forEach(x => x.classList.remove("ok", "no"));
      $("[data-result]", card).classList.add("hidden");
    };
    card.addEventListener("click", e => { const it = e.target.closest(".dnd-item"); if (it) move(it, it.parentElement === pool ? ans : pool); });
    enableDrag(card, move);
    $('[data-act="parsons-reset"]', card).addEventListener("click", () => $$(".dnd-item", ans).forEach(x => move(x, pool)));
    $('[data-act="parsons"]', card).addEventListener("click", ev => {
      const items = $$(".dnd-item", ans), keys = items.map(x => x.dataset.k);
      const noise = items.find(x => x.dataset.k.startsWith("d"));
      if (noise) {
        attempt(c.id); noise.classList.add("no");
        const d = c.distractors[Number(noise.dataset.k.slice(1))];
        return miss(card, `Dòng “${d.text.trim()}” là dòng gây nhiễu. ${d.why || ""}`);
      }
      if (keys.length !== c.lines.length) return result(card, "info", `Chương trình cần đủ ${c.lines.length} dòng. Bạn đang có ${keys.length} dòng.`);
      attempt(c.id);
      items.forEach((x, i) => { const ok = text(x.dataset.k) === c.lines[i]; x.classList.toggle("ok", ok); x.classList.toggle("no", !ok); });
      const wrongAt = keys.findIndex((k, i) => text(k) !== c.lines[i]);
      if (wrongAt < 0) pass(c, card, c.why || "Đúng thứ tự!", ev.currentTarget);
      else miss(card, `Dòng thứ ${wrongAt + 1} chưa đúng chỗ. ${c.hintWrong || "Nghĩ xem máy cần đọc dòng nào trước."}`);
    });
  }

  if (c.type === "match") {
    const pool = $(".match-pool", card); let picked = null;
    const tidy = () => $$(".match-slot", card).forEach(s => {
      s.classList.remove("ok", "no");
      if (!$(".match-chip", s) && !$(".slot-hint", s)) s.insertAdjacentHTML("afterbegin", '<span class="slot-hint">Thả vào đây</span>');
      if ($(".match-chip", s)) $(".slot-hint", s)?.remove();
    });
    const place = (chip, zone) => {
      if (zone.dataset.zone === "slot") { const old = $(".match-chip", zone); if (old && old !== chip) pool.append(old); zone.append(chip); }
      else pool.append(chip);
      chip.classList.remove("picked"); picked = null; tidy();
      $("[data-result]", card).classList.add("hidden");
    };
    card.addEventListener("click", e => {
      const chip = e.target.closest(".match-chip"), slot = e.target.closest(".match-slot");
      if (chip && chip.parentElement !== pool) return place(chip, pool);
      if (chip) { picked?.classList.remove("picked"); picked = picked === chip ? null : chip; chip.classList.toggle("picked", Boolean(picked)); return; }
      if (slot && picked) place(picked, slot);
    });
    enableDrag(card, (chip, zone) => place(chip, zone));
    $('[data-act="match-reset"]', card).addEventListener("click", () => $$(".match-slot .match-chip", card).forEach(ch => place(ch, pool)));
    $('[data-act="match"]', card).addEventListener("click", ev => {
      const slots = $$(".match-slot", card);
      if (slots.some(s => !$(".match-chip", s))) return result(card, "info", "Ghép đủ tất cả các ô nhé.");
      attempt(c.id);
      const bad = slots.filter(s => { const ok = $(".match-chip", s).dataset.r === s.dataset.slot; s.classList.toggle("ok", ok); s.classList.toggle("no", !ok); return !ok; });
      if (!bad.length) pass(c, card, c.why || "Ghép đúng hết!", ev.currentTarget);
      else miss(card, `Còn ${bad.length} cặp chưa đúng (tô đỏ). Bấm vào thẻ sai để trả về rồi ghép lại.`);
    });
  }

  if (c.type === "line") {
    const chosen = new Set(), multi = c.answer.length > 1;
    $$(".cl", card).forEach(el => {
      const toggle = () => {
        const n = Number(el.dataset.line);
        if (!multi && !chosen.has(n)) { chosen.clear(); $$(".cl", card).forEach(x => x.classList.remove("pick")); }
        if (chosen.has(n)) { chosen.delete(n); el.classList.remove("pick"); } else { chosen.add(n); el.classList.add("pick"); }
        $$(".cl", card).forEach(x => x.classList.remove("ok", "no"));
      };
      el.addEventListener("click", toggle);
      el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    });
    $('[data-act="line"]', card).addEventListener("click", ev => {
      if (!chosen.size) return result(card, "info", multi ? `Bấm chọn ${c.answer.length} dòng trước nhé.` : "Bấm chọn một dòng trước nhé.");
      attempt(c.id);
      $$(".cl.pick", card).forEach(x => { const ok = c.answer.includes(Number(x.dataset.line)); x.classList.toggle("ok", ok); x.classList.toggle("no", !ok); });
      const right = chosen.size === c.answer.length && c.answer.every(n => chosen.has(n));
      if (right) pass(c, card, c.why || "Chọn đúng rồi!", ev.currentTarget);
      else miss(card, c.wrongWhy || "Chưa đúng. Đọc lại câu hỏi rồi chọn lại.");
    });
  }

  if (c.type === "run") {
    const view = $(".run-code", card), out = $(".run-out", card), cmp = $(".run-compare", card);
    let busy = false;
    $$(".run-btn", card).forEach(btn => btn.addEventListener("click", async () => {
      if (busy) return; busy = true; $$(".run-btn", card).forEach(b => b.disabled = true);
      try {
        const r = c.runs[Number(btn.dataset.run)];
        view.innerHTML = codeLines(r.code, [], r.input);
        const lines = $$(".cl", view);
        out.textContent = ""; out.classList.remove("error"); cmp.className = "run-compare result-line hidden";
        if (r.real) {
          const res = await runCpp(r.code, r.input || "");
          out.textContent = res.ok ? (res.output || "(Chương trình chạy xong nhưng không in gì.)") : `⚠ LỖI\n${res.error}`;
          out.classList.toggle("error", !res.ok);
        } else {
          (r.skip || []).forEach(n => { lines[n - 1]?.classList.add("skip"); lines[n - 1]?.insertAdjacentHTML("beforeend", '<span class="cl-badge s">bỏ qua</span>'); });
          for (const [n, text, badge, kind] of r.steps) {
            const el = lines[n - 1]; if (!el) continue;
            el.classList.add("run");
            if (badge) el.insertAdjacentHTML("beforeend", `<span class="cl-badge ${kind || ""}">${esc(badge)}</span>`);
            if (text) out.textContent += text;
            await new Promise(res => setTimeout(res, 650));
            el.classList.remove("run"); el.classList.add("ran");
          }
          if (!out.textContent) out.textContent = "(Chương trình chạy xong nhưng không in gì.)";
        }
        state.runs = state.runs || {};
        (state.runs[c.id] = state.runs[c.id] || {})[btn.dataset.run] = true; save();
        btn.classList.add("ran");
        if (r.predict) {
          const guess = state.choices?.[r.predict.id], ans = r.predict.answer, N = "ABCDEF";
          const pc = L.steps.flatMap(s => s.challenges || []).find(x => x.id === r.predict.id);
          const what = pc?.screens ? "màn hình" : "phương án";
          cmp.className = "run-compare result-line " + (guess == null ? "info" : guess === ans ? "good" : "bad");
          cmp.innerHTML = guess == null ? `Kết quả đúng là <strong>${what} ${N[ans]}</strong>.`
            : guess === ans ? `Bạn đoán <strong>${what} ${N[guess]}</strong>. Máy chạy ra đúng như vậy. Khớp rồi! 🎉`
            : `Bạn đoán <strong>${what} ${N[guess]}</strong>, kết quả thật là <strong>${what} ${N[ans]}</strong>. ${esc(r.predict.why || "Nhìn lại các dòng vừa sáng lên để hiểu vì sao.")}`;
        }
        if (c.runs.every((_, i) => state.runs[c.id][i])) pass(c, card, c.why || "Bạn đã chạy đủ.", btn);
      } finally { busy = false; $$(".run-btn", card).forEach(b => b.disabled = false); }
    }));
  }

  if (c.type === "doanchay") {
    if (c.after) card.dataset.after = c.after;
    card.dataset.dc = "1";
    const N = "ABCDEF", scr = c.screens !== false, goi = scr ? "màn hình" : "phương án";
    const opts = c.options.map(o => (typeof o === "string" ? { text: o } : o)), ans = opts.findIndex(o => o.text === c.answer);
    const tr = dcTrace(c), real = Boolean(c.run && c.run.real);
    const q = sel => $(sel, card);
    const host = q(".dc-code"), out = q(".dc-screen"), cmp = q(".run-compare"), ex = q(".dc-explain");
    const terminal = CppTerminal.mount(out, { guided: true });
    const memB = q(".dc-mem tbody"), memE = q(".dc-empty");
    const bStep = q('[data-act="dc-step"]'), bAll = q('[data-act="dc-all"]'), bReset = q('[data-act="dc-reset"]');
    const bReal = q('[data-act="dc-real"]'), bLock = q('[data-act="dc-lock"]');
    let si = 0, busy = false, generation = 0, stepToken = null;
    const lines = () => $$(".cl", host);
    const mark = () => { lines().forEach(l => l.classList.remove("now")); if (!real && si < tr.length) lines()[tr[si].l - 1]?.classList.add("now"); };
    const bat = on => [bStep, bAll, bReal].forEach(b => { if (b) b.disabled = !on; });
    const lamLai = () => {
      generation++; busy = false; stepToken = null; terminal.reset();
      si = 0; host.innerHTML = codeLines(c.code, c.focus || [], "");
      (c.run?.skip || []).forEach(n => lines()[n - 1]?.classList.add("skip"));
      if (memB) { memB.innerHTML = ""; memE.classList.remove("hidden"); }
      cmp.className = "run-compare result-line hidden";
      ex.innerHTML = real ? "Bấm <strong>▶ Biên dịch và chạy</strong> để máy chạy chương trình này bằng trình biên dịch C++ thật."
                          : "Bấm <strong>▶ Chạy từng dòng</strong>. Dòng sắp chạy có mũi tên ▶ màu cam.";
      mark(); bat(true); if (bReset) bReset.disabled = false;
    };
    const moChay = () => {
      q(".dc-predict").classList.add("hidden"); q(".dc-runview").classList.remove("hidden");
      const g = state.choices[c.id];
      q(".dc-guess").innerHTML = scr ? `Bạn đoán: <strong>Màn hình ${N[g]}</strong>` : `Bạn đoán: <strong>${N[g]}. ${esc(opts[g].text)}</strong>`;
      lamLai();
    };
    const ketThuc = () => {
      terminal.finish();
      bat(false); mark();
      const g = state.choices[c.id], ok = g === ans;
      const ke = card.nextElementSibling && card.nextElementSibling.dataset.dc ? card.nextElementSibling : null;
      const tenKe = ke ? (L.steps.flatMap(s => s.challenges || []).find(x => x.id === ke.dataset.card)?.title || "lần tiếp theo").split(" · ")[0] : "";
      const sau = ke ? `<div class="dc-next"><button type="button" class="primary dc-nextlap" data-act="dc-nextlap">Tiếp tục: ${esc(tenKe)} →</button></div>` : "";
      const xem = scr ? `<div class="dc-pair"><div><small>Bạn đoán (${N[g]})</small><pre>${esc(opts[g].text)}</pre></div><div><small>Máy in (${N[ans]})</small><pre>${esc(opts[ans].text)}</pre></div></div>` : "";
      cmp.className = "run-compare result-line " + (ok ? "good" : "bad");
      cmp.innerHTML = (ok ? `🎉 Bạn đoán đúng: <strong>${goi} ${N[g]}</strong>. ${c.whyRight || ""}`
                          : `Bạn đoán <strong>${goi} ${N[g]}</strong>, nhưng máy cho <strong>${goi} ${N[ans]}</strong>. ${c.why || ""}`) + (ok ? "" : xem) + sau;
      if (!state.passed[c.id]) {
        c._quiet = !ok;
        pass(c, card, ok ? "Đã chạy xong. Bạn đoán đúng." : "Đã chạy xong. Đọc phần giải thích ở trên để hiểu vì sao máy in như vậy.", bReset);
        c._quiet = false;
      }
    };
    const buoc = async () => {
      if (stepToken !== null || si >= tr.length || !card.isConnected || card.closest("[hidden]")) return false;
      const token = generation; stepToken = token; bat(false);
      try {
      const t = tr[si], ln = lines()[t.l - 1];
      ln?.classList.add("ran");
      if (t.out) terminal.append(t.out);
      if (t.nhap != null) {
        ex.innerHTML = `<strong>Dòng ${t.l}.</strong> <code>${esc(c.code.split("\n")[t.l - 1]?.trim() || "cin")}</code>`;
        const value = await terminal.prompt({ expected: t.nhap, line: t.l, kind: /^[+-]?\d+$/.test(String(t.nhap)) ? "integer" : "text", min: -2147483648, max: 2147483647 });
        if (value === null || token !== generation || !card.isConnected || card.closest("[hidden]")) return false;
        terminal.append(value + "\n");
      }
      if (t.mem && memB) {
        memE.classList.add("hidden");
        let row = [...memB.rows].find(r => r.cells[0].textContent === t.mem[0]);
        if (!row) { row = memB.insertRow(); row.innerHTML = `<td>${esc(t.mem[0])}</td><td>${esc(t.mem[1])}</td><td class="v"></td>`; }
        row.cells[2].textContent = t.mem[2]; row.classList.add("flash"); setTimeout(() => row.classList.remove("flash"), 800);
      }
      // Bước điều kiện (if, for): tô dòng xanh khi đúng, đỏ khi sai, và ghi nhãn trong lời giải thích.
      if (t.kq) { lines().forEach(x => x.classList.remove("dk-t", "dk-f")); ln?.classList.add(t.kq === "t" ? "dk-t" : "dk-f"); }
      const nhan = t.kq ? `<span class="dk-nhan ${t.kq}">${t.kq === "t" ? "✓ Điều kiện đúng" : "✗ Điều kiện sai"}</span> ` : "";
      ex.innerHTML = `<strong>Dòng ${t.l}.</strong> ${nhan}${t.why || ""}`;
      si++; mark();
      if (si >= tr.length) ketThuc();
      return true;
      } finally {
        if (stepToken === token) stepToken = null;
        if (token === generation && !busy) bat(si < tr.length);
      }
    };
    $$(`input[name="${c.id}"]`, card).forEach(i => i.addEventListener("change", () => {
      $$(".dc-opt", card).forEach(l => l.classList.toggle("guess", l.contains(i)));
      bLock.disabled = false;
    }));
    bLock.addEventListener("click", () => {
      const sel = $(`input[name="${c.id}"]:checked`, card);
      if (!sel) return result(card, "info", "Chọn một phương án trước nhé.");
      state.choices = state.choices || {};
      if (state.choices[c.id] == null) { state.choices[c.id] = Number(sel.value); attempt(c.id); save(); }
      moChay();
    });
    // Nút "Tiếp tục: Lần N" trong khung nhận xét: chuyển thẳng sang lần sau (cùng việc với bấm thanh Lần phía trên).
    cmp.addEventListener("click", e => {
      if (!e.target.closest('[data-act="dc-nextlap"]')) return;
      const sec = card.closest(".flow-screen[data-sec]"); if (!sec) return;
      const k = $$(".challenge-card[data-dc]", sec).indexOf(card) + 1;
      const b = $(`.dc-laps button[data-lap="${k}"]`, sec);
      if (b) { b.disabled = false; b.click(); }
      $(".dc-laps", sec)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    bStep?.addEventListener("click", buoc);
    bAll?.addEventListener("click", async () => {
      if (busy) return; busy = true; bat(false);
      const token = generation;
      try { while (si < tr.length && token === generation) { if (!await buoc()) break; await new Promise(r => setTimeout(r, 750)); } } finally { if (token === generation) { busy = false; bat(si < tr.length); } }
    });
    bReset?.addEventListener("click", lamLai);
    bReal?.addEventListener("click", async () => {
      if (busy) return; busy = true; bat(false);
      try {
        const res = await runCpp(c.code, c.input || "");
        terminal.showResult(res);
        ex.innerHTML = c.realWhy || "";
        ketThuc();
      } finally { busy = false; }
    });
    if (state.choices?.[c.id] != null) moChay();     // đã chốt dự đoán: vào thẳng phần chạy (chạy lại được)
  }

  if (c.type === "self") {
    state.self = state.self || {};
    const got = state.self[c.id] = state.self[c.id] || [];
    $$(".self-lv button", card).forEach(b => b.addEventListener("click", () => {
      got[b.dataset.i] = Number(b.dataset.v); save();
      $$(`.self-lv button[data-i="${b.dataset.i}"]`, card).forEach(x => x.classList.toggle("pick", x === b));
    }));
    $('[data-act="self"]', card).addEventListener("click", ev => {
      if (c.items.some((_, i) => !got[i])) return result(card, "info", "Chọn mức cho tất cả các câu nhé.");
      attempt(c.id);
      pass(c, card, "Đã lưu phần phản tư của bạn.", ev.currentTarget);
    });
  }
}

// Tập gõ code: không cho dán, kéo-thả, sao chép/cắt trong khung code.
// Học sinh thử sao chép/dán thì mới hiện popup nhắc (không ghi chú sẵn trên trang).
function noPasteMsg() {
  const d = $("#typeDialog");
  if (d && !d.open) d.showModal();
}
function guardTyping(ed) {
  ["paste", "drop", "copy", "cut"].forEach(ev => ed.addEventListener(ev, e => { e.preventDefault(); noPasteMsg(); }));
  ed.addEventListener("dragover", e => e.preventDefault());
  ed.addEventListener("beforeinput", e => {
    if (/^insertFrom(Paste|Drop|Yank)/.test(e.inputType || "")) { e.preventDefault(); noPasteMsg(); }
  });
  ed.addEventListener("contextmenu", e => e.preventDefault());
}
// Code mẫu trên trang (ví dụ, bảng giải mã, đáp án): không sao chép được.
function guardCopy() {
  const el = n => (n && n.nodeType === 1 ? n : n && n.parentElement);
  // Chỉ chặn trong khung code (code mẫu, code đang chạy, mẫu cú pháp, ô soạn code): học sinh tự gõ code.
  // Chữ hướng dẫn, câu hỏi, bảng… vẫn chép được bình thường.
  const KHUNG_CODE = ".code-demo, .flow-code, .run-code, .cp-mau, .code-lines, .code-editor, .editor-wrap, .fill-code, .seq-wrap, .parsons";
  const inLesson = n => { const e = el(n); return Boolean(e && e.closest(KHUNG_CODE) && !e.closest("input")); };
  ["copy", "cut"].forEach(ev => document.addEventListener(ev, e => {
    const sel = document.getSelection();
    if (sel && inLesson(sel.anchorNode)) {
      e.preventDefault();
      noPasteMsg();
    }
  }));
  document.addEventListener("dragstart", e => { if (inLesson(e.target) && !el(e.target).closest(".dnd-item,.match-chip")) e.preventDefault(); });
}

function updateBugs(c, card, code) {
  if (!c.bugs) return;
  c.bugs.forEach((b, i) => {
    const el = $(`[data-bug="${i}"]`, card);
    const fixed = b.fixed(code);
    if (fixed && !el.classList.contains("dead")) { el.classList.add("dead"); el.firstChild.textContent = "💥 "; beep("good"); }
    if (!fixed && el.classList.contains("dead")) { el.classList.remove("dead"); el.firstChild.textContent = "🐛 "; }
  });
}

function showRun(out, r) {
  const terminal = CppTerminal.get(out); if (terminal) { terminal.showResult(r); return; }
  out.classList.toggle("error", !r.ok);
  out.textContent = r.ok ? (r.output || "(Chương trình chạy xong nhưng không in gì ra.)") : `⚠ LỖI\n${r.error}`;
}

function firstDiff(actual, expected) {
  const a = actual.split("\n"), e = expected.split("\n");
  for (let i = 0; i < Math.max(a.length, e.length); i++) {
    if ((a[i] ?? "") !== (e[i] ?? "")) {
      if (a[i] === undefined) return `Màn hình của bạn mới có ${a.length} dòng, cần ${e.length} dòng.`;
      if (e[i] === undefined) return `Màn hình của bạn có ${a.length} dòng, chỉ cần ${e.length} dòng.`;
      return `Dòng ${i + 1} chưa khớp:\n• của bạn: "${a[i]}"\n• cần:      "${e[i]}"`;
    }
  }
  return "";
}

async function checkCode(c, code) {
  const tests = c.tests || [{ input: "", expected: c.expected }];
  if (!tests.length || tests.some(t => t.expected == null)) {
    const msg = "Nhiệm vụ chưa có đủ test case để chấm. Hãy báo giáo viên.";
    return { ok: false, run: { ok: false, output: "", error: msg }, msg };
  }
  let lastRun = null;
  for (const [n, t] of tests.entries()) {
    const r = await runCpp(code, t.input || "");
    lastRun = r;
    if (!r.ok) return { ok: false, run: r, input: t.input, msg: "Code chưa chạy được. Bạn đọc dòng ⚠ LỖI trong ô MÀN HÌNH rồi sửa nhé (bí quá thì mở 🧰 Bảng lỗi)." };
    if (t.expected != null) {
      const a = normalizeOutput(r.output), e = normalizeOutput(t.expected);
      if (a !== e) {
        const where = tests.length > 1 ? `Test case ${n + 1} (nhập ${t.input || "không"}) chưa đúng.\n` : "";
        const hint = ifHint(code);
        return { ok: false, run: r, input: t.input, msg: where + (firstDiff(a, e) || "Màn hình chưa khớp mẫu.") + (hint ? "\n👉 " + hint : "") };
      }
    }
  }
  for (const rule of c.rules || []) {
    if (!rule.test(code, lastRun.output)) return { ok: false, run: lastRun, msg: rule.msg };
  }
  if (c.bugs && !c.bugs.every(b => b.fixed(code))) {
    return { ok: false, run: lastRun, msg: "Màn hình đúng rồi, nhưng vẫn còn bọ trốn trong code! Xem con 🐛 nào chưa nổ nhé." };
  }
  return { ok: true, run: lastRun, msg: c.why || `Mã C++ đạt ${tests.length} test case. Màn hình đang hiển thị test case cuối cùng; bấm Chạy để thử với dữ liệu của bạn.` };
}

function attempt(id) { state.attempts[id] = (state.attempts[id] || 0) + 1; save(); }

function nextOpenCard(card) {
  const all = $$(".challenge-card", $("#stepContainer"));
  const i = all.indexOf(card);
  return [...all.slice(i + 1), ...all.slice(0, i)].find(el => !el.classList.contains("passed") && !el.classList.contains("advanced") && !el.classList.contains("bonus"));
}

function pass(c, card, msg, btn, starNow = false) {
  if(!state||!CppCloud.allowed()||lockedByBoss())return;
  const first = !state.passed[c.id];
  let extra = "";
  if (first) {
    state.passed[c.id] = true;
    let gain = XP_PASS;
    if (state.attempts[c.id] === 1) {
      state.combo += 1; gain += XP_FIRST_TRY;
      if (state.combo >= 2) { gain += state.combo * 2; extra = ` 🔥 Combo x${state.combo}!`; }
    } else state.combo = 0;
    if (starNow) { gain *= 2; extra += " ⭐ Ngôi sao thành công"; }
    state.xp += gain;
    extra = ` +${gain} XP.` + extra;
    if (allRequiredDone() && !state.completedAt) state.completedAt = new Date().toISOString();
    saveBadge();
  }
  save();
  card.classList.add("passed");
  $(".challenge-badge", card).textContent = "⭐ ĐÃ XONG";
  $(".challenge-icon", card).textContent = "✅";
  $('[data-act="hint"]', card)?.remove();

  const step = activeStep();
  const stageNowDone = step.kind !== "gate" && stepDone(step);
  let cta = "";
  if (step.flow) {
    // Xong cả tab (không phải tab cuối) thì nhắc bấm Tiếp ở cuối trang; không có nút trong từng câu.
    const k = step.flow.findIndex(sc => (sc.tasks || []).includes(c.id));
    if (k >= 0 && k < step.flow.length - 1 && screenDone(step, step.flow[k])) cta = `<span class="scroll-hint">✓ Xong phần này — bấm “Tiếp” ở cuối trang</span>`;
  } else if (stageNowDone && step.kind !== "boss") cta = `<button class="mini-cta" type="button" data-go-step>${nextLabel(STEPS[STEPS.indexOf(step) + 1])}</button>`;
  result(card, "good", msg + extra, cta);
  $("[data-go-step]", card)?.addEventListener("click", () => go(STEPS[STEPS.indexOf(step) + 1].id));

  if (c.type !== "self" && !c._quiet) {
    const r = btn ? btn.getBoundingClientRect() : null;
    confetti(r ? { x: r.left + r.width / 2, y: r.top } : null, starNow);
    beep(starNow ? "win" : "good");
    const cheers = ["Tuyệt vời!", "Quá đỉnh!", "Chuẩn luôn!", "Bạn giỏi quá!", "Xuất sắc!"];
    if (step.kind !== "boss") bitSay(`<strong>${cheers[Math.floor(Math.random() * cheers.length)]}</strong>${extra}`, "happy", 3500);
  }
  if (step.kind === "boss" && first) bossDanh(step, c);
  updateTop();
  renderMap();
  if (step.flow) flowRefresh(step);
  else if (step.kind !== "gate") refreshFooter(step);
  if (step.kind === "boss" && first && allRequiredDone()) {
    beep("win"); confetti(null, true);
    bitSay("<strong>BOSS gục rồi!</strong> Lưu chứng chỉ để nộp nhé. Còn sức thì thử nhiệm vụ nâng cao để lấy huy hiệu vàng!", "wow");
    if (!c.advanced && !window.LessonCelebration) setTimeout(openCertificate, 2800);
  }
}

function miss(card, msg) {
  state.combo = 0; save(); updateTop();
  result(card, "bad", msg);
  const st = activeStep();
  if (st?.kind === "boss" && bossVat) { bossVat.treu(); bossVat.noi(bossLoi(st, "truot")); }
  else bitSay("Chưa đúng — đọc dòng ❌ ngay dưới nút nhé. Bạn làm được!", "sad", 3500);
  beep("bad");
}

/* ---------- huy hiệu & chứng chỉ ---------- */
function saveBadge() {
  if (!allRequiredDone()) return;
  state.badge=isGold()?"gold":"silver";
}

function certId() {
  return `CPP8-B${String(L.number).padStart(2, "0")}-${state.student.className}-${hashText(`${state.student.userId}|${L.id}|${state.completedAt}`)}`;
}

window.LessonCelebration?.setCertificateOpener(()=>openCertificate(true));
function openCertificate(bypass=false) {
  if(bypass!==true&&window.LessonCelebration?.holdCertificate(()=>openCertificate(true)))return;
  if (!allRequiredDone()) return;
  drawCertificate();
  const link = $("#canvasLink");
  if (CFG.canvasSubmissionUrl) { link.href = CFG.canvasSubmissionUrl; link.classList.remove("hidden"); }
  const d = $("#certDialog");
  if (!d.open) d.showModal();
}

// Chứng chỉ (góp ý thầy 19/10/2026): gọn, đẹp, chỉ giữ tên, lớp, bài, boss đã hạ, ngày và mã đối chiếu.
function drawCertificate() {
  const cv = $("#certCanvas"), ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
  const gold = isGold(), boss = bossStep();
  const kieu = boss?.bossKieu || BOSS_KIEU[L.number] || "quai";
  const mauBoss = boss?.bossMau || window.Boss3D?.MAU?.[kieu] || "#8b5cf6";
  const NAVY = "#17304f", XANH = "#2076d2", TIM = "#5640a5", NHAT = "#6b7a90";
  const vien = gold ? "#c99700" : XANH;
  ctx.clearRect(0, 0, W, H);
  // Nền kem + quầng sáng nhẹ ở giữa
  ctx.fillStyle = "#fffaf0"; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H / 2 - 40, 80, W / 2, H / 2, W * 0.62);
  g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(1, "rgba(241,237,255,.9)");
  ctx.fillStyle = g; rr(ctx, 36, 36, W - 72, H - 72, 30); ctx.fill();
  // Viền đôi
  ctx.strokeStyle = NAVY; ctx.lineWidth = 10; rr(ctx, 36, 36, W - 72, H - 72, 30); ctx.stroke();
  ctx.strokeStyle = vien; ctx.lineWidth = 3; rr(ctx, 62, 62, W - 124, H - 124, 22); ctx.stroke();
  // Hoa văn góc: dấu ngoặc nhọn kiểu code
  ctx.fillStyle = "rgba(32,118,210,.13)"; ctx.font = "900 150px Consolas, 'Courier New', monospace"; ctx.textAlign = "center";
  ctx.fillText("{", 150, 260); ctx.fillText("}", W - 150, 260);
  // Nhãn khoá học
  ctx.font = "800 24px Segoe UI, Arial";
  const nhan = "C++ JOURNEY 8  ·  LẬP TRÌNH C++ LỚP 8", wN = ctx.measureText(nhan).width + 56;
  ctx.fillStyle = TIM; rr(ctx, W / 2 - wN / 2, 108, wN, 46, 23); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.fillText(nhan, W / 2, 140);
  // Tiêu đề
  ctx.fillStyle = NAVY; ctx.font = "900 92px Segoe UI, Arial";
  ctx.save(); ctx.letterSpacing = "10px"; ctx.fillText("CHỨNG NHẬN", W / 2, 268); ctx.restore();
  fit(ctx, `Bài ${L.number}: ${L.title}`, W / 2, 334, 1100, 40, 28, XANH);
  // Người nhận
  ctx.fillStyle = NHAT; ctx.font = "italic 500 28px Segoe UI, Arial"; ctx.fillText("Trao cho", W / 2, 432);
  fit(ctx, state.student.name, W / 2, 522, 1050, 84, 44, TIM);
  ctx.strokeStyle = vien; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W / 2 - 360, 556); ctx.lineTo(W / 2 + 360, 556); ctx.stroke();
  ctx.fillStyle = NAVY; ctx.font = "800 34px Segoe UI, Arial"; ctx.fillText(`Lớp ${state.student.className}`, W / 2, 616);
  ctx.font = "500 32px Segoe UI, Arial"; ctx.fillStyle = NAVY;
  ctx.fillText(`đã hạ ${boss?.bossName || "BOSS"} và hoàn thành chặng chứng chỉ`, W / 2, 686);
  // Huy hiệu bài (trái) và con boss đã bị hạ (phải)
  huyHieu(ctx, 300, 815, gold);
  bossBiHa(ctx, W - 300, 830, mauBoss, kieu);
  // Ngày + mã đối chiếu
  const date = new Date(state.completedAt || Date.now()).toLocaleDateString("vi-VN");
  ctx.fillStyle = NAVY; ctx.font = "700 28px Segoe UI, Arial"; ctx.textAlign = "center";
  ctx.fillText(`Ngày ${date}`, W / 2, 900);
  ctx.strokeStyle = "#d8cfbd"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2 - 150, 920); ctx.lineTo(W / 2 + 150, 920); ctx.stroke();
  ctx.fillStyle = "#9aa5b4"; ctx.font = "500 18px Consolas, 'Courier New', monospace";
  ctx.fillText(`Mã: ${certId()}`, W / 2, H - 92);
}

function huyHieu(ctx, x, y, gold) {
  const vien = gold ? "#b47700" : "#7d8ba0", nen = gold ? "#ffd44d" : "#e3e9f1";
  ctx.save();
  // hai dải ruy băng
  ctx.fillStyle = gold ? "#e0a800" : "#2076d2";
  ctx.beginPath(); ctx.moveTo(x - 60, y + 40); ctx.lineTo(x - 95, y + 150); ctx.lineTo(x - 55, y + 128); ctx.lineTo(x - 30, y + 165); ctx.lineTo(x - 5, y + 55); ctx.fill();
  ctx.fillStyle = gold ? "#c99000" : "#5640a5";
  ctx.beginPath(); ctx.moveTo(x + 60, y + 40); ctx.lineTo(x + 95, y + 150); ctx.lineTo(x + 55, y + 128); ctx.lineTo(x + 30, y + 165); ctx.lineTo(x + 5, y + 55); ctx.fill();
  // mặt huy hiệu răng cưa
  ctx.beginPath();
  for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2, r = i % 2 ? 92 : 100; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.closePath(); ctx.fillStyle = vien; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, 80, 0, Math.PI * 2); ctx.fillStyle = nen; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 68, 0, Math.PI * 2); ctx.stroke();
  ctx.textAlign = "center"; ctx.font = "64px Segoe UI Emoji, Apple Color Emoji, sans-serif"; ctx.fillText(L.badge?.icon || "🏆", x, y + 22);
  ctx.fillStyle = gold ? "#7d5600" : "#4f5d70"; ctx.font = "900 20px Segoe UI, Arial";
  ctx.fillText(gold ? "HUY HIỆU VÀNG" : "HUY HIỆU BẠC", x, y + 196);
  ctx.restore();
}

// Con boss vẽ 2D (cùng màu với boss 3D): nằm choáng, mắt xoắn ốc, sao quay trên đầu.
function bossBiHa(ctx, x, y, mau, kieu) {
  ctx.save();
  ctx.fillStyle = "rgba(23,48,79,.13)"; ctx.beginPath(); ctx.ellipse(x, y + 92, 120, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.translate(x, y); ctx.rotate(-0.18);
  ctx.fillStyle = mau; ctx.strokeStyle = "#17304f"; ctx.lineWidth = 5;
  ctx.beginPath();
  if (kieu === "robot" || kieu === "mach") rr(ctx, -105, -80, 210, 165, 36); else ctx.ellipse(0, 0, 112, 88, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // phụ kiện nhỏ theo bài
  ctx.fillStyle = "#ffd166";
  if (kieu === "bo") { ctx.beginPath(); ctx.moveTo(-30, -82); ctx.lineTo(-60, -130); ctx.moveTo(30, -82); ctx.lineTo(60, -130); ctx.stroke(); ctx.beginPath(); ctx.arc(-60, -134, 11, 0, 7); ctx.arc(60, -134, 11, 0, 7); ctx.fill(); }
  if (kieu === "rong") { ctx.fillStyle = "#fff3c4"; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 40, -78); ctx.lineTo(s * 62, -128); ctx.lineTo(s * 72, -70); ctx.fill(); ctx.stroke(); } }
  if (kieu === "trum") { ctx.fillStyle = "#ffd34d"; ctx.beginPath(); ctx.moveTo(-55, -80); ctx.lineTo(-55, -125); ctx.lineTo(-28, -100); ctx.lineTo(0, -135); ctx.lineTo(28, -100); ctx.lineTo(55, -125); ctx.lineTo(55, -80); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (kieu === "robot") { ctx.beginPath(); ctx.moveTo(0, -80); ctx.lineTo(0, -118); ctx.stroke(); ctx.fillStyle = "#ff6b6b"; ctx.beginPath(); ctx.arc(0, -124, 12, 0, 7); ctx.fill(); }
  ctx.textAlign = "center";
  if (kieu === "quai") { ctx.fillStyle = "#ffd166"; ctx.font = "900 54px Segoe UI, Arial"; ctx.fillText("?", 0, -98); }
  if (kieu === "mach") { ctx.font = "44px Segoe UI Emoji, sans-serif"; ctx.fillText("⚡", -80, -86); }
  // mắt xoắn ốc
  for (const ex of [-40, 40]) {
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ex, -12, 27, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); for (let t = 0; t < 4 * Math.PI; t += 0.2) { const r = 2 + t * 1.7; ctx.lineTo(ex + Math.cos(t) * r, -12 + Math.sin(t) * r); } ctx.stroke();
  }
  // má hồng + miệng há + lưỡi
  ctx.fillStyle = "rgba(255,130,160,.75)"; ctx.beginPath(); ctx.ellipse(-72, 22, 16, 9, 0, 0, 7); ctx.ellipse(72, 22, 16, 9, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#7a2335"; ctx.beginPath(); ctx.ellipse(0, 36, 22, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ff8fab"; ctx.beginPath(); ctx.ellipse(8, 48, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // sao choáng
  ctx.save(); ctx.textAlign = "center"; ctx.font = "34px Segoe UI Emoji, sans-serif";
  [[-70, -150], [0, -172], [70, -150]].forEach(([dx, dy]) => ctx.fillText("⭐", x + dx, y + dy));
  ctx.fillStyle = "#4f5d70"; ctx.font = "800 22px Segoe UI, Arial"; ctx.fillText("Đã bị hạ!", x, y + 150);
  ctx.restore();
}

function rr(ctx, x, y, w, h, r) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k); ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k); ctx.arcTo(x, y, x + w, y, k); ctx.closePath();
}

function fit(ctx, text, x, y, maxW, size, min, color) {
  while (size > min) { ctx.font = `900 ${size}px Segoe UI, Arial`; if (ctx.measureText(text).width <= maxW) break; size -= 2; }
  ctx.font = `900 ${size}px Segoe UI, Arial`;
  ctx.fillStyle = color; ctx.textAlign = "center"; ctx.fillText(text, x, y);
}

function fileSafe(s) {
  return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "");
}

function savePng() {
  drawCertificate();
  $("#certCanvas").toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ChungChi-Bai${L.number}-${fileSafe(state.student.name)}-${state.student.className}.png`;
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}

function printPdf() {
  drawCertificate();
  const data = $("#certCanvas").toDataURL("image/png");
  const win = window.open("", "_blank");
  if (!win) return alert("Trình duyệt đang chặn cửa sổ in. Cho phép popup rồi thử lại.");
  win.document.write(`<!doctype html><html><head><title>Chứng chỉ Bài ${L.number}</title><style>html,body{margin:0}body{display:grid;place-items:center;min-height:100vh}img{max-width:100%}@page{size:A4 landscape;margin:0}@media print{img{width:100vw}}</style></head><body><img src="${data}"/></body></html>`);
  win.document.close(); win.focus(); setTimeout(() => win.print(), 300);
}

/* ---------- khởi động ---------- */
function boot() {
  shell();
  load(CPPAccount.student());
  $("#studentBtn").addEventListener("click",CPPAccount.profile);
  $("#newStudentBtn").addEventListener("click",CPPAccount.profile);
  $("#resetBtn").addEventListener("click",CPPAccount.profile);
  $("#errorsBtn").addEventListener("click", () => $("#errorsDialog").showModal());
  $("#soundBtn").addEventListener("click", () => { safeSet(`${PREFIX}:sound`, soundOn() ? "off" : "on"); $("#soundBtn").textContent = soundOn() ? "🔊" : "🔇"; });
  $$("[data-close]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
  $("#savePng").addEventListener("click", savePng);
  $("#printPdf").addEventListener("click", printPdf);
  $(".bit-close").addEventListener("click", () => $("#bitBubble").classList.add("hidden"));
  $("#bitFace").addEventListener("click", () => {
    const b = $("#bitBubble");
    if (b.classList.contains("hidden") && bitLast) { b.classList.remove("hidden"); } else b.classList.add("hidden");
  });
  $("#soundBtn").textContent = soundOn() ? "🔊" : "🔇";
  guardCopy();
  renderAll(true);CPPAccount.controls();
}

window.CPP_ENGINE={progress:completionStatus,certificate:openCertificate,remoteState(){if(!CppCloud.allowed())return;load(CPPAccount.student());renderAll(true)},profileChanged(){if(!state||!CppCloud.allowed())return;state.student=CPPAccount.student();updateTop()},dispose(){CppTerminal.stopAll();CppRun.stop();clearTimeout(bitTimer);clearInterval(bossDem);bossTheo?.disconnect();bossVat?.huy?.();bossVat=null;state=null}};
if(CppCloud.allowed())boot();

})();
