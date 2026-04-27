/* ===== 定数 ===== */
const STORAGE_KEY = 'mc-tracker-v1';
const ARTWORK_KEY = 'mc-artwork-v1';

/* ===== 状態 ===== */
let sung = {};       // { "albumId::trackIndex": true }
let artworkCache = {}; // { albumId: imageUrl }

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
  return `background-color:${color};`;
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
          return `
            <div class="track-item${isSung ? ' sung' : ''}" data-key="${key}">
              <div class="track-check">${isSung ? '✓' : ''}</div>
              <div class="track-name">${track}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    /* アコーディオン開閉 */
    card.querySelector('.album-header').addEventListener('click', () => {
      card.classList.toggle('open');
    });

    /* 曲トグル */
    card.querySelectorAll('.track-item').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.dataset.key;
        toggleTrack(key);
        /* DOM更新 */
        const isSung = !!sung[key];
        item.classList.toggle('sung', isSung);
        item.querySelector('.track-check').textContent = isSung ? '✓' : '';
        /* アルバム進捗更新 */
        updateAlbumProgress(card, album);
        updateProgress();
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
  if (sung[key]) {
    delete sung[key];
  } else {
    sung[key] = true;
  }
  saveState();
}

/* ===== タブ切り替え ===== */
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`view-${btn.dataset.tab}`).classList.add('active');
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
          sung = data.sung;
          saveState();
          renderAlbumView();
          renderKanaView();
          updateProgress();
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
    saveState();
    renderAlbumView();
    renderKanaView();
    updateProgress();
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

/* ===== フッターボタン初期化 ===== */
function initFooter() {
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
      item.innerHTML = `
        <div class="kana-album-art" data-artwork="${album.id}" style="${makeArtStyle(album.color)}">${album.title.slice(0,4)}</div>
        <div class="kana-track-info">
          <div class="kana-track-name">${track}</div>
          <div class="kana-album-name">${album.title} (${album.year})</div>
        </div>
        <div class="kana-track-check">${isSung ? '✓' : ''}</div>
      `;
      item.addEventListener('click', () => {
        toggleTrack(key);
        const s = !!sung[key];
        item.classList.toggle('sung', s);
        item.querySelector('.kana-track-check').textContent = s ? '✓' : '';
        /* アルバムビューも同期 */
        syncAlbumViewItem(key, s);
        updateProgress();
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
  initTabs();
  initFooter();
  renderAlbumView();
  renderKanaView();
  updateProgress();
  loadAllArtwork();
});
