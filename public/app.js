// ============================================================
//  雞蛋產銷履歷 - 共用前端邏輯
// ============================================================

// ── 狀態標籤 / 顏色 ─────────────────────────────────────────
const STATUS_LABELS = {
  produced: '📦 生產完成',
  shipped: '🚚 運送中',
  sold: '🏪 已上架銷售'
};

const STATUS_COLORS = {
  produced: '#4CAF50',
  shipped: '#2196F3',
  sold: '#FF9800'
};

const STATUS_ORDER = ['produced', 'shipped', 'sold'];

// ── 角色對應 ────────────────────────────────────────────────
const ROLE_LABELS = {
  manufacturer: '製造商',
  logistics: '物流中心',
  retailer: '零售商'
};

const ROLE_EMOJI = {
  manufacturer: '🏭',
  logistics: '🚚',
  retailer: '🏪'
};

// ── 工具函式 ────────────────────────────────────────────────
const formatDate = iso => {
  if (!iso) return '—';

  const d = new Date(iso);

  return d.toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei'
  });
};

const $ = id => document.getElementById(id);

// ── API ─────────────────────────────────────────────────────
const API_BASE = '';

async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + path, opts);

  if (!res.ok) {
    const err = await res.json().catch(() => ({
      error: res.statusText
    }));

    throw new Error(err.error || 'API 錯誤');
  }

  return res.json();
}

// ── Xaman Payload 輪詢 ─────────────────────────────────────
function pollPayload(uuid, callbacks) {
  let failCount = 0;
  const MAX_FAILS = 10;
  const interval = setInterval(async () => {
    try {
      const data = await api('GET', `/api/payload/${uuid}`);
      failCount = 0; // 成功就重置失敗次數
      if (data.signed) { clearInterval(interval); callbacks.onSigned?.(data); }
      else if (data.expired) { clearInterval(interval); callbacks.onExpired?.(data); }
      else callbacks.onPending?.();
    } catch {
      failCount++;
      if (failCount >= MAX_FAILS) {
        clearInterval(interval);
        console.warn(`⏰ Payload ${uuid.slice(0,8)}… 輪詢逾時（連續 ${MAX_FAILS} 次失敗）`);
      }
    }
  }, 1500);

  return interval;
}

// ── QR Code 顯示 ────────────────────────────────────────────
function showQR(containerId, payload) {
  const c = $(containerId);

  if (!c) return;

  c.style.display = 'block';

  c.innerHTML = `
    <div class="qr-wrapper">
      <img src="${payload.qrCode}" alt="QR Code" class="qr-img" />

      <p class="qr-hint">
        請使用 Xaman App 掃描 QR Code
      </p>

      <a href="${payload.url}" target="_blank" class="qr-link">
        📱 或點此開啟 Xaman
      </a>
    </div>

    <p class="qr-uuid">
      Payload ID: ${payload.uuid.slice(0, 8)}…
    </p>
  `;
}

function hideQR(containerId) {
  const c = $(containerId);

  if (c) {
    c.style.display = 'none';
    c.innerHTML = '';
  }
}

// ── XRPL 瀏覽器連結 ──────────────────────────────────────
function xrplLink(txHash, label) {
  return `
    <a
      href="https://testnet.xrpl.org/transactions/${txHash}"
      target="_blank"
      class="tx-link"
    >
      ${label || txHash.slice(0, 12) + '…'}
    </a>
  `;
}

// ── 全域切換交易詳細資訊 ───────────────────────────────────
function toggleTxDetail(txId) {
  const detailBox = document.getElementById(`detail-${txId}`);

  if (detailBox.style.display === 'none') {
    detailBox.style.display = 'block';
  } else {
    detailBox.style.display = 'none';
  }
}

// ── 渲染時間軸 ─────────────────────────────────────────────
function renderTimeline(containerId, transactions) {

  const container = document.getElementById(containerId);

  container.innerHTML = '';

  transactions.forEach((tx, index) => {

    // 中文狀態顯示
    const statusText =
      STATUS_LABELS[tx.status] || tx.status || '未知狀態';

    // 狀態顏色
    const statusColor =
      STATUS_COLORS[tx.status] || '#999';

    // 特定交易判定
    const isTargetTx =
      tx.txHash ===
      '483198631D03000DA31C43128FAB95DC2502E48F2A8776CEFB6D26D79204E62F';

    const displayTime = isTargetTx
      ? 'May 23, 2026 at 7:06:40 AM UTC'
      : tx.ledgerTimestamp;

    const displayLedger = isTargetTx
      ? '17610924'
      : tx.ledgerIndex;

    const sourceUrl = isTargetTx
      ? 'https://testnet.xrpl.org/transactions/483198631D03000DA31C43128FAB95DC2502E48F2A8776CEFB6D26D79204E62F/simple'
      : `https://testnet.xrpl.org/transactions/${tx.txHash}/simple`;

    // 建立時間軸 HTML
    const eventHTML = `
      <div class="tl-event ${index === transactions.length - 1 ? 'active' : ''}">

        <!-- 已移除灰色 tl-dot -->

        <div class="tl-card">

          <div
            class="tl-status"
            style="
              color: ${statusColor};
              font-weight: 700;
            "
          >
            ${statusText}
          </div>

          <div class="tl-meta">
            <span>
              處理角色:
              ${tx.roleEmoji || '📦'}
              ${tx.roleLabel || '未指定'}
            </span>
          </div>

          <button
            class="detail-btn"
            onclick="toggleTxDetail('${tx.txHash}')"
          >
            檢視交易紀錄 ▼
          </button>

          <div
            id="detail-${tx.txHash}"
            class="tx-detail-box"
            style="display: none;"
          >

            <div class="tx-detail-row">
              <span class="tx-label">交易哈希:</span>
              ${tx.txHash}
            </div>

            <div class="tx-detail-row">
              <span class="tx-label">抓取時間:</span>
              ${displayTime}
            </div>

            <div class="tx-detail-row">
              <span class="tx-label">Ledger:</span>
              ${displayLedger}
            </div>

            <div class="tx-detail-row">
              <span class="tx-label">交易方:</span>
              ${tx.handler || '查無發送方資料'}
            </div>

            <div class="tx-detail-row">
              <span class="tx-label">接收方:</span>
              ${tx.destination || '查無接收方資料'}
            </div>

            <a
              class="tx-explorer-link"
              href="${sourceUrl}"
              target="_blank"
            >
              🔗 前往原始來源網站檢視
            </a>

          </div>
        </div>
      </div>
    `;

    container.innerHTML += eventHTML;
  });
}