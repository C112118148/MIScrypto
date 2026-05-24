# 🥚 雞蛋產銷履歷追蹤系統 — 區塊鏈技術一覽

> 專案名稱：egg-tracker  
> 說明：基於 XRPL Testnet + Xaman SDK 的區塊鏈溯源系統  
> 產出日期：2026-05-24

---

## 目錄

1. [XRPL（XRP Ledger）Testnet](#1-xrplxrp-ledger-testnet--核心區塊鏈)
2. [xrpl.js（npm package）](#2-xrpljsnpm-package-xrpl-v4x--xrpl-js-客戶端)
3. [Xaman（Xumm）SDK（npm package）](#3-xamansdk-npm-package-xumm-sdk-v1x--錢包簽章橋樑)
4. [Xaman（Xumm）App](#4-xamanapp--手機端錢包)
5. [XRPL Transaction Memo](#5-xrpl-transaction-memo--鏈上資料儲存機制)
6. [XRPL Testnet Faucet](#6-xrpl-testnet-faucet--測試用-xrp-取得)

---

## 1. XRPL（XRP Ledger）Testnet — 核心區塊鏈

### 說明

本系統捨棄傳統關聯式資料庫（MySQL、MongoDB），以 **XRPL Testnet** 作為唯一的資料儲存層。所有物流紀錄皆以區塊鏈交易的形式永久寫入，無法篡改。

### 用途

| 用途 | 說明 |
|------|------|
| 溯源資料庫 | 取代傳統資料庫，每一筆物流狀態（生產→運送→銷售）都存在鏈上 |
| 不可篡改性 | 交易一旦驗證即永久固化，沒有人可以回頭修改歷史資料 |
| 低成本運作 | XRPL 手續費極低（每筆交易約 0.00001 XRP），適合高頻物流更新 |
| 快速確認 | 3-5 秒完成交易驗證，適合供應鏈即時更新情境 |

### 程式碼位置

```js
// server.js:65 — WebSocket 連線至 XRPL Testnet
const xrplClient = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
```

### 交易實例

```
🔗 https://testnet.xrpl.org/transactions/CEA299438434E076DD777046C43CCE8FEF303065E4E9B78A75E1F26F032CC0AF
```

---

## 2. xrpl.js（npm package `xrpl` v4.x）— XRPL JS 客戶端

### 說明

官方 JavaScript 客戶端程式庫，提供與 XRPL 帳本互動的完整 API。後端 server.js 完全依賴此套件對鏈進行讀寫操作。

### 用途

| 功能 API | 程式碼位置 | 用途說明 |
|----------|-----------|---------|
| `new Client('wss://...')` + `client.connect()` | server.js:65, 461 | 建立 WebSocket 連線到 XRPL Testnet |
| `client.fundWallet()` | server.js:155 | 從 Testnet Faucet 自動生成新錢包並注資測試 XRP |
| `client.request({ command: 'account_tx', ... })` | server.js:81-107 | 掃描指定帳戶的所有歷史交易（翻頁式），用來在啟動時重建記憶體索引 |
| `client.request({ command: 'tx', ... })` | server.js:349, 393 | 依交易 Hash 查詢單筆交易的完整明細（含 Memo 內容） |
| `client.request({ command: 'account_info', ... })` | server.js:167 | 查詢帳戶餘額、交易序列號等帳本狀態 |
| `Wallet.fromSeed(seed)` | server.js:148 | 從種子碼（Secret Seed）恢復 XRPL 錢包 |
| `xrpl.dropsToXrp(drops)` | server.js:170 | 單位轉換：最小單位 drops → XRP（1 XRP = 1,000,000 drops） |

---

## 3. Xaman（Xumm）SDK（npm package `xumm-sdk` v1.x）— 錢包簽章橋樑

### 說明

Xaman 錢包的官方 SDK，負責在 **後端** 與 **使用者手機錢包** 之間建立簽章請求通道。這是整個系統中串接 Web3 身分驗證與交易授權的關鍵元件。

### 用途

| 功能 API | 程式碼位置 | 用途說明 |
|----------|-----------|---------|
| `new XummSdk(apiKey, apiSecret)` | server.js:47 | 初始化 SDK（需先在 Xaman Developer Console 註冊應用程式取得憑證） |
| `sdk.payload.create({ txjson: { TransactionType: 'SignIn' } })` | server.js:187 | 建立「簽章登入」Payload → 產生 QR Code，使用者手機掃碼登入 |
| `sdk.payload.create({ txjson: { TransactionType: 'Payment', ..., Memos } })` | server.js:273-280 | 建立「物流狀態更新」Payload → 使用者手機檢視交易內容後簽署，交易即送上鏈 |
| `sdk.payload.get(uuid)` | server.js:210, 303 | 查詢某個 Payload 的狀態（是否已簽署、是否已過期） |

### 完整流程

```
後端建立 Payload (create)
       │
       ▼
回傳 { uuid, qrCode, url }
       │
       ▼
前端顯示 QR Code
       │
       ▼
使用者打開 Xaman App 掃碼
       │
       ▼
使用者檢視交易內容 → 確認簽署
       │
       ▼
交易自動提交至 XRPL
       │
       ▼
前端輪詢 GET /api/payload/:uuid → signed: true → 取得 txHash
```

---

## 4. Xaman（Xumm）App — 手機端錢包

### 說明

物流人員安裝在手機上的 XRPL 錢包應用程式（iOS / Android）。它是系統中 **人類授權交易** 的入口，物流人員透過它簽署每一筆物流狀態更新。

### 用途

| 功能 | 說明 |
|------|------|
| 身分驗證 | 掃描 QR Code 完成 SignIn 登入，回傳使用者的 XRPL 地址（r 開頭） |
| 交易授權 | 檢視後端傳來的交易內容（Payment + Memo），確認後簽名上鏈 |
| 角色綁定 | 使用者的錢包地址對應到系統中的角色（製造商/物流中心/零售商） |

### 角色權限對應

```js
// server.js:114-121
STATUS_ROLE_MAP = {
  produced: 'manufacturer',   // 製造商 🏭
  shipped:  'logistics',      // 物流中心 🚚
  sold:     'retailer'        // 零售商 🏪
}
```

- **封閉模式**（`.env` 有設定角色地址）：只有該角色的錢包可以簽署對應步驟
- **開放模式**（角色地址全留空）：任何 Xaman 錢包都可以簽署

---

## 5. XRPL Transaction Memo — 鏈上資料儲存機制

### 說明

XRPL 交易的「備忘錄」欄位，這是整個系統 **儲存物流資料的核心機制**。不發行 Token、不寫資料庫，而是利用 XRPL 每筆交易可以攜帶 Memo 的特性，把結構化資料寫入鏈上。

### 用途

每當物流人員更新狀態時，系統產生一筆 **XRPL Payment 交易**，將物流資料編碼在 Memo 中：

```
交易結構：
┌─────────────────────────────────────┐
│  TransactionType: 'Payment'          │
│  Destination: 物流接收帳戶            │
│  Amount: '1' (1 drop = 0.000001 XRP) │
│  Memos: [                            │
│    {                                 │
│      MemoType (hex): "eggtrack/item-status"
│      MemoData (hex): JSON 字串轉 hex  │
│    }                                 │
│  ]                                   │
└─────────────────────────────────────┘
```

### MemoData 內容範例

```json
{
  "type": "eggtrack/item-status",
  "v": 2,
  "itemId": "EGG001",
  "status": "produced",
  "timestamp": "2026-05-21T16:46:32.372Z",
  "location": "台北養雞場",
  "role": "manufacturer"
}
```

### 為何選擇 Memo 而非發行 Token

| 考量 | Memo 方案 | 發行 Token 方案 |
|------|-----------|----------------|
| 實作複雜度 | 低：直接夾帶 JSON | 高：需管理發行/銷毀/信任線 |
| 資料彈性 | 高：可帶任意結構化資料 | 低：只能表示「持有」 |
| 讀取效率 | 需要搭配索引（txIndex） | 可以帳本查詢 |
| 成本 | 只需基本交易手續費 | 需要 Reserve 費用 |

---

## 6. XRPL Testnet Faucet — 測試用 XRP 取得

### 說明

XRPL Testnet 提供的自動注資水龍頭服務，開發者可以免費取得測試用 XRP。

### 用途

```js
// server.js:153-156
const fundResult = await xrplClient.fundWallet();
logisticsAddress = fundResult.wallet.classicAddress;
```

當 `.env` 中未設定 `LOGISTICS_SEED` 時，伺服器啟動流程中：
1. 呼叫 `client.fundWallet()` 自動生成一個新 XRPL 錢包
2. 從 Testnet Faucet 注入測試 XRP（作為交易手續費）
3. 將這個錢包作為物流收款帳戶

### 替代方式

若 Faucet 暫時失靈，也可以到 [XRPL Testnet Faucet 官網](https://testnet.xrpl.org/faucet) 手動取得測試 XRP。

---

## 附錄 A：相依套件一覽

```json
// package.json
{
  "dependencies": {
    "xrpl": "^4.1.0",      // XRPL 區塊鏈 JS 客戶端
    "xumm-sdk": "^1.11.2"  // Xaman 錢包 SDK（簽章橋樑）
  }
}
```

## 附錄 B：資料流總圖

```
👤 消費者查詢                          👤 物流人員
    │                                      │
    ▼                                      ▼
┌──────────┐                        ┌──────────────┐
│ index.html│                        │ admin.html    │
└─────┬────┘                        └──────┬───────┘
      │                                     │
      │ HTTP                                │ QR Code + 輪詢
      ▼                                     ▼
┌────────────────────────────────────────────────────────┐
│  🖥️ Node.js 後端 (server.js)                           │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ Express  │  │ xumm-sdk │  │ xrpl.js (XRPL客戶端)  │ │
│  │ REST API │◄─┤ Payload  │  │                      │ │
│  │ 路由     │  │ 建立/查詢│  │ account_tx / tx /     │ │
│  └──────────┘  └──────────┘  │ account_info 等      │ │
│                               └──────────┬───────────┘ │
│  ┌────────────────────────────────────┐  │              │
│  │ 記憶體索引 txIndex (Map)           │  │              │
│  │ itemId → [{ txHash, timestamp }]  │  │              │
│  │ 啟動時從 XRPL 掃描重建            │  │              │
│  └────────────────────────────────────┘  │              │
└──────────────────────────────────────────┼──────────────┘
                                           │
                    WebSocket (wss://s.altnet.rippletest.net:51233)
                                           │
                                           ▼
                               ┌─────────────────────┐
                               │  ⛓️ XRPL Testnet    │
                               │                     │
                               │ 每筆物流更新 =        │
                               │ Payment + Memo 交易  │
                               │                     │
                               │ 不可篡改             │
                               │ 3-5 秒確認           │
                               │ 手續費極低           │
                               └─────────────────────┘
```
