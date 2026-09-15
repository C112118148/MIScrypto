# 🥚 雞蛋產銷履歷追蹤系統 — Egg Supply Chain Traceability

> **區塊鏈 x 食品安全** — 將雞蛋從生產到銷售的每一站物流狀態記錄於 **XRPL (XRP Ledger)**，確保資料不可篡改、公開可查。

--- 

## 📌 專案簡介

這是一套基於 **XRPL Testnet** 的農產品溯源 MVP，靈感來自臺灣「雞蛋產銷履歷」的實際需求。  
每顆雞蛋從「生產完成 → 運送中 → 已上架銷售」的每一筆狀態變更，皆透過 **Xaman 錢包** 簽署後寫入 XRPL 交易備忘錄（Memo），消費者只需掃描 QR Code 或輸入商品 ID，即可查閱完整且不可竄改的物流時間軸。

### Why XRPL？

- **低手續費**：每筆交易僅需 0.00001 XRP（Testnet 完全免費）
- **秒級確認**：3–5 秒即完成交易最終確認
- **Memo 機制**：直接在交易附加結構化資料，無需另建資料庫
- **碳節能**：共識機制遠較 PoW 節能，更符合 ESG 精神

---

## ✨ 功能特色

| 功能 | 說明 |
|---|---|
| **🔍 消費者查詢** | 輸入或掃描商品 ID，即時從 XRPL 讀取完整物流時間軸 |
| **📱 Xaman 錢包登入** | 物流人員使用 Xaman App 掃碼簽署，不需帳密系統 |
| **✍️ 區塊鏈寫入** | 每筆物流更新皆經本人簽署後寫入 XRPL，不可篡改 |
| **📦 三階狀態** | 生產完成 → 運送中 → 已上架銷售，覆蓋完整供應鏈 |
| **⏳ 即時輪詢** | 前端自動輪詢 Payload 狀態，簽署完成後立即更新 |
| **🔗 交易瀏覽器連結** | 每筆紀錄可直接連至 XRPL Testnet Explorer 驗證 |

---

## 🏗 系統架構

```
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│  消費者瀏覽器     │     │  物流管理後台       │     │  Xaman 錢包 App  │
│  (index.html)    │     │  (admin.html)     │     │  (簽署工具)       │
└────────┬─────────┘     └────────┬──────────┘     └────────┬─────────┘
         │                        │                        │
         ▼                        ▼                        │
┌──────────────────────────────────────────────────┐        │
│           Express.js REST API (server.js)         │        │
│   POST /api/auth  •  POST /api/logistics/update   │◄───────┘
│   GET  /api/payload/:uuid  •  GET  /api/logistics │
│   GET  /api/health                               │
└─────────────────────┬────────────────────────────┘
                      │   XRPL Client (wss://s.altnet.rippletest.net:51233)
                      ▼
┌─────────────────────────────────────────────────────┐
│              XRPL (XRP Ledger) Testnet               │
│  每筆物流紀錄 → Payment Transaction + Memo (JSON)    │
│  不可篡改、公開查閱                                   │
└─────────────────────────────────────────────────────┘
```

### 資料流程

1. **物流人員** 在後台輸入商品 ID 與狀態
2. 後端建立 Xaman Signing Payload，產生 QR Code
3. **物流人員** 使用 Xaman App 掃碼簽署
4. 簽署完成後，XRPL 產生一筆 `Payment` 交易，Memo 中寫入 `{ itemId, status, timestamp, location }`
5. **消費者** 輸入商品 ID，後端從 XRPL 查詢該商品所有歷史交易，回傳時間軸

---

## 🛠 技術棧

| 類別 | 技術 |
|---|---|
| **後端** | Node.js, Express.js |
| **前端** | 原生 JavaScript (Vanilla JS), HTML5, CSS3 |
| **區塊鏈** | XRPL (XRP Ledger) — Testnet |
| **錢包整合** | Xaman SDK (Xumm SDK v1) |
| **資料儲存** | XRPL Transaction Memo（無傳統資料庫） |
| **索引** | 記憶體 Map + JSON 檔案（僅供快速查詢） |

---

## 🚀 快速開始

### 前置需求

- [Node.js](https://nodejs.org/) v18+
- [Xaman App](https://xaman.app/)（手機安裝，並切換至 Testnet 模式）
- [Xaman Developer Console](https://apps.xaman.dev/) 的 API Key 與 Secret

### 安裝步驟

```bash
# 1. 克隆專案
git clone https://github.com/<你的帳號>/egg-tracker.git
cd egg-tracker

# 2. 安裝依賴
npm install

# 3. 設定環境變數
cp .env.example .env
```

編輯 `.env` 檔案：

```env
XUMM_API_KEY=你的_API_Key
XUMM_API_SECRET=你的_API_Secret
# LOGISTICS_SEED=選填：物流帳戶種子，留空會自動生成
PORT=3000
```

### 啟動

```bash
npm start
```

啟動後 Terminal 會輸出：

```
✅ Xumm SDK 初始化完成
🔗 已連線 XRPL Testnet
🏦 物流帳戶已生成並注資: rXXXXX...
📂 載入索引: 0 項商品

🚀 雞蛋產銷履歷系統啟動完成
   消費者查詢: http://localhost:3000/?itemId=EGG001
   物流管理頁: http://localhost:3000/admin.html
   API 健康檢查: http://localhost:3000/api/health
```

### 快速體驗流程

1. 開啟 `http://localhost:3000/admin.html` — 點擊「使用 Xaman 錢包登入」
2. 用手機 Xaman App 掃 QR Code 簽署登入
3. 輸入商品 ID（例如 `EGG001`），選取狀態，點擊「簽署並寫入 XRPL」
4. 用手機 Xaman App 掃碼簽署交易
5. 開啟 `http://localhost:3000/?itemId=EGG001` 查看物流時間軸

---

## 📁 專案結構

```
egg-tracker/
├── public/                  # 靜態前端檔案
│   ├── index.html           # 消費者查詢頁面
│   ├── admin.html           # 物流管理後台
│   └── app.js               # 共用前端邏輯 (API 呼叫、QR顯示、時間軸渲染)
├── .env.example             # 環境變數範本
├── .gitignore
├── package.json
├── server.js                # Express 後端主程式 (XRPL 整合、API 路由)
└── tx-index.json            # 交易索引快取 (自動產生，不建議手動編輯)
```

---

## 🔌 API 文件

| 方法 | 路由 | 說明 |
|---|---|---|
| `GET` | `/api/health` | 系統健康檢查，回傳連線狀態與追蹤商品數 |
| `POST` | `/api/auth` | 建立 Xaman SignIn Payload，回傳 QR Code |
| `GET` | `/api/auth/:uuid` | 輪詢登入結果 |
| `POST` | `/api/logistics/update` | 建立物流更新 Payload，回傳 QR Code |
| `GET` | `/api/payload/:uuid` | 通用 Payload 輪詢（簽署狀態、交易 Hash） |
| `GET` | `/api/logistics/:itemId` | 查詢商品完整物流時間軸，從 XRPL 讀取歷史 |

### 物流更新 Payload Request Body

```json
{
  "itemId": "EGG001",
  "status": "produced",
  "location": "台北養雞場"
}
```

`status` 可選值：`produced` | `shipped` | `sold`

### 物流查詢 Response

```json
{
  "itemId": "EGG001",
  "currentStatus": "shipped",
  "totalEvents": 2,
  "transactions": [
    {
      "txHash": "ABCDEF123456...",
      "status": "produced",
      "timestamp": "2026-05-23T10:00:00.000Z",
      "ledgerTimestamp": "2026-05-23T10:00:05.000Z",
      "location": "台北養雞場",
      "handler": "rXYZ...",
      "ledgerIndex": 12345678
    }
  ]
}
```

---

## 🤝 貢獻指南

歡迎任何形式的貢獻！請先開 Issue 討論你想新增的功能或修正。

### 開發方向

- **NFC / QR Code 標籤整合** — 與實體包裝整合，掃描即查詢
- **多種產品支援** — 擴展至其他農產品（豬肉、蔬果等）
- **Webhook 通知** — 狀態變更時主動通知消費者
- **儀表板** — 管理後台增加統計圖表與分析
- **Mainnet 部署** — 準備好後可切換至 XRPL Mainnet

---

## 📄 授權

本專案以 **MIT License** 釋出。詳見 [LICENSE](./LICENSE) 檔案。

---

## 🙏 致謝

- [XRP Ledger](https://xrpl.org/) — 提供穩定、低成本的公共區塊鏈
- [Xaman (Xumm)](https://xaman.app/) — 提供友善的錢包與 SDK
- [XRPL Testnet Faucet](https://testnet.xrpl.org/faucet) — 提供免費測試 XRP

---

<p align="center">
  Made with ❤️ for 食品安全 & 農業數位轉型
</p>
