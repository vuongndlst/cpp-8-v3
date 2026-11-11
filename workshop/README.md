# Demo workshop giáo viên

Demo Bài 3 gọi Gemini theo đoạn code và test vừa trượt. Khóa được nạp từ biến môi trường `GEMINI_API_KEY` trên máy chủ.

## Chạy trên máy

Cài Node.js 24. Tạo `.env` ở thư mục gốc repo theo `.env.example`, điền khóa Gemini, rồi chạy từ thư mục repo.

```powershell
node workshop/server.cjs
```

Mở http://127.0.0.1:8765/ và chọn một trong hai bài mẫu. Bấm Kiểm tra test case, rồi bấm Hỏi Gemini về code này.

## GitHub Environment

Environment `workshop-demo` chứa secret `GEMINI_API_KEY`. Workflow **Check Gemini workshop demo** dùng secret này để khởi động demo và kiểm tra một phản hồi Gemini với code giả lập. Chạy tại Actions → Check Gemini workshop demo → Run workflow.

GitHub Environments cung cấp secret cho workflow. Để có đường dẫn demo chạy liên tục trên Internet, cần triển khai máy chủ Node lên dịch vụ hosting và cấu hình secret ở dịch vụ đó. Máy chủ hiện lắng nghe tại địa chỉ loopback để chạy workshop trên máy giáo viên.

GitHub Pages phục vụ phần web tĩnh. Workflow Pages chỉ đóng gói các tài nguyên web công khai. Mã workshop nằm trong repo tại thư mục này.

## Bản thử trong Bài 3

Mở `bai03/?mode=read&phanhoi=1` trên web GitHub để dùng phản hồi Gemini ngay trong bài. Phản hồi theo lựa chọn sai, từng ý đúng/sai và từng giá trị điền khuyết có sẵn ở Bài 3.

API online có địa chỉ ổn định qua Sites. Bản thử workshop hiện chuyển tiếp qua một Quick Tunnel HTTPS đến máy giáo viên vì Gemini từ chối vị trí chạy của Worker. Máy giáo viên và hai tiến trình Node/cloudflared cần tiếp tục chạy. Khi tạo lại Quick Tunnel, cập nhật secret `TEACHER_API_URL` trong Sites và triển khai lại cùng phiên bản. Đây là kết nối tạm thời cho demo.

Chế độ chỉ phục vụ API trên máy giáo viên được bật bằng `CPP_WORKSHOP_API_ONLY=1`, với `CPP_WORKSHOP_PORT=8766`. Cloudflared trỏ tới `http://127.0.0.1:8766` và đặt `--http-host-header 127.0.0.1:8766`.
