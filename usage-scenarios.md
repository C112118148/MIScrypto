# 🥚 雞蛋產銷履歷追蹤系統 — 使用情境流程圖

> Egg Supply Chain Traceability — Usage Scenario Flowcharts
> 基於 XRPL Testnet + Xaman SDK 的區塊鏈溯源系統

---

## 📋 使用情境總覽

| 編號 | 情境名稱 | 主要角色 | 核心 API |
|------|---------|---------|---------|
| 1 | 消費者查詢溯源 | 消費者 | `GET /api/logistics/:itemId` |
| 2 | 物流人員登入 | 物流人員、Xaman App | `POST /api/auth` → `GET /api/auth/:uuid` |
| 3 | 物流狀態更新 | 物流人員、Xaman App | `POST /api/logistics/update` → `GET /api/payload/:uuid` |
| 4 | 商品 QR 標籤列印 | 物流人員 | QRCode.js 前端產生 |
| 5 | 角色權限驗證 | 後端系統 | `getRoleByAddress()` + `STATUS_ROLE_MAP` |

---

## 情境一：消費者查詢溯源

```mermaid
flowchart TD
    A([消費者]) --> B[開啟 index.html<br>或掃描包裝 NFC/QR]
    B --> C{手動輸入 or URL 參數?}
    C -->|手動輸入| D[在搜尋欄輸入商品 ID<br>例如 EGG001]
    C -->|URL 參數| E[瀏覽器自動帶入 ?itemId=EGG001]
    D --> F[點擊「🔍 查詢」按鈕]
    E --> F
    F --> G[GET /api/logistics/:itemId]
    
    subgraph 後端處理
        G --> H[從記憶體 txIndex 查詢<br>該商品所有交易紀錄]
        H --> I[遍歷每筆 txHash<br>呼叫 XRPL tx API]
        I --> J[解析 Memo 中的 JSON 資料<br>取出 status / timestamp / location / role]
        J --> K[依時間排序、去重複]
        K --> L["回傳 JSON，包含 itemId, currentStatus, totalEvents, transactions"]
    end
    
    L --> M[前端渲染時間軸]
    M --> N[顯示每筆事件卡片<br>📦 生產完成 → 🚚 運送中 → 🏪 已上架銷售]
    N --> O[消費者查看完整物流鏈<br>點擊交易連結可至 XRPL Explorer 驗證]
    O --> P([結束])
    
    style A fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
    style N fill:#fff3e0,stroke:#ff9800,color:#e65100
    style P fill:#f5f5f5,stroke:#999,color:#666
```

**參與角色：** 消費者  
**關鍵 API：** `GET /api/logistics/:itemId`  
**資料流向：** index.html → Express → XRPL Testnet → Express → index.html  
**備註：** 所有資料從 XRPL 鏈上即時讀取，不需資料庫；前端使用 `Set` 去重複處理

---

## 情境二：物流人員登入

```mermaid
flowchart TD
    A([物流人員]) --> B[開啟 admin.html]
    B --> C[點擊「📱 使用 Xaman 錢包登入」]
    C --> D[POST /api/auth<br>→ 建立 SignIn Payload]
    D --> E["Xumm SDK 回傳 uuid, qrCode, url"]
    E --> F[前端顯示 QR Code]
    F --> G[物流人員打開 Xaman App<br>掃描 QR Code]
    G --> H[Xaman App 顯示簽署請求]
    H --> I[物流人員確認簽署]
    
    I --> J{前端輪詢<br>GET /api/auth/:uuid<br>間隔 1.5 秒}
    J -->|未簽署| J
    J -->|已簽署| K[取得 XRPL 帳戶地址<br>及 userToken]
    J -->|已過期| L[顯示「⚠️ 登入逾時」<br>重新產生 QR]
    
    K --> M[前端比對 ROLE_ADDRESSES<br>判斷使用者角色]
    M --> N{地址匹配哪個角色?}
    N -->|MANUFACTURER_ADDRESS| O[✅ 🏭 製造商]
    N -->|LOGISTICS_ADDRESS| P[✅ 🚚 物流中心]
    N -->|RETAILER_ADDRESS| Q[✅ 🏪 零售商]
    N -->|無匹配| R{角色限制是否啟用?}
    R -->|任一角色有設定地址| S[⚠️ 未綁定角色<br>無法進行更新操作]
    R -->|所有角色都無地址| T[🔓 無限制測試模式<br>可簽署所有步驟]
    
    O --> U[顯示物流管理介面<br>含使用者資訊與角色徽章]
    P --> U
    Q --> U
    S --> U
    T --> U
    
    U --> V([登入完成])
    
    style A fill:#e3f2fd,stroke:#1565c0,color:#0d47a1
    style V fill:#f5f5f5,stroke:#999,color:#666
```

**參與角色：** 物流人員、Xaman App  
**關鍵 API：** `POST /api/auth` → `GET /api/auth/:uuid`  
**簽署工具：** Xaman (Xumm) App  
**角色驗證：** 後端根據 `.env` 設定的 `MANUFACTURER_ADDRESS` / `LOGISTICS_ADDRESS` / `RETAILER_ADDRESS` 比對簽署者錢包地址  
**輪詢機制：** 前端每 1.5 秒呼叫一次 `GET /api/auth/:uuid`，直到 signed 或 expired

---

## 情境三：物流狀態更新（核心流程）

```mermaid
flowchart TD
    A([已登入物流人員]) --> B[在 admin.html 表單區]
    B --> C{輸入商品 ID 方式}
    C -->|手動輸入| D[在 itemId 欄位輸入]
    C -->|QR 掃描| E[點擊「📷 掃描條碼」<br>→ Html5QrcodeScanner<br>→ 使用後置鏡頭]
    C -->|掃描槍| F[條碼掃描槍輸入後 Enter]
    
    D --> G["blur 事件觸發 validateItemState"]
    E --> G
    F --> G
    
    G --> H[GET /api/logistics/:itemId<br>查詢商品當前鏈上狀態]
    H --> I{目前狀態為何?}
    I -->|unknown / 無資料| J[建議下一步: 📦 produced]
    I -->|produced| K[建議下一步: 🚚 shipped]
    I -->|shipped| L[建議下一步: 🏪 sold]
    I -->|sold| M[✅ 此商品已完成所有階段<br>status 選單設為「已結束」<br>提交按鈕 disabled]
    
    J --> N[系統自動選取下一步<br>鎖定只能選擇該選項]
    K --> N
    L --> N
    
    N --> O{檢查角色權限}
    O -->|角色無權限| P[顯示 ❌ 您無法執行此步驟<br>提交按鈕 disabled]
    P --> Q([結束 - 無權限])
    
    O -->|角色有權限| R[提交按鈕啟用]
    R --> S[（選填）輸入地點]
    S --> T[點擊「✍️ 簽署並寫入 XRPL」]
    
    T --> U["POST /api/logistics/update 送出 itemId, status, location, signerAddress"]
    
    subgraph 後端驗證
        U --> V{角色驗證是否啟用?<br>anyRoleConfigured}
        V -->|是| W{signerAddress 是否<br>在任一位址列表中?}
        W -->|否| X[❌ 403: 此錢包未綁定任何角色]
        W -->|是| Y{該角色是否能<br>執行此 status?}
        Y -->|否| Z[❌ 403: 你的角色是 🏭 製造商<br>無法執行「shipped」]
        Y -->|是| AA[✅ 驗證通過]
        V -->|否| AA
    end
    
    X --> AB([結束 - 403 拒絕])
    Z --> AB
    
    AA --> AC["構造 MemoData JSON：type, v, itemId, status, timestamp, location, role"]
    AC --> AD[建立 Payment Transaction<br>Destination: logisticsAddress<br>Amount: 1 drop<br>Memo: eggtrack/item-status]
    AD --> AE["Xumm SDK 建立 Payload，回傳 uuid, qrCode, url"]
    
    AE --> AF[前端顯示 QR Code<br>按鈕顯示「⌛ 等待簽名…」]
    AF --> AG{前端輪詢<br>GET /api/payload/:uuid}
    AG -->|未簽署| AG
    AG -->|已簽署| AH[取得 txHash]
    AG -->|已過期| AI[顯示簽署逾時<br>按鈕恢復可點擊]
    
    AH --> AJ[交易寫入 XRPL<br>Memo 包含完整物流資料<br>不可篡改]
    AJ --> AK[前端顯示 ✅ 更新成功<br>🔗 XRPL Explorer 交易連結]
    AK --> AL[記錄寫入 session history<br>清空表單欄位]
    AL --> AM([結束 - 狀態更新成功])
    
    AI --> AN[使用者可重新發起流程]
    AN --> T
    
    style A fill:#e3f2fd,stroke:#1565c0,color:#0d47a1
    style AA fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
    style AK fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
    style AM fill:#f5f5f5,stroke:#999,color:#666
    style X fill:#ffebee,stroke:#c62828,color:#b71c1c
    style Z fill:#ffebee,stroke:#c62828,color:#b71c1c
```

**參與角色：** 物流人員（已登入狀態）、Xaman App  
**關鍵 API：** `POST /api/logistics/update` → `GET /api/payload/:uuid`  
**XRPL 交易結構：** `Payment` 交易 + `Memo`  
- `MemoType`: `"eggtrack/item-status"`（hex 編碼）  
- `MemoData`: JSON `{ type, v, itemId, status, timestamp, location, role }`（hex 編碼，非 ASCII 轉 `\uXXXX`）  

**狀態流轉強制順序：** `produced → shipped → sold`（由前端 `NEXT_STATUS_MAP` 與後端共同控制）

---

## 情境四：商品 QR 標籤列印

```mermaid
flowchart TD
    A([已登入物流人員]) --> B[在 admin.html 找到<br>「🖨️ 商品 QR 標籤列印」區塊]
    B --> C[在 #printInputId 輸入商品 ID<br>例如 EGG001]
    C --> D[點擊「產生」按鈕]
    D --> E[QRCode.js 產生 QR Code<br>分別繪製到兩個 canvas]
    
    subgraph 前端渲染
        E --> F[#qrCodeCanvas<br>160x160 預覽用]
        E --> G[#printTarget<br>350x350 列印用]
    end
    
    F --> H[顯示預覽區塊<br>包含 QR Code + 商品 ID 文字]
    G --> H
    H --> I[檢查 QR Code 內容正確]
    I --> J{內容正確?}
    J -->|否| K[重新輸入商品 ID]
    K --> C
    J -->|是| L[點擊「🖨️ 列印此標籤」]
    L --> M["window.print 觸發"]
    M --> N[列印專用 CSS #printWrapper 生效<br>body * 設 visibility: hidden]
    N --> O[僅印出 #printWrapper 內容<br>QR Code + 大號商品 ID]
    O --> P[印出實體標籤]
    P --> Q[將標籤貼在雞蛋包裝上<br>供消費者掃描查詢]
    Q --> R([結束])
    
    style A fill:#e3f2fd,stroke:#1565c0,color:#0d47a1
    style O fill:#fff3e0,stroke:#ff9800,color:#e65100
    style R fill:#f5f5f5,stroke:#999,color:#666
```

**參與角色：** 物流人員  
**使用套件：** [QRCode.js](https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js)（前端產生）  
**QR Code 內容：** 純文字商品 ID（如 `EGG001`）  
**列印機制：** `@media print` CSS 隱藏所有 `body *`，僅顯示 `#printWrapper` 內容  
**用途：** 印出後貼在實體包裝上，消費者掃描即可查詢溯源

---

## 情境五：角色權限驗證流程

```mermaid
flowchart TD
    A([系統啟動]) --> B[讀取 .env 環境變數]
    B --> C[解析 ROLE_ADDRESSES<br>MANUFACTURER_ADDRESS<br>LOGISTICS_ADDRESS<br>RETAILER_ADDRESS]
    C --> D{至少一個角色<br>有設定錢包地址?}
    
    D -->|YES - 封閉模式| E[角色驗證全面啟用]
    D -->|NO - 開放模式| F[任何 Xaman 錢包都可簽署<br>角色資訊僅供顯示與記錄]
    
    E --> G[物流人員登入<br>取得 XRPL 地址]
    G --> H["後端 getRoleByAddress，遍歷 ROLE_ADDRESSES 比對地址屬於哪個角色"]
    
    H --> I{狀態權限檢查<br>STATUS_ROLE_MAP}
    
    I -->|status = produced| J[必須是 manufacturer 🏭]
    I -->|status = shipped| K[必須是 logistics 🚚]
    I -->|status = sold| L[必須是 retailer 🏪]
    
    J --> M{角色符合?}
    K --> M
    L --> M
    
    M -->|✅ 是| N[允許建立 Payload]
    M -->|❌ 否| O[回傳 403 錯誤<br>附帶角色提示訊息]
    
    O --> P[前端顯示錯誤訊息<br>「你的角色是 🏭 製造商<br>無法執行 shipped」]
    
    N --> Q[建立 Xumm Payload<br>Memo 含 role 資訊]
    Q --> R[簽署 → 寫入 XRPL]
    
    F --> S[角色僅紀錄在 Memo data.role<br>不強制攔截]
    S --> Q
    
    style D fill:#e3f2fd,stroke:#1565c0,color:#0d47a1
    style E fill:#fce4ec,stroke:#c62828,color:#b71c1c
    style F fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
    style O fill:#ffebee,stroke:#c62828,color:#b71c1c
    style N fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
```

### 角色驗證設計原理

```
STATUS_ROLE_MAP = {
    produced: 'manufacturer',   // 📦 生產完成 → 製造商簽署
    shipped:  'logistics',      // 🚚 運送中   → 物流中心簽署
    sold:     'retailer'        // 🏪 已上架   → 零售商簽署
}
```

| 狀態 | 需簽署角色 | 環境變數 | 標籤 |
|------|-----------|---------|------|
| `produced` | manufacturer 🏭 | `MANUFACTURER_ADDRESS` | 製造商 |
| `shipped` | logistics 🚚 | `LOGISTICS_ADDRESS` | 物流中心 |
| `sold` | retailer 🏪 | `RETAILER_ADDRESS` | 零售商 |

**運作邏輯：**
1. 各角色支援多個錢包地址（逗號分隔）
2. 如果所有角色的地址都留空 → **開放模式**（任何人都可簽署，角色僅供紀錄）
3. 只要任一角色有設定地址 → **封閉模式**（強制驗證簽署者身分）
4. 簽署不合法的組合 → 後端回傳 `403` + 明確的中文錯誤提示

---

## 系統整體架構與資料流

```mermaid
flowchart LR
    subgraph 前端層 [Frontend - public/]
        A[消費者查詢頁<br>index.html]
        B[物流管理後台<br>admin.html]
        C[共用前端邏輯<br>app.js]
        D[健康檢查儀表板<br>Health.html]
    end
    
    subgraph 後端層 [Backend - server.js]
        E[Express.js Router<br>REST API 路由]
        F[Xumm SDK 整合層<br>xumm-sdk]
        G[XRPL Client<br>xrpl.js]
        H[記憶體狀態<br>txIndex + pendingMap]
    end
    
    subgraph 外部服務 [External Services]
        I[Xaman App<br>行動端錢包簽署]
        J[XRPL Testnet<br>wss://s.altnet.rippletest.net:51233]
        K[XRPL Testnet Explorer<br>testnet.xrpl.org]
        L[環境變數設定<br>.env]
    end
    
    A <-->|HTTP REST| E
    B <-->|HTTP REST| E
    C --- A
    C --- B
    D <-->|HTTP| E
    
    E --- F
    E --- G
    E --- H
    E --- L
    
    F <-->|REST API| I
    G <-->|WebSocket| J
    K -.->|驗證交易| J
    L ---|注入設定| E
    
    style A fill:#e8f5e9,stroke:#4caf50
    style B fill:#e3f2fd,stroke:#2196f3
    style E fill:#e8eaf6,stroke:#3f51b5,color:#1a237e
    style J fill:#f3e5f5,stroke:#7b1fa2,color:#4a148c
    style I fill:#fff3e0,stroke:#ff9800,color:#e65100
```

### API 路由總覽

| 方法 | 路由 | 說明 | 所屬情境 |
|------|------|------|---------|
| `GET` | `/api/health` | 系統健康檢查（支援瀏覽器/JSON 兩種模式） | 系統維護 |
| `POST` | `/api/auth` | 建立 Xaman SignIn Payload，回傳 QR Code | 情境二 |
| `GET` | `/api/auth/:uuid` | 輪詢登入結果 | 情境二 |
| `POST` | `/api/logistics/update` | 建立物流更新 Payload，回傳 QR Code | 情境三 |
| `GET` | `/api/payload/:uuid` | 通用 Payload 輪詢（簽署狀態、交易 Hash） | 情境三 |
| `GET` | `/api/logistics/:itemId` | 查詢商品完整物流時間軸 | 情境一 |
| `GET` | `/api/roles` | 回傳角色設定（給前端顯示） | 情境二、五 |
| `GET` | `/api/debug/tx/:txHash` | 檢查原始 MemoData hex（除錯用） | 開發除錯 |
| `GET` | `/api/health/data` | Health API 純 JSON 資料端點 | 系統維護 |

---

## 狀態機：商品物流生命週期

```mermaid
stateDiagram-v2
    [*] --> unknown: 商品建立
    unknown --> produced: 製造商簽署 📦
    produced --> shipped: 物流中心簽署 🚚
    shipped --> sold: 零售商簽署 🏪
    sold --> [*]: 完成
    
    note right of unknown
        尚未有任何鏈上紀錄
        或查無此商品 ID
    end note
    
    note right of produced
        Memo: { status: "produced",
        location: "台北養雞場" }
    end note
    
    note right of shipped
        Memo: { status: "shipped",
        location: "中盤商集貨站" }
    end note
    
    note right of sold
        Memo: { status: "sold",
        location: "全聯超市" }
    end note
```

---

## 📝 補充說明

### 前端共用邏輯（app.js）

`app.js` 被 `index.html` 和 `admin.html` 共同引用，提供以下功能：

- **`api(method, path, body)`** — 統一的 API 呼叫封裝
- **`pollPayload(uuid, callbacks)`** — 每 1.5 秒輪詢 Payload 狀態
- **`showQR(containerId, payload)` / `hideQR(containerId)`** — QR Code 顯示控制
- **`renderTimeline(containerId, transactions)`** — 時間軸渲染（消費者頁面用）
- **`xrplLink(txHash, label)`** — 產生 XRPL Explorer 連結
- **`formatDate(iso)`** — 日期格式化（`zh-TW` / `Asia/Taipei`）

### 系統啟動流程

```mermaid
flowchart LR
    A[npm start] --> B[載入 .env 設定]
    B --> C[初始化 Xumm SDK]
    C --> D[連線 XRPL Testnet<br>WebSocket]
    D --> E["設定物流接收帳戶 setupLogisticsAccount"]
    E --> F{是否指定 LOGISTICS_SEED?}
    F -->|是| G[從種子恢復錢包]
    F -->|否| H[自動生成錢包 + Faucet 注資]
    G --> I["掃描歷史交易重建索引 buildIndex"]
    H --> I
    I --> J[啟動 Express 伺服器<br>port 3000]
    J --> K[🚀 系統就緒]
```

---

> 文件產出日期：2026-05-23  
> 專案名稱：egg-tracker / 雞蛋產銷履歷追蹤系統  
> 技術棧：Node.js + Express + XRPL + Xaman SDK
