# OLA2 - 訂單識別助手 🦷

> Labubu 風格的 AI 自動識別訂單系統

## 🎨 特色

- **Labubu 主題設計** - 咖啡色、奶油色、粉色配色
- **AI 智能識別** - 使用 Google Gemini 2.0 Flash
- **響應式介面** - 適配所有手機尺寸
- **一鍵分享** - 支援複製和 Web Share API

## 📦 專案結構

```
識圖傳單/
├── backend_new/          # Cloudflare Workers 後端
│   ├── src/
│   │   └── index.ts     # API 端點
│   ├── package.json
│   └── wrangler.toml    # Workers 配置
│
└── frontend_new/         # Next.js 前端
    ├── app/
    │   ├── page.tsx     # 主頁面
    │   ├── layout.tsx   # 布局
    │   └── globals.css  # Labubu 樣式
    ├── components/
    ├── .env.production  # 生產環境變數
    └── next.config.mjs  # Next.js 配置
```

## 🚀 部署

### 後端（Cloudflare Workers）

```bash
cd backend_new
npm install
npx wrangler secret put GEMINI_API_KEY  # 設定 API Key
npx wrangler deploy
```

### 前端（Cloudflare Pages）

1. 連結 GitHub: `lalawgwg99/ola2`
2. 設定參數：
   - **Root directory**: `frontend_new`
   - **Build command**: `npm run build`
   - **Output directory**: `out`
3. 環境變數：
   - `NEXT_PUBLIC_API_URL` = `https://ola2-backend.lalawgwg99.workers.dev`

## 🔗 網址

- **後端**: <https://ola2-backend.lalawgwg99.workers.dev>
- **前端**: (由 Cloudflare Pages 提供)

## 💡 本地開發

```bash
# 後端
cd backend_new
npm install
npx wrangler dev

# 前端
cd frontend_new
npm install
npm run dev
```

---
設計：WG德 🐸🦷
