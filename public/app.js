// ============================================================
//  雞蛋產銷履歷 - 共用前端邏輯
// ============================================================

// ── 狀態標籤 / 顏色 ─────────────────────────────────────────
const STATUS_LABELS = {
  produced: '📦 生產完成',
  shipped:  '🚚 運送中',
  sold:     '🏪 已上架銷售'
};
const STATUS_COLORS = {
  produced: '#4CAF50',
  shipped:  '#2196F3',
  sold:     '#FF9800'
};
const STATUS_ORDER = ['produced', 'shipped', 'sold'];

// ── 工具函式 ────────────────────────────────────────────────
const formatDate = iso => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
};

const $ = id => document.getElementById(id);

// ── API ─────────────────────────────────────────────────────
const API_BASE = '';

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API 錯誤');
  }
  return res.json();
}

// ── Xaman Payload 輪詢 ─────────────────────────────────────
function pollPayload(uuid, callbacks) {
  const interval = setInterval(async () => {
    try {
      const data = await api('GET', `/api/payload/${uuid}`);
      if (data.signed) { clearInterval(interval); callbacks.onSigned?.(data); }
      else if (data.expired) { clearInterval(interval); callbacks.onExpired?.(data); }
      else callbacks.onPending?.();
    } catch { /* 靜默重試 */ }
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
      <p class="qr-hint">請使用 Xaman App 掃描 QR Code</p>
      <a href="${payload.url}" target="_blank" class="qr-link">📱 或點此開啟 Xaman</a>
    </div>
    <p class="qr-uuid">Payload ID: ${payload.uuid.slice(0,8)}…</p>`;
}

function hideQR(containerId) {
  const c = $(containerId);
  if (c) { c.style.display = 'none'; c.innerHTML = ''; }
}

// ── XRPL 瀏覽器連結 ──────────────────────────────────────
function xrplLink(txHash, label) {
  return `<a href="https://testnet.xrpl.org/transactions/${txHash}" target="_blank" class="tx-link">${label || txHash.slice(0,12)+'…'}</a>`;
}

// ── 渲染時間軸 ──────────────────────────────────────────────
function renderTimeline(containerId, transactions) {
  const c = $(containerId);
  if (!c) return;

  if (!transactions || transactions.length === 0) {
    c.innerHTML = '<div class="empty-state">📭 尚無物流紀錄</div>';
    return;
  }

  let html = '<div class="timeline">';
  transactions.forEach((tx, i) => {
    const label  = STATUS_LABELS[tx.status] || tx.status;
    const color  = STATUS_COLORS[tx.status] || '#999';
    const isLast = i === transactions.length - 1;
    html += `
      <div class="tl-event ${isLast ? 'active' : ''}">
        <div class="tl-dot" style="background:${color};border-color:${color}"></div>
        <div class="tl-card">
          <div class="tl-status" style="color:${color}">${label}</div>
          <div class="tl-meta">
            <span>🕐 ${formatDate(tx.timestamp)}</span>
            ${tx.location ? `<span>📍 ${tx.location}</span>` : ''}
          </div>
          <div class="tl-footer">
            <span class="tl-handler">👤 ${tx.handler ? tx.handler.slice(0,12)+'…' : '—'}</span>
            ${tx.txHash ? xrplLink(tx.txHash, '🔗 檢視交易') : ''}
          </div>
        </div>
      </div>`;
  });
  html += '</div>';
  c.innerHTML = html;
}
