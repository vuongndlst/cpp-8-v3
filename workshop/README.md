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
