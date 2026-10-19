/* C++ Journey 8 — con boss 3D của chặng chứng chỉ (góp ý thầy 19/10/2026).
   - Dựng bằng three.js (cùng bản 0.160.0 với đảo 3D), toàn hình khối tròn, dễ thương, không máu me.
   - Mỗi bài một kiểu: bo (Bài 1), quai (Bài 2), rong (Bài 3), robot (Bài 4), trum (Bài 5), mach (Bài 6).
   - Hiệu ứng: dmg() trúng đòn (bẹp, chớp sáng, sao bay, mắt quay vòng), treu() cười trêu, gap() hối thúc,
     thang() boss bị hạ (xì hơi, choáng), thua() boss thắng (to lên, dậm chân).
   - Máy không chạy được WebGL hoặc không tải được three.js: tự dùng bản 2D bằng emoji + CSS, cùng các hàm.
   Dùng: const b = Boss3D.mount(khung, { kieu: "quai", mau: "#8b5cf6" }); b.dmg(17); b.noi("…");
*/
(function () {
  "use strict";
  const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
  const EMOJI = { bo: "🐞", quai: "👾", rong: "🐲", robot: "🤖", trum: "👑", mach: "🔌" };
  const MAU = { bo: "#4caf50", quai: "#8b5cf6", rong: "#f97316", robot: "#64a8d8", trum: "#a855f7", mach: "#14b8a6" };
  const itMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let threeP = null;
  const napThree = () => (threeP = threeP || import(THREE_URL));

  function coWebGL() {
    try { const c = document.createElement("canvas"); return Boolean(c.getContext("webgl2") || c.getContext("webgl")); }
    catch { return false; }
  }

  // Ảnh chữ/emoji nhỏ làm sprite (sao bay, dấu ?, tia điện).
  function chuTexture(THREE, text, mau = "#fff", co = 96) {
    const cv = document.createElement("canvas"); cv.width = cv.height = 128;
    const g = cv.getContext("2d");
    g.font = `900 ${co}px "Segoe UI Emoji", "Apple Color Emoji", "Segoe UI", sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = mau;
    g.lineWidth = 10; g.strokeStyle = "rgba(23,48,79,.85)"; g.strokeText(text, 64, 70); g.fillText(text, 64, 70);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  function dungBoss(THREE, kieu, mauChinh) {
    const g = new THREE.Group(), than = new THREE.Group(); g.add(than);
    const toon = c => new THREE.MeshToonMaterial({ color: c });
    const mauThan = new THREE.Color(mauChinh), mauToi = mauThan.clone().multiplyScalar(0.72);
    const matThan = new THREE.MeshToonMaterial({ color: mauThan, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0 });
    const cau = (r, m, x = 0, y = 0, z = 0, s = [1, 1, 1]) => {
      const o = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), m); o.position.set(x, y, z); o.scale.set(...s); return o;
    };
    // Thân: robot và mạch là khối hộp bo tròn nhẹ, còn lại là khối tròn.
    let body;
    if (kieu === "robot" || kieu === "mach") {
      body = new THREE.Mesh(new THREE.BoxGeometry(1.7, kieu === "mach" ? 1.35 : 1.6, 1.4, 4, 4, 4), matThan);
      // bo tròn góc hộp bằng cách đẩy đỉnh về phía mặt cầu một chút
      const p = body.geometry.attributes.position, v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = v.clone().normalize().multiplyScalar(1.05); v.lerp(n, 0.28); p.setXYZ(i, v.x, v.y, v.z); }
      body.geometry.computeVertexNormals();
    } else body = cau(1, matThan, 0, 0, 0, [1.05, 0.92, 0.95]);
    than.add(body);
    // Má hồng, mắt to, đồng tử, đốm sáng
    const trang = toon("#ffffff"), den = toon("#1d2433"), hong = toon("#ff9fb8");
    than.add(cau(0.13, hong, -0.55, -0.12, 0.78, [1.2, 0.7, 0.5]), cau(0.13, hong, 0.55, -0.12, 0.78, [1.2, 0.7, 0.5]));
    const mat = [], dongTu = [];
    for (const x of [-0.33, 0.33]) {
      const m = cau(0.27, trang, x, 0.2, 0.74, [1, 1.12, 0.7]); than.add(m); mat.push(m);
      const d = new THREE.Group(); d.position.set(x, 0.2, 0.93);
      d.add(cau(0.13, den, 0, 0, 0, [1, 1.1, 0.6])); d.add(cau(0.045, trang, 0.045, 0.06, 0.07));
      than.add(d); dongTu.push(d);
    }
    // Miệng cười và miệng há (khi trêu, khi thắng)
    const mieng = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.04, 10, 24, Math.PI), den);
    mieng.position.set(0, -0.2, 0.86); mieng.rotation.z = Math.PI; than.add(mieng);
    const ha = cau(0.15, toon("#7a2335"), 0, -0.24, 0.84, [1.2, 0.85, 0.5]); ha.visible = false; than.add(ha);
    // Hai tay tròn
    const tay = [cau(0.2, matThan, -1.05, -0.25, 0.1), cau(0.2, matThan, 1.05, -0.25, 0.1)];
    tay.forEach(t => than.add(t));
    // Hai chân tròn
    than.add(cau(0.22, toon(mauToi), -0.42, -0.92, 0.15, [1.2, 0.6, 1.2]), cau(0.22, toon(mauToi), 0.42, -0.92, 0.15, [1.2, 0.6, 1.2]));

    const phu = new THREE.Group(); than.add(phu);
    const non = (r, h, m, x, y, z, rz = 0) => { const o = new THREE.Mesh(new THREE.ConeGeometry(r, h, 16), m); o.position.set(x, y, z); o.rotation.z = rz; return o; };
    const sprite = (tex, s, x, y, z) => { const o = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); o.scale.set(s, s, s); o.position.set(x, y, z); return o; };
    const lungLay = [];   // vật treo trên đầu đung đưa
    if (kieu === "bo") {
      for (const x of [-0.3, 0.3]) {
        const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), den); r.position.set(x * 1.2, 1.12, 0); r.rotation.z = -x * 1.1; phu.add(r);
        const q = cau(0.1, toon("#ffd166"), x * 1.95, 1.38, 0); phu.add(q); lungLay.push(q);
      }
      for (const [x, y, z] of [[-0.4, 0.62, -0.5], [0.35, 0.7, -0.45], [0, 0.82, -0.2]]) phu.add(cau(0.15, den, x, y, z, [1, 0.5, 1]));
    } else if (kieu === "quai") {
      const q = sprite(chuTexture(THREE, "?", "#ffd166"), 0.75, 0, 1.45, 0); phu.add(q); lungLay.push(q);
      const x = sprite(chuTexture(THREE, "x=?", "#ffffff", 46), 0.7, -0.95, 1.05, 0); phu.add(x); lungLay.push(x);
      for (const [px, py] of [[-0.5, 0.75], [0, 0.95], [0.5, 0.75]]) phu.add(non(0.14, 0.32, toon(mauToi), px, py, 0.1, -px * 0.6));
    } else if (kieu === "rong") {
      phu.add(non(0.12, 0.42, toon("#fff3c4"), -0.45, 0.95, 0.15, 0.35), non(0.12, 0.42, toon("#fff3c4"), 0.45, 0.95, 0.15, -0.35));
      for (const s of [-1, 1]) { const c = cau(0.42, toon("#fdba74"), s * 1.05, 0.35, -0.35, [0.25, 0.7, 0.9]); c.rotation.z = s * 0.5; phu.add(c); lungLay.push(c); }
      for (const [y, z] of [[0.75, -0.55], [0.35, -0.85], [-0.1, -0.95]]) { const o = non(0.12, 0.3, toon("#fde047"), 0, y, z); o.rotation.x = -0.9; phu.add(o); }
    } else if (kieu === "robot") {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.45, 8), den); r.position.set(0, 1.05, 0); phu.add(r);
      const den2 = cau(0.11, new THREE.MeshToonMaterial({ color: "#ff5d5d", emissive: "#ff2d2d", emissiveIntensity: 0.6 }), 0, 1.32, 0); phu.add(den2); lungLay.push(den2);
      for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 12), toon("#c9d4df")); b.rotation.z = Math.PI / 2; b.position.set(s * 0.92, 0.25, 0); phu.add(b); }
    } else if (kieu === "trum") {
      const vang = toon("#ffd34d");
      const vanh = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.2, 24, 1, true), vang); vanh.position.set(0, 0.95, 0); phu.add(vanh);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; phu.add(non(0.1, 0.3, vang, Math.sin(a) * 0.47, 1.18, Math.cos(a) * 0.47)); }
      const ngoc = cau(0.08, toon("#ff5d8f"), 0, 0.98, 0.52); phu.add(ngoc); lungLay.push(ngoc);
    } else if (kieu === "mach") {
      const chan = toon("#cbd5e1");
      for (const x of [-0.6, -0.2, 0.2, 0.6]) for (const y of [0.78, -0.78]) { const ch = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.1), chan); ch.position.set(x, y * 1.02, -0.2); phu.add(ch); }
      for (const s of [-1, 1]) { const tia = sprite(chuTexture(THREE, "⚡", "#ffe066"), 0.55, s * 1.05, 0.95, 0); phu.add(tia); lungLay.push(tia); }
    }
    lungLay.forEach(o => { o.userData.goc = o.position.clone(); });
    g.userData = { than, body, matThan, mat, dongTu, mieng, ha, tay, lungLay };
    return g;
  }

  /* ---------- bản 2D dự phòng ---------- */
  function mount2D(host, cfg) {
    host.classList.add("b3-2d");
    host.innerHTML = `<div class="b3-emoji">${EMOJI[cfg.kieu] || "👾"}</div><div class="b3-fx"></div>`;
    const e = host.querySelector(".b3-emoji");
    const lop = (c, ms) => { e.classList.remove(c); void e.offsetWidth; e.classList.add(c); if (ms) setTimeout(() => e.classList.remove(c), ms); };
    return {
      dmg: n => { lop("b3-hit", 700); bayChu(host, `−${n} HP`); sao(host); },
      treu: () => lop("b3-treu", 1000), gap: on => e.classList.toggle("b3-gap", on),
      thang: () => lop("b3-thang"), thua: () => lop("b3-thua"), noi: t => noi(host, t), huy() {}
    };
  }

  /* ---------- hiệu ứng DOM dùng chung ---------- */
  function bayChu(host, text) {
    const fx = host.querySelector(".b3-fx"); if (!fx) return;
    const d = document.createElement("div"); d.className = "b3-so"; d.textContent = text; fx.append(d);
    setTimeout(() => d.remove(), 1300);
  }
  function sao(host) {
    const fx = host.querySelector(".b3-fx"); if (!fx || itMotion) return;
    for (let i = 0; i < 7; i++) {
      const s = document.createElement("span"); s.className = "b3-sao"; s.textContent = ["⭐", "✨", "💫"][i % 3];
      const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 50;
      s.style.setProperty("--dx", `${Math.cos(a) * r}px`); s.style.setProperty("--dy", `${Math.sin(a) * r - 20}px`);
      fx.append(s); setTimeout(() => s.remove(), 900);
    }
  }
  function noi(host, text) {
    const b = host.closest(".boss-dock")?.querySelector(".b3-noi");
    if (!b) return;
    b.innerHTML = text; b.classList.remove("hien"); void b.offsetWidth; b.classList.add("hien");
  }

  /* ---------- bản 3D ---------- */
  function mount(host, cfg = {}) {
    cfg = { kieu: "quai", ...cfg }; cfg.mau = cfg.mau || MAU[cfg.kieu] || "#8b5cf6";
    if (!coWebGL()) return mount2D(host, cfg);
    host.classList.add("b3-3d");
    host.innerHTML = `<div class="b3-canvas"></div><div class="b3-fx"></div>`;
    const cho = [];          // lệnh gọi trước khi three.js tải xong
    let api = null, chet = false, du = null;
    const goi = (ten, ...a) => (api ? api[ten](...a) : cho.push([ten, a]));
    const tam = {
      dmg: n => { bayChu(host, `−${n} HP`); sao(host); goi("dmg", n); },
      treu: () => goi("treu"), gap: on => goi("gap", on), thang: () => goi("thang"), thua: () => goi("thua"),
      noi: t => noi(host, t), huy: () => { chet = true; api?.huy(); }
    };
    // Tải three.js quá 8 giây thì dùng bản 2D.
    du = setTimeout(() => { if (!api && !chet) { chet = true; const b = mount2D(host, cfg); Object.assign(tam, b, { noi: tam.noi }); cho.forEach(([t, a]) => b[t]?.(...a)); } }, 8000);
    napThree().then(THREE => {
      if (chet) return;
      clearTimeout(du);
      api = chay3D(THREE, host, cfg);
      cho.forEach(([t, a]) => api[t](...a));
    }).catch(() => { if (chet) return; clearTimeout(du); chet = true; const b = mount2D(host, cfg); Object.assign(tam, b, { noi: tam.noi }); });
    return tam;
  }

  function chay3D(THREE, host, cfg) {
    const khung = host.querySelector(".b3-canvas");
    const W = () => khung.clientWidth || 220, H = () => khung.clientHeight || 200;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(W(), H());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    khung.append(renderer.domElement);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(36, W() / H(), 0.1, 50); cam.position.set(0, 0.35, 5.6); cam.lookAt(0, 0.1, 0);
    scene.add(new THREE.HemisphereLight("#ffffff", "#9aa7c7", 1.6));
    const dl = new THREE.DirectionalLight("#ffffff", 1.6); dl.position.set(2, 4, 5); scene.add(dl);
    const bong = new THREE.Mesh(new THREE.CircleGeometry(0.95, 32), new THREE.MeshBasicMaterial({ color: "#17304f", transparent: true, opacity: 0.16 }));
    bong.rotation.x = -Math.PI / 2; bong.position.y = -1.08; scene.add(bong);
    const boss = dungBoss(THREE, cfg.kieu, cfg.mau); scene.add(boss);
    const U = boss.userData;
    // Vòng sao quay khi choáng
    const vongSao = new THREE.Group(); vongSao.position.y = 1.15; vongSao.visible = false; scene.add(vongSao);
    const texSao = chuTexture(THREE, "★", "#ffd34d");
    for (let i = 0; i < 5; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texSao, transparent: true, depthWrite: false })); s.scale.set(0.32, 0.32, 0.32); const a = i / 5 * Math.PI * 2; s.position.set(Math.cos(a) * 0.65, 0, Math.sin(a) * 0.65); vongSao.add(s); }

    let hit = 0, treu = 0, gap = false, thang = 0, thua = 0, chop = 0, lap = 0, dangChay = true, hienTren = true;
    const t0 = performance.now();
    const io = "IntersectionObserver" in window ? new IntersectionObserver(es => { hienTren = es[0]?.isIntersecting ?? true; }) : null;
    io?.observe(host);
    const ro = "ResizeObserver" in window ? new ResizeObserver(() => { renderer.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix(); }) : null;
    ro?.observe(khung);

    function ve(now) {
      if (!dangChay) return;
      if (!host.isConnected) return huy();
      lap = requestAnimationFrame(ve);
      if (!hienTren || document.hidden) return;
      const t = (now - t0) / 1000, dt = 1 / 60;
      const nhanh = gap ? 2.2 : 1;
      const th = U.than;
      // Đứng yên: nhún nhẹ, lắc người, vẫy tay, chớp mắt
      let y = Math.sin(t * 2.2 * nhanh) * 0.07, ry = Math.sin(t * 0.8) * 0.28, rz = 0, sx = 1, sy = 1, lacX = 0;
      U.tay[0].position.y = -0.25 + Math.sin(t * 3 * nhanh) * 0.08; U.tay[1].position.y = -0.25 + Math.sin(t * 3 * nhanh + 1.5) * 0.08;
      U.lungLay.forEach((o, i) => { const g0 = o.userData.goc; o.position.set(g0.x + Math.sin(t * 2.4 + i) * 0.05, g0.y + Math.cos(t * 2.1 + i) * 0.06, g0.z); });
      const chopMat = (t % 3.4) < 0.12 ? 0.12 : 1;
      U.mat.forEach(m => { m.scale.y = 1.12 * chopMat; });
      U.dongTu.forEach(d => { d.scale.y = chopMat; d.rotation.z = 0; d.position.x = Math.sign(d.position.x) * 0.33; });
      U.ha.visible = false; U.mieng.visible = true;
      // Trúng đòn: bẹp rồi nảy lại, chớp trắng, lắc ngang, mắt quay vòng
      if (hit > 0) {
        const k = hit / 0.75, e = Math.sin((1 - k) * Math.PI * 3) * k;
        sx = 1 + 0.28 * e; sy = 1 - 0.32 * e; lacX = Math.sin(t * 60) * 0.06 * k;
        U.matThan.emissiveIntensity = Math.max(0, k - 0.45) * 1.6;
        U.dongTu.forEach((d, i) => { d.rotation.z = t * 14 * (i ? -1 : 1); d.position.x = Math.sign(d.position.x) * 0.33 + Math.cos(t * 14) * 0.05; });
        U.ha.visible = true; U.mieng.visible = false;
        hit = Math.max(0, hit - dt);
      } else U.matThan.emissiveIntensity = 0;
      // Cười trêu: nhảy 2 cái, há miệng, lắc qua lại
      if (treu > 0) {
        const k = treu / 1.1; y += Math.abs(Math.sin((1 - k) * Math.PI * 2)) * 0.32; rz = Math.sin(t * 18) * 0.12;
        U.ha.visible = true; U.mieng.visible = false; treu = Math.max(0, treu - dt);
      }
      // Bị hạ: xoay vòng, xẹp xuống rồi nằm choáng, sao quay trên đầu
      if (thang > 0) {
        thang += dt;
        const k = Math.min(1, thang / 1.4);
        ry = thang < 1.4 ? thang * 12 : Math.sin(t) * 0.2;
        sx = sy = 1 - 0.32 * k; y = -0.28 * k + Math.sin(t * 1.5) * 0.02; rz = 0.35 * k;
        vongSao.visible = thang > 1.2; vongSao.rotation.y = t * 3; vongSao.position.y = 0.8 - 0.28 * k;
        U.dongTu.forEach((d, i) => { d.rotation.z = t * 6 * (i ? -1 : 1); });
        U.ha.visible = true; U.mieng.visible = false;
      }
      // Thắng (hết giờ): to lên, dậm chân, cười lớn
      if (thua > 0) {
        thua += dt;
        const k = Math.min(1, thua / 0.8);
        sx = sy = 1 + 0.22 * k; y = Math.abs(Math.sin(thua * 5)) * 0.35;
        cam.position.x = thua < 2.5 ? Math.sin(thua * 70) * 0.04 * (y < 0.05 ? 1 : 0) : 0;
        U.ha.visible = true; U.mieng.visible = false; rz = Math.sin(t * 10) * 0.08;
      }
      if (itMotion) { y = 0; rz = 0; lacX = 0; if (thang > 0) ry = 0; }
      th.position.set(lacX, y, 0); boss.rotation.y = ry; th.rotation.z = rz; th.scale.set(sx, sy, sx);
      bong.scale.setScalar(1 - Math.max(0, y) * 0.6);
      renderer.render(scene, cam);
    }
    lap = requestAnimationFrame(ve);
    function huy() {
      dangChay = false; cancelAnimationFrame(lap); io?.disconnect(); ro?.disconnect();
      renderer.dispose(); renderer.forceContextLoss?.(); scene.traverse(o => { o.geometry?.dispose?.(); o.material?.map?.dispose?.(); o.material?.dispose?.(); });
    }
    return {
      dmg: () => { hit = 0.75; }, treu: () => { treu = 1.1; }, gap: on => { gap = Boolean(on); },
      thang: () => { thang = thang || 0.001; thua = 0; }, thua: () => { thua = thua || 0.001; thang = 0; }, huy
    };
  }

  window.Boss3D = { mount, EMOJI, MAU };
})();
