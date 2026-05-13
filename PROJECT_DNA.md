# 🧬 Vietlott AI Predictor - Project DNA

> Tài liệu này mô tả mã gen (Core Logic & Architecture) của dự án Vietlott AI. Bất kỳ ai tiếp quản hoặc phát triển dự án cần đọc kỹ để hiểu "linh hồn" của hệ thống này.

---

## 1. Triết lý thiết kế (Design Philosophy)
- **Tự động hóa hoàn toàn (Full Automation):** Hệ thống phải có khả năng tự vận hành (quét dữ liệu, học, dự đoán) mà không cần con người nhúng tay.
- **Tiến hóa (Evolutionary):** AI không được dự đoán theo công thức tĩnh. Nó phải thay đổi cách chọn số dựa trên hiệu suất của những dự đoán quá khứ thông qua cơ chế *Self-Learning*.
- **Bảo mật tối đa (Zero-Trust Security):** Vì hệ thống dùng API Key nhạy cảm và yêu cầu tính riêng tư cá nhân, toàn bộ thông tin xác thực phải "bốc hơi" khi đóng trình duyệt.
- **Dữ liệu vững chắc (Hybrid Data):** Không bao giờ sợ mất dữ liệu. Luôn có một bản sao cứng (Local JSONL) dự phòng cho quá trình truy xuất, kết hợp với Auto-fetch để có tính cập nhật tức thời (Live).

---

## 2. Cấu trúc Hệ thống Tự động hóa (The Automation Loop)

Trung tâm của dự án là dịch vụ **`automatedSchedulerService`**. Đây là trái tim điều phối 4 nhịp đập chính yếu:

1.  **Nhịp 1 - Theo dõi Thời gian:** Scheduler giám sát thời gian máy khách. Nó biết hôm nay là thứ mấy và đến giờ quay thưởng chưa (ví dụ: Thứ 3,5,7 lúc 18:00 ICT là Power 6/55).
2.  **Nhịp 2 - Kéo Dữ liệu (Auto-Fetch):** Khi đến giờ, hệ thống kích hoạt `vietlottApiService` để lấy kết quả nóng hổi trên Github.
3.  **Nhịp 3 - Tự học (Self-Learning):** Khi có kết quả mới, cỗ máy `predictionAnalysisService` sẽ đối chiếu xem AI dự đoán kỳ trước đúng bao nhiêu số. Nó chạy một lượt Backtest 200 ngày quá khứ để tìm ra các quy luật mới.
4.  **Nhịp 4 - Tiên đoán (AI Prediction):** Gemini AI nhận "Prompt" chứa toàn bộ kết luận từ nhịp 3, từ đó nảy số ra cho kỳ quay tiếp theo. Cuối cùng, kết quả này có thể tự động gửi Email (qua thư viện EmailJS).

---

## 3. Kiến trúc Dữ liệu (Hybrid Data Architecture)

Dữ liệu lịch sử là nguồn sống của AI. Để đảm bảo không bị thiếu hụt, hệ thống dùng mô hình Hybrid:
- **Local Source (`power655.jsonl.txt`):** File tĩnh chứa lịch sử 1,344 kỳ quay từ những năm 2017. Đây là mỏ vàng để AI phân tích Backtest mà không phải fetch tốn tài nguyên.
- **Live Source (`Github Repo`):** Nơi chứa kết quả các kỳ quay mới nhất.
- **Merge Engine:** `vietlottApiService` sẽ gộp 2 nguồn lại. Dùng cơ chế `Map` với ID là Key để **xóa trùng lặp**, cuối cùng trả về mảng dữ liệu duy nhất và sắp xếp từ mới nhất đến cũ nhất.

---

## 4. Tích hợp AI (The Gemini Prompt Injection)

Khác với các ứng dụng dự đoán ngẫu nhiên thông thường, AI trong dự án này được tiêm (inject) tri thức từ hệ thống thống kê bằng toán học:

1. Mảng dữ liệu của AI nhận không chỉ là "10 kết quả gần nhất".
2. Nó bao gồm cả **Tỷ lệ phân bổ (Lẻ/Chẵn, Thấp/Cao, Trung bình cộng)**.
3. Chuyên sâu hơn, nó nhận được **Self-Learning Insights**: "Cặp số nào dạo này hay đi chung?", "Khoảng số nào bị hổng quá lâu?", "Biên độ xuất hiện của các số nóng".
4. Từ đó, AI đóng vai trò như một chuyên gia tổng hợp chứ không phải một cỗ máy random.

---

## 5. Kiến trúc UI & Quản trị (Admin View)

- Giao diện được thiết kế theo phong cách Dark Mode/Glassmorphism cao cấp (`TailwindCSS`).
- Ứng dụng không cho phép truy cập bừa bãi. Bắt buộc vượt qua **Màn hình khóa (Passcode: 989999)**.
- Toàn bộ hoạt động ngầm (Fetch, Analyze, Predict) đều được ghi Log (Nhật ký) và hiển thị trong nút **Quản Trị (AdminDashboard)**. Giúp Admin dễ dàng theo dõi hệ thống có đang khỏe mạnh và tự động làm việc đúng giờ hay không.

---
*Tài liệu này được tạo ra để đảm bảo dự án có thể dễ dàng bảo trì và mở rộng trong tương lai mà không đánh mất đi định hướng cốt lõi ban đầu.*
