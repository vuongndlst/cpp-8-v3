(() => {
  "use strict";
  const examples = JSON.parse(document.querySelector("#examples").textContent);
  for (const button of document.querySelectorAll("[data-example]")) {
    button.addEventListener("click", () => {
      try {
        const { index, state } = examples[Number(button.dataset.example)];
        const name = `Demo giáo viên · Mẫu ${index + 1}`;
        const saved = LocalLearning.profiles().find(profile => profile.display_name === name);
        const profile = LocalLearning.create(name, "8A1", saved?.id);
        LocalLearning.save(profile.id, "bai03", state);
        sessionStorage.setItem(LocalLearning.ns + "confirmed", profile.id);
        sessionStorage.setItem(LocalLearning.ns + "confirmed-at", String(Date.now()));
        sessionStorage.removeItem(LocalLearning.ns + "ended");
        location.href = `/bai03/?mode=read&chang=${index}&phanhoi=1`;
      } catch {
        document.querySelector("#notice").textContent = "Chưa mở được tình huống. Hãy kiểm tra trình duyệt có cho phép lưu dữ liệu trên máy này.";
      }
    });
  }
})();
