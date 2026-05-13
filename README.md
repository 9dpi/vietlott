# 🎰 Vietlott AI Predictor

> **Ứng dụng dự đoán xổ số Vietlott thông minh với AI, Backtest và Tự học**

[![Deploy to GitHub Pages](https://github.com/9dpi/vietlott/actions/workflows/deploy.yml/badge.svg)](https://github.com/9dpi/vietlott/actions/workflows/deploy.yml)

## 🌐 Demo trực tiếp

👉 **[https://9dpi.github.io/vietlott/](https://9dpi.github.io/vietlott/)**

---

## ✨ Tính năng

### 1. 🔮 Trí tuệ Nhân tạo (Gemini AI)
- Sử dụng Google Gemini 2.5 Flash để phân tích lịch sử và đưa ra dự đoán.
- Hệ thống tự động đẩy các quy luật (Insights) mà bộ máy Tự Học khám phá được vào trong câu lệnh (Prompt) của AI, giúp AI tiến hóa sau mỗi kỳ quay.
- 4 chiến lược chọn số: **Balanced Mix**, **Hot Focus**, **Cold Focus**, **AI Co-Pilot**.

### 2. 📡 Nguồn Dữ liệu Kép (Local + Live)
- **Local:** Tích hợp cứng 1,344 kỳ quay từ 2017 đến nay, đảm bảo dữ liệu luôn đầy đủ ngay khi mở app.
- **Live:** Tự động Auto-Fetch kết quả mới nhất từ Github sau mỗi kỳ quay (Power 6/55: Thứ 3, 5, 7 lúc 18:00 ICT).
- Tự động gộp dữ liệu và xóa trùng lặp, đảm bảo không bao giờ bị gián đoạn.

### 3. 🧠 Tự học (Self-Learning) & Backtest
- Mượn cỗ máy **Backtest** để giả lập đánh thử 200 ngày trong quá khứ mà không nhìn trước kết quả.
- Rút ra bài học từ các dự đoán sai/đúng (ví dụ: số nào hay về cùng nhau, khoảng số nào an toàn).
- Tạo thành vòng lặp tự động: *Dữ liệu mới -> Backtest -> Tự Học -> AI thông minh hơn*.

### 4. 📈 Bảng Quản Trị & Thống Kê (Admin Dashboard)
- Hệ thống chạy ngầm toàn bộ quy trình: Quét dữ liệu -> Phân tích -> Gửi Email -> Lưu Log.
- Bảng Admin Dashboard lưu lại toàn bộ Nhật ký hoạt động (Logs) của hệ thống.
- **Phân Tích Lịch Sử:** Hiển thị khối lượng dữ liệu, Số nóng nhất, Tỷ lệ Lẻ/Chẵn, và Tổng trung bình trên nền tảng 1,344+ kỳ quay.

### 5. 🔒 Bảo mật tuyệt đối (Passcode Lock)
- Giao diện khóa App bằng mã bảo vệ (Passcode: `989999`).
- Cơ chế lưu trữ `sessionStorage`: API Key và trạng thái đăng nhập sẽ bốc hơi hoàn toàn và vĩnh viễn ngay khi bạn đóng trình duyệt.

---

## 🚀 Cài đặt & Chạy local

```bash
# Clone repo
git clone https://github.com/9dpi/vietlott.git
cd vietlott

# Cài dependencies
npm install

# Tạo file .env
cp .env.example .env
# Điền GEMINI_API_KEY vào .env

# Chạy dev server
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`

---

## 🔑 Bảo mật & Cấu hình

1. App yêu cầu mã bảo vệ khi mở lên: **`989999`**.
2. Lấy API key tại [Google AI Studio](https://aistudio.google.com/)
3. Click nút **"API Key"** trong app để nhập.
4. Key và Passcode được lưu trong **sessionStorage** — sẽ bị hủy hoàn toàn khi bạn đóng trình duyệt web. Khuyến khích mức độ an toàn cao nhất!

---

## 🌍 Deploy lên GitHub Pages

### Tự động (GitHub Actions)
Push lên branch `main` → GitHub Actions tự build và deploy.

**Thiết lập một lần:**
1. Vào **Settings → Pages** → Source: **GitHub Actions**
2. Vào **Settings → Secrets** → Thêm `GEMINI_API_KEY` (tùy chọn)

### Thủ công
```bash
npm run build
# Nội dung trong dist/ upload lên GitHub Pages
```

---

## 🗂️ Cấu trúc dự án

```
vietlott/
├── components/
│   ├── BacktestPanel.tsx      # Backtest engine UI
│   ├── SelfLearningPanel.tsx  # Self-learning & accuracy tracking
│   ├── PredictionPanel.tsx    # AI prediction interface
│   ├── Dashboard.tsx          # Main dashboard layout
│   └── ...
├── services/
│   ├── autoFetchService.ts    # Auto-fetch scheduler
│   ├── backtestService.ts     # Backtest engine logic
│   ├── geminiService.ts       # Gemini AI integration
│   ├── predictionAnalysisService.ts  # Self-learning engine
│   └── vietlottApiService.ts  # Data fetching from GitHub
├── hooks/
│   ├── useLotteryData.ts      # Data loading hook
│   └── useStore.ts            # Zustand global state
└── .github/workflows/
    └── deploy.yml             # GitHub Pages auto-deploy
```

---

## ⚠️ Disclaimer

Ứng dụng này **chỉ mang tính giải trí và nghiên cứu thống kê**. Xổ số là trò chơi may rủi, không có phương pháp nào đảm bảo kết quả. Hãy chơi có trách nhiệm.

---

## 📄 Dữ liệu

Dữ liệu thực được lấy từ: [vietvudanh/vietlott-data](https://github.com/vietvudanh/vietlott-data) — Tự động cập nhật hàng ngày.

---

*Built with ❤️ using React + Vite + Gemini AI*