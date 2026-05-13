# 🎰 Vietlott AI Predictor

> **Ứng dụng dự đoán xổ số Vietlott thông minh với AI, Backtest và Tự học**

[![Deploy to GitHub Pages](https://github.com/9dpi/vietlott/actions/workflows/deploy.yml/badge.svg)](https://github.com/9dpi/vietlott/actions/workflows/deploy.yml)

## 🌐 Demo trực tiếp

👉 **[https://9dpi.github.io/vietlott/](https://9dpi.github.io/vietlott/)**

---

## ✨ Tính năng

### 1. 🔮 Dự đoán AI (Gemini)
- Sử dụng Google Gemini 2.5 Flash để phân tích lịch sử và dự đoán
- 4 chiến lược: **Balanced Mix**, **Hot Focus**, **Cold Focus**, **AI Co-Pilot**
- Phân tích tần suất, momentum, hot/cold numbers

### 2. 📡 Tự động lấy kết quả (Auto-Fetch)
- Tự động tải kết quả mới theo lịch xổ số:
  - **Power 6/55**: Thứ 3, 5, 7 (18:00 ICT)
  - **Mega 6/45**: Thứ 4, 6, CN (18:00 ICT)
- Kiểm tra mỗi 5 phút, tự động cập nhật UI
- Dữ liệu thực từ [vietvudanh/vietlott-data](https://github.com/vietvudanh/vietlott-data)

### 3. 🧠 Tự học (Self-Learning)
- Tự động so sánh mỗi dự đoán với kết quả thực
- Tính toán độ chính xác theo thời gian
- Phân tích pattern: consecutive numbers, frequency, range, sum
- Đề xuất chiến lược cải thiện dựa trên lịch sử

### 4. 📊 Backtest Engine
- Kiểm tra hiệu quả chiến lược trên dữ liệu lịch sử
- 4 chiến lược: HOT, COLD, BALANCED, RANDOM
- Xem biểu đồ kết quả, phân phối prize, win rate
- Tùy chỉnh lookback period và số lần test

### 5. 📈 Dashboard Phân tích
- Heatmap tần suất theo số
- Biểu đồ lịch sử kết quả
- Lịch sử dự đoán với kết quả đối chiếu
- Simulation mode để test dự đoán ngược

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

## 🔑 Cấu hình API Key

1. Lấy API key tại [Google AI Studio](https://aistudio.google.com/)
2. Click nút **"API Key"** trong app để nhập
3. Key được lưu trong sessionStorage (không lưu vĩnh viễn)

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