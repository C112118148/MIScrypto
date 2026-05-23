// =============================================================
//  雞蛋產銷履歷追蹤系統 - XRPL Testnet + Xaman SDK
//  不使用傳統資料庫，所有物流狀態皆寫入 XRPL Transaction Memo
// =============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const xrpl = require('xrpl');

// ----- Xumm SDK -----
const { XummSdk } = require('xumm-sdk');

const app = express();
const PORT = process.env.PORT || 3000;

const path = require('path');
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============================================================
//  工具函式
// ============================================================
const toHex   = str => Buffer.from(str, 'utf8').toString('hex').toUpperCase();
const fromHex = hex => Buffer.from(hex, 'hex').toString('utf8');
// 產生純 ASCII JSON — 非 ASCII 字元轉成 \uXXXX，避免 XRPL Explorer 解碼亂碼
const jsonToHex = obj => toHex(JSON.stringify(obj).replace(/[\u{0080}-\u{10FFFF}]/gu, c =>
  '\\u' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')
));

const XRPL_EPOCH_OFFSET = 946684800; // 秒數: 2000-01-01 00:00:00 UTC
const txDateToISO = rippleSec =>
  new Date((rippleSec + XRPL_EPOCH_OFFSET) * 1000).toISOString();

// ============================================================
//  Xaman SDK 初始化
// ============================================================
const XUMM_API_KEY    = process.env.XUMM_API_KEY;
const XUMM_API_SECRET = process.env.XUMM_API_SECRET;
if (!XUMM_API_KEY || !XUMM_API_SECRET) {
  console.error('❌ 請在 .env 中設定 XUMM_API_KEY 與 XUMM_API_SECRET');
  console.error('   前往 https://apps.xaman.dev/ 建立應用程式以取得憑證');
  process.exit(1);
}

app.get('/api/health/data', (_req, res) => {
  res.json({ status: 'ok', network: 'xrpl-testnet', logisticsAddress, trackedItems: txIndex.size });
});

// 2. 當使用者在瀏覽器輸入 /api/health 時，回傳 Health.html 介面
app.get('/api/health', (req, res) => {
  // 檢查請求標頭 (Header) 是否包含 text/html，代表是瀏覽器直接瀏覽
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    // 回傳網頁介面 (請確保 Health.html 放在 public 資料夾下)
    return res.sendFile(path.join(__dirname, 'public', 'Health.html'));
  }

  // 否則 (例如 Fetch 請求)，回傳原本的 JSON 數據
  res.json({ status: 'ok', network: 'xrpl-testnet', logisticsAddress, trackedItems: txIndex.size });
});
const sdk = new XummSdk(XUMM_API_KEY, XUMM_API_SECRET);
console.log('✅ Xumm SDK 初始化完成');

// ============================================================
//  XRPL Client — 連線至 Testnet
// ============================================================
const xrplClient = new xrpl.Client('wss://s.altnet.rippletest.net:51233');

// ============================================================
//  記憶體索引（不存本機檔案，啟動時從 XRPL 掃描重建）
//  txIndex      : Map<itemId, Array<{ txHash, timestamp }>>
//  pendingMap   : Map<uuid, { itemId, status }>
// ============================================================
const txIndex    = new Map();
const pendingMap = new Map();

// 啟動時從 XRPL 掃描物流帳戶的所有 incoming 交易，重建索引
async function buildIndex() {
  console.log('🔍 正在從 XRPL 掃描歷史交易重建索引…');
  let marker;
  let scanned = 0;
  do {
    const res = await xrplClient.request({
      command: 'account_tx',
      account: logisticsAddress,
      ledger_index_min: -1,
      ledger_index_max: -1,
      limit: 200,
      marker
    });
    for (const txEntry of res.result.transactions) {
      const tx = txEntry.tx_json || txEntry.tx;
      if (!tx?.Memos) continue;
      for (const mw of tx.Memos) {
        try {
          if (fromHex(mw.Memo.MemoType) !== 'eggtrack/item-status') continue;
          const raw = fromHex(mw.Memo.MemoData);
          const braceEnd = raw.lastIndexOf('}');
          const data = JSON.parse(braceEnd !== -1 ? raw.slice(0, braceEnd + 1) : raw);
          if (!data.itemId) continue;
          if (!txIndex.has(data.itemId)) txIndex.set(data.itemId, []);
          const role = data.role || getRoleByAddress(tx.Account) || '';
          txIndex.get(data.itemId).push({ txHash: tx.hash || txEntry.hash, timestamp: data.timestamp, role });
          scanned++;
        } catch { /* 跳過無法解析的 Memo */ }
      }
    }
    marker = res.result.marker;
  } while (marker);
  console.log(`📦 索引重建完成: ${txIndex.size} 項商品, ${scanned} 筆交易`);
}

// ============================================================
//  多重簽章角色設定 — 每個 status 綁定特定角色錢包地址
// ============================================================
// 支援逗號分隔多地址：'rABC...,rXYZ...'
const ROLE_ADDRESSES = {
  manufacturer: (process.env.MANUFACTURER_ADDRESS || '').split(',').map(s => s.trim()).filter(Boolean),
  logistics:    (process.env.LOGISTICS_ADDRESS || '').split(',').map(s => s.trim()).filter(Boolean),
  retailer:     (process.env.RETAILER_ADDRESS || '').split(',').map(s => s.trim()).filter(Boolean),
};
const STATUS_ROLE_MAP = { produced: 'manufacturer', shipped: 'logistics', sold: 'retailer' };
const ROLE_LABELS    = { manufacturer: '製造商', logistics: '物流中心', retailer: '零售商' };
const EMOJI_ROLE     = { manufacturer: '🏭',  logistics: '🚚',  retailer: '🏪' };

function getRoleByAddress(address) {
  if (!address) return null;
  const addr = address.trim();
  for (const [role, addrs] of Object.entries(ROLE_ADDRESSES)) {
    if (addrs.includes(addr)) return role;
  }
  return null;
}
function getRequiredRoleForStatus(status) {
  return STATUS_ROLE_MAP[status] || null;
}
function isRoleConfigured(role) {
  return ROLE_ADDRESSES[role] && ROLE_ADDRESSES[role].length > 0;
}

// ============================================================
//  物流接收帳戶 — 所有物流交易的目的地
// ============================================================
let logisticsAddress = '';

async function setupLogisticsAccount() {
  const seed = process.env.LOGISTICS_SEED;

  if (seed) {
    const wallet = xrpl.Wallet.fromSeed(seed);
    logisticsAddress = wallet.classicAddress;
    console.log(`🏦 物流帳戶 (從種子): ${logisticsAddress}`);
  } else {
    // 自動生成並從 Testnet Faucet 注資
    const wallet = xrpl.Wallet.generate();
    console.log(`🔑 新物流錢包種子 (分享給全組使用): ${wallet.seed}`);
    console.log(`   請將 LOGISTICS_SEED=${wallet.seed} 加入大家的 .env`);
    try {
      const fundResult = await xrplClient.fundWallet(wallet);
      logisticsAddress = fundResult.wallet.classicAddress;
      console.log(`🏦 物流帳戶已生成並注資: ${logisticsAddress}`);
    } catch (e) {
      console.error('❌ 無法從 Faucet 取得測試 XRP:', e.message);
      console.error('   請至 https://testnet.xrpl.org/faucet 手動注資');
      throw e;
    }
  }

  // 驗證帳戶是否已啟用
  try {
    const ai = await xrplClient.request({
      command: 'account_info', account: logisticsAddress, ledger_index: 'validated'
    });
    const bal = xrpl.dropsToXrp(ai.result.account_data.Balance);
    console.log(`💰 物流帳戶餘額: ${bal} XRP`);
  } catch {
    console.warn(`⚠️ 物流帳戶 ${logisticsAddress} 尚未啟用，請先注資`);
  }
}

// ============================================================
//  API 路由
// ============================================================

// GET /api/health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', network: 'xrpl-testnet', logisticsAddress, trackedItems: txIndex.size });
});

// ─── 登入 ─────────────────────────────────────────────────

// POST /api/auth  — 建立 Xaman SignIn Payload
app.post('/api/auth', async (_req, res) => {
  try {
    const payload = await sdk.payload.create({ TransactionType: 'SignIn' });
    res.json({
      uuid: payload.uuid,
      qrCode: payload.refs.qr_png,
      url: payload.next.always
    });
  } catch (err) {
    console.error('❌ Auth 建立失敗:', err.message);
    res.status(500).json({ error: '無法建立登入 Payload', detail: err.message });
  }
});

// GET /api/auth/:uuid  — 輪詢登入結果
app.get('/api/auth/:uuid', async (req, res) => {
  try {
    const p = await sdk.payload.get(req.params.uuid);
    if (p.meta.signed)
      return res.json({ signed: true, account: p.response.account, userToken: p.response.user_token ?? null });
    if (p.meta.expired)
      return res.json({ signed: false, expired: true });
    res.json({ signed: false, expired: false });
  } catch (err) {
    res.status(500).json({ error: '查詢登入狀態失敗', detail: err.message });
  }
});

// ─── 物流更新 ────────────────────────────────────────────

// POST /api/logistics/update  — 建立 Xaman 簽章 Payload
app.post('/api/logistics/update', async (req, res) => {
  try {
    const { itemId, status, location, signerAddress } = req.body;
    if (!itemId || !status)
      return res.status(400).json({ error: '缺少必要欄位 itemId / status' });
    if (!['produced', 'shipped', 'sold'].includes(status))
      return res.status(400).json({ error: 'status 須為 produced / shipped / sold' });

    // 角色驗證：如果該角色已設定錢包地址，簽署者必須是其中一員
    const requiredRole = getRequiredRoleForStatus(status);
    if (requiredRole && isRoleConfigured(requiredRole)) {
      const expectedAddrs = ROLE_ADDRESSES[requiredRole];
      if (!signerAddress) {
        return res.status(403).json({ error: `此操作需要 ${ROLE_LABELS[requiredRole]} 簽署，請先登入` });
      }
      if (!expectedAddrs.includes(signerAddress.trim())) {
        return res.status(403).json({
          error: `簽署者不符 — 這個步驟需要 ${EMOJI_ROLE[requiredRole]} ${ROLE_LABELS[requiredRole]} 的錢包來簽`,
          expectedRole: requiredRole, expectedAddresses: expectedAddrs
        });
      }
    }

    const memoData = {
      type: 'eggtrack/item-status', v: 2,
      itemId: itemId.trim(),
      status,
      timestamp: new Date().toISOString(),
      location: (location || '').trim(),
      role: requiredRole || undefined   // 紀錄上鏈，誰簽的這步
    };

    const payload = await sdk.payload.create({
      TransactionType: 'Payment',
      Destination: logisticsAddress,
      Amount: '1',
      Memos: [{ Memo: { MemoType: toHex('eggtrack/item-status'), MemoData: jsonToHex(memoData) } }]
    });

    pendingMap.set(payload.uuid, { itemId: itemId.trim(), status, role: requiredRole });
    console.log(`📦 Payload 已建立: itemId=${itemId} status=${status} role=${requiredRole || 'any'} uuid=${payload.uuid}`);

    res.json({ uuid: payload.uuid, qrCode: payload.refs.qr_png, url: payload.next.always });
  } catch (err) {
    console.error('❌ 物流 Payload 建立失敗:', err.message);
    res.status(500).json({ error: '無法建立物流更新', detail: err.message });
  }
});

// GET /api/payload/:uuid  — 通用 Payload 輪詢
app.get('/api/payload/:uuid', async (req, res) => {
  try {
    const p = await sdk.payload.get(req.params.uuid);
    if (p.meta.signed && p.response.txid) {
      const info = pendingMap.get(req.params.uuid) || {};
      const txHash = p.response.txid;

      if (info.itemId) {
        if (!txIndex.has(info.itemId)) txIndex.set(info.itemId, []);
        txIndex.get(info.itemId).push({ txHash, timestamp: new Date().toISOString() });
        // 交易已在 XRPL 上，不存本機檔案；重啟時會從鏈上掃描重建
        console.log(`✅ 交易入帳: itemId=${info.itemId} status=${info.status} tx=${txHash.slice(0,12)}...`);
      }
      pendingMap.delete(req.params.uuid);
      return res.json({ signed: true, txHash, itemId: info.itemId, account: p.response.account });
    }
    if (p.meta.expired) {
      pendingMap.delete(req.params.uuid);
      return res.json({ signed: false, expired: true });
    }
    res.json({ signed: false, expired: false });
  } catch (err) {
    res.status(500).json({ error: '查詢 Payload 狀態失敗', detail: err.message });
  }
});

// ─── 角色查詢 ─────────────────────────────────────────────

// GET /api/roles  — 回傳角色設定（給前端顯示用）
app.get('/api/roles', (_req, res) => {
  const configured = {};
  for (const [role, addrs] of Object.entries(ROLE_ADDRESSES)) {
    configured[role] = {
      addresses: addrs.length > 0 ? addrs : null,
      label: ROLE_LABELS[role],
      emoji: EMOJI_ROLE[role],
      configured: addrs.length > 0
    };
  }
  res.json({ roles: configured, statusRole: STATUS_ROLE_MAP });
});

// ─── 查詢 ─────────────────────────────────────────────────

// GET /api/debug/tx/:txHash  — 檢查原始 MemoData hex（除錯用）
app.get('/api/debug/tx/:txHash', async (req, res) => {
  try {
    const txRes = await xrplClient.request({
      command: 'tx', transaction: req.params.txHash, binary: false
    });
    const tx = txRes.result;
    tx.logisticsAddress = logisticsAddress;

    // 解析每個 Memo，回傳 hex 與 decoded 版本
    const memos = [];
    for (const mw of (tx.tx_json?.Memos || tx.Memos || [])) {
      const memoTypeHex = mw.Memo.MemoType || '';
      const memoDataHex = mw.Memo.MemoData || '';
      let memoTypeDecoded = '', memoDataDecoded = '';
      try { memoTypeDecoded = fromHex(memoTypeHex); } catch {}
      try { memoDataDecoded = fromHex(memoDataHex); } catch {}
      memos.push({
        MemoType: { hex: memoTypeHex, decoded: memoTypeDecoded },
        MemoData: { hex: memoDataHex, decoded: memoDataDecoded, length: { hexChars: memoDataHex.length, bytes: memoDataHex.length / 2 } }
      });
    }

    res.json({ txHash: req.params.txHash, account: tx.Account, memos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logistics/:itemId  — 從 XRPL 取得歷史紀錄並回傳時間軸
app.get('/api/logistics/:itemId', async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const entries = txIndex.get(itemId) || [];

    if (entries.length === 0)
      return res.json({ itemId, currentStatus: 'unknown', totalEvents: 0, transactions: [] });

    const transactions = [];
    for (const entry of entries) {
      try {
        const txRes = await xrplClient.request({
          command: 'tx', transaction: entry.txHash, binary: false
        });
        const tx = txRes.result;
        const txJson = tx.tx_json || tx;
        if (!txJson.Memos) continue;

        for (const mw of txJson.Memos) {
          try {
            const memoType = fromHex(mw.Memo.MemoType);
            if (memoType !== 'eggtrack/item-status') continue;
            // 安全解析 JSON — 忽略尾部多餘的 bytes（Xumm/XRPL 序列化可能附加的亂碼）
            const raw = fromHex(mw.Memo.MemoData);
            const braceEnd = raw.lastIndexOf('}');
            const data = JSON.parse(braceEnd !== -1 ? raw.slice(0, braceEnd + 1) : raw);

            const role = data.role || getRoleByAddress(txJson.Account) || '';
            transactions.push({
              txHash: entry.txHash,
              status: data.status,
              timestamp: data.timestamp,
              ledgerTimestamp: txJson.date ? txDateToISO(txJson.date) : data.timestamp,
              location: data.location || '',
              handler: txJson.Account,
              role,           // 製造商 / 物流中心 / 零售商
              roleLabel: ROLE_LABELS[role] || '',
              roleEmoji: EMOJI_ROLE[role] || '',
              ledgerIndex: tx.ledger_index
            });
          } catch { /* 跳過無法解析的 Memo */ }
        }
      } catch { /* 交易可能尚未驗證 */ }
    }

    transactions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const currentStatus = transactions.length > 0 ? transactions.at(-1).status : 'unknown';

    res.json({ itemId, currentStatus, totalEvents: transactions.length, transactions });
  } catch (err) {
    console.error('❌ 查詢失敗:', err.message);
    res.status(500).json({ error: '查詢失敗', detail: err.message });
  }
});

// ============================================================
//  啟動伺服器
// ============================================================
async function main() {
  await xrplClient.connect();
  console.log('🔗 已連線 XRPL Testnet');

  await setupLogisticsAccount();
  await buildIndex();

  app.listen(PORT, () => {
    console.log(`\n🚀 雞蛋產銷履歷系統啟動完成`);
    console.log(`   消費者查詢: http://localhost:${PORT}/?itemId=EGG001`);
    console.log(`   物流管理頁: http://localhost:${PORT}/admin.html`);
    console.log(`   API 健康檢查: http://localhost:${PORT}/api/health\n`);
  });
}

main().catch(err => { console.error('💥 啟動失敗:', err); process.exit(1); });
