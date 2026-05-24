# 🥚 雞蛋產銷履歷系統 — 簡報版流程圖

> 使用情境簡化版 · 適合投影片呈現

---

## 🎨 圖例

```mermaid
flowchart LR
    classDef user fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:3px,rx:12px,ry:12px
    classDef action fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:3px
    classDef system fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:3px
    classDef data fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:3px

    A(["👤 使用者操作"]):::user
    B["💻 前端 / App 動作"]:::action
    C["⚙️ 後端系統處理"]:::system
    D(["🗄️ 資料傳遞"]):::data
```

| 圖示 | 代表 | 顏色 |
|:----:|------|:----:|
| 👤 圓角 | **使用者**操作 | 藍色 |
| 💻 矩形 | **前端**流程 | 橙色 |
| ⚙️ 矩形 | **後端**系統 | 綠色 |
| 🗄️ 圓角 | **資料**傳遞 | 青色 |

---

## 物流人員完整操作流程

```mermaid
flowchart TD
    classDef user fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:3px,rx:12px,ry:12px
    classDef action fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:3px
    classDef system fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:3px
    classDef data fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:3px
    classDef decision fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C,stroke-width:3px
    classDef startend fill:#ECEFF1,stroke:#546E7A,color:#263238,stroke-width:3px,rx:20px,ry:20px

    A(["👤 物流人員"]):::user
    A --> LOGIN1["💻 開啟 admin.html<br>點擊 Xaman 錢包登入"]:::action
    LOGIN1 --> LOGIN2["📱 Xaman App<br>掃描 QR Code 簽署"]:::user
    LOGIN2 --> LOGIN3["⚙️ 後端驗證帳戶<br>判定角色身份"]:::system
    LOGIN3 --> DASH["📋 進入管理後台"]:::action

    DASH --> CHOICE{"選擇功能"}:::decision

    %% ─── 路徑 A：更新物流狀態 ───
    CHOICE -->|"A. 更新物流狀態"| A1["💻 輸入商品 ID<br>（手動 / QR 掃描 / 掃描槍）"]:::action
    A1 --> A2["⚙️ 查詢鏈上目前狀態<br>自動帶入下一步選項"]:::system
    A2 --> A3["💻 確認狀態與地點<br>點擊「簽署並寫入」"]:::action
    A3 --> A4["📱 Xaman App<br>掃碼簽署交易"]:::user
    A4 --> A5["⚙️ 寫入 XRPL<br>物流紀錄上鏈"]:::system
    A5 --> A6["🗄️ XRPL Memo<br>永久保存不可篡改"]:::data
    A6 --> A7["💻 顯示 ✅ 成功<br>附交易驗證連結"]:::action
    A7 --> DASH

    %% ─── 路徑 B：列印 QR 標籤 ───
    CHOICE -->|"B. 列印 QR 標籤"| B1["💻 輸入商品 ID<br>點擊「產生」"]:::action
    B1 --> B2["💻 QRCode.js<br>產生 QR Code 預覽"]:::action
    B2 --> B3["💻 確認無誤<br>點擊「列印」"]:::action
    B3 --> B4(["🖨️ 印出標籤"]):::system
    B4 --> B5(["👤 貼在雞蛋包裝上"]):::user
    B5 --> DASH

    %% ─── 登出 ───
    DASH --> LOGOUT{"繼續 or 登出?"}:::decision
    LOGOUT -->|"繼續"| CHOICE
    LOGOUT -->|"登出"| END(["🏁 結束"]):::startend
```

### 流程重點

| 步驟 | 關鍵動作 | 參與者 |
|:----:|---------|:------:|
| ① 登入 | Xaman App 掃碼簽署 → 後端驗證角色 | 👤 物流人員 + 📱 Xaman |
| ② 更新狀態 | 輸入 ID → 系統自動帶入下一步 → Xaman 掃碼簽署 → 寫入 XRPL | 👤 物流人員 + ⚙️ 後端 + 🗄️ XRPL |
| ③ 列印標籤 | 產生 QR → 列印 → 貼在包裝 | 👤 物流人員 + 🖨️ 印表機 |

---

## 消費者查詢溯源

```mermaid
flowchart TD
    classDef user fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:3px,rx:12px,ry:12px
    classDef action fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:3px
    classDef system fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:3px
    classDef data fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:3px
    classDef startend fill:#ECEFF1,stroke:#546E7A,color:#263238,stroke-width:3px,rx:20px,ry:20px

    A(["👤 消費者"]):::user
    B["💻 輸入商品 ID<br>或掃描包裝 QR Code"]:::action
    C["⚙️ 後端向 XRPL<br>查詢歷史交易紀錄"]:::system
    D(["🗄️ XRPL 回傳<br>完整物流時間軸"]):::data
    E["💻 前端顯示時間軸<br>📦生產 → 🚚運送 → 🏪上架"]:::action
    END(["🏁 查詢完成"]):::startend

    A --> B --> C --> D --> E --> END
```

---

## 角色權限驗證

```mermaid
flowchart TD
    classDef user fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:3px,rx:12px,ry:12px
    classDef action fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:3px
    classDef system fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:3px
    classDef data fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:3px
    classDef decision fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C,stroke-width:3px

    A["⚙️ 後端收到狀態更新請求"]:::system
    B{"角色驗證已啟用?"}:::decision
    C["🔓 開放模式<br>任何人皆可簽署"]:::data
    D["🔒 封閉模式<br>檢查簽署者錢包地址"]:::data
    E{"角色對應此狀態?"}:::decision
    F(["✅ 允許簽署"]):::user
    G(["⛔ 403 拒絕"]):::user

    A --> B
    B -->|"否"| C
    B -->|"是"| D
    D --> E
    E -->|"是"| F
    E -->|"否"| G
```

| 狀態 | 需由誰簽署 |
|------|-----------|
| 📦 生產完成 `produced` | 🏭 **製造商** |
| 🚚 運送中 `shipped` | 🚚 **物流中心** |
| 🏪 已上架銷售 `sold` | 🏪 **零售商** |

---

## 系統架構與資訊流

```mermaid
flowchart LR
    classDef user fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:3px,rx:12px,ry:12px
    classDef action fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:3px
    classDef system fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:3px
    classDef data fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:3px

    A["👤 消費者<br>index.html"]:::user
    B["📋 物流管理<br>admin.html"]:::action
    C["⚙️ Express 後端<br>REST API"]:::system
    D(["📱 Xaman App<br>錢包簽署"]):::user
    E(["🗄️ XRPL Testnet<br>交易 + Memo"]):::data

    A <-->|"查詢資料"| C
    B <-->|"更新狀態"| C
    D -.->|"簽署交易"| C
    C <-->|"WebSocket"| E
```

---

> 📅 2026-05-23 · 🥚 雞蛋產銷履歷追蹤系統 · 簡報版流程圖
