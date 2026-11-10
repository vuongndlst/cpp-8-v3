(() => {
  "use strict";

  // Gợi ý biên tập từ các tình huống mẫu đã soạn với Gemini.
  const topics = {
    boundary: {
      title: "Thử đúng mốc 3 ly",
      hint: "Chương trình chưa tặng topping khi nhập đúng 3 ly. Quy tắc “từ 3 ly trở lên” tính trường hợp này thế nào?",
      more: "Đọc điều kiện ở dòng if với số ly bằng 3. Sau khi sửa, thử lại với 2, 3 và 4 ly.",
      exercise: {
        question: "Được giảm giá khi mua từ 5 quyển vở trở lên. Số quyển nào dễ phát hiện lỗi bỏ sót đúng mốc?",
        options: ["4 quyển", "5 quyển", "6 quyển"], answer: 1,
        explanation: "5 là đúng mốc. Thử đúng mốc giúp phân biệt “lớn hơn” và “lớn hơn hoặc bằng”."
      }
    },
    branchBoundary: {
      title: "Thử đúng mốc 100 000 đồng",
      hint: "Với 100 000 đồng, chương trình vẫn in dòng tính phí. Theo đề, đơn đúng mốc thuộc nhánh nào?",
      more: "Thay tổng tiền trong điều kiện bằng 100 000 và đọc xem máy vào nhánh nào. Thử lại dưới, đúng và trên mốc sau khi sửa.",
      exercise: {
        question: "Đơn từ 80 000 đồng được tặng quà, các đơn còn lại không có quà. Với đơn đúng 80 000 đồng, chương trình cần chọn nhánh nào?",
        options: ["Nhánh tặng quà", "Nhánh không có quà", "Cả hai nhánh"], answer: 0,
        explanation: "Cụm “từ 80 000” bao gồm cả đơn đúng 80 000 đồng."
      }
    },
    emptyIf: {
      title: "Kiểm tra dấu ngay sau if",
      hint: "Có dấu chấm phẩy ngay sau điều kiện if. Dấu đó kết thúc câu lệnh ở đâu?",
      more: "Nhìn vị trí dấu chấm phẩy so với khối { }. Thử đọc xem khối còn nằm trong if hay đã thành câu lệnh riêng.",
      exercise: {
        question: "Với `if (n > 0); { cout << n; }`, nhập n = 0 thì màn hình in gì?",
        options: ["Không in gì", "In 0", "In 1"], answer: 1,
        explanation: "Dấu chấm phẩy là thân rỗng của if. Khối sau đó vẫn chạy và in 0."
      }
    },
    missingThanks: {
      title: "Kiểm tra lệnh cần chạy mỗi lần",
      hint: "Khi nhập 2 ly, màn hình chưa in lời cảm ơn. Khách không nhận topping có cần được cảm ơn không?",
      more: "Tìm dấu đóng khối của if rồi đọc các lệnh bên trong và bên ngoài khối. Thử lại một số ở dưới mốc.",
      exercise: {
        question: "Chương trình in lời chúc riêng khi đủ điểm và luôn in “Hẹn gặp lại”. Lệnh in “Hẹn gặp lại” nên đặt ở đâu?",
        options: ["Trong khối if", "Sau khối if", "Bên trong điều kiện của if"], answer: 1,
        explanation: "Lệnh sau khối if chạy cả khi điều kiện đúng lẫn khi điều kiện sai."
      }
    },
    assignment: {
      title: "Phân biệt phép gán và phép so sánh",
      hint: "Trong điều kiện if có phép gán. Em định thay đổi giá trị của biến hay kiểm tra giá trị của biến?",
      more: "Đọc điều kiện thành lời. Kiểm tra lại phép toán tại vị trí muốn hỏi hai giá trị có bằng nhau không.",
      exercise: {
        question: "Trong C++, biểu thức nào chỉ kiểm tra xem biến n có bằng 5?",
        options: ["n = 5", "n == 5", "n + 5"], answer: 1,
        explanation: "Hai dấu bằng dùng để so sánh. Một dấu bằng dùng để gán giá trị."
      }
    },
    elseSyntax: {
      title: "Đọc lại cấu trúc if–else",
      hint: "Sau else đang có phần trong ngoặc tròn. Khi điều kiện của if sai, máy có cần kiểm tra thêm để vào nhánh else không?",
      more: "Xác định điều kiện của if trước. Sau đó đặt các lệnh dành cho trường hợp còn lại vào khối của else.",
      exercise: {
        question: "Trong `if (n > 0) { … } else { … }`, máy chạy nhánh else khi nào?",
        options: ["Khi n lớn hơn 0", "Khi n bằng 0 hoặc nhỏ hơn 0", "Trong mọi trường hợp"], answer: 1,
        explanation: "Nhánh else chạy khi điều kiện của if sai, nên ở đây n có thể bằng 0 hoặc nhỏ hơn 0."
      }
    },
    missingElse: {
      title: "Dùng một cấu trúc hai nhánh",
      hint: "Kết quả đã khớp các test, nhưng bài còn yêu cầu cấu trúc if–else. Hai trường hợp nào chia hết mọi giá trị của tổng tiền?",
      more: "Đặt một trường hợp trong if và đặt trường hợp còn lại trong else. Mỗi lần chạy chỉ cần in một dòng về phí giao.",
      exercise: {
        question: "Một đơn hoặc được miễn phí, hoặc phải trả phí. Mỗi lần chạy một cấu trúc if–else sẽ thực hiện mấy nhánh?",
        options: ["Đúng một nhánh", "Cả hai nhánh", "Luôn bỏ qua cả hai nhánh"], answer: 0,
        explanation: "Nếu điều kiện đúng thì chạy nhánh if. Nếu sai thì chạy nhánh else."
      }
    },
    output: {
      title: "Tìm dòng in đầu tiên bị lệch",
      hint: "So sánh dòng đầu tiên chưa khớp với màn hình mẫu. Dòng đó bị thiếu, bị dư hay chỉ khác chữ hoặc dấu xuống dòng?",
      more: "Thử lại đúng giá trị của test chưa đạt rồi đọc các câu lệnh cout mà máy đi qua. Sửa từng điểm và kiểm tra lại."
    },
    run: {
      title: "Xem lỗi trong Màn hình",
      hint: "Đọc lỗi trong ô Màn hình. Nếu có số dòng, hãy kiểm tra cả dòng được báo và dòng ngay trước đó.",
      more: "Rà dấu chấm phẩy, ngoặc tròn và ngoặc nhọn quanh chỗ báo lỗi. Sửa một lỗi rồi kiểm tra lại."
    }
  };

  const tasks = {
    "c1-sua": {
      hint: "Đọc điều kiện trong if rồi thử lần lượt 2, 3 và 4 ly. Trường hợp nào đang khác quy tắc của quầy?",
      verify: {
        question: "Quy định cho phép qua vòng loại từ 6 điểm. Chương trình dùng điều kiện `diem > 6`. Khi nhập đúng 6, chương trình xử lý thế nào?",
        options: ["Cho qua vòng loại", "Bỏ sót người đủ điểm", "Không đánh giá được điều kiện"], answer: 1,
        explanation: "6 không lớn hơn 6, nên điều kiện đã bỏ sót người vừa đủ điểm."
      }
    },
    "c2-viet": {
      hint: "Chọn ba tổng tiền dưới, đúng và trên 100 000 đồng. Với từng số, dự đoán dòng nào về phí giao phải xuất hiện.",
      verify: {
        question: "Kiện từ 4 kg dùng thùng lớn, kiện còn lại dùng thùng nhỏ. Một kiện đúng 4 kg đi vào nhánh nào?",
        options: ["Nhánh dùng thùng nhỏ", "Cả hai nhánh", "Nhánh dùng thùng lớn"], answer: 2,
        explanation: "“Từ 4 kg” gồm cả kiện đúng 4 kg. Mỗi kiện chỉ cần một loại thùng."
      }
    }
  };

  function withoutText(code) {
    return code.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g, " ");
  }

  function diagnose(taskId, code, failure) {
    const source = withoutText(code);
    if (failure.kind === "run") return /\belse\s*\(/.test(source) ? "elseSyntax" : "run";
    if (failure.kind === "rule" && taskId === "c2-viet" && !/\belse\b/.test(source)) return "missingElse";
    if (failure.kind !== "output") return null;
    if (/\bif\s*\((?:[^()]|\([^()]*\))*\)\s*;/.test(source)) return "emptyIf";
    const conditions = [...source.matchAll(/\bif\s*\(([^()]*)\)/g)].map(m => m[1]);
    if (conditions.some(c => /[^=!<>]=[^=]/.test(c))) return "assignment";
    if (taskId === "c1-sua" && failure.input === "3" && !failure.actual.includes("Tang topping")
      && conditions.some(c => /^\s*soLy\s*>\s*3\s*$/.test(c))) return "boundary";
    if (taskId === "c1-sua" && failure.input === "2" && !failure.actual.includes("Cam on quy khach!")) return "missingThanks";
    if (taskId === "c2-viet" && failure.input === "100000" && failure.actual.includes("Phi giao: 15000")
      && conditions.some(c => /^\s*tongTien\s*>\s*100000\s*$/.test(c))) return "branchBoundary";
    return "output";
  }

  function mount({ card, editor, taskId, getRecord, saveRecord, fingerprint, canUse, next }) {
    const task = tasks[taskId];
    const panel = document.createElement("section");
    panel.className = "cpp-practice-feedback";
    panel.setAttribute("aria-label", "Việc tiếp theo của em");
    panel.hidden = true;
    card.querySelector("[data-result]").after(panel);

    const current = () => fingerprint(editor.value);
    const focusCode = () => {
      editor.focus({ preventScroll: true });
      editor.scrollIntoView({ block: "nearest" });
    };
    const add = (parent, tag, text) => {
      const node = document.createElement(tag);
      node.textContent = text;
      parent.append(node);
      return node;
    };
    const button = (parent, label, action) => {
      const node = add(parent, "button", label);
      node.type = "button";
      node.className = "secondary-button";
      node.addEventListener("click", () => { if (canUse()) action(); });
      return node;
    };

    function exercise(question, saveAnswer) {
      const group = add(panel, "fieldset", "");
      add(group, "legend", question.question.replaceAll("`", ""));
      const options = question.options.map((text, i) => {
        const label = add(group, "label", "");
        const input = add(label, "input", "");
        input.type = "radio";
        input.name = `practice-${taskId}`;
        input.value = i;
        add(label, "span", text);
        return input;
      });
      const check = button(group, "Kiểm tra câu luyện", () => {
        const index = options.findIndex(input => input.checked);
        if (index < 0) { message.textContent = "Chọn một phương án rồi kiểm tra nhé."; return; }
        const correct = index === question.answer;
        saveAnswer(correct);
        message.textContent = correct ? question.explanation : "Chưa đúng. Bạn đọc lại quy tắc và thử lại nhé.";
        if (correct) {
          check.disabled = true;
          options.forEach(input => { input.disabled = true; });
          if (getRecord()?.result !== "pass") button(group, "Quay lại sửa code", focusCode);
        }
      });
      const message = add(group, "p", "");
      message.setAttribute("role", "status");
      options[0].focus();
    }

    function render({ introductory = false, moveFocus = false } = {}) {
      const record = getRecord() || {};
      const matches = record.snapshot === current();
      const topic = matches ? topics[record.kind] : null;
      const passed = matches && record.result === "pass";
      panel.hidden = !introductory && !topic && !passed;
      panel.replaceChildren();
      if (panel.hidden) return;
      const heading = add(panel, "h5", "Việc tiếp theo của em");
      heading.tabIndex = -1;
      if (topic) {
        add(panel, "strong", topic.title);
        add(panel, "p", topic.hint);
        if (record.more) add(panel, "p", topic.more);
        else button(panel, "Gợi ý rõ hơn", () => {
          saveRecord({ ...getRecord(), usedHint: true, more: true });
          render({ moveFocus: true });
        });
        if (topic.exercise && record.repeated) {
          if (record.practised) button(panel, "Quay lại sửa code", focusCode);
          else {
            const start = button(panel, "Luyện nhanh", () => {
              start.remove();
              saveRecord({ ...getRecord(), usedHint: true });
              exercise(topic.exercise, correct => {
                if (correct) saveRecord({ ...getRecord(), practised: true });
              });
            });
          }
        }
      } else if (passed) {
        if (!record.verified) {
          add(panel, "p", record.usedHint
            ? "Bạn đã sửa code đúng sau khi xem gợi ý. Thử một tình huống khác để tự kiểm tra nhé."
            : "Code đã đạt test. Bạn có thể thử thêm một tình huống để kiểm tra mình đã hiểu quy tắc.");
          const start = button(panel, "Thử một câu tương tự", () => {
            start.remove();
            exercise(task.verify, correct => {
              const saved = getRecord();
              saveRecord({ ...saved, verificationTried: true, verified: correct,
                verifiedIndependently: correct && !saved.verificationTried });
            });
          });
        } else add(panel, "p", record.verifiedIndependently
          ? "Bạn đã tự giải đúng tình huống tương tự ngay lần đầu."
          : "Bạn đã giải đúng tình huống tương tự sau khi thử lại.");
        button(panel, "Sang phần tiếp theo", next);
      } else add(panel, "p", task.hint);
      if (moveFocus) heading.focus({ preventScroll: true });
    }

    function checked(code, verdict) {
      const previous = getRecord() || {};
      const snapshot = current();
      if (verdict.ok) {
        saveRecord({ ...previous, snapshot, kind: null, result: "pass" });
      } else if (verdict.failure) {
        const kind = diagnose(taskId, code, verdict.failure);
        const sameKind = Boolean(kind) && previous.kind === kind;
        const sample = fingerprint(code.trim().replace(/\s+/g, " "));
        saveRecord({ ...previous, snapshot, sample, kind, result: "fail", usedHint: previous.usedHint || Boolean(kind),
          repeated: sameKind && (previous.repeated || previous.sample !== sample),
          more: sameKind && previous.more, practised: sameKind && previous.practised });
      }
      render();
    }

    render();
    return {
      checked, edited: () => render(),
      hint() {
        if (!canUse()) return;
        const previous = getRecord() || {};
        saveRecord({ ...previous, usedHint: true });
        render({ introductory: true, moveFocus: true });
        panel.scrollIntoView({ block: "nearest" });
      }
    };
  }

  window.CppPracticeFeedback = { supports: id => Object.hasOwn(tasks, id), mount };
})();
