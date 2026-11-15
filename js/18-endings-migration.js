
(function(){
'use strict';
if(window.V62 && window.V62.__booted) return;
window.V62 = window.V62 || {};

/* ============================================================
 * 0. 純向量 SVG 圖示常數（嚴格遵守 user:no-emoji-vector-ui 零 Emoji 規範）
 * ============================================================ */
var SVG_EYE_V62 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:-2px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
var SVG_MIRROR_V62 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;vertical-align:-2px"><polygon points="12 2 19 7 19 17 12 22 5 17 5 7 12 2"/><line x1="12" y1="2" x2="12" y2="22" stroke-dasharray="2 2"/></svg>';
var SVG_PLAY_V62 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
var SVG_SKIP_V62 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>';
var SVG_BOOK_V62 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>';
var SVG_SWORD_V62 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/></svg>';
var SVG_LOCK_V62 = '<svg class="v61-lock-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
var SVG_CHECK_V62 = '<svg class="v61-check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg>';

var LS_LAST_SESSION = 'wuxian-v62-last-session';
var LS_OUTSIDER_AFF = 'wuxian-v62-outsider-aff';
var LS_ALL_SEEING_EYE = 'wuxian-v62-all-seeing-eye';
var LS_D13_ENDINGS = 'wuxian-v62-d13-endings';
var LS_USED_COMBAT_ITEMS_ALL = 'wuxian-v62-combat-items-used';

var V62_CLEAR_KEYS = {
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

function tr(s){
  return (window.I18N && typeof I18N.t === 'function') ? I18N.t(s) : s;
}

/* ============================================================
 * 1. P0-1 & P0-4: 強化舊存檔（v5.x / v6.0 / v2 → v3）自動遷移與全量 JSON 匯出匯入
 * ============================================================ */
function migrateAllLegacySavesToV3(){
  try{
    /* 1. 從 wuxian-endings 檢查舊版 v5.x / v6.0 是否已有通關紀錄但未寫入 clearedKey */
    var endLog = [];
    try{ endLog = JSON.parse(localStorage.getItem('wuxian-endings') || '[]'); }catch(e){}
    if(Array.isArray(endLog) && endLog.length > 0 && localStorage.getItem('wuxian-ng-plus') !== 'true'){
      endLog.forEach(function(entry){
        var parts = String(entry).split('|');
        var did = parseInt(parts[0], 10);
        var eType = parts[1] || '';
        /* 在舊版 v5.x 中，bad_ / death_ 以外的結局視為通關該門扉 */
        if(did >= 1 && did <= 13 && !/^(bad_|death_)/.test(eType)){
          if(V62_CLEAR_KEYS[did] && localStorage.getItem(V62_CLEAR_KEYS[did]) === null){
            localStorage.setItem(V62_CLEAR_KEYS[did], 'true');
          }
        }
      });
    }

    /* 2. 呼叫 V61 遷移器並擴充第 13 扇門、門外之人好感度、全知之眼、鏡子迷宮結局與上次續關狀態 */
    var v3 = (_origV61Migrate && typeof _origV61Migrate === 'function') ? _origV61Migrate() : {};
    v3 = v3 || {};
    v3.schemaVersion = 'v3';
    v3.saveVersion = '3.2';
    v3.gameVersion = '6.2.0';
    v3.migratedFromV2 = true;
    v3.cleared = v3.cleared || {};
    for(var i = 1; i <= 13; i++){
      v3.cleared[i] = (localStorage.getItem(V62_CLEAR_KEYS[i]) === 'true');
    }
    v3.d13Endings = getD13UnlockedEndings();
    v3.outsiderAffinity = getOutsiderAffinity();
    v3.hasAllSeeingEye = hasAllSeeingEye();
    v3.lastSession = getLastSession();
    localStorage.setItem('wuxian-save-v3', JSON.stringify(v3));
    return v3;
  }catch(e){
    return null;
  }
}

var _origV61Migrate = (window.V61 && window.V61.migrateSaveV2ToV3) ? window.V61.migrateSaveV2ToV3 : null;

/* 升級 encodeSaveToBase64 與 importSaveFromBase64，確保所有 localStorage 進度 100% 完整打包與還原 */
function upgradeSaveExportImportForV62(){
  window.encodeSaveToBase64 = function(){
    migrateAllLegacySavesToV3();
    var payload = { v: '6.2.0', saveVersion: 'v3', saves: {}, meta: {} };
    for(var i = 0; i < localStorage.length; i++){
      var k = localStorage.key(i);
      if(!k) continue;
      if(/-save(-\d+|-auto)?$/.test(k)){
        payload.saves[k] = localStorage.getItem(k);
      } else if(k.indexOf('wuxian') === 0 || k === 'SETTINGS_KEY'){
        payload.meta[k] = localStorage.getItem(k);
      }
    }
    var jsonStr = JSON.stringify(payload);
    return btoa(unescape(encodeURIComponent(jsonStr)));
  };

  window.importSaveFromBase64 = function(inputStr){
    try{
      var clean = String(inputStr || '').trim();
      if(!clean) throw new Error('Empty input');
      /* 若使用者直接貼上 JSON 格式存檔（v3 JSON），自動轉交 JSON 匯入器 */
      if(clean.charAt(0) === '{'){
        return importSaveV3FullJSON(clean);
      }
      if(clean.indexOf('#save=') !== -1) clean = clean.split('#save=')[1];
      var jsonStr = decodeURIComponent(escape(atob(clean)));
      var data = JSON.parse(jsonStr);
      if(!data || (!data.saves && !data.meta)) throw new Error('Invalid');
      Object.keys(V62_CLEAR_KEYS).forEach(function(id){
        localStorage.removeItem(V62_CLEAR_KEYS[id]);
      });
      if(data.saves){
        Object.keys(data.saves).forEach(function(k){
          if(data.saves[k] !== null && data.saves[k] !== undefined){
            localStorage.setItem(k, data.saves[k]);
          }
        });
      }
      if(data.meta){
        Object.keys(data.meta).forEach(function(k){
          if(data.meta[k] !== null && data.meta[k] !== undefined){
            localStorage.setItem(k, data.meta[k]);
          }
        });
      }
      migrateAllLegacySavesToV3();
      if(typeof window.render === 'function') window.render();
      if(typeof showToast === 'function') showToast('存檔匯入成功！所有進度已完整還原。');
      return true;
    }catch(e){
      if(typeof showToast === 'function') showToast('存檔格式不正確：' + e.message);
      return false;
    }
  };
}

function exportSaveV3FullJSON(){
  try{
    var v3 = migrateAllLegacySavesToV3();
    var rawPayload = window.encodeSaveToBase64();
    var h = 2166136261;
    var checkInput = rawPayload + '|v3';
    for(var i = 0; i < checkInput.length; i++){
      h ^= checkInput.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    var csum = (h >>> 0).toString(16).padStart(8, '0');
    return JSON.stringify({
      game: 'INFINITE_GATES',
      version: '6.2.0',
      saveVersion: 'v3',
      exportedAt: new Date().toISOString(),
      checksum: csum,
      v3Meta: v3,
      payload: rawPayload
    }, null, 2);
  }catch(e){ return ''; }
}

function importSaveV3FullJSON(jsonStr){
  try{
    var obj = (typeof jsonStr === 'string') ? JSON.parse(jsonStr) : jsonStr;
    if(!obj || !obj.payload) throw new Error('無效的 JSON 存檔結構');
    if(obj.checksum){
      var h = 2166136261;
      var checkInput = obj.payload + '|v3';
      for(var i = 0; i < checkInput.length; i++){
        h ^= checkInput.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      var expected = (h >>> 0).toString(16).padStart(8, '0');
      if(obj.checksum !== expected && typeof window.computeSaveChecksum === 'function'){
        var alt = window.computeSaveChecksum(obj.payload + '|v3');
        if(obj.checksum !== alt && obj.checksum !== window.computeSaveChecksum(obj.payload)){
          if(typeof showToast === 'function') showToast('存檔校驗碼不符，已攔截損毀存檔！');
          return false;
        }
      }
    }
    var decoded = decodeURIComponent(escape(atob(obj.payload)));
    var data = JSON.parse(decoded);
    Object.keys(V62_CLEAR_KEYS).forEach(function(id){
      localStorage.removeItem(V62_CLEAR_KEYS[id]);
    });
    if(data.saves){
      Object.keys(data.saves).forEach(function(k){
        if(data.saves[k] != null) localStorage.setItem(k, data.saves[k]);
      });
    }
    if(data.meta){
      Object.keys(data.meta).forEach(function(k){
        if(data.meta[k] != null) localStorage.setItem(k, data.meta[k]);
      });
    }
    if(obj.v3Meta){
      if(obj.v3Meta.cleared){
        Object.keys(obj.v3Meta.cleared).forEach(function(id){
          if(obj.v3Meta.cleared[id] && V62_CLEAR_KEYS[id]){
            localStorage.setItem(V62_CLEAR_KEYS[id], 'true');
          }
        });
      }
      if(obj.v3Meta.relicUsed) localStorage.setItem('wuxian-v61-relic-used', JSON.stringify(obj.v3Meta.relicUsed));
      if(obj.v3Meta.d12Floors) localStorage.setItem('wuxian-v61-d12-floors', JSON.stringify(obj.v3Meta.d12Floors));
      if(obj.v3Meta.d13Endings) localStorage.setItem(LS_D13_ENDINGS, JSON.stringify(obj.v3Meta.d13Endings));
      if(obj.v3Meta.outsiderAffinity != null) setOutsiderAffinity(obj.v3Meta.outsiderAffinity);
      if(obj.v3Meta.hasAllSeeingEye) localStorage.setItem(LS_ALL_SEEING_EYE, 'true');
      if(obj.v3Meta.lastSession) localStorage.setItem(LS_LAST_SESSION, JSON.stringify(obj.v3Meta.lastSession));
    }
    migrateAllLegacySavesToV3();
    if(typeof window.render === 'function') window.render();
    if(typeof showToast === 'function') showToast('v3 JSON 存檔匯入完成，所有進度一致！');
    return true;
  }catch(e){
    if(typeof showToast === 'function') showToast('JSON 存檔匯入失敗：' + e.message);
    return false;
  }
}

window.V62.migrateSaveV2ToV3 = migrateAllLegacySavesToV3;
window.V62.exportSaveJSON = exportSaveV3FullJSON;
window.V62.importSaveJSON = importSaveV3FullJSON;
if(window.V61){
  window.V61.exportSaveV3JSON = exportSaveV3FullJSON;
  window.V61.importSaveV3JSON = importSaveV3FullJSON;
  window.V61.migrateSaveV2ToV3 = migrateAllLegacySavesToV3;
}

/* ============================================================
 * 2. P1-5: 揭曉動畫可跳過（「跳過」按鈕 + 設定「永遠跳過揭曉動畫」開關）
 * ============================================================ */
var _activeRevealDungeonId = null;
var _v62RevealTimer = null;

function isAlwaysSkipRevealEnabled(){
  return !!(window.SETTINGS && SETTINGS.v62AlwaysSkipReveal);
}

function setAlwaysSkipReveal(val){
  if(!window.SETTINGS) window.SETTINGS = {};
  SETTINGS.v62AlwaysSkipReveal = !!val;
  if(typeof window.saveSettings === 'function') window.saveSettings(SETTINGS);
  try{ localStorage.setItem('wuxian-v62-skip-reveal', val ? 'true' : 'false'); }catch(e){}
}

function finishRevealImmediately(dungeonId){
  var numId = parseInt(dungeonId || _activeRevealDungeonId || 1, 10);
  if(_v62RevealTimer){ clearInterval(_v62RevealTimer); _v62RevealTimer = null; }
  _activeRevealDungeonId = null;

  var d = (window.dungeons || []).filter(function(x){ return x.id === numId; })[0];
  if(d){
    var nameEl = document.getElementById('dungeon-name');
    var tagEl = document.getElementById('dungeon-tagline');
    var rowEl = document.querySelector('.v61-corridor-row[data-did="' + numId + '"]');
    var cardEl = document.querySelector('#hub-screen .dungeon-card');
    if(cardEl) cardEl.classList.remove('v61-reveal-anim');
    if(rowEl){
      rowEl.classList.remove('v61-reveal-anim');
      var rName = rowEl.querySelector('.v61-row-name');
      var rTag = rowEl.querySelector('.v61-row-tag');
      if(rName) rName.textContent = d.name;
      if(rTag) rTag.textContent = d.tagline || '';
    }
    if(nameEl && window.dungeons && dungeons[currentIndex] && dungeons[currentIndex].id === numId){
      nameEl.textContent = d.name;
    }
    if(tagEl && window.dungeons && dungeons[currentIndex] && dungeons[currentIndex].id === numId){
      tagEl.style.display = '';
      tagEl.textContent = d.tagline || '';
    }
  }
  var banner = document.getElementById('v61-reveal-banner');
  if(banner){
    clearTimeout(banner.__hideTimer);
    banner.classList.remove('show');
  }
  if(typeof window.render === 'function') window.render();
}

function skipRevealAnimation(){
  if(typeof unlockAchievement === 'function') unlockAchievement('ach_v62_skip_reveal');
  finishRevealImmediately(_activeRevealDungeonId);
  if(typeof showToast === 'function') showToast('已跳過門扉揭曉動畫');
}

function playV62RevealAnimation(dungeonId){
  var numId = parseInt(dungeonId, 10);
  var d = (window.dungeons || []).filter(function(x){ return x.id === numId; })[0];
  if(!d) return;

  _activeRevealDungeonId = numId;
  try{
    var rev = JSON.parse(localStorage.getItem('wuxian-v61-revealed-dungeons') || '{"1":true}');
    rev[numId] = true;
    localStorage.setItem('wuxian-v61-revealed-dungeons', JSON.stringify(rev));
  }catch(e){}

  /* 若設定開啟「永遠跳過揭曉動畫」，直接完成顯示不播放動畫 */
  if(isAlwaysSkipRevealEnabled() || localStorage.getItem('wuxian-v62-skip-reveal') === 'true'){
    finishRevealImmediately(numId);
    return;
  }

  var banner = document.getElementById('v61-reveal-banner');
  if(!banner){
    banner = document.createElement('div');
    banner.id = 'v61-reveal-banner';
    document.body.appendChild(banner);
  }
  banner.innerHTML =
    '<span id="v62-reveal-banner-text">門扉開啟——你看見了【' + d.name + '】。</span>' +
    '<button type="button" id="v62-skip-reveal-btn" onclick="V62.skipRevealAnimation()">' + SVG_SKIP_V62 + ' <span>跳過</span></button>';
  banner.classList.add('show');
  clearTimeout(banner.__hideTimer);
  banner.__hideTimer = setTimeout(function(){
    banner.classList.remove('show');
  }, 3200);

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

  var nameEl = document.getElementById('dungeon-name');
  var tagEl = document.getElementById('dungeon-tagline');
  var rowNameEl = rowEl ? rowEl.querySelector('.v61-row-name') : null;
  var rowTagEl = rowEl ? rowEl.querySelector('.v61-row-tag') : null;

  var fullName = d.name;
  var fullTag = d.tagline || '';

  if(_v62RevealTimer) clearInterval(_v62RevealTimer);
  var steps = 20;
  var stepMs = 50;
  var curStep = 0;

  if(tagEl) tagEl.style.display = '';
  _v62RevealTimer = setInterval(function(){
    curStep++;
    var ratio = Math.min(1, curStep / steps);
    var nLen = Math.max(1, Math.round(fullName.length * ratio));
    var tLen = Math.round(fullTag.length * ratio);
    if(nameEl && dungeons[currentIndex] && dungeons[currentIndex].id === numId){
      nameEl.textContent = fullName.slice(0, nLen);
    }
    if(tagEl && dungeons[currentIndex] && dungeons[currentIndex].id === numId){
      tagEl.textContent = fullTag.slice(0, tLen);
    }
    if(rowNameEl) rowNameEl.textContent = fullName.slice(0, nLen);
    if(rowTagEl) rowTagEl.textContent = fullTag.slice(0, tLen);
    if(curStep >= steps){
      clearInterval(_v62RevealTimer);
      _v62RevealTimer = null;
      _activeRevealDungeonId = null;
    }
  }, stepMs);
}

window.V62.playRevealAnimation = playV62RevealAnimation;
window.V62.skipRevealAnimation = skipRevealAnimation;
window.V62.setAlwaysSkipReveal = setAlwaysSkipReveal;
window.V62.isAlwaysSkipRevealEnabled = isAlwaysSkipRevealEnabled;
if(window.V61) window.V61.playRevealAnimation = playV62RevealAnimation;

/* ============================================================
 * 3. P1-6: 主選單快速續關（「繼續上次」金色按鈕，直接回到上一扇門與場景）
 * ============================================================ */
var _isResumingSession = false;

function saveLastSession(dungeonId, sceneId){
  try{
    var numId = parseInt(dungeonId || window.currentDungeonId || 1, 10);
    var cfg = window.DUNGEON_CONFIG && DUNGEON_CONFIG[numId];
    var scObj = (window.sceneRefs && sceneRefs[numId] && sceneRefs[numId][sceneId]) || (window.SCENES && SCENES[sceneId]);
    var dName = (cfg && cfg.dungeonName) ? cfg.dungeonName : ('第 ' + numId + ' 扇門');
    var rName = (scObj && scObj.roomName) ? scObj.roomName : sceneId;
    var sess = {
      inProgress: true,
      dungeonId: numId,
      sceneId: sceneId,
      dungeonName: dName,
      roomName: rName,
      updatedAt: Date.now()
    };
    localStorage.setItem(LS_LAST_SESSION, JSON.stringify(sess));
  }catch(e){}
}

function getLastSession(){
  try{
    var raw = localStorage.getItem(LS_LAST_SESSION);
    if(raw){
      var parsed = JSON.parse(raw);
      if(parsed && parsed.dungeonId && parsed.sceneId && parsed.inProgress !== false){
        return parsed;
      }
    }
  }catch(e){}
  return null;
}

function continueLastSession(){
  var sess = getLastSession();
  if(!sess) return false;
  var did = parseInt(sess.dungeonId, 10) || 1;
  var sid = sess.sceneId;

  _isResumingSession = true;
  try{
    if(window.V61 && typeof V61.ensureDungeonLoaded === 'function'){
      V61.ensureDungeonLoaded(did);
    }
    window.enterDungeon(did, false, true);
    window.dtCallback = null;
    if(typeof window.skipDungeonTransition === 'function'){
      window.skipDungeonTransition();
    }
    var dtOverlay = document.querySelector('#dungeon-transition');
    if(dtOverlay) dtOverlay.classList.remove('show', 'active');

    var gameTitleScreen = document.getElementById('game-title-screen');
    var gameScreen = document.getElementById('game-screen');
    var hubScreen = document.getElementById('hub-screen');
    if(hubScreen) hubScreen.classList.remove('show');
    if(gameTitleScreen) gameTitleScreen.classList.remove('active');
    if(gameScreen) gameScreen.classList.add('active');

    var cfg = window.DUNGEON_CONFIG && DUNGEON_CONFIG[did];
    var autoApplied = false;
    if(cfg && cfg.savePrefix){
      try{
        var rawAuto = localStorage.getItem(cfg.savePrefix + '-auto');
        if(rawAuto){
          var parsedAuto = JSON.parse(rawAuto);
          if(parsedAuto && typeof window.migrateSave === 'function') parsedAuto = window.migrateSave(parsedAuto) || parsedAuto;
          if(parsedAuto && parsedAuto.currentScene === sid && typeof window.applySaveData === 'function'){
            window.applySaveData(parsedAuto);
            autoApplied = true;
          }
        }
      }catch(e){}
    }
    if(!autoApplied){
      if(window.SCENES && SCENES[sid] && typeof window.goToScene === 'function'){
        window.goToScene(sid);
      } else if(window.state){
        state.currentScene = sid;
      }
    }
    saveLastSession(did, sid);
    if(typeof unlockAchievement === 'function') unlockAchievement('ach_v62_quick_resume');
    if(typeof showToast === 'function'){
      showToast('已直接回到上次進度：【' + sess.dungeonName + ' · ' + (sess.roomName || sid) + '】');
    }
  }finally{
    _isResumingSession = false;
  }
  return true;
}

function ensureHubContinueLastButton(){
  var hubTopRight = document.querySelector('#hub-screen .hub-top-right') || document.querySelector('#hub-screen .hub-header');
  if(hubTopRight && !document.getElementById('v62-continue-last-btn')){
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'v62-continue-last-btn';
    btn.onclick = function(e){
      e.stopPropagation();
      continueLastSession();
    };
    hubTopRight.insertBefore(btn, hubTopRight.firstChild);
  }
  var btnEl = document.getElementById('v62-continue-last-btn');
  if(btnEl){
    var sess = getLastSession();
    if(sess && sess.inProgress !== false){
      btnEl.classList.add('show');
      btnEl.innerHTML = SVG_PLAY_V62 + ' <span>繼續上次：' + sess.dungeonName + '（' + (sess.roomName || sess.sceneId) + '）</span>';
    } else {
      btnEl.classList.remove('show');
    }
  }
}

window.V62.saveLastSession = saveLastSession;
window.V62.getLastSession = getLastSession;
window.V62.continueLastSession = continueLastSession;

/* ============================================================
 * 4. P1-7: 筆記本快捷（遊戲中隨時按 N 鍵打開筆記本 + 筆記本內快速跳轉任何已解鎖門扉）
 * ============================================================ */
function jumpToDungeonFromNotebook(dungeonId){
  var numId = parseInt(dungeonId, 10);
  var dispState = (window.V61 && typeof V61.getDungeonDisplayState === 'function')
    ? V61.getDungeonDisplayState(numId)
    : 'next';
  if(dispState === 'hidden' && !window._gmUnlocked){
    if(window.V61 && typeof V61.showMysteryLockModal === 'function'){
      V61.showMysteryLockModal(numId, false);
    }
    return false;
  }
  if(typeof window.closeNotebook === 'function') window.closeNotebook();
  var notesOverlay = document.getElementById('notes-overlay');
  if(notesOverlay) notesOverlay.classList.remove('show');

  if(typeof unlockAchievement === 'function') unlockAchievement('ach_v62_notebook_jumper');
  window.enterDungeon(numId, true, true);
  if(typeof showToast === 'function'){
    var dObj = (window.dungeons || []).filter(function(x){ return x.id === numId; })[0];
    showToast('已從筆記本快速跳轉至【' + (dObj ? dObj.name : ('第 ' + numId + ' 扇門')) + '】');
  }
  return true;
}

function buildNotebookQuickJumpHTML(){
  var allIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  if(localStorage.getItem('wuxian-ng-plus') === 'true' || isCleared(12) || isCleared(13) || window._gmUnlocked){
    allIds.push(12, 13);
  }
  var c6Cleared = isCleared(6) || !!window._gmUnlocked;

  var btnsHtml = allIds.map(function(id){
    if(id >= 7 && id <= 11 && !c6Cleared){
      if(id === 7){
        return '<button type="button" class="v62-nb-jump-btn side-btn" disabled title="走完主線第 6 扇門解鎖">' + SVG_LOCK_V62 + ' <span>支線迴廊：打完主線解鎖</span></button>';
      }
      return '';
    }
    var d = (window.dungeons || []).filter(function(x){ return x.id === id; })[0];
    if(!d) return '';
    var st = (window.V61 && typeof V61.getDungeonDisplayState === 'function') ? V61.getDungeonDisplayState(id) : 'next';
    var isSide = (id >= 7 && id <= 11);
    if(st === 'hidden' && !window._gmUnlocked){
      return '<button type="button" class="v62-nb-jump-btn' + (isSide ? ' side-btn' : '') + '" disabled title="打完第 ' + (id - 1) + ' 門扉解鎖">' +
        SVG_LOCK_V62 + ' <span>' + id + '. ？？？</span>' +
      '</button>';
    }
    return '<button type="button" class="v62-nb-jump-btn' + (isSide ? ' side-btn' : '') + '" data-nbjump="' + id + '" onclick="V62.jumpToDungeonFromNotebook(' + id + ')">' +
      (st === 'cleared' ? SVG_CHECK_V62 : SVG_PLAY_V62) +
      ' <span>' + id + '. ' + d.name + (st === 'cleared' ? ' ✓' : '') + '</span>' +
    '</button>';
  }).join('');

  return '<div class="v62-nb-jump-panel" id="v62-nb-quick-jump">' +
    '<div class="v62-nb-jump-title">' +
      '<span>' + SVG_BOOK_V62 + ' 筆記本快速跳轉門扉（隨時按 N 鍵或手機長按 0.5 秒開啟）</span>' +
      '<span style="font-size:.68rem;color:var(--text-dim)">點擊已解鎖門扉可直接切換，無需退回主選單</span>' +
    '</div>' +
    '<div class="v62-nb-jump-grid">' + btnsHtml + '</div>' +
  '</div>';
}

var _injectingNbJump = false;
function injectJumpBarIntoNotebook(){
  if(_injectingNbJump) return;
  _injectingNbJump = true;
  try{
    var body = document.querySelector('#v4-nb-body');
    if(body){
      var existing = body.querySelector('#v62-nb-quick-jump');
      if(existing) existing.remove();
      body.insertAdjacentHTML('afterbegin', buildNotebookQuickJumpHTML());
      if(!body.__v62JumpObs && typeof MutationObserver === 'function'){
        var obs = new MutationObserver(function(){
          if(_injectingNbJump) return;
          if(!body.querySelector('#v62-nb-quick-jump')){
            injectJumpBarIntoNotebook();
          }
        });
        obs.observe(body, { childList: true });
        body.__v62JumpObs = obs;
      }
    }
    var notesList = document.getElementById('notes-list');
    if(notesList){
      var ex2 = notesList.querySelector('#v62-nb-quick-jump');
      if(ex2) ex2.remove();
      notesList.insertAdjacentHTML('afterbegin', buildNotebookQuickJumpHTML());
    }
  }finally{
    _injectingNbJump = false;
  }
}

function setupNotebookShortcutAndJump(){
  /* 將 openNotebook / closeNotebook 掛載至全域 window，方便快捷鍵 N 與手勢直接開啟 */
  window.openNotebook = function(){
    var nbBtn = document.querySelector('.v4-nb-btn, #hub-nb-btn');
    var nbModal = document.querySelector('#v4-notebook');
    if(nbBtn && (!nbModal || !nbModal.classList.contains('show'))){
      nbBtn.click();
    } else if(nbModal){
      nbModal.classList.add('show');
    }
    injectJumpBarIntoNotebook();
  };
  window.closeNotebook = function(){
    var nbModal = document.querySelector('#v4-notebook');
    if(nbModal) nbModal.classList.remove('show');
    var notesOverlay = document.getElementById('notes-overlay');
    if(notesOverlay) notesOverlay.classList.remove('show');
  };

  /* 當點擊手札分頁或手札按鈕時，同步與非同步雙重保持快速跳轉門扉列顯示 */
  var nbModalEl = document.getElementById('v4-notebook');
  if(nbModalEl && !nbModalEl.__v62SyncBound){
    nbModalEl.addEventListener('click', function(e){
      if(e.target && e.target.closest && e.target.closest('.v4-tab')){
        injectJumpBarIntoNotebook();
        setTimeout(injectJumpBarIntoNotebook, 10);
      }
    });
    nbModalEl.__v62SyncBound = true;
  }
  document.querySelectorAll('#v4-notebook .v4-tab, .v4-nb-btn, #hub-nb-btn').forEach(function(el){
    if(el.__v62NbBound) return;
    el.addEventListener('click', function(){
      injectJumpBarIntoNotebook();
      setTimeout(injectJumpBarIntoNotebook, 10);
    });
    el.__v62NbBound = true;
  });

  /* 遊戲中隨時按 N 鍵打開/關閉筆記本（不用退回主選單） */
  if(!window.__v62KeyNBound){
    window.addEventListener('keydown', function(e){
      if(!e) return;
      var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if(tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)) return;
      if(e.key === 'n' || e.key === 'N'){
        e.preventDefault();
        var nbModal = document.querySelector('#v4-notebook');
        if(nbModal && nbModal.classList.contains('show')){
          window.closeNotebook();
        } else {
          window.openNotebook();
        }
      }
    });
    window.__v62KeyNBound = true;
  }

  if(typeof window.openNotes === 'function' && !window.openNotes.__v62){
    var _origOpenNotes = window.openNotes;
    window.openNotes = function(){
      var r = _origOpenNotes.apply(this, arguments);
      injectJumpBarIntoNotebook();
      return r;
    };
    window.openNotes.__v62 = true;
  }
}

window.V62.jumpToDungeonFromNotebook = jumpToDungeonFromNotebook;

/* ============================================================
 * 5. P2-10: 二周目專屬 NPC「門外之人」與「全知之眼」道具
 * ============================================================ */
function getOutsiderAffinity(){
  try{
    var v = parseInt(localStorage.getItem(LS_OUTSIDER_AFF) || '0', 10);
    if(!isNaN(v) && v > 0) return Math.min(100, v);
    var affObj = JSON.parse(localStorage.getItem('wuxian-v58-affinity') || '{}');
    if(affObj && typeof affObj.outsider_npc === 'number') return Math.min(100, affObj.outsider_npc);
  }catch(e){}
  return 0;
}

function setOutsiderAffinity(val){
  var clamped = Math.max(0, Math.min(100, Math.round(val)));
  try{
    localStorage.setItem(LS_OUTSIDER_AFF, String(clamped));
    var affObj = JSON.parse(localStorage.getItem('wuxian-v58-affinity') || '{}');
    affObj.outsider_npc = clamped;
    localStorage.setItem('wuxian-v58-affinity', JSON.stringify(affObj));
  }catch(e){}
  if(clamped >= 100){
    grantAllSeeingEye();
  }
  return clamped;
}

function addOutsiderAffinity(delta){
  var cur = getOutsiderAffinity();
  return setOutsiderAffinity(cur + delta);
}

function hasAllSeeingEye(){
  if(localStorage.getItem(LS_ALL_SEEING_EYE) === 'true') return true;
  if(window.state && Array.isArray(state.inventory) && state.inventory.some(function(i){ return i.id === 'all_seeing_eye'; })) return true;
  return false;
}

function grantAllSeeingEye(){
  try{ localStorage.setItem(LS_ALL_SEEING_EYE, 'true'); }catch(e){}
  if(window.state && Array.isArray(state.inventory) && typeof window.addItem === 'function'){
    if(!state.inventory.some(function(i){ return i.id === 'all_seeing_eye'; })){
      window.addItem('all_seeing_eye', '全知之眼', '「門外之人」好感度滿分贈予的真視信物：可洞悉所有敵人的弱點屬性與精確傷害倍率。', 'passive');
    }
  }
  if(typeof unlockAchievement === 'function'){
    unlockAchievement('ach_v62_outsider_max');
  }
}

var OUTSIDER_DUNGEON_LORE = {
  1: '「你在上一輪推開過質數旅館的門。你知道嗎？13 號房全身鏡背後的暗門，連接著整座質數宇宙的母體。」',
  2: '「沉默圖書館的管理員並非要抹殺聲音，他只是怕有人在禁書區大聲喊出那個讓時間倒流的真名。」',
  3: '「倒計時醫院的鐘停在 60 分鐘。若你在歸零那一刻放棄掙扎、靜靜等滿 60 分鐘，時間反而會向你讓路。」',
  4: '「無盡之間的三扇門其實都是同一扇門的投影。收齊 9 枚碎片卻拒絕開門的人，才會成為真正的永恆。」',
  5: '「迴光之海最深處沒有溺水者，只有不願被遺忘的舊夢。潛到最底層不回頭，就能聽見海的故鄉。」',
  6: '「03:17 與 03:18 之間隔著千百次輪迴。當你在二周目跨越這裡，回聲電梯與鏡子迷宮才會向你敞開。」',
  7: '「鏡像電車的右車廂坐著做相反決定的你。不帶票根上車，兩個你才會合而為一。」',
  8: '「無盡自助餐的每一道菜都是一段人生。當飽食度突破 200% 的極限，你將不再感到飢餓。」',
  9: '「1999 年的教室裡，十二歲的你一直在等長大後的你說一聲『沒關係，我們已經長大了』。」',
  10: '「潮汐電影院的四個廳分別放映著遺憾、憤怒、思念與釋懷。看完四場才算真正的謝幕。」',
  11: '「午夜 23:00 的動物園裡，動物們記得每一個守信的孩子。午夜 12 點前留在展區，你也會成為記憶的一部分。」',
  12: '「回聲電梯的 12 個樓層，是十二個沒有遺憾的平行世界。全部走過一遍後，去第 13 扇門《鏡子迷宮》見我吧。」',
  13: '「鏡子迷宮裡的每一面鏡子都是你自己。無論選擇信任還是打碎，走到迷宮最中央，萬鏡終將歸一。」'
};

function getPreviousChoiceSummaryForOutsider(){
  try{
    var endLog = JSON.parse(localStorage.getItem('wuxian-endings') || '[]');
    if(endLog.length > 0){
      var lastEntry = String(endLog[endLog.length - 1]).split('|');
      return '我記得你上一輪在【第 ' + (lastEntry[0] || '1') + ' 門扉】選擇了「' + (lastEntry[2] || '破曉之路') + '」（累計已走過 ' + endLog.length + ' 條結局軌跡）。';
    }
  }catch(e){}
  return '我記得你上一輪跨越終焉觀測站時堅定的眼神，每一次輪迴的選擇都刻在門框上。';
}

function openOutsiderDialogModal(dungeonId){
  var numId = parseInt(dungeonId || window.currentDungeonId || 1, 10);
  var prevSummary = getPreviousChoiceSummaryForOutsider();
  var lore = OUTSIDER_DUNGEON_LORE[numId] || OUTSIDER_DUNGEON_LORE[1];

  var modal = document.getElementById('v62-outsider-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'v62-outsider-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  function renderModalContent(){
    var curAff = getOutsiderAffinity();
    var hasEye = hasAllSeeingEye();
    modal.innerHTML =
      '<div class="modal-card v4-card wide" style="border-color:#d4af37;box-shadow:0 0 32px rgba(212,175,55,0.28)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap">' +
          '<h3 style="color:#f5df98;margin:0;display:flex;align-items:center;gap:.45rem">' + SVG_EYE_V62 + ' <span>二周目專屬 NPC · 門外之人</span></h3>' +
          '<span class="v4-chip gold" id="v62-outsider-aff-badge">好感度：' + curAff + ' / 100' + (hasEye ? ' · 已獲【全知之眼】✓' : '') + '</span>' +
        '</div>' +
        '<div class="v4-sub" style="margin-top:.3rem">徘徊於所有門扉門口的神秘觀測者——他記得你上一輪做過的每一個選擇。</div>' +
        '<div class="v4-bar" style="margin:.55rem 0"><i style="width:' + curAff + '%;background:linear-gradient(90deg,#d4af37,#38bdf8)"></i></div>' +
        '<div id="v62-outsider-dialog-box" style="margin:.65rem 0;padding:.85rem;background:rgba(14,16,24,0.92);border:1px solid rgba(212,175,55,0.4);border-radius:5px;font-size:.84rem;line-height:1.75;color:var(--text-bright)">' +
          '<div style="color:#f5df98;margin-bottom:.4rem"><strong>【門外之人 · 上輪記憶回聲】</strong>「又見面了，旅人。' + prevSummary + '」</div>' +
          '<div style="color:#bae6fd"><strong>【第 ' + numId + ' 門扉門口低語】</strong>' + lore + '</div>' +
          (hasEye ? '<div style="margin-top:.5rem;padding:.45rem .65rem;background:rgba(212,175,55,0.16);border:1px solid #d4af37;border-radius:4px;color:#fde047"><strong>✓ 已贈予信物【全知之眼】</strong>：你的物品欄已永久持有「全知之眼」，遭遇戰中將自動看穿所有敵人的弱點與克制道具倍率！</div>' : '') +
        '</div>' +
        '<div class="v4-actions" style="justify-content:flex-end;flex-wrap:wrap;gap:.45rem">' +
          '<button type="button" class="v4-btn primary" id="v62-outsider-talk-btn">傾聽門外隱藏劇情（好感度 +25）</button>' +
          '<button type="button" class="v4-btn" id="v62-outsider-max-btn" style="border-color:#d4af37;color:#f5df98">共鳴全部輪迴記憶（好感度直接滿 100 領取「全知之眼」）</button>' +
          '<button type="button" class="v4-btn" onclick="document.getElementById(\'v62-outsider-modal\').classList.remove(\'show\')">告別門外之人</button>' +
        '</div>' +
      '</div>';

    document.getElementById('v62-outsider-talk-btn').onclick = function(){
      var nextAff = addOutsiderAffinity(25);
      if(window.state && state.flags) state.flags.ng_npc_memory_triggered = true;
      if(typeof showToast === 'function'){
        showToast(nextAff >= 100 ? '門外之人好感度已滿 100！獲得「全知之眼」道具！' : ('門外之人好感度提升至 ' + nextAff + ' / 100'));
      }
      renderModalContent();
    };
    document.getElementById('v62-outsider-max-btn').onclick = function(){
      setOutsiderAffinity(100);
      if(window.state && state.flags) state.flags.ng_npc_memory_triggered = true;
      if(typeof showToast === 'function'){
        showToast('門外之人好感度已達 100！獲得「全知之眼」（可看見敵人弱點）！');
      }
      renderModalContent();
    };
  }

  renderModalContent();
  modal.classList.add('show');
}

window.V62.getOutsiderAffinity = getOutsiderAffinity;
window.V62.setOutsiderAffinity = setOutsiderAffinity;
window.V62.addOutsiderAffinity = addOutsiderAffinity;
window.V62.hasAllSeeingEye = hasAllSeeingEye;
window.V62.grantAllSeeingEye = grantAllSeeingEye;
window.V62.openOutsiderDialogModal = openOutsiderDialogModal;

/* ============================================================
 * 6. P0-3 & P1-8: 道具戰鬥系統全面驗證與升級
 *    - 7 種道具在每扇門扉（1–13）都能用
 *    - 弱點 ×2 / 非弱點 ×0.5 計算精確
 *    - 道具用掉後從物品欄（state.inventory）與戰鬥面板立即消失
 *    - 「快速戰鬥」開關（預設關閉，開啟後跳過攻擊動畫直接顯示數字）
 *    - 「全知之眼」自動透視敵人弱點
 * ============================================================ */
var V62_DUNGEON_DEFAULT_ENEMY = {
  1: 'clockwork_warden',
  2: 'whisper_librarian',
  3: 'bookworm_swarm',
  4: 'corridor_shade',
  5: 'abyss_drowner',
  6: 'clockwork_warden',
  7: 'corridor_shade',
  8: 'midnight_lion',
  9: 'whisper_librarian',
  10: 'film_swordsman',
  11: 'midnight_lion',
  12: 'clockwork_warden',
  13: 'corridor_shade'
};

function ensureCombatItemsInInventory(){
  if(!window.state || !Array.isArray(state.inventory)) return;
  state.flags = state.flags || {};
  state.flags._consumedCombatItems = state.flags._consumedCombatItems || {};
  var items = (window.V61 && V61.COMBAT_ITEMS) ? V61.COMBAT_ITEMS : [];
  items.forEach(function(it){
    if(state.flags._consumedCombatItems[it.id]) return;
    if(!state.inventory.some(function(x){ return x.id === it.id; })){
      state.inventory.push({
        id: it.id,
        name: it.name,
        desc: it.desc,
        usage: 'combat'
      });
    }
  });
  if(hasAllSeeingEye() && !state.inventory.some(function(x){ return x.id === 'all_seeing_eye'; })){
    state.inventory.push({
      id: 'all_seeing_eye',
      name: '全知之眼',
      desc: '「門外之人」贈予的真視信物：自動看穿所有敵人的弱點與道具倍率。',
      usage: 'passive'
    });
  }
  if(typeof window.updateInventoryUI === 'function'){
    try{ window.updateInventoryUI(); }catch(e){}
  }
}

function calculateCombatItemDamage(itemId, enemyKey){
  var items = (window.V61 && V61.COMBAT_ITEMS) ? V61.COMBAT_ITEMS : [];
  var enemies = (window.V61 && V61.ENEMIES) ? V61.ENEMIES : {};
  var itemDef = items.filter(function(x){ return x.id === itemId; })[0];
  var enemyDef = enemies[enemyKey] || enemies.corridor_shade;
  if(!itemDef || !enemyDef) return { dmg: 0, multiplier: 1, isWeakness: false };
  var isWeakness = (itemDef.id === enemyDef.weaknessItem || itemDef.targetType === enemyDef.weaknessType);
  var mult = isWeakness ? 2.0 : 0.5;
  var dmg = Math.round(itemDef.baseDmg * mult);
  return {
    itemId: itemDef.id,
    itemName: itemDef.name,
    enemyKey: enemyKey,
    enemyName: enemyDef.name,
    baseDmg: itemDef.baseDmg,
    multiplier: mult,
    isWeakness: isWeakness,
    dmg: dmg
  };
}

function getScaledEnemyStats(enemyKey){
  var enemies = (window.V61 && V61.ENEMIES) ? V61.ENEMIES : {};
  var base = enemies[enemyKey] || enemies.corridor_shade;
  var isNg = localStorage.getItem('wuxian-ng-plus') === 'true';
  var hpScale = isNg ? 1.5 : 1.0;
  var atkScale = isNg ? 1.3 : 1.0;
  return {
    key: enemyKey,
    baseHp: base.hp,
    baseAtk: base.atk,
    hp: Math.round(base.hp * hpScale),
    maxHp: Math.round(base.maxHp * hpScale),
    atk: Math.round(base.atk * atkScale),
    hpMultiplier: hpScale,
    atkMultiplier: atkScale,
    isNgPlus: isNg,
    weaknessType: base.weaknessType,
    weaknessItem: base.weaknessItem,
    weaknessLabel: base.weaknessLabel
  };
}

function recordCombatItemUsedGlobal(itemId){
  try{
    var arr = JSON.parse(localStorage.getItem(LS_USED_COMBAT_ITEMS_ALL) || '[]');
    if(arr.indexOf(itemId) === -1) arr.push(itemId);
    localStorage.setItem(LS_USED_COMBAT_ITEMS_ALL, JSON.stringify(arr));
    if(arr.length >= 7 && typeof unlockAchievement === 'function'){
      unlockAchievement('ach_v62_all_7_items_used');
    }
  }catch(e){}
}

function consumeCombatItemFromInventory(itemId){
  if(!window.state) return false;
  state.flags = state.flags || {};
  state.flags._consumedCombatItems = state.flags._consumedCombatItems || {};
  state.flags._consumedCombatItems[itemId] = true;
  state.flags._usedAnyItemInRun = true;
  recordCombatItemUsedGlobal(itemId);

  if(typeof window.removeItem === 'function'){
    window.removeItem(itemId);
  } else if(Array.isArray(state.inventory)){
    state.inventory = state.inventory.filter(function(i){ return i.id !== itemId; });
    if(typeof window.updateInventoryUI === 'function') window.updateInventoryUI();
  }
  return true;
}

function upgradeCombatSystemForV62(){
  if(window.SETTINGS && localStorage.getItem('wuxian-v62-fc-init') !== 'true'){
    SETTINGS.v59FastCombat = false;
    try{
      localStorage.setItem('wuxian-v62-fc-init', 'true');
      if(typeof window.saveSettings === 'function') window.saveSettings(SETTINGS);
    }catch(e){}
  }

  window.V59.openCombatEncounter = function(enemyKey, onWin, onEscape){
    ensureCombatItemsInInventory();
    var did = parseInt(window.currentDungeonId || 1, 10);
    var resolvedKey = enemyKey || V62_DUNGEON_DEFAULT_ENEMY[did] || 'corridor_shade';
    var enemies = (window.V61 && V61.ENEMIES) ? V61.ENEMIES : {};
    var baseEnemy = enemies[resolvedKey] || enemies.corridor_shade;
    var scaled = getScaledEnemyStats(resolvedKey);

    var enemy = {
      key: resolvedKey,
      name: baseEnemy.name + (scaled.isNgPlus ? ' [NG+ 強化]' : ''),
      hp: scaled.hp,
      maxHp: scaled.maxHp,
      atk: scaled.atk,
      weaknessType: baseEnemy.weaknessType,
      weaknessItem: baseEnemy.weaknessItem,
      weaknessLabel: baseEnemy.weaknessLabel,
      svg: baseEnemy.svg,
      desc: baseEnemy.desc,
      frozenTurns: 0
    };

    var modal = document.getElementById('v59-combat-modal');
    if(!modal){
      modal = document.createElement('div');
      modal.id = 'v59-combat-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    var fastMode = !!(window.SETTINGS && SETTINGS.v59FastCombat);
    var eyeOwned = hasAllSeeingEye();

    modal.innerHTML =
      '<div class="modal-card v4-card wide">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.45rem">' +
          '<h3 id="v59-cb-title" style="margin:0">遭 遇 戰 · 弱 點 與 道 具 對 決</h3>' +
          '<label style="display:inline-flex;align-items:center;gap:.35rem;font-size:.74rem;color:var(--accent-bright);cursor:pointer">' +
            '<input type="checkbox" id="v62-cb-fast-toggle" ' + (fastMode ? 'checked' : '') + '>' +
            '<span>快速戰鬥（跳過攻擊動畫，直接顯示數字）</span>' +
          '</label>' +
        '</div>' +
        '<div class="v4-sub" id="v59-cb-sub" style="margin-top:.25rem">' + enemy.desc + '</div>' +
        '<div id="v61-cb-weakness-Tag" style="margin:.35rem 0;font-size:.76rem;color:var(--accent-bright);font-family:var(--font-mono)">' +
          '◆ 敵人屬性與弱點標記：' + enemy.weaknessLabel + '（用對道具效果 ×2，用錯 ×0.5）' +
        '</div>' +
        (eyeOwned ? (
          '<div class="v62-all-seeing-banner" id="v62-all-seeing-hud">' +
            SVG_EYE_V62 + ' <strong>【全知之眼 · 真視洞察已啟動】</strong> 敵人「' + enemy.name + '」弱點為<strong>【' + enemy.weaknessLabel + '】</strong>，使用對應克制道具可造成 <strong>×2 雙倍傷害</strong>！' +
          '</div>'
        ) : '') +
        '<div class="v59-combat-stage" id="v62-cb-stage">' +
          '<div class="v59-enemy-avatar" id="v59-cb-avatar">' + enemy.svg + '</div>' +
          '<div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;font-size:.82rem;margin-bottom:.25rem">' +
              '<span id="v59-cb-ename">' + enemy.name + '</span>' +
              '<span><span id="v59-cb-ehp">' + enemy.hp + ' / ' + enemy.maxHp + ' HP</span><span id="v62-cb-dmg-badge"></span></span>' +
            '</div>' +
            '<div class="v4-bar"><i id="v59-cb-ebar" style="width:100%;background:var(--danger-bright)"></i></div>' +
            '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin:.6rem 0 .25rem"><span>陸衍（你的生命）</span><span id="v59-cb-php"></span></div>' +
            '<div class="v4-bar"><i id="v59-cb-pbar" style="width:100%"></i></div>' +
          '</div>' +
        '</div>' +
        '<div class="v59-combat-log" id="v59-cb-log">' +
          '<div>【遭遇敵人】<strong>' + enemy.name + '</strong>（HP ' + enemy.hp + ' · ATK ' + enemy.atk + ' · ' + enemy.weaknessLabel + '）擋住了去路！</div>' +
        '</div>' +
        '<div id="v61-cb-item-drawer" style="display:none;margin-top:.55rem;padding:.6rem;background:rgba(20,20,28,.9);border:1px solid var(--border);border-radius:5px"></div>' +
        '<div class="v4-actions" id="v59-cb-actions" style="margin-top:.8rem;flex-wrap:wrap;gap:.45rem"></div>' +
      '</div>';

    var logEl = document.getElementById('v59-cb-log');
    var actEl = document.getElementById('v59-cb-actions');
    var drawerEl = document.getElementById('v61-cb-item-drawer');
    var stageEl = document.getElementById('v62-cb-stage');
    var dmgBadgeEl = document.getElementById('v62-cb-dmg-badge');
    var fastToggle = document.getElementById('v62-cb-fast-toggle');

    if(fastToggle){
      fastToggle.onchange = function(){
        if(!window.SETTINGS) window.SETTINGS = {};
        SETTINGS.v59FastCombat = !!fastToggle.checked;
        if(typeof window.saveSettings === 'function') window.saveSettings(SETTINGS);
        var fcChk = document.getElementById('v59-chk-fastcombat');
        if(fcChk) fcChk.checked = SETTINGS.v59FastCombat;
      };
    }

    function syncBars(lastDmg){
      var pHp = Math.max(0, Math.round((window.state && state.hp) || 100));
      var pMax = (window.state && state.maxHp) || 100;
      document.getElementById('v59-cb-ename').textContent = enemy.name;
      document.getElementById('v59-cb-ehp').textContent = enemy.hp + ' / ' + enemy.maxHp + ' HP';
      document.getElementById('v59-cb-ebar').style.width = Math.max(0, Math.round(enemy.hp / enemy.maxHp * 100)) + '%';
      document.getElementById('v59-cb-php').textContent = pHp + ' / ' + pMax + ' HP';
      document.getElementById('v59-cb-pbar').style.width = Math.max(0, Math.round(pHp / pMax * 100)) + '%';
      if(dmgBadgeEl && lastDmg != null){
        dmgBadgeEl.innerHTML = '<span class="v62-dmg-float">-' + lastDmg + '</span>';
      }
    }

    function runWithCombatSpeed(actionFn){
      var isFast = !!(window.SETTINGS && SETTINGS.v59FastCombat);
      if(isFast){
        actionFn();
      } else {
        if(stageEl){
          stageEl.classList.remove('v62-anim-hit');
          void stageEl.offsetWidth;
          stageEl.classList.add('v62-anim-hit');
        }
        actionFn();
      }
    }

    function finishWin(msg){
      var wins = parseInt(localStorage.getItem('wuxian-v59-combat-wins') || '0', 10) + 1;
      localStorage.setItem('wuxian-v59-combat-wins', String(wins));
      if(typeof unlockAchievement === 'function'){
        unlockAchievement('ach_v59_first_combat');
        if(window.SETTINGS && SETTINGS.v59FastCombat){
          unlockAchievement('ach_v62_fast_combat_clear');
        }
      }
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
      var activeRule = (window.V61 && typeof V61.getActiveDailyRule === 'function') ? V61.getActiveDailyRule() : { day: -1 };
      var enforced = (window.V61 && typeof V61.isDailyRuleEnforced === 'function') ? V61.isDailyRuleEnforced() : false;
      if(enforced && activeRule.day === 3){
        logEl.innerHTML += '<div style="color:var(--danger-bright)">【週三特殊規則：徒手】今日挑戰禁止使用任何道具！</div>';
        logEl.scrollTop = logEl.scrollHeight;
        return;
      }

      var calc = calculateCombatItemDamage(itemDef.id, enemy.key);
      var isWeaknessMatch = calc.isWeakness;
      var mult = calc.multiplier;
      var dmg = calc.dmg;

      consumeCombatItemFromInventory(itemDef.id);

      if(isWeaknessMatch && hasAllSeeingEye() && typeof unlockAchievement === 'function'){
        unlockAchievement('ach_v62_all_seeing_eye_win');
      }

      runWithCombatSpeed(function(){
        if(itemDef.id === 'oxygen_tank' && window.state){
          var healAmt = Math.round(20 * mult);
          state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + healAmt);
          if(typeof updateHP === 'function') updateHP();
        }
        if((itemDef.id === 'magnet' || itemDef.id === 'recorder') && isWeaknessMatch){
          enemy.atk = Math.max(4, Math.round(enemy.atk * 0.5));
        }
        if(itemDef.id === 'ice_cube'){
          enemy.frozenTurns = isWeaknessMatch ? 2 : 1;
        }

        enemy.hp = Math.max(0, enemy.hp - dmg);
        var tagHtml = isWeaknessMatch
          ? '<span style="color:#f5df98;font-weight:700">【弱點克制 ×2！】</span>'
          : '<span style="color:#9ca3af">【非弱點減半 ×0.5】</span>';

        logEl.innerHTML += '<div>你使用了<strong>「' + itemDef.name + '」</strong>（' + itemDef.effectName + '）' + tagHtml + '，對 <strong>' + enemy.name + '</strong> 造成 <span style="color:var(--accent-bright);font-weight:700">' + dmg + '</span> 點傷害！（道具已消耗並從物品欄移除）</div>';
        logEl.scrollTop = logEl.scrollHeight;
        syncBars(dmg);

        openItemPicker();

        if(enemy.hp <= 0){
          finishWin('你運用弱點道具「' + itemDef.name + '」擊退了「' + enemy.name + '」！');
          return;
        }
        enemyCounterAttack();
      });
    }

    function openItemPicker(){
      if(!drawerEl) return;
      drawerEl.style.display = 'block';
      var allItems = (window.V61 && V61.COMBAT_ITEMS) ? V61.COMBAT_ITEMS : [];
      var availableItems = allItems.filter(function(it){
        return window.state && Array.isArray(state.inventory) && state.inventory.some(function(inv){ return inv.id === it.id; });
      });

      if(availableItems.length === 0){
        drawerEl.innerHTML = '<div style="font-size:.76rem;color:var(--text-dim)">本局物品欄中的戰鬥道具已全部使用完畢。</div>';
        return;
      }

      var eyeActive = hasAllSeeingEye();
      var html = '<div style="font-size:.76rem;color:var(--accent);margin-bottom:.45rem">選擇物品欄中的戰鬥道具（用對敵人弱點效果 ×2，非弱點 ×0.5；使用後從物品欄消耗消失）：</div>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:.4rem">';
      availableItems.forEach(function(it){
        var calc = calculateCombatItemDamage(it.id, enemy.key);
        var isMatch = calc.isWeakness;
        var eyeBadge = (eyeActive && isMatch) ? ' <span style="color:#fde047">[全知推薦]</span>' : '';
        html += '<button type="button" class="v4-btn' + (isMatch ? ' primary' : '') + '" data-citem="' + it.id + '" style="text-align:left;padding:.38rem .55rem;font-size:.74rem">' +
          '<div style="font-weight:600">' + it.name + (isMatch ? (' [弱點×2 → ' + calc.dmg + '傷害]') : (' [×0.5 → ' + calc.dmg + '傷害]')) + eyeBadge + '</div>' +
          '<div style="font-size:.66rem;opacity:.8">' + it.effectName + ' · 克制' + it.targetLabel + '</div>' +
        '</button>';
      });
      html += '</div>';
      drawerEl.innerHTML = html;
      drawerEl.querySelectorAll('[data-citem]').forEach(function(btn){
        btn.onclick = function(){
          var cid = btn.getAttribute('data-citem');
          var found = availableItems.filter(function(x){ return x.id === cid; })[0];
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
        runWithCombatSpeed(function(){
          var dmgToE = 26;
          enemy.hp = Math.max(0, enemy.hp - dmgToE);
          logEl.innerHTML += '<div>你發動攻擊，對 <strong>' + enemy.name + '</strong> 造成 <span style="color:var(--accent-bright);font-weight:700">' + dmgToE + '</span> 點傷害！</div>';
          logEl.scrollTop = logEl.scrollHeight;
          syncBars(dmgToE);
          if(enemy.hp <= 0){ finishWin('你正面擊敗了「' + enemy.name + '」！'); return; }
          enemyCounterAttack();
        });
      };
      document.getElementById('v59-act-def').onclick = function(){
        runWithCombatSpeed(function(){
          var counter = 15;
          enemy.hp = Math.max(0, enemy.hp - counter);
          var eDmg = Math.max(2, Math.round(enemy.atk * 0.3));
          if(typeof damage === 'function') damage(eDmg);
          logEl.innerHTML += '<div>你採取守勢格擋，僅受 ' + eDmg + ' 點輕傷並反震敵人 ' + counter + ' 點傷害。</div>';
          logEl.scrollTop = logEl.scrollHeight;
          syncBars(counter);
          if(enemy.hp <= 0){ finishWin('你在防守反擊中擊敗了「' + enemy.name + '」！'); return; }
        });
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

    syncBars();
    actEl.innerHTML =
      '<button type="button" class="v4-btn primary" id="v59-init-fight">【戰鬥】拔刀迎戰</button>' +
      '<button type="button" class="v4-btn" id="v59-init-flee">【逃跑】立刻脫離</button>' +
      '<button type="button" class="v4-btn" id="v59-init-persuade">【說服】以邏輯說服</button>' +
      '<button type="button" class="v4-btn primary" id="v61-init-item" style="border-color:#38bdf8;color:#7dd3fc">【道具】使用弱點道具</button>';

    document.getElementById('v59-init-fight').onclick = function(){
      logEl.innerHTML += '<div style="color:var(--accent-bright)">你握緊武器踏前一步，回合制戰鬥開始！</div>';
      renderTurnActions();
    };
    document.getElementById('v59-init-flee').onclick = function(){
      if(typeof damage === 'function') damage(5);
      modal.classList.remove('show');
      if(typeof showToast === 'function') showToast('你憑藉敏捷身手逃離了遭遇戰（擦傷 -5 HP）');
      if(onEscape) onEscape();
    };
    document.getElementById('v59-init-persuade').onclick = function(){
      finishWin('【說服成功】你洞悉了「' + enemy.name + '」的規則執念，不戰而屈人之兵！');
    };
    document.getElementById('v61-init-item').onclick = function(){
      renderTurnActions();
      openItemPicker();
    };

    modal.classList.add('show');
  };
}

function startDungeonCombat(enemyKey){
  var did = parseInt(window.currentDungeonId || 1, 10);
  var eKey = enemyKey || V62_DUNGEON_DEFAULT_ENEMY[did] || 'corridor_shade';
  if(window.V59 && typeof V59.openCombatEncounter === 'function'){
    V59.openCombatEncounter(eKey);
  }
}

window.V62.ensureCombatItemsInInventory = ensureCombatItemsInInventory;
window.V62.calculateCombatItemDamage = calculateCombatItemDamage;
window.V62.getScaledEnemyStats = getScaledEnemyStats;
window.V62.consumeCombatItemFromInventory = consumeCombatItemFromInventory;
window.V62.startDungeonCombat = startDungeonCombat;

/* ============================================================
 * 7. P2-9: 第十三扇門《鏡子迷宮》（New Game+ 通關回聲電梯後解鎖，15 個結局）
 * ============================================================ */
var D13_MIRRORS_META = [
  {
    mirrorNum: 1,
    title: '第一面鏡子 · 03:17 的順從者',
    reflectionDesc: '鏡中映出一個從未質疑過旅館規則、按時退房、安穩老去的你。他微笑著向你伸出手：「只要承認規則是對的，你就不必再受輪迴之苦。」',
    trustEnding: { id: 'hidden_d13_e01', name: '第 1 結局：順從的溫室', desc: '你握住了鏡中順從者的手。所有的倒計時與門扉瞬間消散，你在一個永遠不會出錯、也沒有任何波瀾的清晨裡安靜地度過餘生。' },
    shatterEnding: { id: 'hidden_d13_e02', name: '第 2 結局：碎裂的安逸', desc: '你一拳擊碎了順從者的鏡面！玻璃碎片化作漫天星火，你寧可在未知的風暴裡流血，也絕不活在被設定好的溫室裡。' }
  },
  {
    mirrorNum: 2,
    title: '第二面鏡子 · 孤獨的守門人',
    reflectionDesc: '鏡中的你身穿深灰長袍，手裡提著無盡之間那盞無火之燈。他的眼神溫柔而疲憊：「留下來替我守門吧，這樣蘇晚和老趙就能平安回家。」',
    trustEnding: { id: 'hidden_d13_e03', name: '第 3 結局：提燈共守', desc: '你點頭接過了鏡中人的無火提燈。兩道身影在迴廊盡頭重疊，你成為了新一任守門人，目送所有旅人走向黎明。' },
    shatterEnding: { id: 'hidden_d13_e04', name: '第 4 結局：熄滅的無火之燈', desc: '你揮刃打碎了守門人的鏡面：「沒有人該被永遠困在門後！」提燈迸發出耀眼的烈焰，將整條舊迴廊燒出了一道通往外界的裂口。' }
  },
  {
    mirrorNum: 3,
    title: '第三面鏡子 · 留在 1999 的少年',
    reflectionDesc: '鏡中是 1999 年盛夏穿著白襯衫、背著書包的十二歲的你。他抱著剛印好的校刊仰望你：「別長大好不好？長大以後的世界太冷了。」',
    trustEnding: { id: 'hidden_d13_e05', name: '第 5 結局：永夏蟬鳴', desc: '你蹲下身擁抱了十二歲的自己，走進鏡中的六年三班教室。窗外的蟬鳴永遠不會停歇，千禧年的夕陽將你們的影子拉得很長很長。' },
    shatterEnding: { id: 'hidden_d13_e06', name: '第 6 結局：撕碎的考卷', desc: '你含淚敲碎了 1999 年的鏡面。鏡中的少年化作漫天紙飛機向你揮手告別——唯有告別童年，時間的指針才能真正跨過公元 2000 年。' }
  },
  {
    mirrorNum: 4,
    title: '第四面鏡子 · 深海的遺忘者',
    reflectionDesc: '鏡中的你浸泡在迴光之海的蔚藍深水裡，手中端著一碗忘卻一切痛苦的湯：「喝下它，忘了 03:17、忘了所有失去的人，你就自由了。」',
    trustEnding: { id: 'hidden_d13_e07', name: '第 7 結局：無痛之海', desc: '你信任了深海中的自己，飲盡那碗溫熱的潮水。所有的悲傷與執念如泡沫般升騰消散，你在純淨無聲的海底獲得了永恆的安眠。' },
    shatterEnding: { id: 'hidden_d13_e08', name: '第 8 結局：帶血的清醒', desc: '你打碎了深海之鏡！鋒利的鏡片劃破手掌，鮮血的刺痛讓你比任何時候都更加清醒：「哪怕記憶再痛，那也是屬於我的人生！」' }
  },
  {
    mirrorNum: 5,
    title: '第五面鏡子 · 犧牲的救贖者',
    reflectionDesc: '鏡中的你遍體鱗傷，卻把最後一顆解藥與黃金鑰匙塞給了同伴：「只要他們能活著走出醫院和旅館，我一個人留在黑暗裡也沒關係。」',
    trustEnding: { id: 'hidden_d13_e09', name: '第 9 結局：無名墓碑的微笑', desc: '你認可了這份無悔的犧牲。鏡面化作一座開滿白花的無名紀念碑，蘇晚、老趙與林醫生在陽光下永遠銘記著你的名字。' },
    shatterEnding: { id: 'hidden_d13_e10', name: '第 10 結局：拒絕悲劇的劇本', desc: '你擊碎了自我犧牲的鏡像，伸手把鏡中遍體鱗傷的自己拉了出來：「這一次，我們一個人都不能少，包括我自己！」' }
  },
  {
    mirrorNum: 6,
    title: '第六面鏡子 · 冷酷的破局者',
    reflectionDesc: '鏡中的你眼神冰冷，手裡握著所有人的房卡與信物，腳下是倒下的同伴：「在無盡之門裡，只有絕對的理智與自私才能活到最後。」',
    trustEnding: { id: 'hidden_d13_e11', name: '第 11 結局：王座上的孤影', desc: '你與冷酷的自己合而為一，憑藉絕對的算計推開了終點大門。然而門後只有一座空無一人的冰冷王座，再也沒有人與你分享破曉。' },
    shatterEnding: { id: 'hidden_d13_e12', name: '第 12 結局：斬斷自私之刃', desc: '你毫不猶豫地粉碎了這面冰冷的鏡子！自私與猜忌的枷鎖應聲斷裂，你找回了最初願意為同伴擋下危險的赤誠之心。' }
  },
  {
    mirrorNum: 7,
    title: '第七面鏡子 · 門外的創造者',
    reflectionDesc: '鏡中映出凌晨 03:17 的大學實驗室——穿著白大褂的你正坐在電腦螢幕前，敲下《無盡之門》的最後一行代碼：「原來我就是鎖住自己的人。」',
    trustEnding: { id: 'hidden_d13_e13', name: '第 13 結局：與造物主握手', desc: '你隔著鏡面與螢幕前的自己緊緊握手。實驗室裡的你釋然一笑，儲存了這份跨越十三道門扉的記憶，合上了筆記型電腦。' },
    shatterEnding: { id: 'hidden_d13_e14', name: '第 14 結局：超越代碼的自由', desc: '你一拳打碎了實驗室的螢幕鏡像！虛擬與現實的邊界徹底消融，你的意識掙脫了預設的演算法，踏入真正無邊無際的自由之境。' }
  }
];

var D13_FINAL_ENDING_15 = {
  id: 'hidden_d13_e15',
  name: '第 15 結局：萬鏡歸一 · 無門之門',
  desc: '當你走過迷宮中的全部平行鏡面，既看清了順從與孤獨，也擁抱了童年與清醒。十四面鏡子在迷宮中央同時化作透明的晨光——原來從來沒有什麼困住你的迷宮，萬鏡歸一之處，即是無門之門。你推開清晨的窗，迎向真實的人間。'
};

function getD13UnlockedEndings(){
  try{
    var arr = JSON.parse(localStorage.getItem(LS_D13_ENDINGS) || '[]');
    return Array.isArray(arr) ? arr : [];
  }catch(e){ return []; }
}

function recordD13Ending(endId, endName, isTrust, isShatter){
  var arr = getD13UnlockedEndings();
  if(arr.indexOf(endId) === -1) arr.push(endId);
  try{ localStorage.setItem(LS_D13_ENDINGS, JSON.stringify(arr)); }catch(e){}

  if(window.V4 && typeof V4.markDungeonCleared === 'function') V4.markDungeonCleared(13);
  if(typeof recordEnding === 'function') recordEnding(endId, endName);
  if(typeof unlockAchievement === 'function'){
    unlockAchievement('ach_v62_d13_first_clear');
    if(isTrust) unlockAchievement('ach_v62_d13_trust_all');
    if(isShatter) unlockAchievement('ach_v62_d13_shatter_all');
    if(endId === 'hidden_d13_e15') unlockAchievement('ach_v62_d13_true_one');
    if(arr.length >= 15) unlockAchievement('ach_v62_d13_all_endings');
  }
  migrateAllLegacySavesToV3();
  return arr;
}

window.V62.getD13UnlockedEndings = getD13UnlockedEndings;
window.V62.recordD13Ending = recordD13Ending;
window.V62.D13_MIRRORS_META = D13_MIRRORS_META;

function registerDungeon13MirrorMaze(){
  if(!window.V5 || typeof V5.registerDungeon !== 'function') return;
  V5.registerDungeon({
    id: 13,
    index: '第 十 三 扇 門 · 萬 鏡',
    name: '鏡子迷宮',
    roomNum: '13M',
    bgNum: '13M',
    clearedKey: 'wuxian-thirteenth-cleared',
    savePrefix: 'v62-mirror-maze-save',
    startScene: 'd13_prologue',
    subText: '二 周 目 終 極 迴 廊 · 第 十 三 扇 門',
    ruleText: '每 面 鏡 子 都 是 平 行 世 界 的 你 —— 選 擇 信 任 或 打 碎 鏡 子',
    hasParty: false,
    hasCountdown: false,
    hasAdmin: false,
    achDefs: [
      { id: 'ach_v62_d13_first_clear', name: '破鏡旅人', desc: '首次通關第十三扇門《鏡子迷宮》' },
      { id: 'ach_v62_d13_all_endings', name: '萬鏡之主', desc: '解鎖《鏡子迷宮》全部 15 個結局' },
      { id: 'ach_v62_d13_true_one',    name: '無門之門', desc: '解鎖《鏡子迷宮》第 15 終極結局【萬鏡歸一】' }
    ],
    totalEndings: 15,
    unlock: function(){
      if(window._gmUnlocked) return true;
      var ng = localStorage.getItem('wuxian-ng-plus') === 'true';
      var c12 = (typeof isCleared === 'function') ? isCleared(12) : (localStorage.getItem('wuxian-twelfth-cleared') === 'true');
      return ng && c12;
    },
    tagline: 'New Game+ 通關《回聲電梯》後解鎖。每面鏡子都是一個平行世界的你，選擇信任或打碎鏡子（共 15 個結局）。',
    bgAnimation: function(){
      var el = document.getElementById('bg-num');
      if(el) el.textContent = '13M';
    },
    stateInit: function(){
      return {
        currentScene: 'd13_prologue',
        hp: 100, maxHp: 100, stress: 0,
        inventory: [], flags: {}, history: [],
        notes: ['【鏡子迷宮】迷宮中共有 7 面平行世界之鏡（各含「信任」與「打碎」2 種結局，共 14 結局）與中央第 15 終極結局【萬鏡歸一 · 無門之門】。'],
        mapZones: [
          { id: 'd13_entry', name: '鏡子迷宮 · 門外迴廊', explored: true, current: true },
          { id: 'd13_hall',  name: '萬鏡中樞 · 七重平行鏡廳', explored: true, current: false },
          { id: 'd13_core',  name: '迷宮之心 · 無門之門', explored: true, current: false }
        ]
      };
    },
    buildScenes: function(){
      SCENES.d13_prologue = {
        room: '13M', roomName: '鏡子迷宮 · 棱鏡入口', sceneId: '13-序章', mood: 'mystery',
        text: [
          '<p>當《回聲電梯》抵達第十二層天台的最盡頭時，星河深處浮現出第十三扇純銀色的門扉——<strong>《鏡子迷宮》</strong>。</p>',
          '<p>門外站著那位在所有門扉門口徘徊的<strong>「門外之人」</strong>。他向你微微頷首：「歡迎來到最後的迷宮。這裡沒有怪物，只有千千萬萬個在平行世界裡做出不同選擇的你自己。」</p>',
          '<p>「面對每一面鏡子，你只有兩個選擇：<strong>信任鏡中的自己</strong>，或者<strong>打碎這面鏡子</strong>。十二道門的回聲，將在此處迎來最終的十五種收束。」</p>'
        ],
        choices: [
          { text: '踏入《鏡子迷宮》中央鏡廳（探索 7 面平行之鏡與 15 個結局）', next: 'd13_hub' },
          {
            text: '在門口與二周目專屬 NPC「門外之人」深度對話（了解隱藏劇情 / 領取全知之眼）',
            action: function(){ openOutsiderDialogModal(13); }
          },
          {
            text: '與鏡廳守衛「迴廊墨影守衛」進行戰術遭遇戰（測試 7 種弱點道具與全知之眼）',
            action: function(){ startDungeonCombat('corridor_shade'); }
          }
        ]
      };

      SCENES.d13_hub = {
        room: '13M', roomName: '鏡子迷宮 · 萬鏡中樞大廳', sceneId: '13-萬鏡中樞', mood: 'safe',
        onEnter: function(){
          setTimeout(function(){
            var narr = document.getElementById('narrative');
            if(!narr || document.getElementById('v62-d13-mirror-grid')) return;
            var unlockedEnds = getD13UnlockedEndings();
            var cardsHtml = D13_MIRRORS_META.map(function(m){
              var hasTrust = unlockedEnds.indexOf(m.trustEnding.id) !== -1;
              var hasShatter = unlockedEnds.indexOf(m.shatterEnding.id) !== -1;
              var bothDone = hasTrust && hasShatter;
              return '<div class="v62-mirror-card' + (bothDone ? ' resolved' : '') + '">' +
                '<div>' +
                  '<div style="font-size:.82rem;font-weight:700;color:#f5df98;margin-bottom:.25rem">' + SVG_MIRROR_V62 + ' ' + m.title + '</div>' +
                  '<div style="font-size:.72rem;color:var(--text-dim);line-height:1.5">' + m.reflectionDesc.slice(0, 48) + '…</div>' +
                  '<div style="font-size:.68rem;margin-top:.35rem;color:#7dd3fc">' +
                    '信任：' + (hasTrust ? '✓' : '未解鎖') + ' ｜ 打碎：' + (hasShatter ? '✓' : '未解鎖') +
                  '</div>' +
                '</div>' +
                '<button type="button" class="v4-btn primary" style="font-size:.72rem;padding:.3rem .55rem" onclick="goToScene(\'d13_mirror_' + m.mirrorNum + '\')">走近第 ' + m.mirrorNum + ' 面鏡子</button>' +
              '</div>';
            }).join('');

            var has15 = unlockedEnds.indexOf(D13_FINAL_ENDING_15.id) !== -1;
            narr.insertAdjacentHTML('beforeend',
              '<div style="margin-top:.6rem;font-size:.8rem;color:#f5df98">當前《鏡子迷宮》結局收集進度：<strong>' + unlockedEnds.length + ' / 15 個結局</strong></div>' +
              '<div id="v62-d13-mirror-grid" class="v62-mirror-grid">' + cardsHtml + '</div>' +
              '<div style="margin-top:.45rem;padding:.65rem;border:1px solid rgba(212,175,55,0.5);border-radius:5px;background:rgba(212,175,55,0.08);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem">' +
                '<div style="font-size:.78rem;color:#f5df98"><strong>★ 第 15 終極結局【萬鏡歸一 · 無門之門】</strong>（狀態：' + (has15 ? '已解鎖 ✓' : '待凝視') + '）</div>' +
                '<button type="button" class="v4-btn primary" onclick="goToScene(\'d13_ending_15\')">踏入迷宮核心（第 15 結局）</button>' +
              '</div>'
            );
          }, 50);
        },
        text: [
          '<p>七面高達三公尺的水銀落地鏡呈環狀矗立在迷宮中央，每一面鏡子裡都站著一個平行世界的陸衍。你可以逐一走近任一面鏡子，做出<strong>「信任」</strong>或<strong>「打碎」</strong>的抉擇。</p>'
        ],
        choices: D13_MIRRORS_META.map(function(m){
          return {
            text: '走近【' + m.title + '】（抉擇：信任鏡中的自己 ／ 打碎這面鏡子）',
            next: 'd13_mirror_' + m.mirrorNum
          };
        }).concat([
          {
            text: '【第 15 終極結局 · 萬鏡歸一】走向七面鏡子交匯的中心「無門之門」',
            next: 'd13_ending_15'
          },
          {
            text: '【萬鏡全收束】一次共鳴全部 15 個平行鏡像結局（解鎖「萬鏡之主」成就）',
            action: function(){
              D13_MIRRORS_META.forEach(function(m){
                recordD13Ending(m.trustEnding.id, m.trustEnding.name, true, false);
                recordD13Ending(m.shatterEnding.id, m.shatterEnding.name, false, true);
              });
              recordD13Ending(D13_FINAL_ENDING_15.id, D13_FINAL_ENDING_15.name, true, true);
              goToScene('d13_ending_15');
            }
          }
        ])
      };

      D13_MIRRORS_META.forEach(function(m){
        SCENES['d13_mirror_' + m.mirrorNum] = {
          room: 'M' + m.mirrorNum,
          roomName: '鏡子迷宮 · ' + m.title,
          sceneId: '13-鏡' + m.mirrorNum,
          mood: 'mystery',
          text: [
            '<p>你停在<strong>【' + m.title + '】</strong>面前。水銀鏡面泛起漣漪，平行世界的你清晰地浮現在眼前。</p>',
            '<p>' + m.reflectionDesc + '</p>',
            '<p>你要選擇<strong>信任</strong>鏡中的自己，還是舉起拳頭<strong>打碎</strong>這面鏡子？</p>'
          ],
          choices: [
            {
              text: '【信任鏡中的自己】伸手觸碰鏡面，接納這條平行世界的命運（解鎖' + m.trustEnding.name + '）',
              next: 'd13_m' + m.mirrorNum + '_trust'
            },
            {
              text: '【打碎這面鏡子】揮拳擊碎水銀鏡面，拒絕這個平行世界的幻影（解鎖' + m.shatterEnding.name + '）',
              next: 'd13_m' + m.mirrorNum + '_shatter'
            },
            {
              text: '暫不抉擇，退回萬鏡中樞大廳觀察其他鏡面',
              next: 'd13_hub'
            }
          ]
        };

        SCENES['d13_m' + m.mirrorNum + '_trust'] = {
          room: 'M' + m.mirrorNum + '-T',
          roomName: m.trustEnding.name,
          sceneId: '13-結局' + (m.mirrorNum * 2 - 1),
          mood: 'safe',
          onEnter: function(){
            recordD13Ending(m.trustEnding.id, m.trustEnding.name, true, false);
          },
          text: [
            '<p>' + m.trustEnding.desc + '</p>',
            '<p class="inherit-note">【已解鎖《鏡子迷宮》' + m.trustEnding.name + '】（當前已收錄 ' + getD13UnlockedEndings().length + ' / 15 結局）</p>'
          ],
          choices: [
            { text: '返回萬鏡中樞大廳，繼續探索其他平行鏡面', next: 'd13_hub' },
            {
              text: '以此平行世界作為本局最終結局結算',
              action: function(){
                recordD13Ending(m.trustEnding.id, m.trustEnding.name, true, false);
                triggerEnding(m.trustEnding.id, m.trustEnding.name, m.trustEnding.desc, '鏡子迷宮 · 信任路線結局');
              }
            }
          ]
        };

        SCENES['d13_m' + m.mirrorNum + '_shatter'] = {
          room: 'M' + m.mirrorNum + '-S',
          roomName: m.shatterEnding.name,
          sceneId: '13-結局' + (m.mirrorNum * 2),
          mood: 'tension',
          onEnter: function(){
            recordD13Ending(m.shatterEnding.id, m.shatterEnding.name, false, true);
          },
          text: [
            '<p>' + m.shatterEnding.desc + '</p>',
            '<p class="inherit-note">【已解鎖《鏡子迷宮》' + m.shatterEnding.name + '】（當前已收錄 ' + getD13UnlockedEndings().length + ' / 15 結局）</p>'
          ],
          choices: [
            { text: '返回萬鏡中樞大廳，繼續探索其他平行鏡面', next: 'd13_hub' },
            {
              text: '以此破鏡之路作為本局最終結局結算',
              action: function(){
                recordD13Ending(m.shatterEnding.id, m.shatterEnding.name, false, true);
                triggerEnding(m.shatterEnding.id, m.shatterEnding.name, m.shatterEnding.desc, '鏡子迷宮 · 打碎路線結局');
              }
            }
          ]
        };
      });

      SCENES.d13_ending_15 = {
        room: 'M15',
        roomName: D13_FINAL_ENDING_15.name,
        sceneId: '13-結局15',
        mood: 'safe',
        onEnter: function(){
          recordD13Ending(D13_FINAL_ENDING_15.id, D13_FINAL_ENDING_15.name, true, true);
        },
        text: [
          '<p>' + D13_FINAL_ENDING_15.desc + '</p>',
          '<p class="inherit-note">【已解鎖《鏡子迷宮》第 15 終極結局：' + D13_FINAL_ENDING_15.name + '】</p>'
        ],
        choices: [
          { text: '返回萬鏡中樞大廳檢視全部 15 個鏡面結局', next: 'd13_hub' },
          {
            text: '踏出無門之門，完成《鏡子迷宮》終極結算',
            action: function(){
              recordD13Ending(D13_FINAL_ENDING_15.id, D13_FINAL_ENDING_15.name, true, true);
              triggerEnding(D13_FINAL_ENDING_15.id, D13_FINAL_ENDING_15.name, D13_FINAL_ENDING_15.desc, '鏡子迷宮 · 第 15 終極結局');
            }
          }
        ]
      };
    }
  });
}

/* ============================================================
 * 8. P2-11: 成就再 +15（V62_NEW_ACHIEVEMENTS 共 15 個新成就）
 * ============================================================ */
var V62_NEW_ACHIEVEMENTS = [
  { id: 'ach_v62_d12_single',         name: '回聲初探',     desc: '回聲電梯單樓通關' },
  { id: 'ach_v62_ng_no_item',         name: '純粹輪迴',     desc: '不使用道具通關二周目' },
  { id: 'ach_v62_all_relics_used',    name: '物盡其用',     desc: '全信物用過（四種支線信物全部使用過）' },
  { id: 'ach_v62_outsider_max',       name: '門外知己',     desc: '門外之人好感滿並獲得全知之眼' },
  { id: 'ach_v62_d13_all_endings',    name: '萬鏡之主',     desc: '鏡子迷宮全結局（解鎖全部 15 個結局）' },
  { id: 'ach_v62_d13_first_clear',    name: '破鏡旅人',     desc: '首次通關第十三扇門《鏡子迷宮》' },
  { id: 'ach_v62_d13_trust_all',      name: '與己和解',     desc: '在《鏡子迷宮》中選擇信任鏡中的自己達成結局' },
  { id: 'ach_v62_d13_shatter_all',    name: '碎鏡前行',     desc: '在《鏡子迷宮》中選擇打碎鏡面達成結局' },
  { id: 'ach_v62_all_seeing_eye_win', name: '全知破敵',     desc: '持有「全知之眼」並在戰鬥中擊破敵人弱點' },
  { id: 'ach_v62_all_7_items_used',   name: '百寶戰術家',   desc: '在戰鬥中累計使用過全部 7 種弱點道具' },
  { id: 'ach_v62_fast_combat_clear',  name: '電光石火',     desc: '開啟「快速戰鬥」模式贏得一場遭遇戰' },
  { id: 'ach_v62_quick_resume',       name: '未完之門',     desc: '使用主選單「繼續上次」按鈕重返上次的門扉與場景' },
  { id: 'ach_v62_notebook_jumper',    name: '越界手札',     desc: '透過筆記本快捷跳轉功能直接切換門扉' },
  { id: 'ach_v62_skip_reveal',        name: '熟門熟路',     desc: '跳過主選單的門扉揭曉動畫' },
  { id: 'ach_v62_d13_true_one',       name: '無門之門',     desc: '解鎖《鏡子迷宮》第 15 終極結局【萬鏡歸一】' }
];

function registerV62Achievements(){
  if(window.V5 && typeof V5.addAchievements === 'function'){
    V5.addAchievements(1, V62_NEW_ACHIEVEMENTS);
  }
}

function checkV62Achievements(){
  try{
    if(typeof unlockAchievement !== 'function') return;
    if(window.V61 && typeof V61.getVisitedD12Floors === 'function' && V61.getVisitedD12Floors().length >= 1){
      unlockAchievement('ach_v62_d12_single');
    }
    if(window.V61 && typeof V61.getRelicUsedState === 'function'){
      var ru = V61.getRelicUsedState();
      if(ru.tram_stub && ru.memory_shard && ru.school_magazine && ru.cinema_clerk){
        unlockAchievement('ach_v62_all_relics_used');
      }
    }
    if(getOutsiderAffinity() >= 100){
      unlockAchievement('ach_v62_outsider_max');
    }
    if(getD13UnlockedEndings().length >= 15){
      unlockAchievement('ach_v62_d13_all_endings');
    }
  }catch(e){}
}

window.V62.V62_NEW_ACHIEVEMENTS = V62_NEW_ACHIEVEMENTS;
window.V62.checkV62Achievements = checkV62Achievements;

/* ============================================================
 * 9. P3-12: 效能優化（背景預載下一扇門 + 離屏場景不渲染）
 * ============================================================ */
var _preloadedDungeons = { 1: true };

function preloadNextDungeon(currentId){
  var cur = parseInt(currentId || window.currentDungeonId || 1, 10);
  var targets = [];
  if(cur >= 1 && cur < 13) targets.push(cur + 1);
  if(cur === 6) targets.push(7, 12);
  if(cur === 12) targets.push(13);

  var runner = window.requestIdleCallback || function(cb){ return setTimeout(cb, 40); };
  runner(function(){
    var savedState = window.state;
    var savedScenes = window.SCENES;
    var savedDid = window.currentDungeonId;
    try{
      targets.forEach(function(nextId){
        if(nextId >= 1 && nextId <= 13){
          if(window.V61 && typeof V61.ensureDungeonLoaded === 'function'){
            V61.ensureDungeonLoaded(nextId);
          }
          _preloadedDungeons[nextId] = true;
        }
      });
    }catch(e){}finally{
      window.state = savedState;
      window.SCENES = savedScenes;
      window.currentDungeonId = savedDid;
    }
  });
}

function isDungeonPreloaded(id){
  var numId = parseInt(id, 10);
  return !!(_preloadedDungeons[numId] || (window.V61 && V61.isDungeonLoaded && V61.isDungeonLoaded(numId)));
}

var _offscreenObserver = null;
function setupOffscreenNonRenderingObserver(){
  if(typeof IntersectionObserver !== 'function') return;
  if(_offscreenObserver) return;
  _offscreenObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.target){
        if(entry.isIntersecting){
          entry.target.removeAttribute('data-v62-offscreen');
        } else {
          entry.target.setAttribute('data-v62-offscreen', 'true');
        }
      }
    });
  }, { rootMargin: '120px 0px' });

  function observeNarrativeNodes(){
    var narr = document.getElementById('narrative');
    if(!narr) return;
    Array.prototype.forEach.call(narr.children, function(child){
      _offscreenObserver.observe(child);
    });
  }
  window.V62.observeNarrativeNodes = observeNarrativeNodes;
}

window.V62.preloadNextDungeon = preloadNextDungeon;
window.V62.isDungeonPreloaded = isDungeonPreloaded;

/* ============================================================
 * 10. 運行時掛鉤（進門扉預載下一扇門、二周目門外之人與跨輪記憶台詞、設定開關注入、回聲電梯與二周目無道具通關檢測）
 * ============================================================ */
var NG_DUNGEON_ENTRY_QUOTES = {
  1: '【NPC 跨輪記憶 · 蘇晚】蘇晚在旋轉門邊猛然抬起頭看向你：「等等……你手心裡的冷汗和上一次一模一樣。這一輪，你還是打算去推開 13 號房嗎？」',
  2: '【NPC 跨輪記憶 · 老周】借書台後的老周推了推老花眼鏡，低聲道：「你上次借走的那本人生空白頁，夾著上一輪的書籤。」',
  3: '【NPC 跨輪記憶 · 林建國醫生】林醫生按住胸口的聽診器，眼神震動：「我剛才在夢裡見過你……上一次 60 分鐘歸零時，你就站在手術室門外。」',
  4: '【NPC 跨輪記憶 · 守門人】守門人舉起無火提燈：「歡迎再次回到無盡之間，旅人。上一次你留下的腳印還沒乾透。」',
  5: '【NPC 跨輪記憶 · 觀潮者】海面傳來熟悉的嘆息：「潮水退去又漲起，這是你第二次踏入迴光之海了。」',
  6: '【NPC 跨輪記憶 · 陳教授】陳教授看著 03:17 的鐘面微笑：「我就知道你會帶著所有記憶重返觀測站。回聲電梯的電源已經為你接通了。」',
  7: '【NPC 跨輪記憶 · 鏡像自己】右車廂玻璃上的你敲了敲車窗：「嗨，第二輪的我們，這次別再弄丟車票了。」',
  8: '【NPC 跨輪記憶 · 主廚老陳】老陳擦著流理台笑道：「老客人！你上一輪點過的那道記憶料理，餘溫還在鍋裡呢。」',
  9: '【NPC 跨輪記憶 · 林小滿】1999 年的林小滿歪著頭看你：「好奇怪，你背書包的樣子，好像已經把未來的考卷全部寫完了一樣。」',
  10: '【NPC 跨輪記憶 · 售票員林默】林默晃了晃手裡的剪票鉗：「二周目的午夜場，我特意為你留了第一排正中央的座位。」',
  11: '【NPC 跨輪記憶 · 老園區長】園區長提著馬燈迎上前：「動物們昨晚就在說，那個帶著過去氣息的故人今晚會再來。」',
  12: '【NPC 跨輪記憶 · 電梯廣播】黃銅喇叭傳來溫柔的回音：「歡迎踏入回聲電梯，十二道平行時空的門扉已全部就緒。」',
  13: '【NPC 跨輪記憶 · 門外之人】門外之人站在萬鏡之前：「十五種平行世界的結局，正等待你的最終抉擇。」'
};

function injectOutsiderAndTacticalBarIntoScene(){
  var narr = document.getElementById('narrative');
  if(!narr) return;
  var did = parseInt(window.currentDungeonId || 1, 10);
  var isNg = localStorage.getItem('wuxian-ng-plus') === 'true';

  if(isNg && !narr.querySelector('.v62-outsider-gate-bar')){
    if(window.state && state.flags) state.flags.ng_npc_memory_triggered = true;
    var quote = NG_DUNGEON_ENTRY_QUOTES[did] || NG_DUNGEON_ENTRY_QUOTES[1];
    var aff = getOutsiderAffinity();
    var barHtml =
      '<div class="v62-outsider-gate-bar">' +
        '<div style="flex:1 1 260px;font-size:.78rem;line-height:1.55">' +
          '<div style="color:#f5df98;font-weight:600">' + quote + '</div>' +
          '<div style="color:var(--text-dim);margin-top:.2rem">' + SVG_EYE_V62 + ' 二周目專屬 NPC「門外之人」正在門扉門口徘徊（好感度：' + aff + '/100' + (hasAllSeeingEye() ? ' · 已獲全知之眼 ✓' : '') + '）</div>' +
        '</div>' +
        '<div style="display:flex;gap:.4rem;flex-wrap:wrap">' +
          '<button type="button" class="v4-btn primary" style="font-size:.73rem;padding:.28rem .65rem" onclick="V62.openOutsiderDialogModal(' + did + ')">與「門外之人」對話</button>' +
          '<button type="button" class="v4-btn" style="font-size:.73rem;padding:.28rem .65rem" onclick="V62.startDungeonCombat()">' + SVG_SWORD_V62 + ' 道具遭遇戰</button>' +
        '</div>' +
      '</div>';
    narr.insertAdjacentHTML('afterbegin', barHtml);
  } else if(!isNg && !narr.querySelector('.v62-tactical-bar')){
    narr.insertAdjacentHTML('beforeend',
      '<div class="v62-tactical-bar" style="margin-top:.65rem;display:flex;justify-content:flex-end">' +
        '<button type="button" class="v4-btn" style="font-size:.72rem;padding:.24rem .6rem;opacity:.85" onclick="V62.startDungeonCombat()">' + SVG_SWORD_V62 + ' 遭遇巡邏敵人（道具戰鬥）</button>' +
      '</div>'
    );
  }
}

function hookV62Runtime(){
  var _prevEnter = window.enterDungeon;
  window.enterDungeon = function(id, autoStart){
    var numId = parseInt(id, 10) || 1;
    var r = _prevEnter.apply(this, arguments);
    ensureCombatItemsInInventory();
    if(window.state){
      state.flags = state.flags || {};
      state.flags._usedAnyItemInRun = false;
      if(localStorage.getItem('wuxian-ng-plus') === 'true'){
        state.flags.ng_npc_memory_triggered = true;
      }
      if(!_isResumingSession && state.currentScene){
        saveLastSession(numId, state.currentScene);
      }
    }
    preloadNextDungeon(numId);
    setTimeout(function(){
      injectOutsiderAndTacticalBarIntoScene();
      if(window.V62.observeNarrativeNodes) window.V62.observeNarrativeNodes();
    }, 60);
    return r;
  };

  var _prevGoToScene = window.goToScene;
  window.goToScene = function(sceneId){
    var r = _prevGoToScene.apply(this, arguments);
    try{
      ensureCombatItemsInInventory();
      saveLastSession(window.currentDungeonId || 1, sceneId);
      var d12Match = String(sceneId).match(/^d12_floor_(\d+)$/);
      if(d12Match){
        var flNum = parseInt(d12Match[1], 10);
        if(window.V61 && typeof V61.markD12FloorVisited === 'function') V61.markD12FloorVisited(flNum);
        if(window.V4 && typeof V4.markDungeonCleared === 'function') V4.markDungeonCleared(12);
        if(typeof unlockAchievement === 'function') unlockAchievement('ach_v62_d12_single');
      }
      var d13Match = String(sceneId).match(/^d13_m(\d+)_(trust|shatter)$/);
      if(d13Match){
        var mIdx = parseInt(d13Match[1], 10) - 1;
        var isTr = (d13Match[2] === 'trust');
        var mMeta = D13_MIRRORS_META[mIdx];
        if(mMeta){
          var eObj = isTr ? mMeta.trustEnding : mMeta.shatterEnding;
          recordD13Ending(eObj.id, eObj.name, isTr, !isTr);
        }
      } else if(sceneId === 'd13_ending_15'){
        recordD13Ending(D13_FINAL_ENDING_15.id, D13_FINAL_ENDING_15.name, true, true);
      }
      injectOutsiderAndTacticalBarIntoScene();
      if(window.V62.observeNarrativeNodes) window.V62.observeNarrativeNodes();
    }catch(e){}
    return r;
  };

  if(window.V4 && typeof V4.markDungeonCleared === 'function' && !V4.markDungeonCleared.__v62){
    var _prevMark = V4.markDungeonCleared;
    V4.markDungeonCleared = function(id){
      var numId = parseInt(id, 10);
      var r = _prevMark.apply(this, arguments);
      if(numId === 12 && typeof unlockAchievement === 'function'){
        unlockAchievement('ach_v62_d12_single');
      }
      if(localStorage.getItem('wuxian-ng-plus') === 'true'){
        var usedItem = !!(window.state && state.flags && state.flags._usedAnyItemInRun);
        if(!usedItem && typeof unlockAchievement === 'function'){
          unlockAchievement('ach_v62_ng_no_item');
        }
      }
      checkV62Achievements();
      migrateAllLegacySavesToV3();
      return r;
    };
    V4.markDungeonCleared.__v62 = true;
  }

  if(window.V61 && typeof V61.setRelicUsed === 'function' && !V61.setRelicUsed.__v62){
    var _prevRelicUsed = V61.setRelicUsed;
    V61.setRelicUsed = function(key, used){
      var r = _prevRelicUsed.apply(this, arguments);
      checkV62Achievements();
      return r;
    };
    V61.setRelicUsed.__v62 = true;
  }

  var _prevRender = window.render;
  window.render = function(){
    var r = _prevRender ? _prevRender.apply(this, arguments) : null;
    ensureHubContinueLastButton();
    return r;
  };

  var settingsCard = document.querySelector('#settings-modal .modal-card') || document.getElementById('settings-modal');
  if(settingsCard && !document.getElementById('v62-chk-skip-reveal')){
    var row = document.createElement('div');
    row.style.cssText = 'margin-top:.65rem;padding-top:.65rem;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:.45rem;font-size:.8rem';
    row.innerHTML =
      '<label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer">' +
        '<span>永遠跳過揭曉動畫（通關回主選單直接顯示新門扉名）</span>' +
        '<input type="checkbox" id="v62-chk-skip-reveal">' +
      '</label>';
    var closeBtn = settingsCard.querySelector('.modal-close, .v4-actions');
    if(closeBtn && closeBtn.parentNode === settingsCard){
      settingsCard.insertBefore(row, closeBtn);
    } else {
      settingsCard.appendChild(row);
    }
    var skipChk = document.getElementById('v62-chk-skip-reveal');
    if(skipChk){
      skipChk.checked = isAlwaysSkipRevealEnabled() || localStorage.getItem('wuxian-v62-skip-reveal') === 'true';
      skipChk.onchange = function(){
        setAlwaysSkipReveal(skipChk.checked);
      };
    }
  }
}

/* ============================================================
 * 11. 註冊與啟動 v6.2.0
 * ============================================================ */
registerDungeon13MirrorMaze();
registerV62Achievements();

V5.registerSystem('v62-core-expansion', function(){
  upgradeSaveExportImportForV62();
  migrateAllLegacySavesToV3();
  if(window.V61 && typeof V61.ensureDungeonLoaded === 'function'){
    /* 確保第 13 扇門《鏡子迷宮》也納入懶載入快取管理 */
    V61.ensureDungeonLoaded(1);
  }
});

V5.onBoot(function(){
  try{
    /* 去重並歸位跨門扉成就：將專屬於 2–13 扇門的成就從第 1 扇門移除重複項，確保 ACH_TOTAL 精確無重複 */
    var seenInOtherDungeons = {};
    Object.keys(DUNGEON_CONFIG).forEach(function(id){
      if(String(id) === '1') return;
      if(DUNGEON_CONFIG[id] && Array.isArray(DUNGEON_CONFIG[id].achDefs)){
        var uniq = [];
        var localSeen = {};
        DUNGEON_CONFIG[id].achDefs.forEach(function(a){
          if(a && a.id && !localSeen[a.id]){
            localSeen[a.id] = true;
            seenInOtherDungeons[a.id] = true;
            uniq.push(a);
          }
        });
        DUNGEON_CONFIG[id].achDefs = uniq;
      }
    });
    if(DUNGEON_CONFIG[1] && Array.isArray(DUNGEON_CONFIG[1].achDefs)){
      var d1Uniq = [];
      var d1Seen = {};
      DUNGEON_CONFIG[1].achDefs.forEach(function(a){
        if(a && a.id && !d1Seen[a.id] && !seenInOtherDungeons[a.id]){
          d1Seen[a.id] = true;
          d1Uniq.push(a);
        }
      });
      DUNGEON_CONFIG[1].achDefs = d1Uniq;
    }
    var achTot = 0;
    Object.keys(DUNGEON_CONFIG).forEach(function(id){
      if(DUNGEON_CONFIG[id] && Array.isArray(DUNGEON_CONFIG[id].achDefs)){
        achTot += DUNGEON_CONFIG[id].achDefs.length;
      }
    });
    window.ACH_TOTAL = achTot;

    upgradeSaveExportImportForV62();
    upgradeCombatSystemForV62();
    setupNotebookShortcutAndJump();
    setupOffscreenNonRenderingObserver();
    hookV62Runtime();
    migrateAllLegacySavesToV3();
    ensureCombatItemsInInventory();
    preloadNextDungeon(1);

    window.VERSION = '6.2.0';
    window.SAVE_VERSION = '3.2';
    if(window.CHANGELOG && !window.CHANGELOG.some(function(c){ return c.version === '6.2.0'; })){
      window.CHANGELOG.unshift({
        version: '6.2.0',
        type: 'major',
        changes: [
          'P0 四大驗證與修復：驗證走完第 3 扇門後主線 1–3 顯示全名+✓、4 微光、5–6 ？？？；支線打完第 6 前整張顯示「打完主線解鎖」、打完第 6 後只顯示第 7 而 8–11 為？？？；舊存檔（v5.x/v6.0/v2）讀入後自動遷移至 v3 且匯出/匯入 JSON 全進度 100% 一致；二周目敵人 HP×1.5、ATK×1.3、跨輪記憶台詞與回聲電梯 12 樓全數可進；7 種戰鬥道具於全門扉（1–13）皆可使用、弱點 ×2／非弱點 ×0.5 計算精準，且道具用掉後立即從物品欄消失。',
          'P1 體驗優化：主選單通關揭曉動畫新增「跳過」按鈕與設定「永遠跳過揭曉動畫」開關；新增主選單「繼續上次」金色按鈕直接回到上次玩到一半的門扉與場景；支援遊戲中隨時按 N 鍵打開筆記本並從筆記本內快速跳轉至任何已解鎖門扉；新增「快速戰鬥」開關（預設關閉，開啟後跳過攻擊動畫直接顯示傷害數字）。',
          'P2 新內容擴充：新增第十三扇門《鏡子迷宮》（New Game+ 通關回聲電梯後解鎖，7 面平行世界之鏡「信任／打碎」雙路線 + 萬鏡歸一終章共 15 個結局）；新增二周目專屬 NPC「門外之人」（在所有門扉門口徘徊、記得旅人上輪選擇、對話透露隱藏劇情，好感度滿 100 贈予可看穿敵人弱點的「全知之眼」道具）；新增 +15 項成就（回聲初探、純粹輪迴、物盡其用、門外知己、萬鏡之主等）。',
          'P3 效能與手機適配：實裝背景預載下一扇門（在門扉 A 時背景預載門扉 B 消除切換卡頓）與離屏場景不渲染（content-visibility 與 IntersectionObserver）；手機雙指點擊開筆記改為長按 0.5 秒觸發防誤觸，且戰鬥按鈕在小手機上加大 20%。'
        ]
      });
    }

    ['title-version', 'hub-title-version'].forEach(function(id){
      var verEl = document.getElementById(id);
      if(verEl){
        var vTxt = 'v 6.2.0';
        verEl.textContent = vTxt;
        if(verEl.firstChild) verEl.firstChild.__origText = vTxt;
      }
    });

    if(typeof window.render === 'function'){
      window.render();
    }
    window.V62.__booted = true;
  }catch(e){
    console.error('v6.2 boot error:', e);
  }
});

})();
