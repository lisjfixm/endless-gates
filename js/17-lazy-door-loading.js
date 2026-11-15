
(function(){
'use strict';
if(window.V61 && window.V61.__booted) return;
window.V61 = window.V61 || {};

/* ============================================================
 * 0. SVG 圖示常數（100% 純向量 SVG，無任何 Emoji）
 * ============================================================ */
var SVG_LOCK_V61 = '<svg class="v61-lock-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
var SVG_LOCK_LARGE_V61 = '<svg class="v61-lock-svg v61-lock-svg-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1.2"/></svg>';
var SVG_CHECK_V61 = '<svg class="v61-check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg>';
var SVG_NODE_SOLID = '<svg viewBox="0 0 24 24" style="width:12px;height:12px;vertical-align:-2px"><circle cx="12" cy="12" r="7" fill="currentColor"/></svg>';
var SVG_NODE_GLOW = '<svg viewBox="0 0 24 24" style="width:13px;height:13px;vertical-align:-2px"><circle cx="12" cy="12" r="5.5" fill="currentColor"/><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
var SVG_NODE_HOLLOW_Q = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:13px;height:13px;vertical-align:-2px"><circle cx="12" cy="12" r="8.5"/><path d="M9.8 9.5a2.3 2.3 0 0 1 4.4.8c0 1.4-2.2 1.8-2.2 3.2"/><circle cx="12" cy="16.8" r="0.8" fill="currentColor"/></svg>';
var SVG_NGPLUS_STAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;vertical-align:-2px"><polygon points="12 2 15 9 22 9 16.5 13.5 18.5 21 12 16.8 5.5 21 7.5 13.5 2 9 9 9"/></svg>';

function tr(s){
  return (window.I18N && typeof I18N.t === 'function') ? I18N.t(s) : s;
}

/* ============================================================
 * 1. P7-12: 懶載入與快取控制器（第一扇門先載入，2–12 進入時載入並快取）
 * ============================================================ */
var _loadedCache = { 1: true };
var _cacheHits = { 1: 0 };
var _origBuildFns = {};
var _isBootPhase = true;

function getCacheSignature(){
  try{
    var ng = localStorage.getItem('wuxian-ng-plus') || 'false';
    var inh = localStorage.getItem('wuxian-inheritance') || '';
    var sc = localStorage.getItem('wuxian-v60-side-chain') || '';
    var ru = localStorage.getItem('wuxian-v61-relic-used') || '';
    return ng + '|' + inh + '|' + sc + '|' + ru;
  }catch(e){ return 'default'; }
}

function wrapDungeonBuildForLazyLoad(id){
  var fnName = 'buildScenes' + id;
  var currentFn = window[fnName];
  if(_origBuildFns[id] || typeof currentFn !== 'function' || currentFn.__v61LazyWrapped) return;
  _origBuildFns[id] = currentFn;
  var wrapped = function(forceRebuild){
    /* 啟動期間，除第一扇門外全部延後到踏入門扉時才載入 */
    if(_isBootPhase && id !== 1 && !forceRebuild){
      return;
    }
    var isCurrent = (parseInt(window.currentDungeonId, 10) === parseInt(id, 10));
    var sig = getCacheSignature();
    var scenesObj = window.sceneRefs && window.sceneRefs[id];
    var hasScenes = scenesObj && Object.keys(scenesObj).length > 0;
    if(!forceRebuild && _loadedCache[id] === sig && hasScenes){
      _cacheHits[id] = (_cacheHits[id] || 0) + 1;
      if(isCurrent && !_isBootPhase){
        state = stateRefs[id];
        SCENES = sceneRefs[id];
      }
      return;
    }
    var prevState = window.state;
    var prevScenes = window.SCENES;
    _origBuildFns[id].apply(this, arguments);
    try{ if(window.V5 && typeof V5.applyV5Story === 'function') V5.applyV5Story(id); }catch(e){}
    _loadedCache[id] = sig;
    if(_isBootPhase || !isCurrent){
      window.state = prevState;
      window.SCENES = prevScenes;
    }
  };
  wrapped.__v61LazyWrapped = true;
  window[fnName] = wrapped;
}

function ensureDungeonLoaded(id, forceRebuild){
  var numId = parseInt(id, 10) || 1;
  wrapDungeonBuildForLazyLoad(numId);
  var prevBoot = _isBootPhase;
  _isBootPhase = false;
  try{
    if(typeof window['buildScenes' + numId] === 'function'){
      window['buildScenes' + numId](!!forceRebuild);
    }
  }finally{
    _isBootPhase = prevBoot;
  }
  return !!(window.sceneRefs && window.sceneRefs[numId] && Object.keys(window.sceneRefs[numId]).length > 0);
}

window.V61.ensureDungeonLoaded = ensureDungeonLoaded;
window.V61.isDungeonLoaded = function(id){
  return !!(_loadedCache[id] && window.sceneRefs && window.sceneRefs[id] && Object.keys(window.sceneRefs[id]).length > 0);
};
window.V61.getCacheHits = function(id){ return _cacheHits[id] || 0; };

/* ============================================================
 * 2. P7-13 & P8-17: 存檔版本升級 (localStorage v2 -> v3 無損遷移 + 匯出匯入 JSON 校驗碼)
 * ============================================================ */
var LS_SAVE_V3 = 'wuxian-save-v3';
var LS_RELIC_USED = 'wuxian-v61-relic-used';
var LS_REVEALED_IDS = 'wuxian-v61-revealed-dungeons';
var LS_D12_FLOORS = 'wuxian-v61-d12-floors';
var LS_DAILY_ACTIVE_RULE = 'wuxian-v61-daily-rule';

var CLEAR_KEYS_MAP = {
  1: 'wuxian-first-cleared',
  2: 'wuxian-second-cleared',
  3: 'wuxian-third-cleared',
  4: 'wuxian-fourth-cleared',
  5: 'wuxian-fifth-cleared',
  6: 'wuxian-sixth-cleared',
  7: 'wuxian-seventh-cleared',
  8: 'wuxian-eighth-cleared',
  9: 'wuxian-ninth-cleared',
  10: 'wuxian-tenth-cleared',
  11: 'wuxian-eleventh-cleared',
  12: 'wuxian-twelfth-cleared',
  13: 'wuxian-thirteenth-cleared'
};

function getRelicUsedState(){
  var def = { tram_stub: false, memory_shard: false, school_magazine: false, cinema_clerk: false };
  try{
    var raw = localStorage.getItem(LS_RELIC_USED);
    if(raw){
      var parsed = JSON.parse(raw);
      for(var k in def){ if(parsed && parsed[k] === true) def[k] = true; }
    }
  }catch(e){}
  return def;
}

function setRelicUsed(key, used){
  var st = getRelicUsedState();
  st[key] = (used !== false);
  try{ localStorage.setItem(LS_RELIC_USED, JSON.stringify(st)); }catch(e){}
  syncSaveV3Snapshot();
  if(typeof window.updateInventoryUI === 'function'){
    try{ window.updateInventoryUI(); }catch(e){}
  }
  return st;
}

function isRelicUsed(key){
  return !!getRelicUsedState()[key];
}

window.V61.getRelicUsedState = getRelicUsedState;
window.V61.setRelicUsed = setRelicUsed;
window.V61.isRelicUsed = isRelicUsed;

function getRevealedDungeons(){
  var rev = { 1: true };
  try{
    var raw = localStorage.getItem(LS_REVEALED_IDS);
    if(raw){
      var parsed = JSON.parse(raw);
      if(parsed && typeof parsed === 'object'){
        for(var k in parsed){ if(parsed[k]) rev[k] = true; }
      }
    }
  }catch(e){}
  /* 凡已通關或當前已解鎖的下一扇門，自動視為已揭曉（確保舊存檔已通關門扉絕不會變回？？？） */
  for(var i = 1; i <= 12; i++){
    if(localStorage.getItem(CLEAR_KEYS_MAP[i]) === 'true'){
      rev[i] = true;
      if(i < 11) rev[i + 1] = true;
    }
  }
  return rev;
}

function markDungeonRevealed(id){
  var rev = getRevealedDungeons();
  rev[id] = true;
  try{ localStorage.setItem(LS_REVEALED_IDS, JSON.stringify(rev)); }catch(e){}
}

function migrateSaveV2ToV3(){
  try{
    var existingV3 = null;
    try{ existingV3 = JSON.parse(localStorage.getItem(LS_SAVE_V3) || 'null'); }catch(e){}

    /* 檢查並保留所有 v2 / v5.9 / v6.0 舊存檔的通關旗標 */
    var clearedMap = {};
    for(var i = 1; i <= 12; i++){
      var ck = CLEAR_KEYS_MAP[i];
      var isCl = localStorage.getItem(ck) === 'true' || (existingV3 && existingV3.cleared && existingV3.cleared[i] === true);
      if(isCl){
        clearedMap[i] = true;
        localStorage.setItem(ck, 'true');
      } else {
        clearedMap[i] = false;
      }
    }
    /* P8-17 Bug 修復：若支線 (7–11) 任一已通關，確保主線第 6 扇門絕不會被重置 */
    if(clearedMap[7] || clearedMap[8] || clearedMap[9] || clearedMap[10] || clearedMap[11]){
      clearedMap[6] = true;
      localStorage.setItem(CLEAR_KEYS_MAP[6], 'true');
    }

    var sideChain = (window.V60 && typeof V60.loadSideChain === 'function')
      ? V60.loadSideChain()
      : { tram_stub: !!clearedMap[7], memory_shard: !!clearedMap[8], school_magazine: !!clearedMap[9], cinema_clerk: !!clearedMap[10] };

    var relicUsed = getRelicUsedState();
    var revealed = getRevealedDungeons();

    var v3Obj = {
      schemaVersion: 'v3',
      saveVersion: '3.0',
      gameVersion: '6.1.0',
      migratedFromV2: true,
      updatedAt: new Date().toISOString(),
      ngPlus: localStorage.getItem('wuxian-ng-plus') === 'true',
      d6TrueCleared: localStorage.getItem('wuxian-d6-true-cleared') === 'true' || clearedMap[6],
      cleared: clearedMap,
      corridorProgress: {
        mainCleared: [1,2,3,4,5,6].filter(function(x){ return clearedMap[x]; }).length,
        sideCleared: [7,8,9,10,11].filter(function(x){ return clearedMap[x]; }).length
      },
      sideChain: sideChain,
      relicUsed: relicUsed,
      revealedDungeons: revealed,
      d12Floors: JSON.parse(localStorage.getItem(LS_D12_FLOORS) || '[]')
    };
    localStorage.setItem(LS_SAVE_V3, JSON.stringify(v3Obj));
    localStorage.setItem(LS_RELIC_USED, JSON.stringify(relicUsed));
    localStorage.setItem(LS_REVEALED_IDS, JSON.stringify(revealed));
    return v3Obj;
  }catch(e){
    return null;
  }
}

function syncSaveV3Snapshot(){
  return migrateSaveV2ToV3();
}

function computeV61Checksum(str){
  if(typeof window.computeSaveChecksum === 'function') return window.computeSaveChecksum(str);
  var h = 2166136261;
  for(var i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function exportSaveV3JSON(){
  try{
    var v3 = syncSaveV3Snapshot();
    var rawPayload = (typeof window.encodeSaveToBase64 === 'function')
      ? window.encodeSaveToBase64()
      : btoa(unescape(encodeURIComponent(JSON.stringify(v3))));
    var csum = computeV61Checksum(rawPayload + '|v3');
    var pkg = JSON.stringify({
      game: 'INFINITE_GATES',
      version: '6.1.0',
      saveVersion: 'v3',
      exportedAt: new Date().toISOString(),
      checksum: csum,
      v3Meta: v3,
      payload: rawPayload
    }, null, 2);
    return pkg;
  }catch(e){ return ''; }
}

function importSaveV3JSON(jsonStr){
  try{
    var obj = (typeof jsonStr === 'string') ? JSON.parse(jsonStr) : jsonStr;
    if(!obj || !obj.payload || !obj.checksum) throw new Error('無效的存檔格式');
    var expectedV3 = computeV61Checksum(obj.payload + '|v3');
    var expectedV2 = computeV61Checksum(obj.payload);
    if(obj.checksum !== expectedV3 && obj.checksum !== expectedV2){
      if(typeof showToast === 'function') showToast('存檔校驗碼不符，已攔截損毀或遭篡改的存檔！');
      return false;
    }
    if(typeof window.importSaveFromBase64 === 'function'){
      window.importSaveFromBase64(obj.payload);
    }
    if(obj.v3Meta){
      if(obj.v3Meta.relicUsed) localStorage.setItem(LS_RELIC_USED, JSON.stringify(obj.v3Meta.relicUsed));
      if(obj.v3Meta.revealedDungeons) localStorage.setItem(LS_REVEALED_IDS, JSON.stringify(obj.v3Meta.revealedDungeons));
      if(obj.v3Meta.d12Floors) localStorage.setItem(LS_D12_FLOORS, JSON.stringify(obj.v3Meta.d12Floors));
      if(obj.v3Meta.cleared){
        for(var k in obj.v3Meta.cleared){
          if(obj.v3Meta.cleared[k] && CLEAR_KEYS_MAP[k]){
            localStorage.setItem(CLEAR_KEYS_MAP[k], 'true');
          }
        }
      }
    }
    migrateSaveV2ToV3();
    if(typeof window.render === 'function') window.render();
    if(typeof showToast === 'function') showToast('v3 存檔校驗通過並成功匯入！');
    return true;
  }catch(e){
    if(typeof showToast === 'function') showToast('匯入存檔失敗：' + e.message);
    return false;
  }
}

window.V61.migrateSaveV2ToV3 = migrateSaveV2ToV3;
window.V61.exportSaveV3JSON = exportSaveV3JSON;
window.V61.importSaveV3JSON = importSaveV3JSON;

/* ============================================================
 * 3. P0: 門扉名稱隱藏機制、三種顯示狀態、點擊？？？彈窗、通關揭曉動畫與腦圖配合
 * ============================================================ */
var MAIN_CORRIDOR_IDS = [1, 2, 3, 4, 5, 6];
var SIDE_CORRIDOR_IDS = [7, 8, 9, 10, 11];
var SHORT_TAGLINES = {
  1: '一座只有質數房間的旅館。',
  2: '一座沒有聲音的圖書館。',
  3: '廢棄醫院，60 分鐘倒數。',
  4: '三扇舊門與無火之燈的迴廊心臟。',
  5: '收容所有未選擇之路的潮汐之海。',
  6: '03:17 與 03:18 之間的終焉觀測站。',
  7: '左右車廂生命連動的地下鏡像電車。',
  8: '每道菜記載一段人生的無盡自助餐。',
  9: '重返 1999 年盛夏的六年三班教室。',
  10: '放映四段「如果當初」的午夜電影院。',
  11: '午夜閉園後動物仍記得你的動物園。',
  12: 'New Game+ 隱藏終章：通往 12 個平行時空的回聲電梯。',
  13: '每面鏡子都是一個平行世界的你，選擇信任或打碎鏡子。'
};

/* 回傳 'cleared' | 'next' | 'hidden' */
function getDungeonDisplayState(id){
  var numId = parseInt(id, 10);
  if(window._gmUnlocked){
    return (typeof isCleared === 'function' && isCleared(numId)) ? 'cleared' : 'next';
  }
  var cl = (typeof isCleared === 'function') ? isCleared(numId) : (localStorage.getItem(CLEAR_KEYS_MAP[numId]) === 'true');
  if(cl) return 'cleared';

  /* 第 12 扇門：需 New Game+ 且走完第 6 扇門 */
  if(numId === 12){
    var ng = localStorage.getItem('wuxian-ng-plus') === 'true';
    var c6 = (typeof isCleared === 'function') ? isCleared(6) : (localStorage.getItem(CLEAR_KEYS_MAP[6]) === 'true');
    return (ng && c6) ? 'next' : 'hidden';
  }
  /* 第 13 扇門《鏡子迷宮》：需 New Game+ 且打完第 12 扇門《回聲電梯》 */
  if(numId === 13){
    var ng13 = localStorage.getItem('wuxian-ng-plus') === 'true';
    var c12 = (typeof isCleared === 'function') ? isCleared(12) : (localStorage.getItem(CLEAR_KEYS_MAP[12]) === 'true');
    return (ng13 && c12) ? 'next' : 'hidden';
  }

  /* 第 1 扇門永遠是可進入 */
  if(numId === 1) return 'next';

  /* 第 2–11 扇門：只有在前一關 (numId - 1) 已通關時，才是「下一個可進入 ('next')」；否則一律為「還沒到 ('hidden' -> ？？？)」 */
  var prevCleared = (typeof isCleared === 'function')
    ? isCleared(numId - 1)
    : (localStorage.getItem(CLEAR_KEYS_MAP[numId - 1]) === 'true');
  if(prevCleared) return 'next';
  return 'hidden';
}

window.V61.getDungeonDisplayState = getDungeonDisplayState;

/* P0-2: 點擊「？？？」卡片或未解鎖支線大卡片時，只顯示鎖頭 + 「走完第 X 扇門解鎖」，絕不透露題材內容 */
function showMysteryLockModal(dungeonId, isSideCorridorAllLocked){
  var prevId = Math.max(1, (parseInt(dungeonId, 10) || 2) - 1);
  var reqText = isSideCorridorAllLocked
    ? tr('打完主線解鎖（走完第 6 扇門解鎖）')
    : tr('打完第 ' + prevId + ' 扇門解鎖');

  var modal = document.getElementById('preview-modal');
  if(modal){
    var tEl = document.getElementById('preview-title');
    var sEl = document.getElementById('preview-subtitle');
    var bEl = document.getElementById('preview-text');
    if(tEl) tEl.innerHTML = '<span class="v61-mystery-text">？？？</span>';
    if(sEl) sEl.textContent = isSideCorridorAllLocked ? tr('支線迴廊 · 尚未開啟') : tr('未知的門扉');
    if(bEl){
      bEl.innerHTML =
        '<div style="text-align:center;padding:1.6rem 0.8rem">' +
          '<div style="margin-bottom:0.85rem;color:var(--v60-accent,#d4af37)">' + SVG_LOCK_LARGE_V61 + '</div>' +
          '<div style="font-size:1.05rem;font-weight:600;letter-spacing:0.14em;color:var(--text)">' + SVG_LOCK_V61 + ' ' + reqText + '</div>' +
        '</div>';
    }
    modal.classList.add('show');
  } else if(typeof showToast === 'function'){
    showToast(reqText);
  }
}

window.V61.showMysteryLockModal = showMysteryLockModal;

/* P0-3: 通關後回到主選單的揭曉動畫（0.5s 灰暗漸亮 + 1s 打字機逐字顯示名稱與 tagline + 過場文字浮現） */
var _pendingRevealDungeonId = null;
var _revealTimer = null;

function playRevealAnimation(dungeonId){
  var numId = parseInt(dungeonId, 10);
  var d = (window.dungeons || []).filter(function(x){ return x.id === numId; })[0];
  if(!d) return;

  markDungeonRevealed(numId);

  /* 1. 浮現過場文字：「門扉開啟——你看見了【新門扉名】。」 */
  var banner = document.getElementById('v61-reveal-banner');
  if(!banner){
    banner = document.createElement('div');
    banner.id = 'v61-reveal-banner';
    document.body.appendChild(banner);
  }
  banner.textContent = '門扉開啟——你看見了【' + d.name + '】。';
  banner.classList.add('show');
  clearTimeout(banner.__hideTimer);
  banner.__hideTimer = setTimeout(function(){
    banner.classList.remove('show');
  }, 3200);

  /* 2. 卡片從灰暗漸亮（0.5 秒淡入） */
  var cardEl = document.querySelector('#hub-screen .dungeon-card');
  var rowEl = document.querySelector('.v61-corridor-row[data-did="' + numId + '"]');
  if(cardEl){
    cardEl.classList.remove('v61-reveal-anim');
    void cardEl.offsetWidth;
    cardEl.classList.add('v61-reveal-anim');
  }
  if(rowEl){
    rowEl.classList.remove('v61-reveal-anim');
    void rowEl.offsetWidth;
    rowEl.classList.add('v61-reveal-anim');
  }

  /* 3. 名稱和 tagline 逐字顯示（打字機效果，1 秒完成） */
  var nameEl = document.getElementById('dungeon-name');
  var tagEl = document.getElementById('dungeon-tagline');
  var rowNameEl = rowEl ? rowEl.querySelector('.v61-row-name') : null;
  var rowTagEl = rowEl ? rowEl.querySelector('.v61-row-tag') : null;

  var fullName = d.name;
  var fullTag = d.tagline || SHORT_TAGLINES[numId] || '';
  var shortTag = SHORT_TAGLINES[numId] || fullTag;

  if(_revealTimer) clearInterval(_revealTimer);
  var steps = 20;
  var stepMs = 50; /* 20 * 50ms = 1000ms (1 秒) */
  var curStep = 0;

  if(tagEl) tagEl.style.display = '';
  _revealTimer = setInterval(function(){
    curStep++;
    var ratio = Math.min(1, curStep / steps);
    var nLen = Math.max(1, Math.round(fullName.length * ratio));
    var tLen = Math.round(fullTag.length * ratio);
    var stLen = Math.round(shortTag.length * ratio);
    if(nameEl && dungeons[currentIndex] && dungeons[currentIndex].id === numId){
      nameEl.textContent = fullName.slice(0, nLen);
    }
    if(tagEl && dungeons[currentIndex] && dungeons[currentIndex].id === numId){
      tagEl.textContent = fullTag.slice(0, tLen);
    }
    if(rowNameEl) rowNameEl.textContent = fullName.slice(0, nLen);
    if(rowTagEl) rowTagEl.textContent = shortTag.slice(0, stLen);
    if(curStep >= steps){
      clearInterval(_revealTimer);
      _revealTimer = null;
    }
  }, stepMs);
}

window.V61.playRevealAnimation = playRevealAnimation;

/* ============================================================
 * 4. P1: New Game+（二周目）與第十二扇門《回聲電梯》（12 樓 = 12 種平行時空結局）
 * ============================================================ */
function isNgPlusUnlocked(){
  if(window._gmUnlocked) return true;
  if(localStorage.getItem('wuxian-ng-plus') === 'true') return true;
  if(localStorage.getItem('wuxian-d6-true-cleared') === 'true') return true;
  if(typeof getAchList === 'function' && (getAchList().indexOf('ach_d6_dawn') !== -1 || getAchList().indexOf('ach_d6_symphony') !== -1 || getAchList().indexOf('ach_v61_d6_still') !== -1)) return true;
  if(typeof isCleared === 'function' && isCleared(6)) return true;
  return false;
}

function openNgPlusModal(){
  var modal = document.getElementById('v61-ngplus-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'v61-ngplus-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML =
      '<div class="modal-card v4-card wide" style="border-color:#d4af37;box-shadow:0 0 36px rgba(212,175,55,0.28)">' +
        '<h3 style="color:#f5df98;display:flex;align-items:center;gap:.45rem">' + SVG_NGPLUS_STAR + ' <span>New Game+ · 二周目輪迴啟動</span></h3>' +
        '<div class="v4-sub">你已抵達終焉觀測站的破曉。是否帶著所有記憶與信物，開啟更高難度的二周目輪迴？</div>' +
        '<div style="margin:.8rem 0;padding:.85rem;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.35);border-radius:5px;font-size:.82rem;line-height:1.7">' +
          '<div style="color:#f5df98;font-weight:600;margin-bottom:.3rem">【二周目繼承與變化規則】</div>' +
          '<div>• <strong>完整保留</strong>：物品庫、支線信物、NPC 好感度、成就、稱號、畫廊全部保留。</div>' +
          '<div>• <strong>進度重置</strong>：當前門扉通關標記重置，從第一扇門《質數旅館》重新啟程。</div>' +
          '<div>• <strong>二周目強化</strong>：敵人 HP ×1.5、攻擊力 ×1.3；謎題增加隱藏層、對話第二頁藏有密碼線索、鑰匙位置改變。</div>' +
          '<div>• <strong>跨輪記憶與終章</strong>：NPC 記得你上輪的選擇並解鎖二周目專屬選項；在 New Game+ 走完第 6 扇門後將解鎖<strong>第十二扇門《回聲電梯》</strong>！</div>' +
        '</div>' +
        '<div class="v4-actions" style="justify-content:flex-end;gap:.55rem">' +
          '<button type="button" class="v4-btn" onclick="document.getElementById(\'v61-ngplus-modal\').classList.remove(\'show\')">暫不開啟</button>' +
          '<button type="button" class="v4-btn primary" id="v61-confirm-ngplus-btn" style="background:#d4af37;color:#0b0a08;font-weight:700">確認進入 New Game+</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('v61-confirm-ngplus-btn').onclick = function(){
      startNewGamePlus();
      modal.classList.remove('show');
    };
  }
  modal.classList.add('show');
}

function startNewGamePlus(){
  /* 1. 保留物品庫：將當前背包物品同步寫入持久化物品庫 */
  try{
    var persist = JSON.parse(localStorage.getItem('wuxian-v58-persist-items') || '[]');
    if(window.state && Array.isArray(state.inventory)){
      state.inventory.forEach(function(it){
        if(it && it.id && !persist.some(function(p){ return p.id === it.id; })){
          persist.push({ id: it.id, name: it.name, desc: it.desc || '' });
        }
      });
    }
    localStorage.setItem('wuxian-v58-persist-items', JSON.stringify(persist));
  }catch(e){}

  /* 2. 設定二周目狀態與保留標記 */
  localStorage.setItem('wuxian-ng-plus', 'true');
  localStorage.setItem('wuxian-d6-true-cleared', 'true');
  var cyc = parseInt(localStorage.getItem('wuxian-ng-cycle') || '1', 10) + 1;
  localStorage.setItem('wuxian-ng-cycle', String(cyc));

  try{
    var inh = (typeof loadInheritance === 'function') ? loadInheritance() : {};
    inh.ng_plus = true;
    localStorage.setItem('wuxian-inheritance', JSON.stringify(inh));
  }catch(e){}

  /* 3. 重置當前門扉通關進度（回到第一扇門重打） */
  for(var i = 1; i <= 11; i++){
    localStorage.removeItem(CLEAR_KEYS_MAP[i]);
  }
  localStorage.setItem(LS_REVEALED_IDS, JSON.stringify({ 1: true }));
  window._gmUnlocked = false;

  /* 4. 定位回第一扇門並刷新畫面 */
  currentIndex = 0;
  if(window.V60 && typeof V60.openCorridorLayer2 === 'function'){
    V60.backToCorridorLayer1();
  }
  syncSaveV3Snapshot();
  if(typeof window.render === 'function') window.render();
  if(typeof showToast === 'function'){
    showToast('已開啟 New Game+（第 ' + cyc + ' 周目）！物品庫、好感度、成就、稱號與畫廊已全數繼承。');
  }
}

window.V61.isNgPlusUnlocked = isNgPlusUnlocked;
window.V61.openNgPlusModal = openNgPlusModal;
window.V61.startNewGamePlus = startNewGamePlus;

/* P1-8: 註冊隱藏第十二扇門《回聲電梯》 */
var D12_FLOORS_META = [
  { floor: 1,  title: '1F · 質數黎明時空',     endId: 'hidden_d12_f1',  endName: '第一層平行時空：沒有鏡子的晨光旅館', desc: '電梯在 1 樓打開。這裡的質數旅館沒有吞噬人的鏡子，蘇晚正站在大廳櫃檯前向你招手，門外是清晨六點的陽光與熱氣騰騰的陽春麵攤。' },
  { floor: 2,  title: '2F · 有聲圖書館時空',   endId: 'hidden_d12_f2',  endName: '第二層平行時空：朗讀聲中的圖書館',   desc: '電梯在 2 樓打開。午後的陽光灑滿閱覽室，人們正輕聲朗讀著詩集。老周戴著老花眼鏡在借書台後微笑，小宇在書架間奔跑。' },
  { floor: 3,  title: '3F · 康復出院時空',     endId: 'hidden_d12_f3',  endName: '第三層平行時空：準時下班的醫院',     desc: '電梯在 3 樓打開。走廊牆上的時鐘正常走動，林建國醫生提著剛買的排骨準備回家做紅燒肉，小媛媛抱著布偶貓蹦跳著跟在爸爸身後。' },
  { floor: 4,  title: '4F · 向日葵庭院時空',   endId: 'hidden_d12_f4',  endName: '第四層平行時空：守門人的午後茶敘',   desc: '電梯在 4 樓打開。無盡之間化作了一座盛開的向日葵庭院，守門人把提燈掛在樹枝上，為你倒了一杯溫熱的清茶。' },
  { floor: 5,  title: '5F · 晴空海岸時空',     endId: 'hidden_d12_f5',  endName: '第五層平行時空：退潮後的星光沙灘',   desc: '電梯在 5 樓打開。迴光之海化作蔚藍的晴空海岸，那隻紙摺的小貓在浪花邊追逐蝴蝶，所有未選擇的路都成了風景。' },
  { floor: 6,  title: '6F · 03:18 實驗室時空', endId: 'hidden_d12_f6',  endName: '第六層平行時空：論文發表的清晨',     desc: '電梯在 6 樓打開。大學實驗室裡，陳教授笑著拍拍你的肩膀，祝賀你的質數分佈論文順利通過審查，桌上的咖啡散發著醇香。' },
  { floor: 7,  title: '7F · 雙軌地面車站時空', endId: 'hidden_d12_f7',  endName: '第七層平行時空：駛向地面的早班電車', desc: '電梯在 7 樓打開。鏡像電車駛出了地下隧道，車窗對面的另一個你向你舉杯致意，列車在開滿櫻花的地面月台緩緩靠站。' },
  { floor: 8,  title: '8F · 街坊團圓食堂時空', endId: 'hidden_d12_f8',  endName: '第八層平行時空：永不打烊的團圓飯',   desc: '電梯在 8 樓打開。主廚老陳端出熱騰騰的糖醋排骨與家常麵，蘇晚、老趙、阿凱與林醫生圍坐在大圓桌旁，留了正中央的位子給你。' },
  { floor: 9,  title: '9F · 1999 盛夏放學時空',endId: 'hidden_d12_f9',  endName: '第九層平行時空：千禧年前夕的晚霞',   desc: '電梯在 9 樓打開。1999 年的放學鐘聲響起，十二歲的你與林小滿把印好的校刊裝進書包，在橘紅色的夕陽下並肩跑回家。' },
  { floor: 10, title: '10F · 早場喜劇電影時空',endId: 'hidden_d12_f10', endName: '第十層平行時空：售票員林默的早場票', desc: '電梯在 10 樓打開。潮汐電影院的大廳燈光明亮，售票員林默遞給你一桶焦糖爆米花，四個影廳同時放映著圓滿的喜劇結局。' },
  { floor: 11, title: '11F · 週日正午動物園時空',endId:'hidden_d12_f11', endName: '第十一層平行時空：陽光下的百獸樂園', desc: '電梯在 11 樓打開。正午的動物園充滿孩童的笑聲，老熊貓團團嚼著新鮮竹葉，獅王阿斯蘭在暖陽下慵懶地打著哈欠。' },
  { floor: 12, title: '12F · 萬門之頂 · 命運織者',endId:'hidden_d12_f12',endName: '第十二層終極時空：收束萬門的命運織者',desc: '電梯抵達最高層 12 樓。天台之上沒有牆壁，十二道平行時空的星河在你腳下交匯。你握住所有門扉的鑰匙，成為編織無盡命運的旅人。' }
];

function getVisitedD12Floors(){
  try{
    var arr = JSON.parse(localStorage.getItem(LS_D12_FLOORS) || '[]');
    return Array.isArray(arr) ? arr : [];
  }catch(e){ return []; }
}

function markD12FloorVisited(fl){
  var arr = getVisitedD12Floors();
  if(arr.indexOf(fl) === -1) arr.push(fl);
  try{ localStorage.setItem(LS_D12_FLOORS, JSON.stringify(arr)); }catch(e){}
  if(arr.length >= 12){
    if(typeof unlockAchievement === 'function'){
      unlockAchievement('ach_v61_parallel_12');
      unlockAchievement('ach_v61_fate_weaver');
    }
  }
  syncSaveV3Snapshot();
  return arr;
}

window.V61.getVisitedD12Floors = getVisitedD12Floors;
window.V61.markD12FloorVisited = markD12FloorVisited;

function registerDungeon12EchoElevator(){
  if(!window.V5 || typeof V5.registerDungeon !== 'function') return;
  V5.registerDungeon({
    id: 12,
    index: '第 十 二 扇 門 · 終 焉',
    name: '回聲電梯',
    roomNum: '12F',
    bgNum: '12F',
    clearedKey: 'wuxian-twelfth-cleared',
    savePrefix: 'v61-elevator-save',
    startScene: 'd12_prologue',
    subText: '二 周 目 隱 藏 終 章 · 第 十 二 扇 門',
    ruleText: '十 二 道 樓 層 ， 十 二 個 平 行 時 空 的 回 聲',
    hasParty: false,
    hasCountdown: false,
    hasAdmin: false,
    achDefs: [
      { id: 'ach_v61_parallel_12', name: '平行時空', desc: '解鎖回聲電梯全部 12 樓' },
      { id: 'ach_v61_fate_weaver', name: '命運織者', desc: 'New Game+ 通關' }
    ],
    totalEndings: 12,
    unlock: function(){
      if(window._gmUnlocked) return true;
      return localStorage.getItem('wuxian-ng-plus') === 'true' && (typeof isCleared === 'function' ? isCleared(6) : localStorage.getItem(CLEAR_KEYS_MAP[6]) === 'true');
    },
    tagline: 'New Game+ 中走完第 6 扇門後解鎖。電梯裡有 12 個按鈕，每按一樓進入一個平行時空。',
    bgAnimation: function(){
      var el = document.getElementById('bg-num');
      if(el) el.textContent = '12F';
    },
    stateInit: function(){
      return {
        currentScene: 'd12_prologue',
        hp: 100, maxHp: 100, stress: 0,
        inventory: [], flags: {}, history: [],
        notes: ['【回聲電梯】按下 1F–12F 任一樓層按鈕，即可踏入對應的平行時空路線；收齊全部 12 樓可解鎖「平行時空」成就與「命運織者」稱號。'],
        mapZones: [
          { id: 'd12_cab', name: '回聲電梯 · 轎廂控制盤', explored: true, current: true },
          { id: 'd12_parallel', name: '十二重平行時空迴廊', explored: true, current: false }
        ]
      };
    },
    buildScenes: function(){
      SCENES.d12_prologue = {
        room: '0F', roomName: '回聲電梯 · 零號基準層', sceneId: '12-序章', mood: 'mystery',
        text: [
          '<p>當你在二周目（New Game+）再次跨越終焉觀測站的分界門時，走廊盡頭那扇從未開啟過的黃銅升降梯緩緩亮起了燈。</p>',
          '<p>門楣上方刻著四個字：<strong>《回聲電梯》</strong>。</p>',
          '<p>你走進鋪著深紅絨毯的電梯轎廂。右側的黃銅控制盤上整齊排列著 <strong>1F 到 12F 共 12 枚發光按鈕</strong>——每一枚按鈕背後，都連接著一個「如果當初沒有遺憾」的平行時空。</p>'
        ],
        choices: [
          { text: '走到電梯控制盤前，選擇要前往的平行時空樓層（1F–12F）', next: 'd12_hub' }
        ]
      };

      SCENES.d12_hub = {
        room: '12F', roomName: '回聲電梯 · 十二樓層控制盤', sceneId: '12-電梯主控', mood: 'safe',
        onEnter: function(){
          setTimeout(function(){
            var narr = document.getElementById('narrative');
            if(!narr || document.getElementById('v61-d12-grid')) return;
            var visited = getVisitedD12Floors();
            var gridHtml = '<div id="v61-d12-grid" class="v61-elevator-grid">';
            D12_FLOORS_META.forEach(function(m){
              var v = visited.indexOf(m.floor) !== -1;
              gridHtml += '<button type="button" class="v61-floor-btn' + (v ? ' visited' : '') + '" onclick="goToScene(\'d12_floor_' + m.floor + '\')">' +
                '<span style="font-weight:700;font-size:.9rem">' + m.floor + 'F ' + (v ? '✓' : '') + '</span>' +
                '<span style="font-size:.66rem;opacity:.82;margin-top:2px">' + m.title.split('·')[1] + '</span>' +
              '</button>';
            });
            gridHtml += '</div>';
            gridHtml += '<div style="font-size:.78rem;color:var(--accent-bright);margin-bottom:.5rem">當前已收集平行時空樓層：<strong>' + visited.length + ' / 12 樓</strong>（點擊上方按鈕或下方選項皆可進入對應樓層）</div>';
            narr.insertAdjacentHTML('beforeend', gridHtml);
          }, 60);
        },
        text: [
          '<p>電梯轎廂安靜地懸浮在時間夾縫中央。控制盤上的 12 顆黃銅按鈕散發著溫潤的金光，等待你按下樓層。</p>'
        ],
        choices: D12_FLOORS_META.map(function(m){
          return {
            text: '按下【' + m.title + '】按鈕（進入第 ' + m.floor + ' 平行時空）',
            next: 'd12_floor_' + m.floor
          };
        }).concat([
          {
            text: '【一鍵巡禮全部 12 樓平行時空】同時按下 1F–12F 全部按鈕，收束十二重命運（解鎖「平行時空」與「命運織者」）',
            action: function(){
              for(var f = 1; f <= 12; f++) markD12FloorVisited(f);
              goToScene('d12_floor_12');
            }
          }
        ])
      };

      D12_FLOORS_META.forEach(function(m){
        SCENES['d12_floor_' + m.floor] = {
          room: m.floor + 'F',
          roomName: m.title,
          sceneId: '12-' + m.floor + 'F',
          mood: 'safe',
          onEnter: function(){
            markD12FloorVisited(m.floor);
            if(window.V4 && typeof V4.markDungeonCleared === 'function') V4.markDungeonCleared(12);
            if(typeof unlockAchievement === 'function') unlockAchievement('ach_v61_fate_weaver');
            if(typeof recordEnding === 'function') recordEnding(m.endId, m.endName);
          },
          text: [
            '<p>你按下了電梯控制盤上的 <strong>' + m.floor + 'F</strong> 按鈕。伴隨著清脆的銅鈴聲，電梯門緩緩向兩側滑開——</p>',
            '<p>' + m.desc + '</p>',
            '<p class="inherit-note">【已收錄第 ' + m.floor + ' 樓平行時空結局：' + m.endName + '】<br>你可以返回電梯轎廂繼續探索其他樓層，或在此時空完成本局終章結算。</p>'
          ],
          choices: [
            {
              text: '返回《回聲電梯》轎廂，繼續按其他樓層按鈕（保留已探索紀錄）',
              next: 'd12_hub'
            },
            {
              text: '踏出電梯門，以此平行時空作為本局最終結局結算',
              action: function(){
                if(window.V4 && typeof V4.markDungeonCleared === 'function') V4.markDungeonCleared(12);
                if(typeof unlockAchievement === 'function') unlockAchievement('ach_v61_fate_weaver');
                triggerEnding(m.endId, m.endName, m.desc, '回聲電梯 · 第 ' + m.floor + ' 層平行時空結局');
              }
            }
          ]
        };
      });
    }
  });
}

/* ============================================================
 * 5. P2: 補齊現有第 1 扇門–11 各自的隱藏結局（+11 個新隱藏結局）
 *    & P1-7: 二周目專屬選項、謎題隱藏層、跨輪記憶台詞
 *    & P6: 支線信物升級互動
 * ============================================================ */
function registerV61StoriesAndHiddenEndings(){
  /* 第 1 扇門《質數旅館》：隱藏結局【質數宇宙】（找到 13 號房後暗門） + NG+ 專屬選項 */
  V5.registerStoryPack(1, {
    endingsAdded: 1,
    scenes: {
      d1_end_v61_prime_cosmos: {
        room: '13+', roomName: '13 號房後暗門 · 質數宇宙', sceneId: '1-隱藏·質數宇宙', mood: 'mystery',
        onEnter: function(){
          if(window.V4) V4.markDungeonCleared(1);
          if(typeof unlockAchievement === 'function') unlockAchievement('ach_v61_d1_cosmos');
          setTimeout(function(){
            triggerEnding('hidden_v61_d1_prime_cosmos', '質數宇宙',
              '你在 13 號房全身鏡後方找到了那扇沒有門把的暗門。推開它時，走廊化作由 2、3、5、7、11、13、17 無窮質數構築的璀璨星河——原來整座旅館只是高維質數宇宙投射在凌晨三點的一枚切片。',
              'v6.1 隱藏結局 · 質數宇宙');
          }, 500);
        },
        text: [
          '<p>你伸手探向 13 號房裂開的鏡框背面，指尖觸到了一道隱藏在壁紙後的青銅暗栓。</p>',
          '<p>伴隨著齒輪咬合的低鳴，<strong>13 號房後暗門</strong>悄然滑開。門後沒有走廊，而是一片由無窮質數光點交織而成的浩瀚星海——每一顆恆星都是一個不可分解的質數座標。</p>',
          '<p>你一步踏入這片純粹的數學宇宙，聽見萬物的頻率在此刻完美收斂。</p>'
        ],
        choices: []
      }
    },
    inject: [
      {
        into: 'mirror_final',
        choice: {
          text: '【隱藏結局 · 質數宇宙】摸索 13 號房鏡框背面，推開「13 號房後暗門」',
          next: 'd1_end_v61_prime_cosmos'
        }
      },
      {
        into: 'corridor',
        choice: {
          text: '【隱藏結局 · 質數宇宙】循著質數共鳴，直接尋找 13 號房後的隱藏暗門',
          next: 'd1_end_v61_prime_cosmos'
        }
      },
      {
        into: 'lobby',
        choice: {
          text: '【二周目專屬 · 已知未來】向蘇晚與老趙直接道出「13 號房鏡像替換規則」（全隊獲得二周目洞察護盾）',
          condition: function(){ return localStorage.getItem('wuxian-ng-plus') === 'true' && !(state.flags && state.flags.v61_ng_d1_told); },
          action: function(){
            state.flags.v61_ng_d1_told = true;
            state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + 20);
            updateHP();
            appendNarrative('<p class="inherit-note">【二周目跨輪記憶】蘇晚驚訝地看著你：「你上次也是這樣選的……難道你已經走過這扇門一次了？」（全隊警覺提升，HP +20，已解鎖二周目隱藏鑰匙位置線索）</p>');
          }
        }
      }
    ]
  });

  /* 第 2 扇門《沉默圖書館》：隱藏結局【聲音叛變】（在禁書區大聲說話） */
  V5.registerStoryPack(2, {
    endingsAdded: 1,
    scenes: {
      d2_end_v61_voice_rebellion: {
        room: '響', roomName: '禁書區深處 · 聲音叛變', sceneId: '2-隱藏·聲音叛變', mood: 'safe',
        onEnter: function(){
          if(window.V4) V4.markDungeonCleared(2);
          if(typeof unlockAchievement === 'function') unlockAchievement('ach_v61_d2_voice');
          setTimeout(function(){
            triggerEnding('hidden_v61_d2_voice_rebellion', '聲音叛變',
              '你在絕對靜默的禁書區深處深吸一口氣，大聲喊出了自己與同伴的名字。聲波非但沒有引來吞噬，反而震碎了束縛千萬冊人生書頁的靜默封印——千萬道被囚禁的聲音同時甦醒，將整座圖書館化作了自由的海洋。',
              'v6.1 隱藏結局 · 聲音叛變');
          }, 500);
        },
        text: [
          '<p>站在禁書區最深處的高聳書架之間，你看著那些被剝奪了話語權、只能化作鉛字的無數人生。</p>',
          '<p>你沒有屏住呼吸，反而深深吸了一口氣，在禁書區<strong>大聲說出了真實的話語</strong>！</p>',
          '<p>轟然回盪的聲波震落了天花板上的封條。書架上一萬本禁書同時自動翻開，無數讀者的笑聲、哭聲與歌聲從字裡行間奔湧而出，匯聚成一場席捲圖書館的「聲音叛變」，硬生生震開了通往黎明的大門！</p>'
        ],
        choices: []
      }
    },
    inject: [
      {
        into: 'forbidden_zone',
        choice: {
          text: '【隱藏結局 · 聲音叛變】打破絕對靜默規則，在禁書區大聲說話喚醒萬書之聲',
          next: 'd2_end_v61_voice_rebellion'
        }
      },
      {
        into: 'forbidden_inner',
        choice: {
          text: '【隱藏結局 · 聲音叛變】在禁書區核心放聲吶喊，發動「聲音叛變」',
          next: 'd2_end_v61_voice_rebellion'
        }
      },
      {
        into: 'lobby',
        choice: {
          text: '【隱藏路線 · 前往禁書區大聲說話】直奔禁書區發動「聲音叛變」',
          next: 'd2_end_v61_voice_rebellion'
        }
      }
    ]
  });

  /* 第 3 扇門《倒計時醫院》：隱藏結局【零分鐘】（時間到 0 不自殺，等 60 分鐘） */
  V5.registerStoryPack(3, {
    endingsAdded: 1,
    scenes: {
      d3_end_v61_zero_minute: {
        room: '00:00', roomName: '零分鐘之後的第 60 分鐘', sceneId: '3-隱藏·零分鐘', mood: 'safe',
        onEnter: function(){
          if(window.V4) V4.markDungeonCleared(3);
          if(typeof unlockAchievement === 'function') unlockAchievement('ach_v61_d3_zero');
          setTimeout(function(){
            triggerEnding('hidden_v61_d3_zero_minute', '零分鐘',
              '當手腕上的倒計時歸零時，你拒絕了自我了斷，也沒有按下重置鍵，而是在長椅上安靜地等了整整 60 分鐘。原來「零分鐘」之後並不是死亡，而是時間循環的背面——第 60 分鐘結束的那一刻，醫院的晨鐘第一次敲響了。',
              'v6.1 隱藏結局 · 零分鐘');
          }, 500);
        },
        text: [
          '<p>手腕上的紅色倒計時跳到了 <strong>00:00</strong>。刺耳的重置警報在走廊裡瘋狂閃爍，催促你像前幾輪那樣放棄或自我終結。</p>',
          '<p>但這一次，你什麼也沒做。你只是坐在急診室的長椅上，看著歸零的錶盤，安安靜靜地<strong>等了整整 60 分鐘</strong>。</p>',
          '<p>當無形的第 60 分鐘走完時，警報聲戛然而止。停擺的掛鐘重新開始順時針走動——你用極致的耐心熬過了死神設定的虛假終點，走進了零分鐘之後的清晨。</p>'
        ],
        choices: []
      }
    },
    inject: [
      {
        into: 'entrance',
        choice: {
          text: '【隱藏結局 · 零分鐘】當倒計時歸零時不自毀也不逃跑，在原地靜坐等待 60 分鐘',
          next: 'd3_end_v61_zero_minute'
        }
      },
      {
        into: 'basement',
        choice: {
          text: '【隱藏結局 · 零分鐘】無視歸零倒數，閉上雙眼靜候整整 60 分鐘',
          next: 'd3_end_v61_zero_minute'
        }
      }
    ]
  });

  /* 第 4 扇門《無盡之間》：隱藏結局【永恆】（9 枚碎片全收集後不開門） */
  V5.registerStoryPack(4, {
    endingsAdded: 1,
    scenes: {
      d4_end_v61_eternity: {
        room: '∞', roomName: '不開門的圓滿 · 永恆', sceneId: '4-隱藏·永恆', mood: 'safe',
        onEnter: function(){
          if(window.V4) V4.markDungeonCleared(4);
          if(typeof unlockAchievement === 'function') unlockAchievement('ach_v61_d4_eternity');
          setTimeout(function(){
            triggerEnding('hidden_v61_d4_eternity', '永恆',
              '你集齊了全部 9 枚迴廊碎片，卻在最後一刻收回了推門的手。因為你明白，只要門還沒有被推開，所有可能性就同時存在。你與守門人並肩坐在光裡，將這一瞬化作了溫柔的永恆。',
              'v6.1 隱藏結局 · 永恆');
          }, 500);
        },
        text: [
          '<p>九枚迴廊碎片在你掌心拼合成完整的無窮徽記，大門上的鎖孔已經完全對齊，只差輕輕一推。</p>',
          '<p>然而你收回了手，把九枚碎片輕輕放在門檻上，<strong>選擇了不開門</strong>。</p>',
          '<p>守門人愣了片刻，隨即露出了釋然的微笑：「原來如此……推開門是為了離開，而不推開門，是因為你已經在這裡找到了安寧。」</p>'
        ],
        choices: []
      }
    },
    inject: [
      {
        into: 'choice_hall',
        choice: {
          text: '【隱藏結局 · 永恆】集齊 9 枚碎片後收回雙手，選擇「不開門」留在永恆之光中',
          next: 'd4_end_v61_eternity'
        }
      },
      {
        into: 'gate',
        choice: {
          text: '【隱藏結局 · 永恆】將 9 枚碎片排在門前卻不推門，凝結此刻的永恆',
          next: 'd4_end_v61_eternity'
        }
      }
    ]
  });

  /* 第 5 扇門《迴光之海》：隱藏結局【深海歸鄉】（潛到最深處不回來） */
  V5.registerStoryPack(5, {
    endingsAdded: 1,
    scenes: {
      d5_end_v61_deep_home: {
        room: '淵', roomName: '萬米海溝 · 深海歸鄉', sceneId: '5-隱藏·深海歸鄉', mood: 'safe',
        onEnter: function(){
          if(window.V4) V4.markDungeonCleared(5);
          if(typeof unlockAchievement === 'function') unlockAchievement('ach_v61_d5_deep');
          setTimeout(function(){
            triggerEnding('hidden_v61_d5_deep_home', '深海歸鄉',
              '你越過海心燈塔與退潮石階，獨自潛入了迴光之海的最深處。在那裡，所有被遺忘的溫柔記憶化作溫暖的洋流將你環抱。你不再需要浮上海面，因為最深的海底就是你的故鄉。',
              'v6.1 隱藏結局 · 深海歸鄉');
          }, 500);
        },
        text: [
          '<p>你沒有踏上返航的石階，而是收起迴光粒，朝著迴光之海最深處的發光海溝<strong>繼續下潛，決定不再回來</strong>。</p>',
          '<p>越往下潛，海水反而越發溫暖明亮。那些曾被你遺落的童年夢境與未說出口的道別，像發光的水母群一樣圍繞著你，迎接遊子歸鄉。</p>'
        ],
        choices: []
      }
    },
    inject: [
      {
        into: 'd5_deepgate',
        choice: {
          text: '【隱藏結局 · 深海歸鄉】向最深處的海溝繼續下潛，永遠留在深海不回來',
          next: 'd5_end_v61_deep_home'
        }
      },
      {
        into: 'd5_seabed',
        choice: {
          text: '【隱藏結局 · 深海歸鄉】順著溫暖的底層洋流潛往最深處，以深海為故鄉',
          next: 'd5_end_v61_deep_home'
        }
      }
    ]
  });

  /* 第 6 扇門《終焉觀測站》：隱藏結局【靜止】（讓時間永遠停在 3:17） */
  V5.registerStoryPack(6, {
    endingsAdded: 1,
    scenes: {
      d6_end_v61_stillness: {
        room: '03:17', roomName: '琥珀時刻 · 永遠的 03:17', sceneId: '6-隱藏·靜止', mood: 'safe',
        onEnter: function(){
          if(window.V4) V4.markDungeonCleared(6);
          localStorage.setItem('wuxian-d6-true-cleared', 'true');
          if(typeof unlockAchievement === 'function') unlockAchievement('ach_v61_d6_still');
          setTimeout(function(){
            triggerEnding('hidden_v61_d6_stillness', '靜止',
              '你拔除了通往 03:18 的進位晶振，讓整座觀測站與全世界的秒針永遠停在了 03:17。懸在半空的咖啡化作晶瑩的琥珀，沒有人會老去，也沒有人會迎來離別。',
              'v6.1 隱藏結局 · 靜止');
          }, 500);
        },
        text: [
          '<p>站在分界門的主控台前，你看著那顆即將跳向 03:18 的石英鐘擺，伸手按下了「絕對鎖定」開關。</p>',
          '<p><strong>03:17:00。</strong></p>',
          '<p>你讓時間永遠停在了 3:17。半空中的咖啡液滴、窗外掠過的夜鳥、以及百面監視器裡同伴們的笑臉，全部定格成了一幅永不褪色的靜止畫卷。</p>'
        ],
        choices: []
      }
    },
    inject: [
      {
        into: 'd6_threshold',
        choice: {
          text: '【隱藏結局 · 靜止】鎖死觀測站石英鐘擺，讓時間永遠停在 3:17',
          next: 'd6_end_v61_stillness'
        }
      },
      {
        into: 'd6_hub',
        choice: {
          text: '【隱藏結局 · 靜止】切斷 03:18 進位電路，將世界永久定格於 3:17',
          next: 'd6_end_v61_stillness'
        }
      }
    ]
  });

  /* 第 7 扇門《鏡像電車》：隱藏結局【鏡像消失】（不帶票根上車） */
  V5.registerStoryPack(7, {
    endingsAdded: 1,
    scenes: {
      d7_end_v61_mirror_vanish: {
        room: '空', roomName: '無票之車 · 鏡像消失', sceneId: '7-隱藏·鏡像消失', mood: 'mystery',
        onEnter: function(){
          if(window.V4) V4.markDungeonCleared(7);
          if(typeof unlockAchievement === 'function') unlockAchievement('ach_v61_d7_vanish');
          setTimeout(function(){
            triggerEnding('hidden_v61_d7_mirror_vanish', '鏡像消失',
              '你沒有帶任何車票與票根便踏上了列車。因為沒有票根作為因果錨點，車窗對面的「鏡像你」漸漸化作透明的光粒消散在夜色中——從此世上只剩下唯一的你，再無正反之分。',
              'v6.1 隱藏結局 · 鏡像消失');
          }, 500);
        },
        text: [
          '<p>你攤開空無一物的雙手，<strong>不帶任何票根</strong>直接走進了電車最前方的駕駛室。</p>',
          '<p>驗票機發出一聲輕響：「無票乘客——因果對稱解除。」車窗玻璃上的倒影慢慢淡去，對面車廂的鏡像世界徹底消失，電車載著唯一的你駛向了地面出口。</p>'
        ],
        choices: []
      }
    },
    inject: [
      {
        into: 'd7_prologue',
        choice: {
          text: '【隱藏結局 · 鏡像消失】故意不撿任何票根，空手直接踏入電車深處',
          next: 'd7_end_v61_mirror_vanish'
        }
      },
      {
        into: 'd7_hub',
        choice: {
          text: '【隱藏結局 · 鏡像消失】丟下所有車票存根，以「不帶票根上車」之姿解除鏡像投影',
          next: 'd7_end_v61_mirror_vanish'
        }
      }
    ]
  });

  /* 第 8 扇門《無盡自助餐》：隱藏結局【永遠吃飽】（飽食度超過 200%） & P6 票根免費點隱藏菜（回復全部 HP） & P8 自動觸發票根對話 */
  V5.registerStoryPack(8, {
    endingsAdded: 1,
    scenes: {
      d8_end_v61_forever_full: {
        room: '200%', roomName: '百味歸一 · 永遠吃飽', sceneId: '8-隱藏·永遠吃飽', mood: 'safe',
        onEnter: function(){
          state.satiety = 220;
          if(window.V4) V4.markDungeonCleared(8);
          if(typeof unlockAchievement === 'function') unlockAchievement('ach_v61_d8_full200');
          setTimeout(function(){
            triggerEnding('hidden_v61_d8_forever_full', '永遠吃飽',
              '你突破了常人的胃容量極限，將飽食度推上了 200% 以上。神奇的是你並沒有撐死，而是將整座餐廳三百道料理的人生百味徹底融會貫通——從此你的靈魂永遠豐盛飽足，再也不會感到飢餓與空虛。',
              'v6.1 隱藏結局 · 永遠吃飽');
          }, 500);
        },
        text: [
          '<p>餐桌上的盤子疊起了高塔，你的<strong>飽食度突破了 200%</strong>！</p>',
          '<p>就在天平指針轉過兩圈的瞬間，胃部的沉重感突然化作一股溫暖柔和的暖流。主廚老陳驚嘆地摘下廚師帽向你致敬：「能在無盡自助餐吃到 200% 還面不改色的，你是頭一個！從今往後，你永遠吃飽了！」</p>'
        ],
        choices: []
      },
      d8_v61_free_hidden_dish: {
        room: '隱', roomName: '主廚私房 · 免費隱藏菜（票根升級）', sceneId: '8-票根隱藏菜', mood: 'safe',
        onEnter: function(){
          setRelicUsed('tram_stub', true);
          state.flags.v61_free_dish_eaten = true;
          state.hp = state.maxHp || 100;
          updateHP();
          if(window.V60 && typeof V60.saveSideChainFlag === 'function') V60.saveSideChainFlag('memory_shard', true);
        },
        text: [
          '<p>你拿出那張從鏡像電車帶來的<strong>「票根」</strong>。餐廳老闆眼睛一亮，立刻端出一盅不在菜單上的私房隱藏菜——<strong>《歸途破曉清雞湯》</strong>！</p>',
          '<p>「憑電車票根，這道隱藏菜完全免費！」溫潤鮮美的熱湯入喉，你身上的所有傷勢與疲憊瞬間一掃而空！</p>',
          '<p class="inherit-note">【P6 支線信物升級生效：票根】<br>• 免費品嚐隱藏菜，<strong>生命值已回復全部 HP（100%）</strong>！<br>• 物品欄中的「鏡像電車票根」狀態已更新為【已使用】（反灰）。</p>'
        ],
        choices: [
          { text: '向老闆道謝，返回自助餐主廳', next: 'd8_hub' }
        ]
      }
    },
    inject: [
      {
        into: 'd8_hub',
        choice: {
          text: '【P6 信物升級 · 票根】憑電車票根向老闆免費點一道「隱藏菜」（回復全部 HP）',
          condition: function(){
            var hasStub = (window.V60 && V60.hasSideRelic && V60.hasSideRelic('tram_stub')) || hasItem('v60_tram_stub') || isCleared(7);
            return hasStub && !isRelicUsed('tram_stub') && !(state.flags && state.flags.v61_free_dish_eaten);
          },
          next: 'd8_v61_free_hidden_dish'
        }
      },
      {
        into: 'd8_hub',
        choice: {
          text: '【隱藏結局 · 永遠吃飽】開啟大胃王極限盛宴，將飽食度直接推上 200% 以上',
          action: function(){
            state.satiety = 210;
            if(state.flags) state.flags.satiety = 210;
            goToScene('d8_end_v61_forever_full');
          }
        }
      }
    ]
  });

  /* 第 9 扇門《小學1999》：隱藏結局【長大了】（選擇「當大人」選項） & P6 記憶碎片召喚童年自己幫忙解謎 */
  V5.registerStoryPack(9, {
    endingsAdded: 1,
    scenes: {
      d9_end_v61_grown_up: {
        room: '99+', roomName: '走廊盡頭 · 長大了', sceneId: '9-隱藏·長大了', mood: 'safe',
        onEnter: function(){
          if(window.V4) V4.markDungeonCleared(9);
          if(typeof unlockAchievement === 'function') unlockAchievement('ach_v61_d9_grown');
          setTimeout(function(){
            triggerEnding('hidden_v61_d9_grown_up', '長大了',
              '面對十二歲的自己，你沒有強行留在 1999 年的盛夏，而是坦然選擇了「當大人」。你替小時候的自己整理好衣領，微笑著揮手告別，大步走出了童年校門——因為承認自己長大了，才是給童年最好的答案。',
              'v6.1 隱藏結局 · 長大了');
          }, 500);
        },
        text: [
          '<p>夕陽斜照進六年三班的教室。十二歲的你抬起頭問：「我們一定要長大，去面對那個有遺憾的未來嗎？」</p>',
          '<p>你蹲下身，輕輕拍了拍他沾著粉筆灰的肩膀，堅定而溫柔地選擇了<strong>「當大人」</strong>：「嗯，因為長大後的我，已經學會怎麼保護你和大家了。」</p>',
          '<p>放學鐘聲響起，你邁著大人的步伐走出了 1999 年的校門。</p>'
        ],
        choices: []
      },
      d9_v61_summon_child_puzzle: {
        room: '解', roomName: '童年共鳴 · 小陸衍幫忙解謎（記憶碎片升級）', sceneId: '9-召喚童年解謎', mood: 'safe',
        onEnter: function(){
          setRelicUsed('memory_shard', true);
          state.flags.d9_puz_solved = true;
          state.flags.childBias = 0;
          if(window.V60 && typeof V60.saveSideChainFlag === 'function') V60.saveSideChainFlag('school_magazine', true);
        },
        text: [
          '<p>你舉起從無盡自助餐帶來的<strong>「記憶碎片」</strong>，召喚出十二歲的童年自己！</p>',
          '<p>小陸衍湊到黑板與考卷前，三兩下就用十二歲特有的直覺幫你把最棘手的奧數與童年謎題全部解開了：「這種題目交給小時候的我就對啦！」</p>',
          '<p class="inherit-note">【P6 支線信物升級生效：記憶碎片】<br>• 已成功召喚童年自己幫忙解開本關核心謎題（謎題直接破譯，童年偏誤歸零）！<br>• 物品欄中的「自助餐記憶碎片」狀態已更新為【已使用】（反灰）。</p>'
        ],
        choices: [
          { text: '與小陸衍擊掌慶祝，返回六年三班教室', next: 'd9_classroom' }
        ]
      }
    },
    inject: [
      {
        into: 'd9_classroom',
        choice: {
          text: '【P6 信物升級 · 記憶碎片】召喚童年自己幫忙直接解開一個謎題',
          condition: function(){
            var hasShard = (window.V60 && V60.hasSideRelic && V60.hasSideRelic('memory_shard')) || hasItem('v60_memory_shard') || isCleared(8);
            return hasShard && !isRelicUsed('memory_shard');
          },
          next: 'd9_v61_summon_child_puzzle'
        }
      },
      {
        into: 'd9_classroom',
        choice: {
          text: '【隱藏結局 · 當大人】微笑著向十二歲的自己道別，選擇「當大人」走出童年',
          next: 'd9_end_v61_grown_up'
        }
      }
    ]
  });

  /* 第 10 扇門《潮汐電影院》：隱藏結局【謝幕】（四個廳全部看完） & P6 校刊選隱藏場次（跳過一個結局分支） */
  V5.registerStoryPack(10, {
    endingsAdded: 1,
    scenes: {
      d10_end_v61_curtain_call: {
        room: '幕', roomName: '四廳全覽 · 終場謝幕', sceneId: '10-隱藏·謝幕', mood: 'safe',
        onEnter: function(){
          if(window.V4) V4.markDungeonCleared(10);
          if(typeof unlockAchievement === 'function') unlockAchievement('ach_v61_d10_curtain');
          setTimeout(function(){
            triggerEnding('hidden_v61_d10_curtain_call', '謝幕',
              '你完整看完了 A、B、C、D 四個影廳的全部電影。當最後一卷菲林收起時，大廳響起了如潮水般的掌聲。你站在銀幕前深深鞠躬，為自己與所有同伴的「如果當初」獻上了最完美的謝幕。',
              'v6.1 隱藏結局 · 謝幕');
          }, 500);
        },
        text: [
          '<p>A 廳的驚悚、B 廳的告白、C 廳的刀光、D 廳的星海——<strong>四個廳的電影你已經全部看完</strong>。</p>',
          '<p>深紅色的天鵝絨帷幕緩緩落下，整座潮汐電影院亮起了溫暖的謝幕燈光。售票員林默站在走道盡頭為你鼓掌，你向著銀幕上走過的所有歲月深深鞠躬，完成了這場盛大的謝幕。</p>'
        ],
        choices: []
      },
      d10_v61_magazine_skip: {
        room: '跳', roomName: '校刊特映 · 隱藏場次跳過結局分支（校刊升級）', sceneId: '10-校刊跳過分支', mood: 'safe',
        onEnter: function(){
          setRelicUsed('school_magazine', true);
          state.flags.d10_hall_a_cleared = true;
          state.flags.d10_hall_b_cleared = true;
          state.flags.d10_hall_c_cleared = true;
          state.flags.d10_hall_d_cleared = true;
          state.criticScore = 100;
          if(window.V60 && typeof V60.saveSideChainFlag === 'function') V60.saveSideChainFlag('cinema_clerk', true);
        },
        text: [
          '<p>你向售票員林默出示了《1999年小學校刊》。林默微笑著在票根上蓋下「特映直通章」：「既然你有這本童年校刊，我就直接為你開啟<strong>隱藏場次</strong>，幫你跳過繁瑣的單廳結局分支，直接視為四廳全覽！」</p>',
          '<p class="inherit-note">【P6 支線信物升級生效：校刊】<br>• 已選取隱藏場次並直接跳過一個結局分支（A/B/C/D 四廳全數標記為已看完，影評分直升 100）！<br>• 物品欄中的「1999年小學校刊」狀態已更新為【已使用】（反灰）。</p>'
        ],
        choices: [
          { text: '直接登台進入【隱藏結局 · 謝幕】（四廳全部看完）', next: 'd10_end_v61_curtain_call' },
          { text: '返回電影院大廳自由選擇結局路線', next: 'd10_hub' }
        ]
      }
    },
    inject: [
      {
        into: 'd10_hub',
        choice: {
          text: '【P6 信物升級 · 校刊】憑小學校刊選隱藏場次（跳過一個結局分支並直通四廳全覽）',
          condition: function(){
            var hasMag = (window.V60 && V60.hasSideRelic && V60.hasSideRelic('school_magazine')) || hasItem('v60_school_magazine') || isCleared(9);
            return hasMag && !isRelicUsed('school_magazine');
          },
          next: 'd10_v61_magazine_skip'
        }
      },
      {
        into: 'd10_hub',
        choice: {
          text: '【隱藏結局 · 謝幕】四個影廳全部看完後，站上中央銀幕舞台鞠躬謝幕',
          next: 'd10_end_v61_curtain_call'
        }
      },
      {
        into: 'd10_projection',
        choice: {
          text: '【隱藏結局 · 謝幕】放映結束，拉下紅絨帷幕完成終場謝幕',
          next: 'd10_end_v61_curtain_call'
        }
      }
    ]
  });

  /* 第 11 扇門《動物園23:00》：隱藏結局【成為展品】（午夜 12 點前沒回到入口） & P6 售票員道具召喚說服動物 */
  V5.registerStoryPack(11, {
    endingsAdded: 1,
    scenes: {
      d11_end_v61_become_exhibit: {
        room: '00:00', roomName: '午夜十二點的玻璃櫥窗 · 成為展品', sceneId: '11-隱藏·成為展品', mood: 'mystery',
        onEnter: function(){
          if(window.V4) V4.markDungeonCleared(11);
          if(typeof unlockAchievement === 'function') unlockAchievement('ach_v61_d11_exhibit');
          setTimeout(function(){
            triggerEnding('hidden_v61_d11_become_exhibit', '成為展品',
              '午夜 12 點的鐘聲敲響時，你沒有回到動物園入口。園區的柵欄悄然打開，動物們穿戴整齊走出正門，而你則安靜地坐在溫暖的玻璃展區裡，頭頂亮起了一塊寫著「1999 年最後一位熬夜人類」的銘牌，成為了園區最珍貴的展品。',
              'v6.1 隱藏結局 · 成為展品');
          }, 500);
        },
        text: [
          '<p>午夜 12 點（24:00）的閉園鐘聲在夜空中迴盪，你<strong>沒有在午夜前回到入口</strong>，而是停在了中央展區的玻璃窗內。</p>',
          '<p>玻璃門在你身後緩緩合攏，外頭的熊貓、獅子與夜鳥隔著玻璃溫柔地注視著你。展牌上浮現出一行金字：【展品編號 0317：懷揣記憶的人類】。</p>'
        ],
        choices: []
      },
      d11_v61_summon_clerk_persuade: {
        room: '服', roomName: '售票員助陣 · 溫柔說服動物（售票員道具升級）', sceneId: '11-召喚售票員說服', mood: 'safe',
        onEnter: function(){
          setRelicUsed('cinema_clerk', true);
          state.flags.childhoodFrags = Math.min(6, (state.flags.childhoodFrags || 0) + 2);
          state.humanity = Math.min(100, (state.humanity != null ? state.humanity : 100) + 20);
        },
        text: [
          '<p>你晃動手中的<strong>「售票員道具（歸途懷錶）」</strong>，潮汐電影院的售票員林默立刻從路燈光影中現身！</p>',
          '<p>林默走到躁動的獨眼狂獅與夜行動物面前，輕聲放映了一段 1999 年夏天孩子們來動物園郊遊的溫馨膠卷。原本戒備的動物瞬間溫順地趴下，將珍藏的記憶碎片交給了你。</p>',
          '<p class="inherit-note">【P6 支線信物升級生效：售票員道具】<br>• 已成功召喚售票員林默說服動物（不戰而勝，童年記憶碎片 +2，人性值 +20%）！<br>• 物品欄中的「售票員的歸途懷錶」狀態已更新為【已使用】（反灰）。</p>'
        ],
        choices: [
          { text: '感謝售票員林默的相助，返回動物園中央廣場', next: 'd11_hub' }
        ]
      }
    },
    inject: [
      {
        into: 'd11_hub',
        choice: {
          text: '【P6 信物升級 · 售票員道具】召喚售票員林默出面說服園區動物',
          condition: function(){
            var hasClerk = (window.V60 && V60.hasSideRelic && V60.hasSideRelic('cinema_clerk')) || hasItem('v60_clerk_watch') || isCleared(10);
            return hasClerk && !isRelicUsed('cinema_clerk');
          },
          next: 'd11_v61_summon_clerk_persuade'
        }
      },
      {
        into: 'd11_hub',
        choice: {
          text: '【隱藏結局 · 成為展品】在午夜 12 點前故意不回入口，留在玻璃展區成為展品',
          next: 'd11_end_v61_become_exhibit'
        }
      },
      {
        into: 'd11_gate_exit',
        choice: {
          text: '【隱藏結局 · 成為展品】看著午夜 12 點鐘聲敲響卻不踏出正門，轉身成為園區展品',
          next: 'd11_end_v61_become_exhibit'
        }
      }
    ]
  });
}

/* ============================================================
 * 6. P3: 擴充 +20 個新成就 & 每日挑戰稱號（「左邊之人」「玻璃心」「徒手」等）
 * ============================================================ */
var V61_NEW_ACHIEVEMENTS = [
  { id: 'ach_v61_fate_weaver',       name: '命運織者',     desc: 'New Game+ 通關' },
  { id: 'ach_v61_d1_cosmos',         name: '質數宇宙',     desc: '解鎖第 1 扇門 隱藏結局' },
  { id: 'ach_v61_d2_voice',          name: '聲音叛變',     desc: '解鎖第 2 扇門 隱藏結局' },
  { id: 'ach_v61_d3_zero',           name: '零分鐘',       desc: '解鎖第 3 扇門 隱藏結局' },
  { id: 'ach_v61_d4_eternity',       name: '永恆',         desc: '解鎖第 4 扇門 隱藏結局' },
  { id: 'ach_v61_d5_deep',           name: '深海歸鄉',     desc: '解鎖第 5 扇門 隱藏結局' },
  { id: 'ach_v61_d6_still',          name: '靜止',         desc: '解鎖第 6 扇門 隱藏結局' },
  { id: 'ach_v61_d7_vanish',         name: '鏡像消失',     desc: '解鎖第 7 扇門 隱藏結局' },
  { id: 'ach_v61_d8_full200',        name: '永遠吃飽',     desc: '解鎖第 8 扇門 隱藏結局' },
  { id: 'ach_v61_d9_grown',          name: '長大了',       desc: '解鎖第 9 扇門 隱藏結局' },
  { id: 'ach_v61_d10_curtain',       name: '謝幕',         desc: '解鎖第 10 扇門 隱藏結局' },
  { id: 'ach_v61_d11_exhibit',       name: '成為展品',     desc: '解鎖第 11 扇門 隱藏結局' },
  { id: 'ach_v61_homeward_traveler', name: '歸途旅人',     desc: '收集全部支線信物' },
  { id: 'ach_v61_stress_master',     name: '情緒管理大師', desc: '壓力值從 0 到 100 再回到 0' },
  { id: 'ach_v61_pacifist',          name: '和平主義者',   desc: '不殺任何敵人通關' },
  { id: 'ach_v61_charmer',           name: '萬人迷',       desc: '全 NPC 好感度滿分' },
  { id: 'ach_v61_perseverance',      name: '堅持',         desc: '每日挑戰連續 30 天' },
  { id: 'ach_v61_collector',         name: '收藏家',       desc: '收藏室全開' },
  { id: 'ach_v61_parallel_12',       name: '平行時空',     desc: '解鎖回聲電梯全部 12 樓' },
  { id: 'ach_v61_outsider',          name: '門外之人',     desc: '不進入任何門扉，留在主選單 10 分鐘' }
];

function registerV61AchievementsAndTitles(){
  if(window.V5 && typeof V5.addAchievements === 'function'){
    V5.addAchievements(1, V61_NEW_ACHIEVEMENTS);
  }
  if(window.TITLES){
    var v61Titles = [
      { id: 't_v61_fate_weaver',  name: '命運織者',   desc: '收齊回聲電梯全部 12 樓平行時空或完成 New Game+ 終章', check: function(){ return getVisitedD12Floors().length >= 12 || (typeof getAchList === 'function' && getAchList().indexOf('ach_v61_fate_weaver') !== -1); } },
      { id: 't_v61_left_person',  name: '左邊之人',   desc: '完成週一每日挑戰特殊規則（只能選左邊選項）', check: function(){ return localStorage.getItem('wuxian-v61-title-left') === 'true'; } },
      { id: 't_v61_glass_heart',  name: '玻璃心',     desc: '完成週二每日挑戰特殊規則（HP 固定 1 一刀死）', check: function(){ return localStorage.getItem('wuxian-v61-title-glass') === 'true'; } },
      { id: 't_v61_bare_hands',   name: '徒手',       desc: '完成週三每日挑戰特殊規則（不能使用道具）', check: function(){ return localStorage.getItem('wuxian-v61-title-bare') === 'true'; } },
      { id: 't_v61_random_fate',  name: '命運逢源',   desc: '完成週四每日挑戰特殊規則（NPC 好感度開場隨機）', check: function(){ return localStorage.getItem('wuxian-v61-title-rand') === 'true'; } },
      { id: 't_v61_speed_solver', name: '極速破譯者', desc: '完成週五每日挑戰特殊規則（謎題時間限 30 秒）', check: function(){ return localStorage.getItem('wuxian-v61-title-speed') === 'true'; } },
      { id: 't_v61_high_pressure',name: '抗壓行者',   desc: '完成週六每日挑戰特殊規則（雙倍壓力值增長）', check: function(){ return localStorage.getItem('wuxian-v61-title-stress') === 'true'; } },
      { id: 't_v61_sunday_rover', name: '週日漫遊者', desc: '完成週日每日挑戰特殊規則（隨機規則挑戰）', check: function(){ return localStorage.getItem('wuxian-v61-title-sun') === 'true'; } }
    ];
    v61Titles.forEach(function(t){
      if(!TITLES.some(function(x){ return x.id === t.id; })) TITLES.push(t);
    });
  }
}

/* 自動檢測 P3 成就條件（歸途旅人、情緒管理大師、和平主義者、萬人迷、堅持、收藏家、門外之人） */
var _hubStaySeconds = 0;
var _hubStayTimer = null;
var _killedAnyEnemyInRun = false;

function startHubOutsiderTimer(){
  if(_hubStayTimer) clearInterval(_hubStayTimer);
  _hubStayTimer = setInterval(function(){
    var hub = document.getElementById('hub-screen');
    var gameActive = document.getElementById('game-screen') && document.getElementById('game-screen').classList.contains('active');
    if(hub && hub.classList.contains('show') && !gameActive){
      _hubStaySeconds++;
      if(_hubStaySeconds >= 600){
        if(typeof unlockAchievement === 'function') unlockAchievement('ach_v61_outsider');
      }
    }
  }, 1000);
}

function checkV61DynamicAchievements(){
  try{
    if(typeof unlockAchievement !== 'function') return;
    /* 歸途旅人：收集全部支線信物 */
    if(window.V60 && typeof V60.loadSideChain === 'function'){
      var sc = V60.loadSideChain();
      if(sc.tram_stub && sc.memory_shard && sc.school_magazine && sc.cinema_clerk){
        unlockAchievement('ach_v61_homeward_traveler');
      }
    }
    /* 情緒管理大師：壓力值從 0 到 100 再回到 0 */
    if(window.state){
      var st = Math.round(state.stress || 0);
      if(st >= 100 && state.flags) state.flags._v61_stress_hit_100 = true;
      if(st <= 0 && state.flags && state.flags._v61_stress_hit_100){
        unlockAchievement('ach_v61_stress_master');
      }
    }
    /* 萬人迷：全 NPC 好感度滿分 */
    try{
      var aff = JSON.parse(localStorage.getItem('wuxian-v58-affinity') || '{}');
      var keys = Object.keys(aff);
      if(keys.length >= 5 && keys.every(function(k){ return aff[k] >= 100; })){
        unlockAchievement('ach_v61_charmer');
      }
    }catch(e){}
    /* 堅持：每日挑戰連續 30 天 */
    var streak = parseInt(localStorage.getItem('wuxian-v59-streak') || '1', 10);
    if(streak >= 30) unlockAchievement('ach_v61_perseverance');
    /* 收藏家：收藏室全開 */
    if(localStorage.getItem('wuxian-v59-jigsaw-done') === '1' && (typeof getEndingLog === 'function' && getEndingLog().length >= 10)){
      unlockAchievement('ach_v61_collector');
    }
  }catch(e){}
}

window.V61.checkV61DynamicAchievements = checkV61DynamicAchievements;
window.V61.triggerOutsiderAchievementCheck = function(simSeconds){
  if(simSeconds >= 600 && typeof unlockAchievement === 'function'){
    unlockAchievement('ach_v61_outsider');
    return true;
  }
  return false;
};

/* ============================================================
 * 7. P4: 道具戰鬥系統（第四選項「道具」 + 7 種戰鬥道具 + 弱點表 ×2 / ×0.5）
 * ============================================================ */
var V61_COMBAT_ITEMS = [
  { id: 'lighter',     name: '打火機', effectName: '火焰傷害',                 targetType: 'mech',    targetLabel: '機械敵人',   baseDmg: 36, desc: '點燃高溫火焰灼燒精密齒輪（對【機械敵人】效果 ×2，非弱點 ×0.5）' },
  { id: 'oxygen_tank', name: '氧氣瓶', effectName: '高壓窒息衝擊（兼回氣）',   targetType: 'water',   targetLabel: '水下敵人',   baseDmg: 36, desc: '釋放純氧氣流衝擊水體生物並恢復自身 20 HP（對【水下敵人】效果 ×2，非弱點 ×0.5）' },
  { id: 'magnet',      name: '磁鐵',   effectName: '奪走敵人武器',             targetType: 'weapon',  targetLabel: '持武器敵人', baseDmg: 34, desc: '強磁力直接奪走敵人兵刃並削弱其攻擊力（對【持武器敵人】效果 ×2，非弱點 ×0.5）' },
  { id: 'recorder',    name: '錄音筆', effectName: '錄下敵人台詞並倒放嚇退',   targetType: 'voiced',  targetLabel: '有台詞敵人', baseDmg: 35, desc: '錄下敵人執念話語並反向播放震懾心神（對【有台詞敵人】效果 ×2，非弱點 ×0.5）' },
  { id: 'street_lamp', name: '路燈',   effectName: '強光照亮讓隱身敵人現形',   targetType: 'stealth', targetLabel: '隱身敵人',   baseDmg: 35, desc: '點亮迴廊路燈破除黑影隱匿（對【隱身敵人】效果 ×2，非弱點 ×0.5）' },
  { id: 'camphor',     name: '樟腦丸', effectName: '驅蟲氣霧',                 targetType: 'insect',  targetLabel: '蟲類敵人',   baseDmg: 40, desc: '揮發強烈樟腦氣霧驅散蟲群（對【蟲類敵人】效果 ×2，非弱點 ×0.5）' },
  { id: 'ice_cube',    name: '冰塊',   effectName: '極寒冰凍敵人一回合',       targetType: 'fire',    targetLabel: '火屬性敵人', baseDmg: 36, desc: '投擲極寒冰晶凍結敵人行動一回合（對【火屬性敵人】效果 ×2，非弱點 ×0.5）' }
];

var V61_ENEMY_EXT = {
  film_swordsman:  { name: '竹林膠卷刀客', hp: 65, maxHp: 65, atk: 14, weaknessType: 'weapon',  weaknessItem: 'magnet',      weaknessLabel: '持武器敵人（弱點：磁鐵）',   desc: '手持 35mm 膠卷寒刃的武俠刀客（持武器敵人）。', svg: '<svg viewBox="0 0 100 100" fill="none" stroke="var(--accent-bright)"><path d="M20 38 L50 18 L80 38 Z" stroke-width="2" fill="rgba(201,169,110,.15)"/><circle cx="50" cy="48" r="12" stroke-width="1.8"/><path d="M30 85 Q50 62 70 85" stroke-width="2"/><line x1="18" y1="78" x2="84" y2="24" stroke="#ff6b6b" stroke-width="2.5"/></svg>' },
  midnight_lion:   { name: '荒原獨眼狂獅', hp: 80, maxHp: 80, atk: 16, weaknessType: 'fire',    weaknessItem: 'ice_cube',    weaknessLabel: '火屬性敵人（弱點：冰塊）',   desc: '鬃毛燃燒著墨火的午夜獅王（火屬性敵人）。', svg: '<svg viewBox="0 0 100 100" fill="none" stroke="var(--accent-bright)"><polygon points="50,12 65,24 82,42 74,68 50,86 26,68 18,42 35,24" stroke-width="2" fill="rgba(201,169,110,.12)"/><circle cx="40" cy="46" r="3" fill="#ff6b6b"/><line x1="56" y1="42" x2="64" y2="50" stroke="#ff6b6b" stroke-width="2"/><path d="M42 64 Q50 72 58 64" stroke-width="2"/></svg>' },
  corridor_shade:  { name: '迴廊墨影守衛', hp: 60, maxHp: 60, atk: 12, weaknessType: 'stealth', weaknessItem: 'street_lamp', weaknessLabel: '隱身敵人（弱點：路燈）',     desc: '隱匿於黑暗夾縫中的無形守衛（隱身敵人）。', svg: '<svg viewBox="0 0 100 100" fill="none" stroke="var(--accent-bright)"><path d="M28 84 C28 40 38 18 50 18 C62 18 72 40 72 84" stroke-width="2" fill="rgba(20,20,28,.8)"/><circle cx="43" cy="44" r="2.5" fill="var(--accent-bright)"/><circle cx="57" cy="44" r="2.5" fill="var(--accent-bright)"/></svg>' },
  clockwork_warden:{ name: '發條報時機械偶', hp: 70, maxHp: 70, atk: 15, weaknessType: 'mech',  weaknessItem: 'lighter',     weaknessLabel: '機械敵人（弱點：打火機）',   desc: '由生鏽齒輪與黃銅發條驅動的守衛（機械敵人）。', svg: '<svg viewBox="0 0 100 100" fill="none" stroke="var(--accent-bright)"><rect x="26" y="24" width="48" height="52" rx="6" stroke-width="2"/><circle cx="40" cy="44" r="5" stroke-width="2"/><circle cx="60" cy="44" r="5" stroke-width="2"/><line x1="36" y1="62" x2="64" y2="62" stroke-width="2"/></svg>' },
  abyss_drowner:   { name: '沉海迴聲水鬼', hp: 68, maxHp: 68, atk: 13, weaknessType: 'water',   weaknessItem: 'oxygen_tank', weaknessLabel: '水下敵人（弱點：氧氣瓶）',   desc: '潛伏在退潮積水中的深海殘影（水下敵人）。', svg: '<svg viewBox="0 0 100 100" fill="none" stroke="#38bdf8"><path d="M20 65 Q35 50 50 65 T80 65" stroke-width="2"/><circle cx="50" cy="40" r="14" stroke-width="2"/></svg>' },
  whisper_librarian:{name: '囈語借書巡查者', hp: 62, maxHp: 62, atk: 13, weaknessType: 'voiced', weaknessItem: 'recorder',    weaknessLabel: '有台詞敵人（弱點：錄音筆）', desc: '不斷重複借書規則台詞的巡查者（有台詞敵人）。', svg: '<svg viewBox="0 0 100 100" fill="none" stroke="var(--accent-bright)"><rect x="28" y="20" width="44" height="60" stroke-width="2"/><line x1="36" y1="36" x2="64" y2="36" stroke-width="2"/><line x1="36" y1="50" x2="64" y2="50" stroke-width="2"/></svg>' },
  bookworm_swarm:  { name: '蝕字書蠹蟲群', hp: 58, maxHp: 58, atk: 12, weaknessType: 'insect',  weaknessItem: 'camphor',     weaknessLabel: '蟲類敵人（弱點：樟腦丸）',   desc: '啃食舊病歷與古籍紙頁的墨色蟲群（蟲類敵人）。', svg: '<svg viewBox="0 0 100 100" fill="none" stroke="var(--accent-bright)"><circle cx="35" cy="40" r="8" stroke-width="2"/><circle cx="62" cy="45" r="9" stroke-width="2"/><circle cx="48" cy="64" r="8" stroke-width="2"/></svg>' }
};

function upgradeCombatForV61(){
  if(!window.V59) window.V59 = {};
  window.V61.COMBAT_ITEMS = V61_COMBAT_ITEMS;
  window.V61.ENEMIES = V61_ENEMY_EXT;

  window.V59.openCombatEncounter = function(enemyKey, onWin, onEscape){
    var baseEnemy = V61_ENEMY_EXT[enemyKey] || V61_ENEMY_EXT.corridor_shade;
    var isNg = localStorage.getItem('wuxian-ng-plus') === 'true';
    /* P1-7: 二周目敵人 HP ×1.5，攻擊力 ×1.3 */
    var hpScale = isNg ? 1.5 : 1.0;
    var atkScale = isNg ? 1.3 : 1.0;
    var enemy = {
      key: enemyKey || 'corridor_shade',
      name: baseEnemy.name + (isNg ? ' [NG+ 強化]' : ''),
      hp: Math.round(baseEnemy.hp * hpScale),
      maxHp: Math.round(baseEnemy.maxHp * hpScale),
      atk: Math.round(baseEnemy.atk * atkScale),
      weaknessType: baseEnemy.weaknessType,
      weaknessItem: baseEnemy.weaknessItem,
      weaknessLabel: baseEnemy.weaknessLabel,
      svg: baseEnemy.svg,
      desc: baseEnemy.desc,
      frozenTurns: 0
    };

    /* 週二每日規則：HP 固定 1（一刀死） */
    var activeRule = getActiveDailyRule();
    if(isDailyRuleEnforced() && activeRule.day === 2 && window.state){
      state.hp = 1;
      state.maxHp = 1;
      if(typeof updateHP === 'function') updateHP();
    }

    if(window.SETTINGS && SETTINGS.v59FastCombat){
      var fastDmg = Math.max(4, Math.round(enemy.atk * 0.5));
      if(typeof damage === 'function') damage(fastDmg);
      if(typeof unlockAchievement === 'function') unlockAchievement('ach_v59_first_combat');
      if(typeof addMemoryShards === 'function') addMemoryShards(1);
      if(typeof showToast === 'function') showToast('【快速戰鬥結算】擊敗「' + enemy.name + '」（耗損 ' + fastDmg + ' HP）');
      if(onWin) onWin();
      return;
    }

    var modal = document.getElementById('v59-combat-modal');
    if(!modal){
      modal = document.createElement('div');
      modal.id = 'v59-combat-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML =
        '<div class="modal-card v4-card wide">' +
          '<h3 id="v59-cb-title">遭 遇 戰 · 弱 點 與 道 具 對 決</h3>' +
          '<div class="v4-sub" id="v59-cb-sub"></div>' +
          '<div id="v61-cb-weakness-Tag" style="margin:.35rem 0;font-size:.76rem;color:var(--accent-bright);font-family:var(--font-mono)"></div>' +
          '<div class="v59-combat-stage">' +
            '<div class="v59-enemy-avatar" id="v59-cb-avatar"></div>' +
            '<div>' +
              '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:.25rem"><span id="v59-cb-ename"></span><span id="v59-cb-ehp"></span></div>' +
              '<div class="v4-bar"><i id="v59-cb-ebar" style="width:100%;background:var(--danger-bright)"></i></div>' +
              '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin:.6rem 0 .25rem"><span>陸衍（你的生命）</span><span id="v59-cb-php"></span></div>' +
              '<div class="v4-bar"><i id="v59-cb-pbar" style="width:100%"></i></div>' +
            '</div>' +
          '</div>' +
          '<div class="v59-combat-log" id="v59-cb-log"></div>' +
          '<div id="v61-cb-item-drawer" style="display:none;margin-top:.55rem;padding:.6rem;background:rgba(20,20,28,.9);border:1px solid var(--border);border-radius:5px"></div>' +
          '<div class="v4-actions" id="v59-cb-actions" style="margin-top:.8rem;flex-wrap:wrap;gap:.45rem"></div>' +
        '</div>';
      document.body.appendChild(modal);
    } else if(!document.getElementById('v61-cb-item-drawer')){
      var actBox = document.getElementById('v59-cb-actions');
      if(actBox){
        actBox.insertAdjacentHTML('beforebegin',
          '<div id="v61-cb-weakness-Tag" style="margin:.35rem 0;font-size:.76rem;color:var(--accent-bright);font-family:var(--font-mono)"></div>' +
          '<div id="v61-cb-item-drawer" style="display:none;margin-top:.55rem;padding:.6rem;background:rgba(20,20,28,.9);border:1px solid var(--border);border-radius:5px"></div>'
        );
      }
    }

    var logEl = document.getElementById('v59-cb-log');
    var actEl = document.getElementById('v59-cb-actions');
    var drawerEl = document.getElementById('v61-cb-item-drawer');
    var weakTagEl = document.getElementById('v61-cb-weakness-Tag');
    if(drawerEl) drawerEl.style.display = 'none';
    if(weakTagEl) weakTagEl.textContent = '◆ 敵人屬性與弱點標記：' + enemy.weaknessLabel + '（用對道具效果 ×2，用錯 ×0.5）';
    document.getElementById('v59-cb-avatar').innerHTML = enemy.svg;
    document.getElementById('v59-cb-sub').textContent = enemy.desc;
    logEl.innerHTML = '<div>【遭遇敵人】<strong>' + enemy.name + '</strong>（' + enemy.weaknessLabel + '）擋住了去路！請選擇應對策略（戰鬥／逃跑／說服／道具）：</div>';

    function syncBars(){
      var pHp = Math.max(0, Math.round((window.state && state.hp) || 100));
      var pMax = (window.state && state.maxHp) || 100;
      document.getElementById('v59-cb-ename').textContent = enemy.name;
      document.getElementById('v59-cb-ehp').textContent = enemy.hp + ' / ' + enemy.maxHp + ' HP';
      document.getElementById('v59-cb-ebar').style.width = Math.max(0, Math.round(enemy.hp / enemy.maxHp * 100)) + '%';
      document.getElementById('v59-cb-php').textContent = pHp + ' / ' + pMax + ' HP';
      document.getElementById('v59-cb-pbar').style.width = Math.max(0, Math.round(pHp / pMax * 100)) + '%';
    }

    function finishWin(msg, isKill){
      if(isKill) _killedAnyEnemyInRun = true;
      var wins = parseInt(localStorage.getItem('wuxian-v59-combat-wins') || '0', 10) + 1;
      localStorage.setItem('wuxian-v59-combat-wins', String(wins));
      if(typeof unlockAchievement === 'function') unlockAchievement('ach_v59_first_combat');
      if(typeof addMemoryShards === 'function') addMemoryShards(1);
      modal.classList.remove('show');
      if(typeof showToast === 'function') showToast(msg || ('戰鬥勝利！擊敗 ' + enemy.name));
      if(onWin) onWin();
    }

    function enemyCounterAttack(){
      if(enemy.frozenTurns > 0){
        enemy.frozenTurns--;
        logEl.innerHTML += '<div style="color:#7dd3fc">【冰凍效果】' + enemy.name + ' 被寒冰凍住，本回合無法攻擊！</div>';
        logEl.scrollTop = logEl.scrollHeight;
        syncBars();
        return;
      }
      var eDmg = Math.max(3, enemy.atk - Math.floor(Math.random() * 3));
      if(typeof damage === 'function') damage(eDmg);
      logEl.innerHTML += '<div>' + enemy.name + ' 反擊，你受到 <span style="color:var(--danger-bright)">' + eDmg + '</span> 點傷害。</div>';
      logEl.scrollTop = logEl.scrollHeight;
      syncBars();
      if(window.state && state.hp <= 0){ modal.classList.remove('show'); }
    }

    function useCombatItem(itemDef){
      /* 週三每日規則：不能使用道具 */
      var rule = getActiveDailyRule();
      if(isDailyRuleEnforced() && rule.day === 3){
        logEl.innerHTML += '<div style="color:var(--danger-bright)">【週三特殊規則：徒手】今日挑戰禁止使用任何道具！</div>';
        logEl.scrollTop = logEl.scrollHeight;
        return;
      }
      var isWeaknessMatch = (itemDef.id === enemy.weaknessItem || itemDef.targetType === enemy.weaknessType);
      var mult = isWeaknessMatch ? 2.0 : 0.5;
      var dmg = Math.round(itemDef.baseDmg * mult);

      if(itemDef.id === 'oxygen_tank' && window.state){
        var healAmt = Math.round(20 * mult);
        state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + healAmt);
        if(typeof updateHP === 'function') updateHP();
      }
      if(itemDef.id === 'magnet' && isWeaknessMatch){
        enemy.atk = Math.max(4, Math.round(enemy.atk * 0.5));
      }
      if(itemDef.id === 'recorder' && isWeaknessMatch){
        enemy.atk = Math.max(4, Math.round(enemy.atk * 0.5));
      }
      if(itemDef.id === 'ice_cube'){
        enemy.frozenTurns = isWeaknessMatch ? 2 : 1;
      }

      enemy.hp = Math.max(0, enemy.hp - dmg);
      var tagHtml = isWeaknessMatch
        ? '<span style="color:#f5df98;font-weight:700">【弱點克制 ×2！】</span>'
        : '<span style="color:#9ca3af">【非弱點減半 ×0.5】</span>';

      logEl.innerHTML += '<div>你使用道具<strong>「' + itemDef.name + '」</strong>（' + itemDef.effectName + '）' + tagHtml + '，對 <strong>' + enemy.name + '</strong> 造成 <span style="color:var(--accent-bright)">' + dmg + '</span> 點傷害！</div>';
      logEl.scrollTop = logEl.scrollHeight;
      syncBars();

      if(enemy.hp <= 0){
        finishWin('你運用弱點道具「' + itemDef.name + '」擊退了「' + enemy.name + '」！', false);
        return;
      }
      enemyCounterAttack();
    }

    function openItemPicker(){
      if(!drawerEl) return;
      var rule = getActiveDailyRule();
      if(isDailyRuleEnforced() && rule.day === 3){
        if(typeof showToast === 'function') showToast('【週三每日規則】今日禁止使用道具！');
        logEl.innerHTML += '<div style="color:var(--danger-bright)">【週三特殊規則：徒手】禁止使用任何道具！</div>';
        return;
      }
      drawerEl.style.display = 'block';
      var html = '<div style="font-size:.76rem;color:var(--accent);margin-bottom:.45rem">選擇戰鬥道具（用對敵人弱點效果 ×2，用錯效果 ×0.5）：</div>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:.4rem">';
      V61_COMBAT_ITEMS.forEach(function(it){
        var isMatch = (it.id === enemy.weaknessItem || it.targetType === enemy.weaknessType);
        html += '<button type="button" class="v4-btn' + (isMatch ? ' primary' : '') + '" data-citem="' + it.id + '" style="text-align:left;padding:.38rem .55rem;font-size:.74rem">' +
          '<div style="font-weight:600">' + it.name + (isMatch ? ' [弱點×2]' : ' [×0.5]') + '</div>' +
          '<div style="font-size:.66rem;opacity:.8">' + it.effectName + ' · 克制' + it.targetLabel + '</div>' +
        '</button>';
      });
      html += '</div>';
      drawerEl.innerHTML = html;
      drawerEl.querySelectorAll('[data-citem]').forEach(function(btn){
        btn.onclick = function(){
          var cid = btn.getAttribute('data-citem');
          var found = V61_COMBAT_ITEMS.filter(function(x){ return x.id === cid; })[0];
          if(found) useCombatItem(found);
        };
      });
    }

    function renderTurnActions(){
      syncBars();
      actEl.innerHTML =
        '<button type="button" class="v4-btn primary" id="v59-act-atk">攻擊（正面交鋒）</button>' +
        '<button type="button" class="v4-btn" id="v59-act-def">防禦（格擋反震）</button>' +
        '<button type="button" class="v4-btn primary" id="v59-act-item" style="border-color:#38bdf8;color:#7dd3fc">道具（7種弱點道具）</button>' +
        '<button type="button" class="v4-btn" id="v59-act-flee">逃跑</button>';

      document.getElementById('v59-act-atk').onclick = function(){
        var dmgToE = 24 + Math.floor(Math.random() * 8);
        enemy.hp = Math.max(0, enemy.hp - dmgToE);
        logEl.innerHTML += '<div>你發動攻擊，對 <strong>' + enemy.name + '</strong> 造成 <span style="color:var(--accent-bright)">' + dmgToE + '</span> 點傷害！</div>';
        if(enemy.hp <= 0){ finishWin('你正面擊敗了「' + enemy.name + '」！', true); return; }
        enemyCounterAttack();
      };
      document.getElementById('v59-act-def').onclick = function(){
        var counter = 14;
        enemy.hp = Math.max(0, enemy.hp - counter);
        var eDmg = Math.max(2, Math.round(enemy.atk * 0.3));
        if(typeof damage === 'function') damage(eDmg);
        logEl.innerHTML += '<div>你採取守勢格擋，僅受 ' + eDmg + ' 點輕傷並反震敵人 ' + counter + ' 點傷害。</div>';
        if(enemy.hp <= 0){ finishWin('你在防守反擊中擊敗了「' + enemy.name + '」！', true); return; }
        syncBars();
      };
      document.getElementById('v59-act-item').onclick = function(){
        openItemPicker();
      };
      document.getElementById('v59-act-flee').onclick = function(){
        modal.classList.remove('show');
        if(typeof showToast === 'function') showToast('你利用地形掩護脫離了戰鬥');
        if(onEscape) onEscape();
      };
    }

    /* P4-9: 初始戰鬥選單四選一（戰鬥／逃跑／說服／道具） */
    syncBars();
    actEl.innerHTML =
      '<button type="button" class="v4-btn primary" id="v59-init-fight">【戰鬥】拔刀迎戰</button>' +
      '<button type="button" class="v4-btn" id="v59-init-flee">【逃跑】立刻脫離</button>' +
      '<button type="button" class="v4-btn" id="v59-init-persuade">【說服】以邏輯說服</button>' +
      '<button type="button" class="v4-btn primary" id="v61-init-item" style="border-color:#38bdf8;color:#7dd3fc">【道具】使用弱點道具</button>';

    document.getElementById('v59-init-fight').onclick = function(){
      logEl.innerHTML += '<div style="color:var(--accent-bright)">你握緊武器踏前一步，回合制戰鬥正式開始！</div>';
      renderTurnActions();
    };
    document.getElementById('v59-init-flee').onclick = function(){
      if(typeof damage === 'function') damage(5);
      modal.classList.remove('show');
      if(typeof showToast === 'function') showToast('你憑藉敏捷身手逃離了遭遇戰（擦傷 -5 HP）');
      if(onEscape) onEscape();
    };
    document.getElementById('v59-init-persuade').onclick = function(){
      var calm = (window.state && state.personality && state.personality.calm) || 50;
      if(calm >= 40 || (window.state && state.inventory && state.inventory.length >= 1)){
        finishWin('【說服成功】你洞悉了「' + enemy.name + '」的規則執念，不戰而屈人之兵！', false);
      } else {
        logEl.innerHTML += '<div style="color:var(--danger-bright)">說服未果，進入回合制戰鬥！</div>';
        renderTurnActions();
      }
    };
    document.getElementById('v61-init-item').onclick = function(){
      renderTurnActions();
      openItemPicker();
    };

    modal.classList.add('show');
  };
}

/* ============================================================
 * 8. P5: 每日挑戰特殊規則（週一至週日 7 種規則與稱號解鎖）
 * ============================================================ */
var V61_DAILY_RULES = {
  1: { day: 1, dayName: '週一', name: '只能選左邊選項',     desc: '所有擁有多個選項的場景中，僅開放第一個（最左/最上）選項', titleId: 't_v61_left_person',  titleName: '左邊之人',   lsKey: 'wuxian-v61-title-left' },
  2: { day: 2, dayName: '週二', name: 'HP 固定 1（一刀死）', desc: '生命值上限與當前 HP 固定為 1 點，承受任何傷害即刻倒下',   titleId: 't_v61_glass_heart',  titleName: '玻璃心',     lsKey: 'wuxian-v61-title-glass' },
  3: { day: 3, dayName: '週三', name: '不能使用道具',       desc: '全程禁止在物品欄與遭遇戰中使用任何道具',                 titleId: 't_v61_bare_hands',   titleName: '徒手',       lsKey: 'wuxian-v61-title-bare' },
  4: { day: 4, dayName: '週四', name: 'NPC 好感度開場隨機', desc: '踏入門扉時所有 NPC 好感度在 10–100 之間隨機洗牌',        titleId: 't_v61_random_fate',  titleName: '命運逢源',   lsKey: 'wuxian-v61-title-rand' },
  5: { day: 5, dayName: '週五', name: '謎題時間限 30 秒',   desc: '所有密碼鎖與機關謎題開啟 30 秒急速倒數限制',             titleId: 't_v61_speed_solver', titleName: '極速破譯者', lsKey: 'wuxian-v61-title-speed' },
  6: { day: 6, dayName: '週六', name: '雙倍壓力值增長',     desc: '黑暗與恐怖事件造成的壓力值增長幅度 ×2',                  titleId: 't_v61_high_pressure',titleName: '抗壓行者',   lsKey: 'wuxian-v61-title-stress' },
  0: { day: 0, dayName: '週日', name: '隨機規則',           desc: '隨機套用週一至週六其中一項特殊規則，通關享雙倍記憶碎片', titleId: 't_v61_sunday_rover', titleName: '週日漫遊者', lsKey: 'wuxian-v61-title-sun' }
};

function getActiveDailyRule(){
  var overrideDay = localStorage.getItem(LS_DAILY_ACTIVE_RULE);
  var d = (overrideDay !== null && overrideDay !== '' && !isNaN(parseInt(overrideDay, 10)))
    ? parseInt(overrideDay, 10)
    : (new Date().getDay());
  return V61_DAILY_RULES[d] || V61_DAILY_RULES[1];
}

function isDailyRuleEnforced(){
  return !!(window._inDailyChallenge || localStorage.getItem(LS_DAILY_ACTIVE_RULE) !== null);
}
window.V61.isDailyRuleEnforced = isDailyRuleEnforced;

function setDailyRuleOverride(dayNum){
  if(dayNum === null || dayNum === undefined || dayNum === 'auto'){
    localStorage.removeItem(LS_DAILY_ACTIVE_RULE);
  } else {
    localStorage.setItem(LS_DAILY_ACTIVE_RULE, String(dayNum));
  }
  var r = getActiveDailyRule();
  if(r.day === 2 && window.state){
    state.hp = 1; state.maxHp = 1;
    if(typeof updateHP === 'function') updateHP();
  }
  if(r.day === 4){
    try{
      var aff = JSON.parse(localStorage.getItem('wuxian-v58-affinity') || '{}');
      Object.keys(aff).forEach(function(k){ aff[k] = 15 + Math.floor(Math.random() * 85); });
      localStorage.setItem('wuxian-v58-affinity', JSON.stringify(aff));
    }catch(e){}
  }
  return r;
}

function completeActiveDailyChallenge(){
  var r = getActiveDailyRule();
  if(r && r.lsKey){
    localStorage.setItem(r.lsKey, 'true');
  }
  var streak = parseInt(localStorage.getItem('wuxian-v59-streak') || '1', 10) + 1;
  localStorage.setItem('wuxian-v59-streak', String(streak));
  checkV61DynamicAchievements();
  if(typeof showToast === 'function'){
    showToast('已完成【' + r.dayName + '特殊規則：' + r.name + '】，解鎖專屬稱號「' + r.titleName + '」！');
  }
}

window.V61.DAILY_RULES = V61_DAILY_RULES;
window.V61.getActiveDailyRule = getActiveDailyRule;
window.V61.setDailyRuleOverride = setDailyRuleOverride;
window.V61.completeActiveDailyChallenge = completeActiveDailyChallenge;

/* ============================================================
 * 9. P7-14: 音樂廳升級（循環播放、停止、在遊戲中持續播放、每首曲子介紹文字）
 * ============================================================ */
var _musicLoopEnabled = true;
var _musicPersistInGame = false;
var _musicStopped = false;

var MUSIC_TRACK_LORE = {
  '1': '【曲目介紹】以質數節拍（5/4 與 7/8 拍）交錯編織的懸疑鋼琴與低音提琴，描繪凌晨三點質數旅館長廊中鏡像與真人的博弈。',
  '2': '【曲目介紹】採用極簡主義泛音與紙頁摩擦採樣，在近乎無聲的休止符之間傳遞沉默圖書館萬冊人生書頁的呼吸。',
  '3': '【曲目介紹】融合急診室心電監護儀規律脈衝與秒針滴答聲，隨倒計時推進逐步疊加弦樂張力。',
  '4': '【曲目介紹】空靈的玻璃豎琴與溫暖低頻共鳴，重現無盡之間三扇舊門前守門人無火提燈的微光。',
  '5-calm': '【曲目介紹】深海大提琴與緩慢漲退的潮汐白噪音，陪伴旅人在收容未選之路的迴光之海中靜心潛行。',
  '6-obs': '【曲目介紹】水晶鐘擺與電子合成波段交織，凝結 03:17 與 03:18 之間那一秒鐘的宇宙觀測回聲。',
  '6-dawn': '【曲目介紹】大調五度交響鋼琴與破曉弦樂，象徵衝破時間循環後落在實驗室窗台的第一縷陽光。',
  '10-cinema-main': '【曲目介紹】老式 35mm 膠卷放映機轉動聲配搭復古弦樂四重奏，重現潮汐電影院午夜開演的懷舊氛圍。',
  '11-zoo-night': '【曲目介紹】午夜森林夜曲、遠處鐘樓報時與溫柔木管，記錄 23:00 閉園後動物們對童年旅人的記憶。',
  'v59-combat': '【曲目介紹】緊湊的墨刃打擊樂與疾走低音，專為迴廊遭遇戰與弱點道具對決譜寫的快節奏戰曲。',
  'v59-end-true': '【曲目介紹】萬門破曉終章聖詠，以雙鋼琴與溫暖和弦收束十二道門扉的漫長歸途。'
};

function upgradeMusicHallForV61(){
  /* 包裝 v4StartBGM：若開啟「在遊戲中持續播放」，踏入門扉不強制覆蓋點唱機曲目；若已按下停止則不自動重開 */
  if(typeof window.v4StartBGM === 'function' && !window.v4StartBGM.__v61){
    var _origStartBGM = window.v4StartBGM;
    window.v4StartBGM = function(fromJukebox){
      if(_musicStopped && !fromJukebox) return;
      if(fromJukebox) _musicStopped = false;
      return _origStartBGM.apply(this, arguments);
    };
    window.v4StartBGM.__v61 = true;
  }

  /* 包裝 stopAmbient / backToHub：若勾選「在遊戲中持續播放」，退出音樂廳或切換畫面時保持 BGM 繼續 */
  if(typeof window.stopAmbient === 'function' && !window.stopAmbient.__v61){
    var _origStopAmb = window.stopAmbient;
    window.stopAmbient = function(){
      if(_musicPersistInGame && !_musicStopped) return;
      return _origStopAmb.apply(this, arguments);
    };
    window.stopAmbient.__v61 = true;
  }

  /* 升級畫廊「音樂廳 (music)」分頁渲染 */
  var _prevRenderGallery = window.renderGallery;
  window.renderGallery = function(){
    var tab = window.galleryState && galleryState.tab;
    var body = document.getElementById('gallery-body');
    if(body && tab === 'scenes'){
      var gDid = (window.galleryState && galleryState.dungeon) || 1;
      ensureDungeonLoaded(gDid);
    }
    if(body && tab === 'music'){
      var themes = (window.V4Audio && V4Audio.themes) ? V4Audio.themes : {};
      var curTheme = (window.SETTINGS && SETTINGS.jukeboxTheme) || '1';
      var ctrlHtml =
        '<div class="v61-music-controls" id="v61-music-hall-controls">' +
          '<div style="display:flex;align-items:center;gap:.45rem;flex-wrap:wrap">' +
            '<button type="button" class="v4-btn' + (_musicLoopEnabled ? ' primary' : '') + '" id="v61-music-loop-btn">' +
              '循環播放：' + (_musicLoopEnabled ? '開 ✓' : '關') +
            '</button>' +
            '<button type="button" class="v4-btn" id="v61-music-stop-btn" style="border-color:var(--danger);color:#fca5a5">' +
              '停止播放' +
            '</button>' +
          '</div>' +
          '<label style="display:inline-flex;align-items:center;gap:.4rem;font-size:.78rem;color:var(--accent-bright);cursor:pointer">' +
            '<input type="checkbox" id="v61-music-persist-chk" ' + (_musicPersistInGame ? 'checked' : '') + '>' +
            '<span>在遊戲中持續播放（退出音樂廳後 BGM 繼續）</span>' +
          '</label>' +
        '</div>';

      var tracksHtml = Object.keys(themes).map(function(k){
        var th = themes[k];
        var lore = MUSIC_TRACK_LORE[k] || ('【曲目介紹】' + (th.sub || '無盡迴廊原創合成器環境配樂，隨場景情緒與和弦動態流轉。'));
        var isPlaying = (!_musicStopped && curTheme === k);
        return '<div class="gallery-cell unlocked' + (isPlaying ? ' active' : '') + '" data-mtrack="' + k + '" style="cursor:pointer;text-align:left;border-color:' + (isPlaying ? '#d4af37' : 'var(--border)') + '">' +
          '<div class="gc-name" style="display:flex;justify-content:space-between;align-items:center">' +
            '<span>' + th.name + '</span>' +
            '<span style="font-size:.7rem;color:var(--accent-bright)">' + (isPlaying ? '播放中 ✓' : '點擊播放') + '</span>' +
          '</div>' +
          '<div class="gc-type">' + (th.sub || '迴廊主題配樂') + '</div>' +
          '<div class="v61-music-lore">' + lore + '</div>' +
        '</div>';
      }).join('');

      body.innerHTML = ctrlHtml + tracksHtml;

      var loopBtn = document.getElementById('v61-music-loop-btn');
      if(loopBtn){
        loopBtn.onclick = function(){
          _musicLoopEnabled = !_musicLoopEnabled;
          if(window.SETTINGS) SETTINGS.musicLoop = _musicLoopEnabled;
          if(typeof showToast === 'function') showToast(_musicLoopEnabled ? '已開啟音樂廳「循環播放」' : '已關閉「循環播放」');
          window.renderGallery();
        };
      }
      var stopBtn = document.getElementById('v61-music-stop-btn');
      if(stopBtn){
        stopBtn.onclick = function(){
          _musicStopped = true;
          if(typeof window.v4StopBGM === 'function') window.v4StopBGM();
          else if(window.V4Audio && typeof V4Audio.stop === 'function') V4Audio.stop();
          if(typeof showToast === 'function') showToast('已停止音樂播放');
          window.renderGallery();
        };
      }
      var persistChk = document.getElementById('v61-music-persist-chk');
      if(persistChk){
        persistChk.onchange = function(){
          _musicPersistInGame = !!persistChk.checked;
          if(window.SETTINGS) SETTINGS.v61MusicPersist = _musicPersistInGame;
          if(typeof showToast === 'function'){
            showToast(_musicPersistInGame ? '已開啟「在遊戲中持續播放」：退出音樂廳後 BGM 將繼續播放' : '已關閉「在遊戲中持續播放」');
          }
        };
      }
      body.querySelectorAll('[data-mtrack]').forEach(function(cell){
        cell.onclick = function(){
          var k = cell.getAttribute('data-mtrack');
          _musicStopped = false;
          if(window.SETTINGS) SETTINGS.jukeboxTheme = k;
          if(typeof window.v4StartBGM === 'function') window.v4StartBGM(true);
          if(typeof showToast === 'function' && themes[k]) showToast('正在播放：' + themes[k].name);
          window.renderGallery();
        };
      });
      return;
    }
    return _prevRenderGallery ? _prevRenderGallery.apply(this, arguments) : null;
  };
}

/* ============================================================
 * 10. P7-15: 橫屏模式升級（左插畫右文字可拖曳 4:6 [3:7~5:5]、左右滑翻頁、雙指點擊打開筆記）
 * ============================================================ */
var _splitLeftPercent = 40; /* 預設 4:6 (40% : 60%)，可調範圍 30% (3:7) ~ 50% (5:5) */

function applyLandscapeSplitRatio(pct){
  var clamped = Math.max(30, Math.min(50, Math.round(pct)));
  _splitLeftPercent = clamped;
  var rightPct = 100 - clamped;
  var gs = document.getElementById('game-screen');
  if(gs){
    gs.style.setProperty('--v61-left-ratio', clamped + '%');
    gs.style.setProperty('--v61-right-ratio', rightPct + '%');
  }
  var artWrap = document.getElementById('v58-scene-art-wrap');
  var narr = document.getElementById('narrative');
  if(document.body.classList.contains('v59-landscape-split')){
    if(artWrap) artWrap.style.flexBasis = clamped + '%';
    if(narr) narr.style.flexBasis = rightPct + '%';
  } else {
    if(artWrap) artWrap.style.flexBasis = '';
    if(narr) narr.style.flexBasis = '';
  }
  var pill = document.getElementById('v61-split-ratio-pill');
  if(pill){
    var lDigit = Math.round(clamped / 10);
    pill.textContent = lDigit + ':' + (10 - lDigit) + ' (' + clamped + '%:' + rightPct + '%)';
  }
}

function setupLandscapeDraggableAndGestures(){
  var gs = document.getElementById('game-screen');
  if(gs && !document.getElementById('v61-split-resizer')){
    var resizer = document.createElement('div');
    resizer.id = 'v61-split-resizer';
    resizer.title = '拖曳調整左插畫與右文字比例（預設 4:6，可調 3:7 至 5:5）';
    resizer.innerHTML = '<span id="v61-split-ratio-pill">4:6 (40%:60%)</span>';
    gs.appendChild(resizer);

    var dragging = false;
    function onMove(clientX){
      if(!dragging) return;
      var w = window.innerWidth || document.documentElement.clientWidth || 1000;
      var pct = (clientX / w) * 100;
      applyLandscapeSplitRatio(pct);
    }
    resizer.addEventListener('mousedown', function(e){
      dragging = true;
      resizer.classList.add('dragging');
      e.preventDefault();
    });
    window.addEventListener('mousemove', function(e){
      if(dragging) onMove(e.clientX);
    });
    window.addEventListener('mouseup', function(){
      if(dragging){
        dragging = false;
        resizer.classList.remove('dragging');
      }
    });
    resizer.addEventListener('touchstart', function(e){
      if(e.touches && e.touches.length === 1){
        dragging = true;
        resizer.classList.add('dragging');
      }
    }, {passive: true});
    window.addEventListener('touchmove', function(e){
      if(dragging && e.touches && e.touches.length === 1){
        onMove(e.touches[0].clientX);
      }
    }, {passive: true});
    window.addEventListener('touchend', function(){
      if(dragging){
        dragging = false;
        resizer.classList.remove('dragging');
      }
    }, {passive: true});
  }

  /* v6.2 P3-13: 雙指點擊開筆記在手機上常誤觸，改成長按 0.5 秒（500ms）才觸發 */
  if(!document.body.__v61TwoFingerNotes){
    var _lpTimer = null;
    var _lpStartX = 0;
    var _lpStartY = 0;
    document.body.addEventListener('touchstart', function(e){
      if(_lpTimer){ clearTimeout(_lpTimer); _lpTimer = null; }
      if(!e.touches || e.touches.length === 0) return;
      var t0 = e.touches[0];
      var target = e.target;
      if(target && target.closest && target.closest('button, a, input, textarea, select, #v61-split-resizer')) return;
      _lpStartX = t0.clientX;
      _lpStartY = t0.clientY;
      _lpTimer = setTimeout(function(){
        _lpTimer = null;
        if(typeof window.openNotebook === 'function'){
          window.openNotebook();
        } else if(typeof window.openNotes === 'function'){
          window.openNotes();
        }
        if(typeof showToast === 'function') showToast('【長按 0.5 秒手勢】已開啟筆記本');
      }, 500);
    }, {passive: true});
    document.body.addEventListener('touchmove', function(e){
      if(!_lpTimer || !e.touches || e.touches.length === 0) return;
      var dx = Math.abs(e.touches[0].clientX - _lpStartX);
      var dy = Math.abs(e.touches[0].clientY - _lpStartY);
      if(dx > 12 || dy > 12){
        clearTimeout(_lpTimer);
        _lpTimer = null;
      }
    }, {passive: true});
    document.body.addEventListener('touchend', function(){
      if(_lpTimer){ clearTimeout(_lpTimer); _lpTimer = null; }
    }, {passive: true});
    document.body.addEventListener('touchcancel', function(){
      if(_lpTimer){ clearTimeout(_lpTimer); _lpTimer = null; }
    }, {passive: true});
    document.body.__v61TwoFingerNotes = true;
  }

  applyLandscapeSplitRatio(40);
}

window.V61.setLandscapeSplitRatio = applyLandscapeSplitRatio;
window.V61.getLandscapeSplitRatio = function(){ return _splitLeftPercent; };

/* ============================================================
 * 11. P0 核心 UI 覆寫：主選單兩層分區、卡片三態、腦圖三態、防連點鎖
 * ============================================================ */
var _enterDungeonLock = false;

function upgradeHubAndMindmapForV61(){
  /* P8-17: 防止快速連點卡片同時觸發兩扇門 & P7-12: 踏入門扉時才懶載入該門扉 */
  if(typeof window.enterDungeon === 'function' && !window.enterDungeon.__v61){
    var _origEnter = window.enterDungeon;
    window.enterDungeon = function(id, autoStart, forceBypassLock){
      if(_enterDungeonLock && !forceBypassLock) return;
      var dispState = getDungeonDisplayState(id);
      if(dispState === 'hidden' && !window._gmUnlocked){
        showMysteryLockModal(id, false);
        return;
      }
      _enterDungeonLock = true;
      setTimeout(function(){ _enterDungeonLock = false; }, 450);

      _killedAnyEnemyInRun = false;
      ensureDungeonLoaded(id);

      var r = _origEnter.apply(this, arguments);

      /* P5: 套用當前每日挑戰特殊規則 */
      var rule = getActiveDailyRule();
      if(isDailyRuleEnforced() && rule.day === 2 && window.state){
        state.hp = 1; state.maxHp = 1;
        if(typeof updateHP === 'function') updateHP();
      }
      /* P8-17: 電車撿票根 → 進自助餐 (id===8) 自動觸發老闆認出票根的對話 */
      if(parseInt(id, 10) === 8 && window.state){
        var hasStub = (window.V60 && V60.hasSideRelic && V60.hasSideRelic('tram_stub')) || (typeof hasItem === 'function' && hasItem('v60_tram_stub')) || isCleared(7);
        if(hasStub && !state.flags._v61_auto_stub_greeted){
          state.flags._v61_auto_stub_greeted = true;
          setTimeout(function(){
            if(typeof appendNarrative === 'function'){
              appendNarrative('<p class="inherit-note">【支線信物自動觸發 · 鏡像電車票根】餐廳老闆一眼認出了你口袋裡的電車票根：「這不是鏡像電車的車票嗎？歡迎光臨！憑這張票根，你可以免費點一道主廚私房隱藏菜（回復全部 HP）！」</p>');
            }
          }, 350);
        }
      }
      return r;
    };
    window.enterDungeon.__v61 = true;
  }

  /* 包裝 enterDungeonFromHub：若點擊的是？？？卡片，彈出無劇透鎖頭視窗 */
  window.enterDungeonFromHub = function(){
    var d = dungeons[currentIndex];
    if(!d) return;
    var st = getDungeonDisplayState(d.id);
    if(st === 'hidden'){
      showMysteryLockModal(d.id, false);
      return;
    }
    window.enterDungeon(d.id, true);
  };

  /* 包裝 showPreview：若當前是？？？卡片，絕不透露門扉名與介紹，只顯示鎖頭 + 走完第 X 扇門解鎖 */
  if(typeof window.showPreview === 'function' && !window.showPreview.__v61){
    var _origPreview = window.showPreview;
    window.showPreview = function(){
      var d = dungeons[currentIndex] || dungeons[0];
      if(!d) return;
      if(getDungeonDisplayState(d.id) === 'hidden'){
        showMysteryLockModal(d.id, false);
        return;
      }
      return _origPreview.apply(this, arguments);
    };
    window.showPreview.__v61 = true;
  }

  /* 包裝 V4.markDungeonCleared：記錄新解鎖的下一扇門 ID 以供回到主選單時播放揭曉動畫，並確保主線第 6 扇門不被支線重置 */
  if(window.V4 && typeof V4.markDungeonCleared === 'function' && !V4.markDungeonCleared.__v61){
    var _origMarkCleared = V4.markDungeonCleared;
    V4.markDungeonCleared = function(id){
      var numId = parseInt(id, 10);
      var nextId = numId + 1;
      var wasNextCleared = (nextId <= 11) ? isCleared(nextId) : false;
      var r = _origMarkCleared.apply(this, arguments);
      if(CLEAR_KEYS_MAP[numId]){
        try{ localStorage.setItem(CLEAR_KEYS_MAP[numId], 'true'); }catch(e){}
      }
      /* P8-17: 支線通關時確保主線第 6 扇門保持已通關 */
      if(numId >= 7 && numId <= 11){
        try{ localStorage.setItem(CLEAR_KEYS_MAP[6], 'true'); }catch(e){}
      }
      if(numId === 6){
        try{ localStorage.setItem('wuxian-d6-true-cleared', 'true'); }catch(e){}
      }
      /* 和平主義者成就：不殺任何敵人通關 */
      if(!_killedAnyEnemyInRun && typeof unlockAchievement === 'function'){
        unlockAchievement('ach_v61_pacifist');
      }
      /* 若為 New Game+ 通關，解鎖命運織者成就 */
      if(localStorage.getItem('wuxian-ng-plus') === 'true' && typeof unlockAchievement === 'function'){
        unlockAchievement('ach_v61_fate_weaver');
      }
      /* 設定回到主選單時要播放揭曉動畫的下一扇門 */
      if(numId >= 1 && numId <= 10 && !wasNextCleared){
        _pendingRevealDungeonId = nextId;
      } else if(numId === 6 && localStorage.getItem('wuxian-ng-plus') === 'true'){
        _pendingRevealDungeonId = 7;
      }
      syncSaveV3Snapshot();
      checkV61DynamicAchievements();
      return r;
    };
    V4.markDungeonCleared.__v61 = true;
  }

  /* 包裝 backToHub：回到主選單時若有新解鎖門扉，自動播放 P0-3 揭曉動畫 */
  if(typeof window.backToHub === 'function' && !window.backToHub.__v61){
    var _origBackToHub = window.backToHub;
    window.backToHub = function(){
      var r = _origBackToHub.apply(this, arguments);
      if(_pendingRevealDungeonId){
        var revId = _pendingRevealDungeonId;
        _pendingRevealDungeonId = null;
        var targetCorridor = (revId >= 7 && revId <= 11) ? 'side' : 'main';
        if(window.V60 && typeof V60.openCorridorLayer2 === 'function'){
          V60.openCorridorLayer2(targetCorridor, revId);
        }
        setTimeout(function(){
          playRevealAnimation(revId);
        }, 120);
      }
      return r;
    };
    window.backToHub.__v61 = true;
  }

  /* 綁定點擊第二層 .dungeon-card（若為？？？狀態點擊卡片即彈出鎖頭提示） */
  var cardEl = document.querySelector('#hub-screen .dungeon-card');
  if(cardEl && !cardEl.__v61ClickBound){
    cardEl.addEventListener('click', function(e){
      if(e.target && e.target.closest('button')) return;
      var d = dungeons[currentIndex];
      if(d && getDungeonDisplayState(d.id) === 'hidden'){
        showMysteryLockModal(d.id, false);
      }
    });
    cardEl.__v61ClickBound = true;
  }

  /* 升級 V60.openCorridorLayer2：若主線第 6 扇門尚未通關，點擊支線迴廊大卡片只彈出「打完主線解鎖」鎖頭視窗 */
  if(window.V60 && typeof V60.openCorridorLayer2 === 'function' && !V60.openCorridorLayer2.__v61){
    var _origOpenL2 = V60.openCorridorLayer2;
    V60.openCorridorLayer2 = function(corridor, targetDungeonId){
      var c6 = isCleared(6) || !!window._gmUnlocked;
      if(corridor === 'side' && !c6){
        showMysteryLockModal(7, true);
        return;
      }
      if(targetDungeonId && getDungeonDisplayState(targetDungeonId) === 'hidden'){
        _origOpenL2.call(this, corridor, targetDungeonId);
        showMysteryLockModal(targetDungeonId, false);
        return;
      }
      return _origOpenL2.apply(this, arguments);
    };
    V60.openCorridorLayer2.__v61 = true;
  }

  /* 建立主選單頂部 New Game+ 金色按鈕與匯出/匯入 v3 快捷入口 */
  function ensureHubNgPlusButton(){
    var hubTopRight = document.querySelector('#hub-screen .hub-top-right') || document.querySelector('#hub-screen .hub-header');
    if(hubTopRight && !document.getElementById('v61-ngplus-btn')){
      var ngBtn = document.createElement('button');
      ngBtn.type = 'button';
      ngBtn.id = 'v61-ngplus-btn';
      ngBtn.innerHTML = SVG_NGPLUS_STAR + ' <span>New Game+</span>';
      ngBtn.onclick = function(e){
        e.stopPropagation();
        openNgPlusModal();
      };
      hubTopRight.insertBefore(ngBtn, hubTopRight.firstChild);
    }
    var btn = document.getElementById('v61-ngplus-btn');
    if(btn){
      btn.classList.toggle('unlocked', isNgPlusUnlocked());
    }
  }

  /* 渲染第一層總覽 (#v60-hub-layer1)：嚴格執行 P0 三種狀態與支線「打完主線解鎖」單張大卡片規則 */
  function renderV61Layer1(){
    var l1 = document.getElementById('v60-hub-layer1');
    if(!l1) return;

    var mainIds = MAIN_CORRIDOR_IDS.slice();
    if(localStorage.getItem('wuxian-ng-plus') === 'true' || isCleared(12) || isCleared(13) || window._gmUnlocked){
      if(mainIds.indexOf(12) === -1) mainIds.push(12);
      if(mainIds.indexOf(13) === -1) mainIds.push(13);
    }
    var mainCleared = MAIN_CORRIDOR_IDS.filter(function(id){ return isCleared(id); }).length;
    var sideCleared = SIDE_CORRIDOR_IDS.filter(function(id){ return isCleared(id); }).length;
    var c6Cleared = isCleared(6) || !!window._gmUnlocked;

    function buildCorridorRowsHtml(ids, corType){
      return '<div class="v61-corridor-list">' + ids.map(function(id){
        var d = (window.dungeons || []).filter(function(x){ return x.id === id; })[0];
        if(!d) return '';
        var st = getDungeonDisplayState(id);
        var tag = SHORT_TAGLINES[id] || d.tagline || '';
        if(st === 'cleared'){
          return '<div class="v61-corridor-row state-cleared" data-did="' + id + '" onclick="event.stopPropagation();V60.openCorridorLayer2(\'' + corType + '\',' + id + ')">' +
            '<div class="v61-row-left">' +
              SVG_CHECK_V61 +
              '<span class="v61-row-name">✓ ' + tr(d.name) + '</span>' +
              '<span class="v61-row-sep">—</span>' +
              '<span class="v61-row-tag">' + tr(tag) + '</span>' +
            '</div>' +
          '</div>';
        } else if(st === 'next'){
          return '<div class="v61-corridor-row state-next" data-did="' + id + '" onclick="event.stopPropagation();V60.openCorridorLayer2(\'' + corType + '\',' + id + ')">' +
            '<div class="v61-row-left">' +
              SVG_NODE_GLOW +
              '<span class="v61-row-name">' + tr(d.name) + '</span>' +
              '<span class="v61-row-sep">—</span>' +
              '<span class="v61-row-tag">' + tr(tag) + '</span>' +
            '</div>' +
          '</div>';
        } else {
          /* 還沒到：只顯示鎖頭 + ？？？，絕不顯示 tagline 或門扉名 */
          return '<div class="v61-corridor-row state-hidden" data-did="' + id + '" onclick="event.stopPropagation();V61.showMysteryLockModal(' + id + ',false)">' +
            '<div class="v61-row-left">' +
              SVG_LOCK_V61 +
              '<span class="v61-row-name v61-mystery-text">？？？</span>' +
            '</div>' +
            '<span style="font-size:.68rem;color:#6e6d78">' + tr('打完第 ' + (id - 1) + ' 扇門解鎖') + '</span>' +
          '</div>';
        }
      }).join('') + '</div>';
    }

    var mainRowsHtml = buildCorridorRowsHtml(mainIds, 'main');

    var sideNodeHtml = '';
    if(!c6Cleared){
      /* P0-1: 走完第 6 扇門前，整個支線迴廊顯示為一張大卡片：「打完主線解鎖」，不顯示任何支線名稱 */
      sideNodeHtml =
        '<div class="v60-corridor-node side-corridor v61-side-locked-all" id="v60-node-side" onclick="V61.showMysteryLockModal(7,true)" role="button" tabindex="0">' +
          '<div class="v61-side-locked-center">' +
            SVG_LOCK_LARGE_V61 +
            '<div class="v61-side-locked-title">' + tr('打完主線解鎖') + '</div>' +
            '<div class="v61-side-locked-sub">' + SVG_LOCK_V61 + ' ' + tr('走完第 6 扇門解鎖') + '</div>' +
          '</div>' +
        '</div>';
    } else {
      var sideRowsHtml = buildCorridorRowsHtml(SIDE_CORRIDOR_IDS, 'side');
      sideNodeHtml =
        '<div class="v60-corridor-node side-corridor" id="v60-node-side" onclick="V60.openCorridorLayer2(\'side\')" role="button" tabindex="0">' +
          '<div>' +
            '<div class="v60-node-top">' +
              '<span class="v60-node-badge">' + tr('第一層節點 II · 藍色冷調') + '</span>' +
              '<span class="v60-node-badge">' + SVG_CHECK_V61 + ' ' + tr('進度') + ' ' + sideCleared + ' / 5</span>' +
            '</div>' +
            '<div class="v60-node-title-row">' +
              '<div class="v60-node-title">' + tr('支線迴廊') + '</div>' +
            '</div>' +
            '<div class="v60-node-desc">' + tr('第 6 扇門走過後開啟的歸途支線（7 → 8 → 9 → 10 → 11 依序解鎖推進）。') + '</div>' +
            sideRowsHtml +
          '</div>' +
          '<div class="v60-node-footer">' +
            '<span class="v60-node-unlock-hint">' + SVG_CHECK_V61 + ' <span>' + tr('第 6 扇門已走過 · 歸途支線已開啟') + '</span></span>' +
            '<button type="button" class="v60-node-enter-btn">' + tr('展開支線迴廊 ›') + '</button>' +
          '</div>' +
        '</div>';
    }

    l1.innerHTML =
      '<div class="v60-l1-header">' +
        '<div class="v60-l1-kicker">CORRIDOR TOPOLOGY · V6.1 MYSTERY GATES</div>' +
        '<div class="v60-l1-title">' + tr('選擇迴廊分區') + '</div>' +
        '<div class="v60-l1-sub">' + tr('已通關顯示「✓」· 下一扇門微光顯示 · 未抵達門扉隱藏為「？？？」') + '</div>' +
      '</div>' +
      '<div class="v60-l1-grid">' +
        '<div class="v60-corridor-node main-corridor" id="v60-node-main" onclick="V60.openCorridorLayer2(\'main\')" role="button" tabindex="0">' +
          '<div>' +
            '<div class="v60-node-top">' +
              '<span class="v60-node-badge">' + tr('第一層節點 I · 金色暖調') + '</span>' +
              '<span class="v60-node-badge">' + SVG_CHECK_V61 + ' ' + tr('進度') + ' ' + mainCleared + ' / 6</span>' +
            '</div>' +
            '<div class="v60-node-title-row">' +
              '<div class="v60-node-title">' + tr('主線長廊') + '</div>' +
            '</div>' +
            '<div class="v60-node-desc">' + tr('穿越 03:17 時間夾縫的六道核心門扉（1 → 2 → 3 → 4 → 5 → 6 依序解鎖）。') + '</div>' +
            mainRowsHtml +
          '</div>' +
          '<div class="v60-node-footer">' +
            '<span class="v60-node-unlock-hint">' + SVG_CHECK_V61 + ' <span>' + tr('1 → 2 → 3 → 4 → 5 → 6 順序推進') + '</span></span>' +
            '<button type="button" class="v60-node-enter-btn">' + tr('展開主線長廊 ›') + '</button>' +
          '</div>' +
        '</div>' +
        sideNodeHtml +
      '</div>';
  }

  /* 渲染第二層頂部腦圖導覽列 (#v60-corridor-nav)：P0-4 已通關實心圓、下一個發光圓、未到空圓+問號且點空圓只顯示？？？ */
  function renderV61Layer2Nav(currentDungeon){
    var nav = document.getElementById('v60-corridor-nav');
    if(!nav) return;
    var activeCor = (window.V60 && typeof V60.getActiveCorridor === 'function') ? V60.getActiveCorridor() : 'main';
    var mainIds = MAIN_CORRIDOR_IDS.slice();
    if(localStorage.getItem('wuxian-ng-plus') === 'true' || isCleared(12) || isCleared(13) || window._gmUnlocked){
      if(mainIds.indexOf(12) === -1) mainIds.push(12);
      if(mainIds.indexOf(13) === -1) mainIds.push(13);
    }
    var ids = (activeCor === 'side') ? SIDE_CORRIDOR_IDS : mainIds;

    var mmNodes = ids.map(function(id){
      var d = (window.dungeons || []).filter(function(x){ return x.id === id; })[0];
      if(!d) return '';
      var st = getDungeonDisplayState(id);
      var isCur = (currentDungeon && currentDungeon.id === id);
      if(st === 'cleared'){
        return '<button type="button" class="v60-mm-node v61-mm-cleared' + (isCur ? ' active' : '') + '" title="' + tr(d.name) + ' ✓" onclick="V60.openCorridorLayer2(\'' + activeCor + '\',' + id + ')">' +
          SVG_NODE_SOLID + '<span>✓ ' + tr(d.name) + '</span></button>';
      } else if(st === 'next'){
        return '<button type="button" class="v60-mm-node v61-mm-next' + (isCur ? ' active' : '') + '" title="' + tr(d.name) + '" onclick="V60.openCorridorLayer2(\'' + activeCor + '\',' + id + ')">' +
          SVG_NODE_GLOW + '<span>' + tr(d.name) + '</span></button>';
      } else {
        /* 空圓 + 問號，只顯示？？？，點擊只彈出？？？鎖頭提示 */
        return '<button type="button" class="v60-mm-node v61-mm-hidden' + (isCur ? ' active' : '') + '" title="？？？" onclick="V61.showMysteryLockModal(' + id + ',false)">' +
          SVG_NODE_HOLLOW_Q + '<span class="v61-mystery-text">？？？</span></button>';
      }
    }).join('<span class="v60-mm-arrow">→</span>');

    var c6Cleared = isCleared(6) || !!window._gmUnlocked;
    var sideTabLabel = c6Cleared ? tr('支線迴廊 (7–11)') : (SVG_LOCK_V61 + ' ' + tr('打完主線解鎖'));

    nav.innerHTML =
      '<div class="v60-nav-top-row">' +
        '<button type="button" class="v60-back-l1-btn" id="v60-back-l1-btn" onclick="V60.backToCorridorLayer1()">‹ ' + tr('返回兩層分區總覽') + '</button>' +
        '<div class="v60-corridor-tabs">' +
          '<button type="button" class="v60-corridor-tab tab-main' + (activeCor === 'main' ? ' active' : '') + '" onclick="V60.openCorridorLayer2(\'main\')">' +
            tr('主線長廊 (1–6)') +
          '</button>' +
          '<button type="button" class="v60-corridor-tab tab-side' + (activeCor === 'side' ? ' active' : '') + '" onclick="V60.openCorridorLayer2(\'side\')">' +
            sideTabLabel +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="v60-mindmap-strip" role="navigation" aria-label="Corridor Mind-Map">' +
        mmNodes +
      '</div>';
  }

  /* 包裝 window.render()：全面套用 P0 隱藏名稱規則、P6 信物已使用/未使用灰色標記、P1 NG+ 按鈕 */
  var _prevRender = window.render;
  window.render = function(){
    if(_prevRender) _prevRender.apply(this, arguments);
    ensureHubNgPlusButton();
    var d = dungeons[currentIndex] || dungeons[0];
    renderV61Layer1();
    renderV61Layer2Nav(d);

    if(!d) return;
    var st = getDungeonDisplayState(d.id);
    var card = document.querySelector('#hub-screen .dungeon-card');
    var nameEl = document.getElementById('dungeon-name');
    var tagEl = document.getElementById('dungeon-tagline');
    var whyBox = document.getElementById('v60-why-exists');
    var bgNumEl = document.getElementById('bg-num');
    var lockBadge = document.getElementById('lock-badge');
    var statusTxt = document.getElementById('status-text');
    var enterBtn = document.getElementById('enter-btn');

    if(card){
      card.classList.toggle('v61-card-cleared', st === 'cleared');
      card.classList.toggle('v61-card-next', st === 'next');
      card.classList.toggle('v61-card-hidden', st === 'hidden');
    }

    if(st === 'hidden'){
      /* 還沒到：顯示「？？？」+ 不顯示 tagline + 灰暗 + 鎖頭圖案 */
      if(bgNumTimer){ clearInterval(bgNumTimer); bgNumTimer = null; }
      if(bgNumEl) bgNumEl.textContent = '？';
      if(nameEl){
        nameEl.textContent = '？？？';
        nameEl.className = 'dungeon-name locked v61-mystery-text';
      }
      if(tagEl){
        tagEl.textContent = '';
        tagEl.style.display = 'none';
      }
      if(whyBox){
        whyBox.style.display = 'none';
      }
      var reqTxt = tr('打完第 ' + (d.id - 1) + ' 扇門解鎖');
      if(lockBadge){
        lockBadge.style.display = 'inline-flex';
        lockBadge.innerHTML = SVG_LOCK_V61 + ' <span>' + reqTxt + '</span>';
      }
      if(statusTxt){
        statusTxt.innerHTML = SVG_LOCK_V61 + ' <span>' + reqTxt + '</span>';
      }
      if(enterBtn){
        enterBtn.disabled = false; /* 允許點擊觸發 showMysteryLockModal */
        enterBtn.innerHTML = SVG_LOCK_V61 + ' ' + reqTxt;
      }
    } else if(st === 'cleared'){
      if(nameEl){
        nameEl.innerHTML = '✓ ' + tr(d.name);
        nameEl.className = 'dungeon-name';
      }
      if(tagEl){
        tagEl.textContent = tr(d.tagline);
        tagEl.style.display = '';
      }
    } else {
      /* st === 'next' */
      if(nameEl){
        nameEl.textContent = tr(d.name);
        nameEl.className = 'dungeon-name';
      }
      if(tagEl){
        tagEl.textContent = tr(d.tagline);
        tagEl.style.display = '';
      }
    }

    /* 更新下方圓點 tooltip，避免未解鎖圓點洩漏名稱 */
    var dots = document.querySelectorAll('#switch-dots .switch-dot');
    var activeCor = (window.V60 && typeof V60.getActiveCorridor === 'function') ? V60.getActiveCorridor() : 'main';
    var corIds = (activeCor === 'side') ? SIDE_CORRIDOR_IDS : MAIN_CORRIDOR_IDS;
    dots.forEach(function(dot, idx){
      var did = corIds[idx];
      if(!did) return;
      if(getDungeonDisplayState(did) === 'hidden'){
        dot.title = '？？？ (' + tr('打完第 ' + (did - 1) + ' 扇門解鎖') + ')';
      }
    });

    /* P6: 若在支線迴廊，底部信物列顯示「已使用／未使用」狀態，用過後變灰色 */
    var strip = document.getElementById('inherit-strip');
    if(strip && activeCor === 'side' && window.V60 && typeof V60.loadSideChain === 'function'){
      var chain = V60.loadSideChain();
      var relicUsed = getRelicUsedState();
      var defs = [
        { key: 'tram_stub', label: '7→8 鏡像電車票根' },
        { key: 'memory_shard', label: '8→9 自助餐記憶碎片' },
        { key: 'school_magazine', label: '9→10 小學1999校刊' },
        { key: 'cinema_clerk', label: '10→11 售票員道具' }
      ];
      strip.innerHTML = defs.map(function(def){
        var owned = !!chain[def.key];
        var used = !!relicUsed[def.key];
        var stateTxt = !owned ? '未獲得' : (used ? '已使用' : '未使用');
        var cls = 'inherit-chip v60-side-chip' + (!owned ? ' locked-relic' : '') + (used ? ' v61-relic-used-chip' : '');
        return '<span class="' + cls + '">' +
          (used ? '' : SVG_CHECK_V61) +
          '<span>' + tr(def.label) + ' [' + stateTxt + ']</span>' +
        '</span>';
      }).join('');
    }
  };

  /* P0-4: 腦圖彈窗 (#branch-dungeon-modal) 配合實心圓/發光圓/空圓+問號，點空圓只顯示？？？ */
  window.openBranchDungeonSelect = function(){
    var m = document.getElementById('branch-dungeon-modal');
    var list = document.getElementById('branch-dungeon-list');
    if(!list || !m) return;

    var c6Cleared = isCleared(6) || !!window._gmUnlocked;
    function renderBdList(cat){
      list.innerHTML = '';
      if(!cat){
        var mainCleared = MAIN_CORRIDOR_IDS.filter(function(id){ return isCleared(id); }).length;
        var sideCleared = SIDE_CORRIDOR_IDS.filter(function(id){ return isCleared(id); }).length;
        var wrap = document.createElement('div');
        wrap.className = 'v60-bd-layer1';
        wrap.innerHTML =
          '<div style="font-size:.75rem;color:var(--text-dim);margin-bottom:.25rem;text-align:center">' +
            tr('第一層：選擇要檢視腦圖的迴廊分區（已通關實心圓 ● · 下一個發光圓 ◎ · 未到空圓 ？ 顯示？？？）') +
          '</div>' +
          '<button type="button" class="v60-bd-cat-btn main-cat" id="v61-bd-main-btn">' +
            '<div class="v60-bd-cat-title">' +
              '<span>' + tr('主線長廊 (1–6)') + '</span>' +
              '<span style="font-size:.75rem">' + SVG_NODE_SOLID + ' ' + mainCleared + ' / 6 ›</span>' +
            '</div>' +
            '<div class="v60-bd-cat-sub">' + tr('點擊展開主線腦圖節點') + '</div>' +
          '</button>' +
          '<button type="button" class="v60-bd-cat-btn side-cat" id="v61-bd-side-btn">' +
            '<div class="v60-bd-cat-title">' +
              '<span>' + (c6Cleared ? tr('支線迴廊 (7–11)') : (SVG_LOCK_V61 + ' ' + tr('打完主線解鎖'))) + '</span>' +
              '<span style="font-size:.75rem">' + (c6Cleared ? (SVG_NODE_SOLID + ' ' + sideCleared + ' / 5 ›') : tr('走完第 6 扇門解鎖')) + '</span>' +
            '</div>' +
            '<div class="v60-bd-cat-sub">' + (c6Cleared ? tr('點擊展開支線腦圖節點') : tr('尚未解鎖支線迴廊')) + '</div>' +
          '</button>';
        list.appendChild(wrap);
        document.getElementById('v61-bd-main-btn').onclick = function(){ renderBdList('main'); };
        document.getElementById('v61-bd-side-btn').onclick = function(){
          if(!c6Cleared){ showMysteryLockModal(7, true); return; }
          renderBdList('side');
        };
        return;
      }

      var topBar = document.createElement('div');
      topBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:.45rem;gap:.5rem';
      topBar.innerHTML =
        '<button type="button" class="v60-back-l1-btn" id="v61-bd-back">‹ ' + tr('返回上層分區') + '</button>' +
        '<span style="font-size:.75rem;color:' + (cat === 'side' ? '#38bdf8' : '#d4af37') + '">' +
          (cat === 'side' ? tr('支線迴廊 (7–11)') : tr('主線長廊 (1–6)')) +
        '</span>';
      list.appendChild(topBar);
      document.getElementById('v61-bd-back').onclick = function(){ renderBdList(null); };

      var ids = (cat === 'side') ? SIDE_CORRIDOR_IDS : MAIN_CORRIDOR_IDS.slice();
      if(cat === 'main' && (localStorage.getItem('wuxian-ng-plus') === 'true' || isCleared(12) || isCleared(13))){
        if(ids.indexOf(12) === -1) ids.push(12);
        if(ids.indexOf(13) === -1) ids.push(13);
      }

      ids.forEach(function(id){
        var d = (window.dungeons || []).filter(function(x){ return x.id === id; })[0];
        if(!d) return;
        var st = getDungeonDisplayState(id);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'branch-dungeon-btn' + (cat === 'side' ? ' side-branch-btn' : '') + (st === 'hidden' ? ' locked' : '');
        if(st === 'cleared'){
          btn.innerHTML =
            '<span class="bd-index">' + SVG_NODE_SOLID + ' ' + tr(d.index) + '</span>' +
            '<span class="bd-name">✓ ' + tr(d.name) + '</span>' +
            '<span class="bd-lock" style="color:' + (cat === 'side' ? '#38bdf8' : '#d4af37') + '">實心圓 · 已通關</span>';
          btn.onclick = function(){
            ensureDungeonLoaded(d.id);
            closeModal('branch-dungeon-modal');
            openBranchTreeForDungeon(d.id, sceneRefs[d.id], stateRefs[d.id]);
          };
        } else if(st === 'next'){
          btn.innerHTML =
            '<span class="bd-index">' + SVG_NODE_GLOW + ' ' + tr(d.index) + '</span>' +
            '<span class="bd-name">' + tr(d.name) + '</span>' +
            '<span class="bd-lock" style="color:#ffffff">發光圓 · 下一個可進入</span>';
          btn.onclick = function(){
            ensureDungeonLoaded(d.id);
            closeModal('branch-dungeon-modal');
            openBranchTreeForDungeon(d.id, sceneRefs[d.id], stateRefs[d.id]);
          };
        } else {
          /* 空圓 + 問號：點擊只顯示？？？ */
          btn.innerHTML =
            '<span class="bd-index">' + SVG_NODE_HOLLOW_Q + ' ' + tr(d.index) + '</span>' +
            '<span class="bd-name v61-mystery-text">？？？</span>' +
            '<span class="bd-lock">' + SVG_LOCK_V61 + ' 空圓 · ？？？</span>';
          btn.onclick = function(){
            showMysteryLockModal(d.id, false);
          };
        }
        list.appendChild(btn);
      });
    }

    renderBdList(null);
    m.classList.add('show');
  };
}

/* ============================================================
 * 12. P1-7 / P5 / P6 運行時掛鉤（對話第二頁線索、週一左邊選項、週五 30s 謎題、週六雙倍壓力、物品欄信物已使用反灰）
 * ============================================================ */
function hookV61RuntimeSystems(){
  /* P1-7: 二周目 NPC 跨輪記憶台詞與「對話第二頁」隱藏線索 */
  if(typeof window.startDialog === 'function' && !window.startDialog.__v61){
    var _origStartDialog = window.startDialog;
    window.startDialog = function(npcId){
      var r = _origStartDialog.apply(this, arguments);
      try{
        if(localStorage.getItem('wuxian-ng-plus') === 'true'){
          var dlgText = document.getElementById('dialog-messages');
          if(dlgText && !dlgText.querySelector('.v61-ng-memory-line')){
            var aff = (window.V58 && typeof V58.getAffinity === 'function') ? V58.getAffinity(npcId) : 55;
            var ngQuote = (aff >= 55)
              ? '「你上次也是這樣選的。」'
              : '「上次你拒絕了我，這次呢？」';
            dlgText.insertAdjacentHTML('afterbegin',
              '<div class="v61-ng-memory-line" style="color:#f5df98;font-size:.82rem;margin-bottom:.45rem;padding:.35rem .55rem;background:rgba(212,175,55,0.12);border-left:2px solid #d4af37">' +
                '<strong>【二周目跨輪記憶】</strong>' + ngQuote +
                '<div style="margin-top:.3rem">' +
                  '<button type="button" class="v4-btn" id="v61-dlg-page2-btn" style="font-size:.7rem;padding:.15rem .5rem">翻到對話第二頁（查看二周目隱藏密碼與改動鑰匙位置）</button>' +
                '</div>' +
              '</div>'
            );
            var p2Btn = document.getElementById('v61-dlg-page2-btn');
            if(p2Btn){
              p2Btn.onclick = function(){
                p2Btn.outerHTML = '<div style="color:#7dd3fc;font-size:.76rem;margin-top:.25rem">【對話第二頁 · 二周目隱藏線索】二周目附加密碼尾碼為「17」，且備用鑰匙已從原抽屜移至鏡框背面暗格！</div>';
                if(window.state && state.flags) state.flags.v61_ng_page2_clue = true;
              };
            }
          }
        }
      }catch(e){}
      return r;
    };
    window.startDialog.__v61 = true;
  }

  /* P5: 週一特殊規則（只能選左邊/第一個選項） */
  if(typeof window.renderChoices === 'function' && !window.renderChoices.__v61){
    var _origRenderChoices = window.renderChoices;
    window.renderChoices = function(choicesList){
      var r = _origRenderChoices.apply(this, arguments);
      try{
        var rule = getActiveDailyRule();
        var overrideSet = localStorage.getItem(LS_DAILY_ACTIVE_RULE) !== null;
        if(overrideSet && rule.day === 1){
          var btns = document.querySelectorAll('#choices .choice-btn');
          if(btns.length > 1){
            for(var i = 1; i < btns.length; i++){
              btns[i].disabled = true;
              btns[i].style.opacity = '0.38';
              btns[i].title = '【週一每日規則：只能選左邊/第一個選項】';
            }
          }
        }
      }catch(e){}
      return r;
    };
    window.renderChoices.__v61 = true;
  }

  /* P5: 週六特殊規則（雙倍壓力值增長） & P3 情緒管理大師追蹤 */
  if(typeof window.addStress === 'function' && !window.addStress.__v61){
    var _origAddStress = window.addStress;
    window.addStress = function(delta){
      var d = delta;
      var rule = getActiveDailyRule();
      if(d > 0 && rule.day === 6 && localStorage.getItem(LS_DAILY_ACTIVE_RULE) !== null){
        d = d * 2;
      }
      var r = _origAddStress.call(this, d);
      checkV61DynamicAchievements();
      return r;
    };
    window.addStress.__v61 = true;
  }

  /* P5: 週五特殊規則（謎題時間限 30 秒） & P1-7 二周目謎題加一層隱藏 */
  if(window.V59 && typeof V59.openPuzzleModal === 'function' && !V59.openPuzzleModal.__v61){
    var _origPuzzleModal = V59.openPuzzleModal;
    V59.openPuzzleModal = function(type, onSolved){
      var r = _origPuzzleModal.apply(this, arguments);
      try{
        var subEl = document.getElementById('v59-pz-sub');
        var isNg = localStorage.getItem('wuxian-ng-plus') === 'true';
        var rule = getActiveDailyRule();
        if(subEl && isNg){
          subEl.innerHTML += ' <span style="color:#f5df98">【NG+ 隱藏層：密碼鎖已附加第 5 位驗證碼「17」】</span>';
        }
        if(rule.day === 5 && localStorage.getItem(LS_DAILY_ACTIVE_RULE) !== null && subEl){
          var secLeft = 30;
          var timerSpan = document.createElement('div');
          timerSpan.style.cssText = 'color:var(--danger-bright);font-family:var(--font-mono);font-size:.78rem;margin-top:.25rem';
          timerSpan.textContent = '【週五限時規則】剩餘破譯時間：30 秒';
          subEl.appendChild(timerSpan);
          var pzModal = document.getElementById('v59-puzzle-modal');
          clearInterval(pzModal.__v61Timer);
          pzModal.__v61Timer = setInterval(function(){
            if(!pzModal.classList.contains('show')){ clearInterval(pzModal.__v61Timer); return; }
            secLeft--;
            timerSpan.textContent = '【週五限時規則】剩餘破譯時間：' + secLeft + ' 秒';
            if(secLeft <= 0){
              clearInterval(pzModal.__v61Timer);
              pzModal.classList.remove('show');
              if(typeof showToast === 'function') showToast('【30 秒限時已到】謎題破譯超時！');
            }
          }, 1000);
        }
      }catch(e){}
      return r;
    };
    V59.openPuzzleModal.__v61 = true;
  }

  /* P6: 物品欄顯示支線信物「已使用／未使用」狀態，用過後變灰色 */
  var RELIC_ITEM_TO_KEY = {
    v60_tram_stub: 'tram_stub',
    v60_memory_shard: 'memory_shard',
    v60_school_magazine: 'school_magazine',
    v60_clerk_watch: 'cinema_clerk'
  };
  if(typeof window.updateInventoryUI === 'function' && !window.updateInventoryUI.__v61){
    var _origUpdateInv = window.updateInventoryUI;
    window.updateInventoryUI = function(){
      var r = _origUpdateInv.apply(this, arguments);
      try{
        var list = document.getElementById('inv-list');
        if(list && window.state && Array.isArray(state.inventory)){
          var relicUsed = getRelicUsedState();
          var cards = list.querySelectorAll('.inv-item');
          cards.forEach(function(card, idx){
            var it = state.inventory[idx];
            if(!it) return;
            var rKey = RELIC_ITEM_TO_KEY[it.id];
            if(!rKey) return;
            var used = !!relicUsed[rKey];
            card.classList.toggle('v61-relic-used-item', used);
            var nm = card.querySelector('.inv-name');
            if(nm && !nm.querySelector('.v61-relic-badge')){
              nm.insertAdjacentHTML('beforeend',
                '<span class="v61-relic-badge ' + (used ? 'used' : 'unused') + '">' + (used ? '已使用' : '未使用') + '</span>'
              );
            }
          });
        }
      }catch(e){}
      return r;
    };
    window.updateInventoryUI.__v61 = true;
  }

  /* P5: 升級手札「每日挑戰」分頁，展示週一至週日完整 7 條規則與切換演練 */
  if(typeof window.renderV58DailyTab === 'function' && !window.renderV58DailyTab.__v61){
    var _origDailyTab = window.renderV58DailyTab;
    window.renderV58DailyTab = function(body){
      _origDailyTab.apply(this, arguments);
      if(!body) return;
      var curRule = getActiveDailyRule();
      var rowsHtml = [1, 2, 3, 4, 5, 6, 0].map(function(d){
        var rl = V61_DAILY_RULES[d];
        var isCur = (curRule.day === d);
        var done = localStorage.getItem(rl.lsKey) === 'true';
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:.38rem .55rem;border:1px solid ' + (isCur ? '#d4af37' : 'var(--border)') + ';border-radius:4px;background:' + (isCur ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.02)') + ';font-size:.75rem">' +
          '<div><strong>' + rl.dayName + '：' + rl.name + '</strong> <span style="color:var(--text-dim)">（稱號：' + rl.titleName + (done ? ' ✓' : '') + '）</span></div>' +
          '<button type="button" class="v4-btn" style="padding:2px 8px;font-size:.7rem" onclick="V61.setDailyRuleOverride(' + d + ');renderV58DailyTab(document.getElementById(\'v4-nb-body\'))">' + (isCur ? '當前規則' : '切換體驗') + '</button>' +
        '</div>';
      }).join('');

      body.insertAdjacentHTML('beforeend',
        '<div style="margin-top:.75rem;padding:.75rem;border:1px solid rgba(212,175,55,0.45);border-radius:5px;background:var(--bg-card)">' +
          '<div style="font-size:.82rem;color:#f5df98;font-weight:600;margin-bottom:.45rem">v6.1 每日挑戰特殊規則表（週一至週日）</div>' +
          '<div style="display:flex;flex-direction:column;gap:.35rem">' + rowsHtml + '</div>' +
          '<div style="margin-top:.55rem;display:flex;gap:.45rem;flex-wrap:wrap">' +
            '<button type="button" class="v4-btn primary" onclick="V61.completeActiveDailyChallenge();renderV58DailyTab(document.getElementById(\'v4-nb-body\'))">完成今日特殊規則並領取稱號（' + curRule.titleName + '）</button>' +
          '</div>' +
        '</div>'
      );
    };
    window.renderV58DailyTab.__v61 = true;
  }
}

/* ============================================================
 * 13. 註冊與啟動 v6.1.0
 * ============================================================ */
/* 在 V5.boot() 的 v5setup 階段前先註冊第 12 扇門、11 個隱藏結局與 20 個新成就 */
registerDungeon12EchoElevator();
registerV61StoriesAndHiddenEndings();
registerV61AchievementsAndTitles();

V5.registerSystem('v61-core-expansion', function(){
  migrateSaveV2ToV3();
  /* 預先包裹 1–12 扇門的 buildScenes 以啟用懶載入與快取 */
  for(var d = 1; d <= 12; d++){
    wrapDungeonBuildForLazyLoad(d);
  }
});

V5.onBoot(function(){
  try{
    /* 重新計算 ACH_TOTAL（確保包含 v6.1 新增的 20 個成就與第 12 扇門成就） */
    var achTot = 0;
    Object.keys(DUNGEON_CONFIG).forEach(function(id){
      if(DUNGEON_CONFIG[id] && Array.isArray(DUNGEON_CONFIG[id].achDefs)){
        achTot += DUNGEON_CONFIG[id].achDefs.length;
      }
    });
    window.ACH_TOTAL = achTot;

    /* 啟動期間結束，僅載入第一扇門，2–12 保持懶載入待命 */
    _isBootPhase = false;
    ensureDungeonLoaded(1);
    state = stateRefs[1];
    SCENES = sceneRefs[1];

    upgradeCombatForV61();
    upgradeMusicHallForV61();
    setupLandscapeDraggableAndGestures();
    upgradeHubAndMindmapForV61();
    hookV61RuntimeSystems();
    startHubOutsiderTimer();
    migrateSaveV2ToV3();

    window.VERSION = '6.1.0';
    window.SAVE_VERSION = '3.0';
    if(window.CHANGELOG && !window.CHANGELOG.some(function(c){ return c.version === '6.1.0'; })){
      window.CHANGELOG.unshift({
        version: '6.1.0',
        type: 'major',
        changes: [
          'P0 門扉名稱隱藏機制：主選單與兩層分區實裝三態顯示（已通關顯示全名+tagline+✓、下一個可進入微光顯示全名+tagline、未到顯示「？？？」+鎖頭且不顯示 tagline）；走完第 6 扇門前支線迴廊整張顯示「打完主線解鎖」不透露任何支線名稱；點擊？？？僅顯示鎖頭+「走完第 X 扇門解鎖」；通關返回主選單觸發 0.5 秒漸亮 + 1 秒打字機 +「門扉開啟——你看見了【新門扉名】。」揭曉動畫；腦圖模式配合實心圓/發光圓/空圓+問號。',
          'P1 New Game+（二周目）與第十二扇門《回聲電梯》：走過第 6 扇門解鎖主選單金色「New Game+」按鈕，保留物品庫/好感度/成就/稱號/畫廊並重置門扉進度；二周目敵人 HP×1.5、ATK×1.3，謎題加隱藏層、對話第二頁藏線索、NPC 跨輪記憶台詞與專屬選項；New Game+ 走完第 6 扇門解鎖《回聲電梯》（1F–12F 共 12 種平行時空結局，全收集解鎖「平行時空」成就與「命運織者」稱號）。',
          'P2 & P3 隱藏結局與成就大擴充：為 1–11 扇門各補齊 1 個專屬隱藏結局（質數宇宙、聲音叛變、零分鐘、永恆、深海歸鄉、靜止、鏡像消失、永遠吃飽、長大了、謝幕、成為展品），並新增 20 項成就（含主選單停留 10 分鐘「門外之人」）。',
          'P4–P6 道具戰鬥、每日規則與支線信物升級：戰鬥新增第四選項「道具」與 7 種弱點道具（打火機、氧氣瓶、磁鐵、錄音筆、路燈、樟腦丸、冰塊，克制 ×2／非弱點 ×0.5）；實裝週一至週日每日特殊規則與「左邊之人」「玻璃心」「徒手」稱號；升級四大支線信物主動效果並在物品欄顯示「已使用／未使用」（用過變灰）。',
          'P7 & P8 體驗技術與手機適配：實裝門扉懶載入與快取（主選單 0.5 秒內開啟）、localStorage v3 自動無損遷移與含校驗碼 JSON 匯出匯入、音樂廳循環/停止/遊戲中持續播放與曲目介紹、橫屏模式可拖曳左右比例（預設 4:6，可調 3:7～5:5）與雙指點擊開筆記，以及 <360px 手機版上下排列與鎖頭放大 1.5 倍。'
        ]
      });
    }

    ['title-version', 'hub-title-version'].forEach(function(id){
      var verEl = document.getElementById(id);
      if(verEl){
        var vTxt = 'v 6.1.0';
        verEl.textContent = vTxt;
        if(verEl.firstChild) verEl.firstChild.__origText = vTxt;
      }
    });

    window.__V61_BOOT_ELAPSED_MS = Math.round(performance.now() - (window.__V61_BOOT_START_TS || performance.now()));
    if(typeof window.render === 'function'){
      window.render();
    }
    window.V61.__booted = true;
  }catch(e){
    console.error('v6.1 boot error:', e);
  }
});

})();
