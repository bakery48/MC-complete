/* ===== 定数 ===== */
const STORAGE_KEY    = 'mc-tracker-v1';
const ARTWORK_KEY    = 'mc-artwork-v1';
const SYNC_STATE_KEY = 'mc-tracker-sync-v1';
const FIREBASE_URL_KEY  = 'mc-firebase-url';
const FIREBASE_ROOM_KEY = 'mc-firebase-room';
const PREF_KEY = 'mc-pref-v1';

/* ===== 状態 ===== */
let sung = {};       // { "albumId::trackIndex": true }
let artworkCache = {}; // { albumId: imageUrl }
let sungSync = {};   // { "albumId::trackIndex": { v: 1|-1, at: timestamp } }
let syncUrl     = null;
let syncRoomId  = 'default';
let syncPollId  = null;
let pref = {}; // { "albumId::trackIndex": "strong" | "weak" }

/* ===== アートワーク取得（iTunes Search API） ===== */
function loadArtworkCache() {
  try {
    const raw = localStorage.getItem(ARTWORK_KEY);
    artworkCache = raw ? JSON.parse(raw) : {};
  } catch {
    artworkCache = {};
  }
}

function saveArtworkCache() {
  localStorage.setItem(ARTWORK_KEY, JSON.stringify(artworkCache));
}

async function fetchArtwork(album) {
  if (album.artworkUrl) return album.artworkUrl;
  if (artworkCache[album.id]) return artworkCache[album.id];
  try {
    const q = encodeURIComponent(album.itunesSearch);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${q}&media=music&entity=album&country=JP&limit=5`
    );
    const data = await res.json();
    const hit = data.results?.find(r =>
      r.collectionType === 'Album' &&
      r.artistName?.toLowerCase().includes('children')
    ) ?? data.results?.[0];
    if (hit?.artworkUrl100) {
      const url = hit.artworkUrl100.replace('100x100bb', '600x600bb');
      artworkCache[album.id] = url;
      saveArtworkCache();
      return url;
    }
  } catch {
    /* ネットワークエラー時はプレースホルダーを維持 */
  }
  return null;
}

function applyArtwork(albumId, url) {
  document.querySelectorAll(`[data-artwork="${albumId}"]`).forEach(el => {
    el.style.backgroundImage = `url('${url}')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.color = 'transparent';
    el.textContent = '';
  });
}

async function loadAllArtwork() {
  loadArtworkCache();
  /* artworkUrl 指定済みはキャッシュより優先して即時適用 */
  ALBUMS.forEach(album => {
    if (album.artworkUrl) {
      applyArtwork(album.id, album.artworkUrl);
    } else if (artworkCache[album.id]) {
      applyArtwork(album.id, artworkCache[album.id]);
    }
  });
  /* artworkUrl も キャッシュもないものを iTunes から取得 */
  const missing = ALBUMS.filter(a => !a.artworkUrl && !artworkCache[a.id]);
  for (const album of missing) {
    const url = await fetchArtwork(album);
    if (url) applyArtwork(album.id, url);
    await new Promise(r => setTimeout(r, 150));
  }
}

/* ===== LocalStorage ===== */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    sung = raw ? JSON.parse(raw) : {};
  } catch {
    sung = {};
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sung));
}

function loadSyncState() {
  try {
    const raw = localStorage.getItem(SYNC_STATE_KEY);
    sungSync = raw ? JSON.parse(raw) : {};
  } catch {
    sungSync = {};
  }
  for (const k of Object.keys(sung)) {
    if (!sungSync[k]) sungSync[k] = { v: 1, at: 0 };
  }
}

function saveSyncState() {
  localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(sungSync));
}

/* ===== 強弱プリファレンス ===== */
function loadPref() {
  try { pref = JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); }
  catch { pref = {}; }
}

function savePref() {
  localStorage.setItem(PREF_KEY, JSON.stringify(pref));
}

function getPref(key) { return pref[key] || ''; }

function setPref(key, value) {
  if (pref[key] === value) { delete pref[key]; } else { pref[key] = value; }
  savePref();
}

function updatePrefBtns(itemEl, key) {
  itemEl.querySelectorAll('.pref-btn').forEach(b => {
    b.classList.toggle('strong-active', b.dataset.pref === 'strong' && pref[key] === 'strong');
    b.classList.toggle('weak-active',   b.dataset.pref === 'weak'   && pref[key] === 'weak');
  });
}

function trackKey(albumId, trackIndex) {
  return `${albumId}::${trackIndex}`;
}

/* ===== 進捗計算 ===== */
function totalCount() {
  return ALBUMS.reduce((s, a) => s + a.tracks.length, 0);
}

function sungCount() {
  return Object.keys(sung).length;
}

function albumSungCount(album) {
  return album.tracks.filter((_, i) => sung[trackKey(album.id, i)]).length;
}

/* ===== ヘッダー進捗更新 ===== */
function updateProgress() {
  const total = totalCount();
  const done = sungCount();
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-text').textContent = `${done} / ${total}`;
  document.getElementById('progress-bar').style.width = `${pct}%`;
}

/* ===== アルバムアート（カラープレースホルダー） ===== */
function makeArtStyle(color) {
  return `background-color:${color};background-image:none;background-size:cover;background-position:center;background-repeat:no-repeat;`;
}

/* ===== アルバム別ビュー ===== */
function renderAlbumView() {
  const container = document.getElementById('album-list');
  container.innerHTML = '';

  ALBUMS.forEach(album => {
    const card = document.createElement('div');
    card.className = 'album-card';
    card.dataset.albumId = album.id;

    const done = albumSungCount(album);
    const total = album.tracks.length;
    const pct = Math.round((done / total) * 100);

    card.innerHTML = `
      <div class="album-header">
        <div class="album-art" data-artwork="${album.id}" style="${makeArtStyle(album.color)}">${album.title}</div>
        <div class="album-info">
          <div class="album-title">${album.title}</div>
          <div class="album-year">${album.year}年</div>
          <div class="album-progress-text">${done} / ${total} 曲</div>
          <div class="album-progress-bar-wrap">
            <div class="album-progress-bar-fill" style="width:${pct}%;background:${album.color};"></div>
          </div>
        </div>
        <span class="album-chevron">▼</span>
      </div>
      <div class="track-list">
        ${album.tracks.map((track, i) => {
          const key = trackKey(album.id, i);
          const isSung = !!sung[key];
          const cp = getPref(key);
          return `
            <div class="track-item${isSung ? ' sung' : ''}" data-key="${key}">
              <div class="track-check">${isSung ? '✓' : ''}</div>
              <div class="track-name">${track}</div>
              <div class="pref-btns">
                <button class="pref-btn${cp === 'strong' ? ' strong-active' : ''}" data-pref="strong">強</button>
                <button class="pref-btn${cp === 'weak'   ? ' weak-active'   : ''}" data-pref="weak">弱</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    /* アコーディオン開閉 */
    card.querySelector('.album-header').addEventListener('click', () => {
      card.classList.toggle('open');
    });

    /* 曲トグル & 強弱 */
    card.querySelectorAll('.track-item').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.dataset.key;
        toggleTrack(key);
        const isSung = !!sung[key];
        item.classList.toggle('sung', isSung);
        item.querySelector('.track-check').textContent = isSung ? '✓' : '';
        updateAlbumProgress(card, album);
        updateProgress();
        updateRankingIfVisible();
        if (hideSung) updateSungFilterClasses();
      });
      item.querySelectorAll('.pref-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const key = item.dataset.key;
          setPref(key, btn.dataset.pref);
          updatePrefBtns(item, key);
          const kanaEl = document.querySelector(`#view-kana .kana-track-item[data-key="${key}"]`);
          if (kanaEl) updatePrefBtns(kanaEl, key);
        });
      });
    });

    container.appendChild(card);
  });
}

function updateAlbumProgress(card, album) {
  const done = albumSungCount(album);
  const total = album.tracks.length;
  const pct = Math.round((done / total) * 100);
  card.querySelector('.album-progress-text').textContent = `${done} / ${total} 曲`;
  card.querySelector('.album-progress-bar-fill').style.width = `${pct}%`;
}

function toggleTrack(key) {
  const now = Date.now();
  if (sung[key]) {
    delete sung[key];
    sungSync[key] = { v: -1, at: now };
  } else {
    sung[key] = true;
    sungSync[key] = { v: 1, at: now };
  }
  saveState();
  saveSyncState();
  pushKeyToFirebase(key);
}

/* ===== 歌唱済みフィルター ===== */
let hideSung = false;

function updateSungFilterClasses() {
  document.querySelectorAll('.album-card').forEach(card => {
    const album = ALBUMS.find(a => a.id === card.dataset.albumId);
    if (!album) return;
    const allSung = album.tracks.every((_, i) => sung[trackKey(album.id, i)]);
    card.classList.toggle('all-sung', allSung);
  });
  document.querySelectorAll('.kana-section').forEach(section => {
    const items = section.querySelectorAll('.kana-track-item');
    if (!items.length) return;
    const allSung = [...items].every(el => el.classList.contains('sung'));
    section.classList.toggle('all-sung', allSung);
  });
}

function toggleSungFilter() {
  hideSung = !hideSung;
  document.body.classList.toggle('hide-sung', hideSung);
  const btn = document.getElementById('btn-sung-filter');
  if (btn) {
    btn.classList.toggle('active', hideSung);
    btn.textContent = hideSung ? '済を表示' : '済を隠す';
  }
  if (hideSung) updateSungFilterClasses();
}

/* ===== ランキングビュー ===== */
let rankingSort = 'rate'; // 'rate' | 'remaining'

function renderRankingView() {
  const listEl = document.getElementById('ranking-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  const items = ALBUMS.map(album => {
    const done = albumSungCount(album);
    const total = album.tracks.length;
    return { album, done, total, rate: total ? done / total : 0, remaining: total - done };
  });

  if (rankingSort === 'rate') {
    items.sort((a, b) => b.rate - a.rate || b.done - a.done);
  } else {
    items.sort((a, b) => b.remaining - a.remaining || a.rate - b.rate);
  }

  items.forEach(({ album, done, total, rate, remaining }, i) => {
    const rank = i + 1;
    const pct  = Math.round(rate * 100);
    const topClass = rank <= 3 ? ` top-${rank}` : '';
    const primaryStat = rankingSort === 'rate' ? `${pct}%` : `残${remaining}曲`;

    const el = document.createElement('div');
    el.className = 'ranking-item';
    el.innerHTML = `
      <span class="rank-num${topClass}">${rank}</span>
      <div class="rank-color" style="background:${album.color}"></div>
      <div class="rank-info">
        <div class="rank-title">${album.title}</div>
        <div class="rank-year">${album.year}年</div>
        <div class="rank-bar-wrap">
          <div class="rank-bar-fill" style="width:${pct}%;background:${album.color}"></div>
        </div>
      </div>
      <div class="rank-stat">
        <div class="rank-pct">${primaryStat}</div>
        <div class="rank-frac">${done}/${total}曲</div>
      </div>
    `;
    listEl.appendChild(el);
  });
}

function updateRankingIfVisible() {
  if (document.getElementById('view-ranking')?.classList.contains('active')) {
    renderRankingView();
  }
}

function initRankingView() {
  document.querySelectorAll('.ranking-sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      rankingSort = btn.dataset.sort;
      document.querySelectorAll('.ranking-sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderRankingView();
    });
  });
}

/* ===== タブ切り替え ===== */
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`view-${btn.dataset.tab}`).classList.add('active');
      if (btn.dataset.tab === 'ranking') renderRankingView();
    });
  });
}

/* ===== エクスポート ===== */
function exportData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sung,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mc-tracker-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ===== インポート ===== */
function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.sung || typeof data.sung !== 'object') throw new Error();
      showModal(
        `インポートしますか？\n現在の記録は上書きされます。\n（歌唱済み: ${Object.keys(data.sung).length} 曲）`,
        () => {
          const now = Date.now();
          sung = data.sung;
          sungSync = {};
          for (const k of Object.keys(sung)) {
            sungSync[k] = { v: 1, at: now };
          }
          saveState();
          saveSyncState();
          pushAllToFirebase();
          renderAlbumView();
          renderKanaView();
          renderRankingView();
          updateProgress();
          if (hideSung) updateSungFilterClasses();
        }
      );
    } catch {
      showModal('ファイルの形式が正しくありません。', null);
    }
  };
  reader.readAsText(file);
}

/* ===== リセット ===== */
function resetData() {
  showModal('すべての歌唱記録をリセットしますか？\nこの操作は取り消せません。', () => {
    sung = {};
    sungSync = {};
    saveState();
    saveSyncState();
    clearFirebase();
    renderAlbumView();
    renderKanaView();
    renderRankingView();
    updateProgress();
    if (hideSung) updateSungFilterClasses();
  });
}

/* ===== モーダル ===== */
function showModal(message, onConfirm) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-message').textContent = message;
  overlay.hidden = false;

  const confirmBtn = document.getElementById('modal-confirm');
  const cancelBtn = document.getElementById('modal-cancel');

  confirmBtn.style.display = onConfirm ? '' : 'none';
  cancelBtn.textContent = onConfirm ? 'キャンセル' : '閉じる';

  const close = () => { overlay.hidden = true; };

  const handleConfirm = () => { close(); onConfirm?.(); cleanup(); };
  const handleCancel = () => { close(); cleanup(); };
  const handleOverlay = e => { if (e.target === overlay) { close(); cleanup(); } };

  function cleanup() {
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
    overlay.removeEventListener('click', handleOverlay);
  }

  confirmBtn.addEventListener('click', handleConfirm);
  cancelBtn.addEventListener('click', handleCancel);
  overlay.addEventListener('click', handleOverlay);
}

/* ===== ランダム選曲 ===== */
function pickRandom() {
  const unsung = [];
  ALBUMS.forEach(album => {
    album.tracks.forEach((track, i) => {
      if (!sung[trackKey(album.id, i)]) {
        unsung.push({ album, track });
      }
    });
  });
  if (unsung.length === 0) {
    showModal('未歌唱の曲はありません！\nすべての曲を歌唱済みです。', null);
    return;
  }
  const pick = unsung[Math.floor(Math.random() * unsung.length)];
  showModal(`🎵 ${pick.track}\n\n${pick.album.title}（${pick.album.year}年）`, null);
}

/* ===== Firebase Realtime DB 同期 ===== */
function getFirebaseEndpoint() {
  if (!syncUrl) return null;
  const base = syncUrl.replace(/\/+$/, '');
  const room = (syncRoomId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${base}/mc-karaoke/${room}.json`;
}

function setSyncStatus(status) {
  const dot = document.getElementById('sync-dot');
  if (dot) dot.className = 'sync-dot ' + status;
}

async function pushKeyToFirebase(key) {
  const endpoint = getFirebaseEndpoint();
  if (!endpoint) return;
  try {
    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: sungSync[key] }),
    });
    setSyncStatus(res.ok ? 'ok' : 'error');
  } catch {
    setSyncStatus('error');
  }
}

async function pushAllToFirebase() {
  const endpoint = getFirebaseEndpoint();
  if (!endpoint) return;
  try {
    const body = Object.keys(sungSync).length ? sungSync : null;
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSyncStatus(res.ok ? 'ok' : 'error');
  } catch {
    setSyncStatus('error');
  }
}

async function clearFirebase() {
  const endpoint = getFirebaseEndpoint();
  if (!endpoint) return;
  try {
    await fetch(endpoint, { method: 'DELETE' });
    setSyncStatus('ok');
  } catch {
    setSyncStatus('error');
  }
}

async function pollFirebase() {
  const endpoint = getFirebaseEndpoint();
  if (!endpoint) return;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) { setSyncStatus('error'); return; }
    const remote = await res.json();
    if (!remote) { setSyncStatus('ok'); return; }

    const changedKeys = [];
    for (const [key, remoteEntry] of Object.entries(remote)) {
      const local = sungSync[key];
      if (!local || remoteEntry.at > local.at) {
        const wasSung = !!sung[key];
        sungSync[key] = remoteEntry;
        if (remoteEntry.v === 1) { sung[key] = true; }
        else { delete sung[key]; }
        if (wasSung !== !!sung[key]) changedKeys.push(key);
      }
    }

    if (changedKeys.length) {
      saveState();
      saveSyncState();
      changedKeys.forEach(key => {
        const isSung = !!sung[key];
        const trackEl = document.querySelector(`#view-album .track-item[data-key="${key}"]`);
        if (trackEl) {
          trackEl.classList.toggle('sung', isSung);
          trackEl.querySelector('.track-check').textContent = isSung ? '✓' : '';
        }
        const kanaEl = document.querySelector(`#view-kana .kana-track-item[data-key="${key}"]`);
        if (kanaEl) {
          kanaEl.classList.toggle('sung', isSung);
          kanaEl.querySelector('.kana-track-check').textContent = isSung ? '✓' : '';
        }
      });
      const albumIds = new Set(changedKeys.map(k => k.split('::')[0]));
      albumIds.forEach(albumId => {
        const album = ALBUMS.find(a => a.id === albumId);
        const card = document.querySelector(`.album-card[data-album-id="${albumId}"]`);
        if (album && card) updateAlbumProgress(card, album);
      });
      updateProgress();
      updateRankingIfVisible();
      if (hideSung) updateSungFilterClasses();
    }
    setSyncStatus('ok');
  } catch {
    setSyncStatus('error');
  }
}

function startSync(url, room) {
  stopSync();
  syncUrl    = url.trim();
  syncRoomId = (room || 'default').trim() || 'default';
  localStorage.setItem(FIREBASE_URL_KEY, syncUrl);
  localStorage.setItem(FIREBASE_ROOM_KEY, syncRoomId);
  setSyncStatus('ok');
  initialSync();
  syncPollId = setInterval(pollFirebase, 10000);
}

async function initialSync() {
  await pollFirebase();
  if (!syncUrl || !Object.keys(sungSync).length) return;
  const endpoint = getFirebaseEndpoint();
  if (!endpoint) return;
  try {
    await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sungSync),
    });
    setSyncStatus('ok');
  } catch {
    setSyncStatus('error');
  }
}

function stopSync() {
  if (syncPollId) { clearInterval(syncPollId); syncPollId = null; }
  syncUrl = null;
  setSyncStatus('off');
}

function initSyncFromStorage() {
  const url = localStorage.getItem(FIREBASE_URL_KEY);
  if (url) startSync(url, localStorage.getItem(FIREBASE_ROOM_KEY) || 'default');
}

function initSyncModal() {
  const overlay    = document.getElementById('sync-modal');
  const inputUrl   = document.getElementById('sync-url');
  const inputRoom  = document.getElementById('sync-room');
  const btnClose   = document.getElementById('sync-modal-close');
  const btnConnect = document.getElementById('sync-modal-connect');
  const btnDisconnect = document.getElementById('sync-modal-disconnect');

  const openModal = () => {
    inputUrl.value  = localStorage.getItem(FIREBASE_URL_KEY) || '';
    inputRoom.value = localStorage.getItem(FIREBASE_ROOM_KEY) || '';
    btnDisconnect.style.display = syncUrl ? '' : 'none';
    overlay.hidden = false;
  };
  const closeModal = () => { overlay.hidden = true; };

  document.getElementById('btn-sync-settings').addEventListener('click', openModal);
  btnClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  btnConnect.addEventListener('click', () => {
    const url = inputUrl.value.trim();
    if (!url) { inputUrl.focus(); return; }
    startSync(url, inputRoom.value);
    closeModal();
  });

  btnDisconnect.addEventListener('click', () => {
    stopSync();
    localStorage.removeItem(FIREBASE_URL_KEY);
    localStorage.removeItem(FIREBASE_ROOM_KEY);
    closeModal();
  });
}

/* ===== フッターボタン初期化 ===== */
function initFooter() {
  document.getElementById('btn-random').addEventListener('click', pickRandom);
  document.getElementById('btn-export').addEventListener('click', exportData);

  const fileInput = document.getElementById('import-file-input');
  document.getElementById('btn-import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    if (e.target.files[0]) {
      importData(e.target.files[0]);
      e.target.value = '';
    }
  });

  document.getElementById('btn-reset').addEventListener('click', resetData);
}

/* ===== 五十音順ビュー ===== */

/* 行（あ〜ん、英数字、記号）の定義 */
const KANA_ROWS = [
  { label: 'あ', chars: 'あいうえおぁぃぅぇぉ' },
  { label: 'か', chars: 'かきくけこがぎぐげご' },
  { label: 'さ', chars: 'さしすせそざじずぜぞ' },
  { label: 'た', chars: 'たちつてとだぢづでど' },
  { label: 'な', chars: 'なにぬねの' },
  { label: 'は', chars: 'はひふへほばびぶべぼぱぴぷぺぽ' },
  { label: 'ま', chars: 'まみむめも' },
  { label: 'や', chars: 'やゆよ' },
  { label: 'ら', chars: 'らりるれろ' },
  { label: 'わ', chars: 'わをん' },
  { label: '#', chars: null },
];

function getRowLabel(yomi) {
  if (!yomi) return '#';
  const ch = yomi[0];
  for (const row of KANA_ROWS) {
    if (row.chars && row.chars.includes(ch)) return row.label;
  }
  return '#';
}

function buildKanaData() {
  /* 全曲をフラット化 */
  const all = [];
  ALBUMS.forEach(album => {
    album.tracks.forEach((track, i) => {
      all.push({ album, track, index: i, key: trackKey(album.id, i) });
    });
  });

  /* 行ラベルでグループ化 */
  const groups = {};
  KANA_ROWS.forEach(r => { groups[r.label] = []; });

  all.forEach(item => {
    item.yomi = YOMI_MAP[item.key] || item.track;
    const label = getRowLabel(item.yomi);
    groups[label].push(item);
  });

  KANA_ROWS.forEach(r => {
    groups[r.label].sort((a, b) => a.yomi.localeCompare(b.yomi, 'ja'));
  });

  return groups;
}

function renderKanaView() {
  const groups = buildKanaData();
  const navEl = document.getElementById('kana-jump-nav');
  const listEl = document.getElementById('kana-list');
  navEl.innerHTML = '';
  listEl.innerHTML = '';

  KANA_ROWS.forEach(row => {
    const tracks = groups[row.label];

    /* ジャンプナビボタン */
    const btn = document.createElement('button');
    btn.className = 'kana-jump-btn' + (tracks.length ? ' has-tracks' : '');
    btn.textContent = row.label;
    btn.disabled = !tracks.length;
    if (tracks.length) {
      btn.addEventListener('click', () => {
        document.getElementById(`kana-section-${row.label}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    navEl.appendChild(btn);

    if (!tracks.length) return;

    /* セクション */
    const section = document.createElement('div');
    section.className = 'kana-section';
    section.id = `kana-section-${row.label}`;

    section.innerHTML = `<div class="kana-section-label">${row.label}行</div>`;

    tracks.forEach(({ album, track, key }) => {
      const isSung = !!sung[key];
      const item = document.createElement('div');
      item.className = 'kana-track-item' + (isSung ? ' sung' : '');
      item.dataset.key = key;
      const cp = getPref(key);
      item.innerHTML = `
        <div class="kana-album-art" data-artwork="${album.id}" style="${makeArtStyle(album.color)}">${album.title.slice(0,4)}</div>
        <div class="kana-track-info">
          <div class="kana-track-name">${track}</div>
          <div class="kana-album-name">${album.title} (${album.year})</div>
        </div>
        <div class="pref-btns">
          <button class="pref-btn${cp === 'strong' ? ' strong-active' : ''}" data-pref="strong">強</button>
          <button class="pref-btn${cp === 'weak'   ? ' weak-active'   : ''}" data-pref="weak">弱</button>
        </div>
        <div class="kana-track-check">${isSung ? '✓' : ''}</div>
      `;
      item.addEventListener('click', () => {
        toggleTrack(key);
        const s = !!sung[key];
        item.classList.toggle('sung', s);
        item.querySelector('.kana-track-check').textContent = s ? '✓' : '';
        syncAlbumViewItem(key, s);
        updateProgress();
        updateRankingIfVisible();
        if (hideSung) updateSungFilterClasses();
      });
      item.querySelectorAll('.pref-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const key = item.dataset.key;
          setPref(key, btn.dataset.pref);
          updatePrefBtns(item, key);
          const albumEl = document.querySelector(`#view-album .track-item[data-key="${key}"]`);
          if (albumEl) updatePrefBtns(albumEl, key);
        });
      });
      section.appendChild(item);
    });

    listEl.appendChild(section);
  });
}

/* 五十音で変更したとき、アルバムビューの該当行を同期 */
function syncAlbumViewItem(key, isSung) {
  const el = document.querySelector(`#view-album .track-item[data-key="${key}"]`);
  if (!el) return;
  el.classList.toggle('sung', isSung);
  el.querySelector('.track-check').textContent = isSung ? '✓' : '';
  /* アルバムカードの進捗も更新 */
  const card = el.closest('.album-card');
  if (card) {
    const albumId = card.dataset.albumId;
    const album = ALBUMS.find(a => a.id === albumId);
    if (album) updateAlbumProgress(card, album);
  }
}

/* ===== 起動 ===== */
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  loadSyncState();
  loadPref();
  initTabs();
  initFooter();
  document.getElementById('btn-sung-filter').addEventListener('click', toggleSungFilter);
  initSyncModal();
  initRankingView();
  renderAlbumView();
  renderKanaView();
  renderRankingView();
  updateProgress();
  loadAllArtwork();
  initSyncFromStorage();
});
