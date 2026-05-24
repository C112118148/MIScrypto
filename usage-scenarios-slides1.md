# 🥚 雞蛋產銷履歷系統 — 簡報版流程圖

> 三層架構 · 一頁一流程 · 適合投影片呈現

---

## 📖 圖例（Slide 1）

```mermaid
flowchart LR
    classDef user fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:2px,rx:12px,ry:12px
    classDef action fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:2px
    classDef system fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef data fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:2px
    classDef decision fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C,stroke-width:2px

    L1(["👤 使用者操作"]):::user
    L2["💻 前端 / App"]:::action
    L3["⚙️ 後端系統"]:::system
    L4(["🗄️ XRPL / 資料"]):::data
    L5{"🔐 判斷 / 條件"}:::decision
```

| 層級 | 代表 | 顏色 |
|:----:|------|:----:|
| 🟦 圓角 | **使用者**操作（物流/消費者） | 藍 |
| 🟧 矩形 | **前端**介面（輸入/顯示/列印） | 橙 |
| 🟩 矩形 | **後端**系統（驗證/查詢/寫入） | 綠 |
| 🟫 圓角 | **資料**傳遞（XRPL/Memo） | 青 |
| 🟪 菱形 | **判斷**條件（驗證開關/角色比對） | 紫 |

---

## 消費者查詢溯源（Slide 2）

```mermaid
flowchart TD
    classDef user fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:2px,rx:12px,ry:12px
    classDef action fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:2px
    classDef system fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef data fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:2px

    %% ── 第 1 層：使用者 ──
    A(["👤 消費者"]):::user
    A --> B

    %% ── 第 2 層：前端 ──
    B["💻 輸入商品 ID<br/>或掃描 QR Code"]:::action
    B --> C

    %% ── 第 3 層：後端 + 資料 ──
    C["⚙️ 向 XRPL 查詢交易紀錄"]:::system
    C --> D
    D(["🗄️ XRPL 回傳時間軸"]):::data
    D --> E

    %% ── 回到前端顯示 ──
    E["💻 顯示完整物流<br>📦生產→🚚運送→🏪上架"]:::action
```

> ✅ 消費者只需輸入商品 ID 或掃描包裝 QR Code，即可查看完整物流時間軸

---

## 角色權限驗證（Slide 3）

```mermaid
flowchart TD
    classDef user fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:2px,rx:12px,ry:12px
    classDef action fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:2px
    classDef system fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef data fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:2px
    classDef decision fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C,stroke-width:2px

    %% 後端收到請求
    REQ["⚙️ 收到狀態更新請求"]:::system
    REQ --> CHECK

    %% 判斷 1：角色驗證是否啟用
    CHECK{"🔐 角色驗證已啟用？"}:::decision
    CHECK -->|"❌ 否"| OPEN["🗄️ 開放模式<br/>任何人皆可簽署"]:::data
    CHECK -->|"✅ 是"| CLOSED["🗄️ 封閉模式<br/>檢查簽署者錢包"]:::data
    CLOSED --> MATCH

    %% 判斷 2：角色是否匹配
    MATCH{"👤 角色對應此狀態？"}:::decision
    MATCH -->|"✅ 是"| ALLOW(["✅ 允許簽署"]):::user
    MATCH -->|"❌ 否"| DENY(["🚫 403 拒絕"]):::user

    %% 開放模式直接簽署
    OPEN --> ALLOW
```

| 狀態 | 需由誰簽署 |
|:----:|-----------|
| 🏭 生產完成 `produced` | **製造商** |
| 🚚 運送中 `shipped` | **物流人員** |
| 🏪 已上架 `sold` | **零售商** |

---

## 物流人員操作流程（Slide 4）

```mermaid
flowchart TD
    classDef user fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:2px,rx:12px,ry:12px
    classDef action fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:2px
    classDef system fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef data fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:2px
    classDef decision fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C,stroke-width:2px

    %% ── 登入流程 ──
    LOGIN["👤 物流人員"]:::user
    LOGIN --> LOGIN1["💻 開啟 admin.html"]:::action
    LOGIN1 --> LOGIN2["📱 Xaman App 掃碼登入"]:::user
    LOGIN2 --> LOGIN3["⚙️ 後端驗證角色身份"]:::system
    LOGIN3 --> DASH["📋 管理後台"]:::action

    %% ── 功能選擇 ──
    DASH --> CHOICE{"選擇功能"}:::decision

    %% ── 路徑 A：更新狀態 ──
    CHOICE -->|"📦 更新狀態"| A1["💻 輸入商品 ID"]:::action
    A1 --> A2["⚙️ 查詢當前狀態<br/>帶入下一步"]:::system
    A2 --> A3["📱 Xaman App 掃碼簽署"]:::user
    A3 --> A4["⚙️ 寫入 XRPL 上鏈"]:::system
    A4 --> A5(["🗄️ 永久保存不可篡改"]):::data
    A5 --> A6["💻 顯示 ✅ 完成"]:::action
    A6 --> DASH

    %% ── 路徑 B：列印標籤 ──
    CHOICE -->|"🖨️ 列印標籤"| B1["💻 輸入商品 ID<br/>產生 QR Code"]:::action
    B1 --> B2(["🖨️ 列印標籤"]):::system
    B2 --> B3["👤 貼在包裝上"]:::user
    B3 --> DASH
```

---

## 物流流程（橫版 — Slide 5）

```mermaid
flowchart LR
    classDef user fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:2px,rx:12px,ry:12px
    classDef action fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:2px
    classDef system fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef data fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:2px
    classDef decision fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C,stroke-width:2px

    %% 登入
    A["👤 物流人員"]:::user
    A --> B["💻 admin.html"]:::action
    B --> C["📱 Xaman 登入"]:::user
    C --> D["⚙️ 驗證角色"]:::system
    D --> E["📋 管理後台"]:::action

    E --> F{"功能"}:::decision

    %% 更新
    F -->|"📦 更新"| G1["💻 輸入 ID"]:::action
    G1 --> G2["📱 Xaman 簽署"]:::user
    G2 --> G3["⚙️ 寫入 XRPL"]:::system
    G3 --> G4["🗄️ Memo"]:::data
    G4 --> G5["💻 ✅ 完成"]:::action
    G5 --> E

    %% 列印
    F -->|"🖨️ 列印"| H1["💻 產生 QR"]:::action
    H1 --> H2["🖨️ 列印標籤"]:::system
    H2 --> H3["👤 貼上包裝"]:::user
    H3 --> E
```

---

## 🏗️ 系統架構總覽（Slide 6）

```mermaid
flowchart LR
    classDef user fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:2px,rx:12px,ry:12px
    classDef action fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:2px
    classDef system fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:2px
    classDef data fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:2px

    subgraph 使用者
        U1["👤 消費者<br/>index.html"]:::user
        U2["📋 物流管理<br/>admin.html"]:::action
        U3["📱 Xaman App<br/>錢包簽署"]:::user
    end

    subgraph 後端
        S1["⚙️ Express API<br/>REST + WebSocket"]:::system
    end

    subgraph 區塊鏈
        D1["🗄️ XRPL Testnet<br/>交易紀錄 + Memo"]:::data
    end

    U1 <-->|"查詢"| S1
    U2 <-->|"更新"| S1
    U3 -.->|"簽署"| S1
    S1 <-->|"WebSocket"| D1
```

---

### 📌 簡報建議

| 重點 | 說明 |
|:----|------|
| **一頁一流程** | 每張投影片只放一個流程圖，避免資訊過載 |
| **三分鐘法則** | 每張圖花 2-3 分鐘講解，先講角色動機再講技術流程 |
| **由簡入深** | Slide 1(圖例) → Slide 2(消費者) → Slide 3(權限) → Slide 4-5(物流) |
| **三層視覺** | 使用者(上) → 前端(中) → 後端/資料(下)，垂直閱讀直覺 |
| **說故事** | 不要照唸流程，可以說「一顆雞蛋從農場到超市，系統怎麼確保資料不被竄改...」 |

> 📅 2026-05-23 · 🥚 雞蛋產銷履歷追蹤系統 · 簡報優化版
