# 📱 Phone SBS 訂單識別助手

> 🚀 Powered by **Gemini 2.0 Flash** AI

## ✨ 功能說明

上傳訂單圖片，AI 自動識別：

- 🏪 店別名稱
- 📅 日期時間
- 📋 訂貨編號 / 發票號碼
- 📦 商品代碼與品名（支援多商品）

識別結果可一鍵分享或複製！

## 🛠️ 技術架構

| 層級 | 技術 |
|------|------|
| 前端 | HTML + JavaScript (原生) |
| 後端 | Cloudflare Pages Functions |
| AI 模型 | Google Gemini 2.0 Flash |
| 安全 | API Key 存放於環境變數 |

## 🚀 部署步驟

1. **連接倉庫**: Cloudflare Pages → Connect to Git → 選擇此倉庫
2. **建置設定**: Build command 留空，Output directory 設為 `/`
3. **環境變數**: Settings → Environment variables → 添加 `GEMINI_API_KEY`
4. **完成部署**: 推送任何變更自動觸發部署

## 🌐 線上版本

**<https://phonesbs.pages.dev>**

---
*Designed by 德*
