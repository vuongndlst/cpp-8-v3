# cpp-8-v3 — web học C++ lớp 8 (bản V3)

Học bằng họ tên và lớp, không đăng nhập. Tiến độ lưu trên trình duyệt của từng học sinh (khoá riêng `cpp-8-v3`, không lẫn với bản v2).

Mỗi bài là một Đảo C++ gồm Chặng 1, Chặng 2 và Checkpoint. Trước mỗi trạm có một trò chơi ngắn rút từ 10 trò. Mỗi chặng có 6 tab: Bối cảnh → Đoán rồi chạy → Kiểm chứng → Ghi nhớ → Luyện tập → Phản tư.

Nội dung bài học được soạn ở `99. Lưu trữ/_Nguon_ChuanMoi/<bai>/lesson.js` (thư mục khoá V2), kiểm bằng `kiem_tra.cjs`, đóng gói bằng `dong_goi.cjs` vào `lessons/`. Đáp án mẫu `_kiem_tra/dap_an_*.js` chỉ giữ trên máy thầy, không đăng.

## Cập nhật 27/10/2026 · 20261027-boss30

- Boss của cả sáu bài bám theo cuộn ở cột bên phải; màn hình hẹp dùng thanh gọn và nút hiện/thu nhân vật.
- Máu Boss và điều kiện nhận bạc/vàng dùng chung `runtime/cpp/engine/progress.js`. Nút nhận bạc nằm trước bài nâng cao, có danh sách nhiệm vụ còn thiếu. Hai nút chứng chỉ đều mở mẫu C++ có hạng huy hiệu.
- Game đầu trạm tối đa 30 giây cho cả lượt, gồm thử lại; mục tiêu các trò được giảm. Assignment cũ giữ trò/seed và lượt đã dùng, chỉ giảm thời lượng.

Kiểm tra logic: `node _kiem_tra/boss_arcade_checks.cjs`.

Kiểm tra trình duyệt: `node _kiem_tra/boss_arcade_browser.cjs` (cần Playwright và Edge; đặt `PLAYWRIGHT_MODULE` tới module Playwright nếu dùng runtime có sẵn). Bộ kiểm tra dùng localhost và hồ sơ tạm, tải đúng Three.js 0.160.0; ảnh và kết quả nằm ở `../_KiemTra_Boss_20261027/`.

Đã qua 360 tổ hợp bài/hồ sơ/lượt Boss và các ca thiếu nhiệm vụ; kiểm tra cuộn desktop/mobile của cả sáu bài, hai đường nhận chứng chỉ bạc/vàng, mười game và ngân sách thời gian dùng chung khi thử lại. Bộ kiểm nội dung chuẩn mới của sáu bài: 1.187 kiểm tra, 0 lỗi.

## Nhập cin trực tiếp · 20261027-inlinecin

Nút Chạy thực thi đến từng lần đọc `cin`, in câu dẫn có sẵn rồi chờ trong Màn hình. Con trỏ thật nằm ngay sau câu dẫn (ví dụ `Nhap so xe dap: `), cùng dòng, cùng phông/chữ/màu với output; nhấn Enter mới in câu hỏi tiếp theo. Chỉ có một mũi tên nhỏ bên dưới chỉ vào chỗ nhập. Không có hộp vàng, nhãn “Nhập tại đây”, placeholder hoặc nút Gửi; lời nhắc cho trình đọc màn hình vẫn được giữ. Có Dừng, không điền sẵn dữ liệu cũ; nhập sai được sửa tại chỗ.

`interactive-runtime.js` gắn adapter vào toán tử nhập của đúng bản JSCPP đang dùng, giữ nguyên stack/biến qua mỗi lần chờ. Không chạy lại chương trình, không chỉnh bundle hoặc viết lại mã C++ của học sinh. Thời gian chờ gõ không tính vào giới hạn CPU; vẫn giới hạn chạy vòng lặp và output. `cpp-runner.js` truyền phiên bản xuống worker và các script được import.

Kiểm tra test case dùng dữ liệu đã soạn, không phụ thuộc vào lần chạy thử. Đoán rồi chạy chờ học sinh gõ đúng giá trị theo tình huống trước khi cập nhật Bộ nhớ; Chạy hết cũng chờ, Chạy lại hủy lượt chờ cũ. Chuyển phần/chặng, đóng bài hoặc Boss hết giờ sẽ dừng phiên; callback muộn không mở lại ô đã khóa.

Kiểm tra: `node _kiem_tra/cin_checks.cjs`; `node _kiem_tra/cin_browser.cjs` (Playwright/Edge như trên). Bộ đối chiếu 28 nhiệm vụ/82 test case đọc đáp án riêng trên máy thầy nếu có, không chép đáp án vào web. Kiểm tra trình duyệt đo vị trí con trỏ sát cuối output, mũi tên và cùng dòng ở desktop/mobile, gồm cả 13 ví dụ cin có trace; xác nhận câu hỏi sau chưa xuất hiện trước Enter. Các ca dữ liệu sai, chờ hơn 3,5 giây, Dừng, chuyển phần, Boss hết giờ và chấm không cần nhập trước vẫn được giữ. Ảnh và kết quả ở `../_KiemTra_Cin_20261027/`.
