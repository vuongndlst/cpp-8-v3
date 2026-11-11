(() => {
  "use strict";
  const choices = {
    "c1-khoi": {
      "Luôn chạy, với mọi số ly": ["Thử nhập 2 ly. Máy có đi qua dòng 8 không?", "c1-dc2"],
      "Khi điều kiện ở dòng 7 sai": ["Với 5 ly, tính 5 > 3 rồi theo dấu dòng 8.", "c1-dc5"],
      "Chỉ khi khách gõ đúng số 3": ["Đọc 3 > 3 thành lời rồi dự đoán dòng 8 có chạy không.", "c1-dc3"]
    },
    "c1-sau": {
      "Chỉ khi khách được tặng topping": ["So sánh lời cảm ơn khi nhập 2 ly với khi nhận topping.", "c1-dc2"],
      "Chỉ khi điều kiện ở dòng 7 sai": ["Khi nhập 5, máy có in lời cảm ơn sau topping không?", "c1-dc5"],
      "Không chạy khi khách gõ số 3": ["Xác định dòng 10 nằm trong hay sau dấu đóng khối if.", "c1-dc3"]
    },
    "c2-nhanh": {
      "Dòng 8 rồi dòng 12": ["Tính 4 >= 5 rồi tìm nhánh dành cho kết quả sai.", "c2-dc4"],
      "Dòng 8, 10 rồi dòng 12": ["Theo dấu một lần chạy với 4 ly. Đếm số nhánh được thực hiện.", "c2-dc4"],
      "Chỉ chạy dòng 12": ["Khi điều kiện sai, dòng nào trong else chạy trước lời cảm ơn?", "c2-dc4"]
    },
    "c2-else": {
      "Luôn chạy ngay sau khối if": ["Thử 5 ly. Máy có chạy cả dòng 8 và dòng 10 không?", "c2-dc5"],
      "Chỉ khi soLy bằng đúng 5": ["Tính 5 >= 5 trước, rồi chọn nhánh tương ứng.", "c2-dc5"],
      "Khi điều kiện ở dòng 7 đúng": ["Với 4 ly, điều kiện sai. Theo dấu xem máy vào nhánh nào.", "c2-dc4"]
    }
  };
  const statements = {
    "c1-moc": [
      ["Hai số bằng nhau thì số bên trái có lớn hơn số bên phải không?", "c1-dc3"],
      ["Dấu lớn hơn hoặc bằng nhận cả trường hợp bằng nhau. Hãy xét riêng 3 và 3.", "c1-dc3"],
      ["Đọc “từ 3” như một khoảng bắt đầu ở số nào. Số bắt đầu có thuộc khoảng không?", "c1-dc3"],
      ["Thêm một lần chạy đúng 3 ly vào bộ thử 2 và 5 rồi so sánh kết quả.", "c1-dc3"]
    ],
    "c2-mot": [
      ["Theo dấu một lần chạy. Máy bỏ qua nhánh còn lại ở đâu?", "c2-dc4"],
      ["Dòng 12 nằm sau dấu đóng khối if–else. Thử xem nó có chạy với 4 ly không.", "c2-dc4"],
      ["Xem lại mẫu } else {. Khi điều kiện if sai, máy đã biết đi vào phần còn lại chưa?", "c2-dc4"],
      ["Ba số 4, 5, 6 nằm ở đâu so với mốc 5? Số nào kiểm tra trường hợp vừa đủ?", "c2-dc5"]
    ]
  };
  const supports = id => Boolean(choices[id] || statements[id] || id === "c2-dien");
  const text = html => {
    const node = document.createElement("div");
    node.innerHTML = html;
    return node.textContent;
  };

  function render({ task, card, evidence, record, save, review }) {
    card.querySelector(".cpp-answer-feedback")?.remove();
    if (evidence.ok) return;
    const signature = JSON.stringify(evidence);
    const repeated = record?.signature === signature;
    save({ signature });
    const entries = [];
    if (task.type === "choice") {
      const suggestion = choices[task.id]?.[evidence.selected];
      if (suggestion) entries.push({ label: `Bạn vừa chọn “${evidence.selected}”`, suggestion });
    } else if (task.type === "truefalse") {
      for (const { index, selected } of evidence.wrong) {
        entries.push({ label: `Ý ${index + 1} · bạn chọn ${selected ? "Đúng" : "Sai"}`,
          statement: text(task.items[index].text), suggestion: statements[task.id][index] });
      }
    } else {
      for (const { index, value } of evidence.wrong) {
        let hint;
        if (index === 1) hint = "Phần này dành cho toàn bộ trường hợp còn lại. Xem lại từ khóa đứng giữa hai khối trong ví dụ đã chạy.";
        else if (value === ">") hint = "Đơn đúng 100 000 có được miễn phí không? Thay tổng tiền bằng đúng mốc rồi đọc điều kiện.";
        else if (value === "==") hint = "Đơn 150 000 cũng cần miễn phí. Điều kiện này có nhận cả số tiền cao hơn mốc không?";
        else hint = "Thử đơn 99 000. Theo quy tắc, đơn này cần được miễn phí hay phải trả phí?";
        entries.push({ label: `Chỗ trống ${index + 1} · bạn điền “${value}”`, suggestion: [hint, "c2-dc5"] });
      }
    }
    if (!entries.length) return;
    const panel = document.createElement("section");
    panel.className = "cpp-practice-feedback cpp-answer-feedback";
    panel.setAttribute("aria-label", "Phản hồi theo câu trả lời");
    const add = (parent, tag, content) => {
      const el = document.createElement(tag); el.textContent = content; parent.append(el); return el;
    };
    add(panel, "h5", repeated ? "Thử xem một lần chạy cụ thể" : "Thử kiểm chứng câu trả lời");
    for (const entry of entries) {
      const item = add(panel, "div", "");
      add(item, "strong", entry.label);
      if (entry.statement) add(item, "p", entry.statement);
      add(item, "p", entry.suggestion[0]);
      const button = add(item, "button", "Xem lần chạy liên quan");
      button.type = "button"; button.className = "secondary-button";
      button.addEventListener("click", () => review(entry.suggestion[1], task.id));
    }
    card.querySelector("[data-result]").after(panel);
  }

  window.CppAnswerFeedback = { supports, render };
})();
