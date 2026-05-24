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
    B["💻 前端/App 動作"]:::action
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

## 情境一：消費者查詢溯源

```mermaid
flowchart TD
    classDef user fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:3px,rx:12px,ry:12px
    classDef action fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:3px
    classDef system fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:3px
    classDef data fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:3px

    A(["👤 消費者"]):::user
    B["💻 輸入商品 ID<br>或掃描包裝 QR_Code"]:::action
    C["⚙️ 後端向 XRPL<br>查詢歷史交易紀錄"]:::system
    D(["🗄️ XRPL 回傳<br>完整物流時間軸"]):::data
    E["💻 前端渲染<br>時間軸介面"]:::action
    F(["👤 消費者查看<br>生產 → 運送 → 上架"]):::user

    A --> B --> C --> D --> E --> F
```

---

## 情境二：物流人員登入

```mermaid
flowchart TD
    classDef user fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:3px,rx:12px,ry:12px
    classDef action fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:3px
    classDef system fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:3px
    classDef data fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:3px

    A(["👤 物流人員"]):::user
    B["💻 點擊「Xaman 登入」<br>產生 QR Code"]:::action
    C(["📱 Xaman App<br>掃描 QR 簽署"]):::user
    D["⚙️ 後端驗證簽署<br>取得 XRPL 地址"]:::system
    E["💻 比對地址 →<br>判定角色身份"]:::action
    F(["👤 進入管理後台<br>開始操作"]):::user

    A --> B --> C --> D --> E --> F
```

---

## 情境三：物流狀態更新（核心）

```mermaid
flowchart TD
    classDef user fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:3px,rx:12px,ry:12px
    classDef action fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:3px
    classDef system fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:3px
    classDef data fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:3px

    A(["👤 物流人員<br>已登入狀態"]):::user
    B["💻 輸入商品 ID<br>系統自動帶入下一步狀態"]:::action
    C["💻 點擊「簽署並寫入」<br>產生 QR Code"]:::action
    D(["📱 Xaman App<br>掃碼簽署交易"]):::user
    E["⚙️ 後端將物流資料<br>寫入 XRPL Memo"]:::system
    F(["🗄️ XRPL 鏈上<br>永久保存"]):::data
    G["💻 顯示 ✅ 成功<br>附 Explorer 交易連結"]:::action
    H(["👤 完成狀態更新"]):::user

    A --> B --> C --> D --> E --> F --> G --> H
```

---

## 情境四：列印商品 QR 標籤

```mermaid
flowchart TD
    classDef user fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:3px,rx:12px,ry:12px
    classDef action fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:3px
    classDef system fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:3px

    A(["👤 物流人員"]):::user
    B["💻 輸入商品 ID<br>點擊「產生」"]:::action
    C["💻 QRCode.js<br>產生 QR Code 預覽"]:::action
    D["💻 確認無誤後<br>點擊「列印」"]:::action
    E(["🖨️ 印出標籤"]):::system
    F(["👤 貼在雞蛋包裝上"]):::user

    A --> B --> C --> D --> E --> F
```

---

## 情境五：角色權限驗證

```mermaid
flowchart TD
    classDef user fill:#E3F2FD,stroke:#1565C0,color:#0D47A1,stroke-width:3px,rx:12px,ry:12px
    classDef action fill:#FFF3E0,stroke:#F9A825,color:#E65100,stroke-width:3px
    classDef system fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20,stroke-width:3px
    classDef data fill:#E0F2F1,stroke:#00695C,color:#004D40,stroke-width:3px

    A(["⚙️ 後端收到<br>狀態更新請求"]):::system
    B{"系統檢查<br>角色驗證是否啟用?"}:::action
    C["🔓 開放模式<br>任何人都可簽"]:::data
    D["🔒 封閉模式<br>檢查簽署者錢包地址"]:::data
    E{"角色對應此狀態?"}:::action
    F(["👤 允許簽署 ✅"]):::user
    G(["⛔ 403 拒絕 ❌"]):::user

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

## 系統資訊流總覽

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

    A <-->|"查詢"| C
    B <-->|"更新"| C
    D -.->|"簽署"| C
    C <-->|"WebSocket"| E
```

---

> 📅 2026-05-23 · 🥚 雞蛋產銷履歷追蹤系統 · 簡報版流程圖
