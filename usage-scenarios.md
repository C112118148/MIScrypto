# 🥚 雞蛋產銷履歷追蹤系統 — 使用情境流程圖

> Egg Supply Chain Traceability — Usage Scenario Flowcharts
> 基於 XRPL Testnet + Xaman SDK 的區塊鏈溯源系統

---

## 🎨 圖例說明

```mermaid
flowchart LR
    classDef actor fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:2px,rx:10px,ry:10px
    classDef process fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:2px
    classDef decision fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C,stroke-width:2px
    classDef api fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef system fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:2px
    classDef success fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef error fill:#FFEBEE,stroke:#C62828,color:#B71C1C,stroke-width:2px

    A(["角色 / 人員"]):::actor --> B["操作 / 動作"]:::process
    B --> C{"判斷 / 分支"}:::decision
    C -->|"是"| D["API / 系統呼叫"]:::api
    C -->|"否"| E["後端處理"]:::system
    D --> F(["完成 ✅"]):::success
    E --> G(["失敗 ❌"]):::error
```

| 樣式 | 代表意義 | 顏色 |
|:----:|---------|------|
| ⬤ 圓角矩形 | 角色 / 人員 | 🟦 藍色 |
| ▬ 矩形 | 操作 / 動作 | 🟧 橙色 |
| ◇ 菱形 | 判斷 / 分支 | 🟪 紫色 |
| ⬢ 綠框矩形 | API / 後端呼叫 | 🟩 綠色 |
| ⬢ 青框矩形 | 系統內部處理 | 🟩 青色 |
| ✅ 綠底 | 成功結束 | 🟢 綠色 |
| ❌ 紅底 | 失敗結束 | 🔴 紅色 |

---

## 情境一：消費者查詢溯源

```mermaid
flowchart TD
    classDef actor fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:2px,rx:10px,ry:10px
    classDef process fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:2px
    classDef decision fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C,stroke-width:2px
    classDef api fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef system fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:2px
    classDef success fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef subgraphTitle fill:#F5F5F5,stroke:#BDBDBD,color:#333,stroke-width:1px

    A(["👤 消費者"]):::actor --> B["📱 開啟 index.html<br>或掃描包裝 QR Code"]:::process
    B --> C{"輸入方式?"}:::decision
    C -->|"手動鍵入"| D["✏️ 在搜尋欄輸入商品 ID"]:::process
    C -->|"URL 載入"| E["🔗 瀏覽器自動帶入<br>?itemId=EGG001"]:::process
    D --> F["🔍 點擊查詢按鈕"]:::process
    E --> F

    subgraph 後端處理流程
        G["📡 GET /api/logistics/:itemId"]:::api
        H["🗄️ 查詢 txIndex 記憶體索引"]:::system
        I["⛓️ 遍歷 txHash 呼叫 XRPL tx API"]:::api
        J["📋 解析 Memo JSON<br>取出 status / 時間 / 地點 / 角色"]:::system
        K["🔃 排序 + 去重複"]:::system
        L["📤 回傳時間軸 JSON"]:::api

        G --> H --> I --> J --> K --> L
    end

    F --> G
    L --> M["🖥️ 前端渲染物流時間軸"]:::process
    M --> N["📊 顯示完整事件卡片<br>📦生產 → 🚚運送 → 🏪上架"]:::process
    N --> O["🔗 可點擊交易連結<br>至 XRPL Explorer 驗證"]:::process
    O --> P(["✅ 查詢完成"]):::success
```

**參與角色：** 👤 消費者  
**關鍵 API：** `GET /api/logistics/:itemId`  
**資料流向：** `index.html → Express → XRPL Testnet → Express → index.html`  
**備註：** 所有資料從 XRPL 鏈上即時讀取，前端以 `Set` 結構處理去重複

---

## 情境二：物流人員登入

```mermaid
flowchart TD
    classDef actor fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:2px,rx:10px,ry:10px
    classDef process fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:2px
    classDef decision fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C,stroke-width:2px
    classDef api fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef system fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:2px
    classDef success fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef error fill:#FFEBEE,stroke:#C62828,color:#B71C1C,stroke-width:2px

    A(["👤 物流人員"]):::actor --> B["🌐 開啟 admin.html"]:::process
    B --> C["📱 點擊「使用 Xaman 錢包登入」"]:::process
    C --> D["📡 POST /api/auth"]:::api
    D --> E["🔐 Xumm SDK 建立 SignIn Payload<br>回傳 QR Code 與連結"]:::system
    E --> F["📸 前端顯示 QR Code"]:::process
    F --> G["📱 物流人員開啟 Xaman App<br>掃描 QR Code"]:::actor

    G --> H{"Xaman App 簽署結果"}:::decision
    H -->|"確認簽署"| I["📡 GET /api/auth/:uuid<br>前端每 1.5 秒輪詢"]:::api
    H -->|"拒絕簽署"| J(["❌ 登入失敗"]):::error

    I --> K{"輪詢狀態"}:::decision
    K -->|"未簽署"| I
    K -->|"已簽署 ✅"| L["👤 取得 XRPL 帳戶地址"]:::success
    K -->|"已過期 ⏰"| M(["❌ 登入逾時"]):::error

    L --> N{"地址匹配哪個角色?"}:::decision
    N -->|"MANUFACTURER"| O["🏭 製造商"]:::actor
    N -->|"LOGISTICS"| P["🚚 物流中心"]:::actor
    N -->|"RETAILER"| Q["🏪 零售商"]:::actor
    N -->|"無匹配 + 角色已啟用"| R["⚠️ 未綁定角色<br>無法更新"]:::error
    N -->|"無匹配 + 無角色限制"| S["🔓 測試模式<br>可簽署所有步驟"]:::process

    O --> T["📋 顯示物流管理介面"]:::process
    P --> T
    Q --> T
    R --> T
    S --> T

    T --> U(["✅ 登入完成"]):::success
```

**參與角色：** 👤 物流人員、📱 Xaman App  
**關鍵 API：** `POST /api/auth` → `GET /api/auth/:uuid`  
**輪詢機制：** 前端每 1.5 秒呼叫確認簽署狀態，直到 `signed` 或 `expired`  
**角色判定：** 登入成功後，前端以 XRPL 地址比對 `.env` 設定的 `MANUFACTURER_ADDRESS` / `LOGISTICS_ADDRESS` / `RETAILER_ADDRESS`

---

## 情境三：物流狀態更新

```mermaid
flowchart TD
    classDef actor fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:2px,rx:10px,ry:10px
    classDef process fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:2px
    classDef decision fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C,stroke-width:2px
    classDef api fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef system fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:2px
    classDef success fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef error fill:#FFEBEE,stroke:#C62828,color:#B71C1C,stroke-width:2px

    A(["👤 已登入物流人員"]):::actor --> B["📋 在 admin.html 填寫表單"]:::process
    B --> C{"輸入商品 ID 方式"}:::decision

    C -->|"鍵盤輸入"| D["✏️ 手動輸入 itemId"]:::process
    C -->|"📷 相機掃描"| E["Html5QrcodeScanner<br>啟用後置鏡頭掃描 QR"]:::process
    C -->|"🔫 掃描槍"| F["條碼掃描槍輸入後 Enter"]:::process

    D --> G["🔍 自動查詢鏈上狀態<br>GET /api/logistics/:itemId"]:::api
    E --> G
    F --> G

    G --> H{"目前商品狀態"}:::decision

    H -->|"無資料"| I1["📦 建議下一步: produced"]:::process
    H -->|"produced"| I2["🚚 建議下一步: shipped"]:::process
    H -->|"shipped"| I3["🏪 建議下一步: sold"]:::process
    H -->|"sold"| J(["✅ 商品已完整溯源<br>不可再更新"]):::success

    I1 --> K["🔒 系統鎖定下一步選項"]:::process
    I2 --> K
    I3 --> K

    K --> L{"角色權限檢查"}:::decision
    L -->|"❌ 無權限"| M(["⛔ 無法執行此步驟"]):::error
    L -->|"✅ 有權限"| N["✍️ 點擊簽署並寫入 XRPL"]:::process

    N --> O["📡 POST /api/logistics/update"]:::api

    subgraph 後端驗證與上鏈
        P{"角色驗證已啟用?"}:::decision
        P -->|"否"| Q
        P -->|"是"| R{"錢包地址<br>在 ROLE_ADDRESSES ?"}:::decision
        R -->|"✅ 是"| S{"角色對應此 status ?"}:::decision
        S -->|"✅ 是"| T["✅ 驗證通過"]:::success
        S -->|"❌ 否"| U(["❌ 403 角色不符"]):::error
        R -->|"❌ 否"| V(["❌ 403 未綁定角色"]):::error
        Q["📝 構造 MemoData JSON<br>itemId / status / timestamp / location / role"]:::system
        T --> Q
    end

    O --> P
    Q --> W["⛓️ 建立 Payment Transaction<br>Amount: 1 drop + Memo"]:::api
    W --> X["🔐 Xumm SDK 建立 Payload<br>產生 QR Code"]:::system
    X --> Y["📸 前端顯示 QR Code<br>等待 Xaman 簽署"]:::process

    Y --> Z{"前端輪詢<br>GET /api/payload/:uuid"}:::decision
    Z -->|"未簽署"| Y
    Z -->|"✅ 已簽署"| AA["📦 取得 txHash<br>交易寫入 XRPL"]:::success
    Z -->|"⏰ 已過期"| AB(["❌ 簽署逾時"]):::error

    AA --> AC["✅ 顯示成功 + XRPL Explorer 連結<br>紀錄寫入 session history"]:::success
    AC --> AD(["🎉 狀態更新完成"]):::success

    AB --> AE["🔄 可重新發起"]:::process
    AE --> N
```

**參與角色：** 👤 物流人員、📱 Xaman App  
**關鍵 API：** `POST /api/logistics/update` → `GET /api/payload/:uuid`  
**狀態流轉：** `produced → shipped → sold`（強制順序，由 `NEXT_STATUS_MAP` 控制）  
**XRPL 交易結構：** `Payment` 交易 + `Memo`（`MemoType: "eggtrack/item-status"`，`MemoData: JSON（hex）`）

---

## 情境四：商品 QR 標籤列印

```mermaid
flowchart TD
    classDef actor fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:2px,rx:10px,ry:10px
    classDef process fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:2px
    classDef decision fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C,stroke-width:2px
    classDef api fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef success fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px

    A(["👤 物流人員"]):::actor --> B["🖨️ 前往 QR 標籤列印區塊"]:::process
    B --> C["✏️ 輸入商品 ID<br>例如: EGG001"]:::process
    C --> D["點擊產生按鈕"]:::process
    D --> E["🎨 QRCode.js 產生 QR Code"]:::api

    subgraph 前端渲染
        F["🖼️ #qrCodeCanvas<br>160x160 預覽用"]:::process
        G["🖼️ #printTarget<br>350x350 列印用"]:::process
    end

    E --> F
    E --> G
    F --> H["📋 顯示 QR + 商品 ID 預覽"]:::process
    G --> H

    H --> I{"內容正確?"}:::decision
    I -->|"❌ 不正確"| J["✏️ 重新輸入"]:::process
    J --> C
    I -->|"✅ 正確"| K["🖨️ 點擊列印此標籤"]:::process

    K --> L["🖨️ window.print 觸發"]:::api
    L --> M["🎯 @media print CSS 生效<br>僅顯示 QR + 商品 ID"]:::system
    M --> N["📄 印出實體標籤"]:::process
    N --> O["🏷️ 貼在雞蛋包裝上"]:::process
    O --> P(["✅ 標籤製作完成"]):::success
```

**參與角色：** 👤 物流人員  
**使用套件：** QRCode.js（前端產生）  
**QR Code 內容：** 純文字商品 ID（如 `EGG001`）  
**列印機制：** `@media print` CSS 隱藏所有非列印元素  
**用途：** 印出貼在包裝上，消費者掃描即可查詢溯源

---

## 情境五：角色權限驗證

```mermaid
flowchart TD
    classDef actor fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:2px,rx:10px,ry:10px
    classDef process fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:2px
    classDef decision fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C,stroke-width:2px
    classDef api fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef system fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:2px
    classDef success fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef error fill:#FFEBEE,stroke:#C62828,color:#B71C1C,stroke-width:2px

    A(["🚀 系統啟動"]):::process --> B["📄 讀取 .env 設定"]:::process
    B --> C["🔧 解析 ROLE_ADDRESSES"]:::system

    C --> D{"任一角色有設定<br>錢包地址?"}:::decision

    D -->|"✅ YES"| E["🔒 封閉模式<br>角色驗證全面啟用"]:::system
    D -->|"❌ NO"| F["🔓 開放模式<br>任何錢包皆可簽署"]:::system

    E --> G["👤 物流人員登入<br>取得 XRPL 地址"]:::process
    G --> H["🔍 getRoleByAddress()<br>比對所屬角色"]:::system

    H --> I{"STATUS_ROLE_MAP<br>權限檢查"}:::decision

    I -->|"status = produced"| J["必須是 manufacturer 🏭"]:::actor
    I -->|"status = shipped"| K["必須是 logistics 🚚"]:::actor
    I -->|"status = sold"| L["必須是 retailer 🏪"]:::actor

    J --> M{"角色符合?"}:::decision
    K --> M
    L --> M

    M -->|"✅ 是"| N["✅ 允許建立 Payload"]:::success
    M -->|"❌ 否"| O(["❌ 403 Forbidden<br>回傳角色錯誤訊息"]):::error

    N --> P["📝 建立 Xumm Payload<br>Memo 含 role 資訊"]:::system
    P --> Q["⛓️ 簽署 → 寫入 XRPL"]:::success

    F --> R["📝 角色僅記錄在 Memo<br>不強制攔截"]:::system
    R --> P
```

### 角色對應表

```
STATUS_ROLE_MAP = {
    produced: 'manufacturer',   // 📦 生產完成 → 製造商 🏭
    shipped:  'logistics',      // 🚚 運送中   → 物流中心 🚚
    sold:     'retailer'        // 🏪 已上架   → 零售商 🏪
}
```

| 狀態 | 需簽署角色 | 環境變數 | 說明 |
|------|-----------|---------|------|
| `produced` | 🏭 製造商 | `MANUFACTURER_ADDRESS` | 生產完成 |
| `shipped` | 🚚 物流中心 | `LOGISTICS_ADDRESS` | 運送中 |
| `sold` | 🏪 零售商 | `RETAILER_ADDRESS` | 已上架銷售 |

**運作邏輯：**
1. 各角色可設定多個錢包地址（逗號分隔）
2. 所有角色地址皆未設定 → **開放模式**（任何人都可簽署）
3. 任一角色有設定地址 → **封閉模式**（強制驗證身份，否則回傳 403）

---

## 系統架構總覽

```mermaid
flowchart LR
    classDef frontend fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:2px,rx:8px,ry:8px
    classDef backend fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px,rx:8px,ry:8px
    classDef external fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:2px,rx:8px,ry:8px
    classDef highlight fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C,stroke-width:3px,rx:8px,ry:8px

    subgraph 前端層 ["🌐 前端 (public/)"]
        A["👤 消費者查詢<br>index.html"]:::frontend
        B["📋 物流管理後台<br>admin.html"]:::frontend
        C["⚙️ 共用邏輯<br>app.js"]:::frontend
    end

    subgraph 後端層 ["⚡ 後端 (server.js)"]
        D["🚦 Express 路由<br>REST API"]:::backend
        E["🔐 Xumm SDK<br>Payload 管理"]:::backend
        F["⛓️ xrpl.js Client<br>XRPL 連線"]:::backend
        G["💾 記憶體狀態<br>txIndex + pendingMap"]:::backend
    end

    subgraph 外部服務 ["🌍 外部服務"]
        H["📱 Xaman App<br>錢包簽署"]:::external
        I["🔗 XRPL Testnet<br>wss://...rippletest.net"]:::external
        J["🔍 XRPL Explorer<br>testnet.xrpl.org"]:::external
    end

    A <-->|"HTTP"| D
    B <-->|"HTTP"| D
    C --- A
    C --- B

    D --- E
    D --- F
    D --- G

    E <-->|"REST"| H
    F <-->|"WebSocket"| I
    J -.->|"驗證"| I
```

### API 路由一覽

| 方法 | 路由 | 用途 | 對應情境 |
|------|------|------|---------|
| `GET` | `/api/health` | 系統健康檢查 | 維運 |
| `POST` | `/api/auth` | 建立 Xaman SignIn Payload | 情境二 |
| `GET` | `/api/auth/:uuid` | 輪詢登入結果 | 情境二 |
| `POST` | `/api/logistics/update` | 建立物流更新 Payload | 情境三 |
| `GET` | `/api/payload/:uuid` | 輪詢簽署狀態與 txHash | 情境三 |
| `GET` | `/api/logistics/:itemId` | 查詢商品完整物流時間軸 | 情境一 |
| `GET` | `/api/roles` | 回傳角色設定（前端顯示用） | 情境二、五 |
| `GET` | `/api/debug/tx/:txHash` | 除錯：檢視原始 MemoData hex | 開發 |
| `GET` | `/api/health/data` | Health 純 JSON 端點 | 維運 |

---

## 商品生命週期

```mermaid
stateDiagram-v2
    classDef produced fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    classDef shipped fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    classDef sold fill:#FFF3E0,stroke:#F9A825,color:#E65100
    classDef unknown fill:#F5F5F5,stroke:#9E9E9E,color:#616161

    [*] --> unknown: 商品建立
    unknown --> produced: 製造商簽署
    produced --> shipped: 物流中心簽署
    shipped --> sold: 零售商簽署
    sold --> [*]: 完成溯源

    class unknown unknown
    class produced produced
    class shipped shipped
    class sold sold

    note right of unknown
        尚未有任何鏈上紀錄
        或查無此商品 ID
    end note

    note right of produced
        Memo: { status: "produced" }
        地點: 台北養雞場
        簽署: 製造商 🏭
    end note

    note right of shipped
        Memo: { status: "shipped" }
        地點: 中盤商集貨站
        簽署: 物流中心 🚚
    end note

    note right of sold
        Memo: { status: "sold" }
        地點: 零售商門市
        簽署: 零售商 🏪
    end note
```

---

## 系統啟動流程

```mermaid
flowchart LR
    classDef process fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:2px
    classDef decision fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C,stroke-width:2px
    classDef api fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef success fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px

    A["npm start"]:::process --> B["📄 載入 .env 設定"]:::process
    B --> C["🔐 初始化 Xumm SDK"]:::api
    C --> D["🔗 連線 XRPL Testnet"]:::api
    D --> E["🏦 設定物流接收帳戶"]:::process

    E --> F{"已指定<br>LOGISTICS_SEED?"}:::decision
    F -->|"✅ 是"| G["🔑 從種子恢復錢包"]:::api
    F -->|"❌ 否"| H["🆕 自動生成錢包<br>+ Faucet 注資"]:::api

    G --> I["🔍 掃描歷史交易<br>重建 txIndex"]:::api
    H --> I

    I --> J["🚀 啟動 Express<br>Port 3000"]:::success
    J --> K["✅ 系統就緒"]:::success
```

---

> 📅 文件產出：2026-05-23  
> 📦 專案：egg-tracker / 雞蛋產銷履歷追蹤系統  
> 🛠️ 技術：Node.js + Express + XRPL + Xaman SDK
