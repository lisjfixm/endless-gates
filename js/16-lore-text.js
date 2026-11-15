
(function(){
'use strict';
if(window.V60 && window.V60.__booted) return;
window.V60 = window.V60 || {};

/* ============================================================
 * 1. P0 規格常數：主線長廊 (1–6) 與 支線迴廊 (7–11) 定義
 * ============================================================ */
var MAIN_IDS = [1, 2, 3, 4, 5, 6];
var SIDE_IDS = [7, 8, 9, 10, 11];

/* 「它為什麼存在」——支線與主線的關聯文案（更新書 P0 第 3 點原文） */
var WHY_IT_EXISTS = {
  7: '觀測站調校到一半，時間裂縫打開，電車是裂縫裡溢出的記憶列車。車上坐的都是你在主線裡見過的人。',
  8: '從電車下車後走進的一站。餐廳老闆認識你小時候。每道菜是某個主線NPC的記憶。',
  9: '吃飽後沿路走回小時候。你發現主線裡的選擇，其實在十二歲就埋下了。',
  10: '放學路上經過的電影院。四個廳分別是你四條主線路線的如果當初。',
  11: '電影散場後繞遠路回家。動物園關門了，但動物們還記得你。'
};

/* 支線連貫性信物定義（更新書 P0 第 4 點：7→8→9→10→11 繼承標記） */
var LS_SIDE_CHAIN = 'wuxian-v60-side-chain';
var SIDE_CHAIN_DEFS = [
  {
    key: 'tram_stub',
    fromId: 7,
    toId: 8,
    label: '7→8 鏡像電車票根',
    shortDesc: '在電車上撿到的票根，帶到自助餐可以打折'
  },
  {
    key: 'memory_shard',
    fromId: 8,
    toId: 9,
    label: '8→9 自助餐記憶碎片',
    shortDesc: '自助餐吃出來的記憶碎片，帶到小學1999會解鎖額外對話'
  },
  {
    key: 'school_magazine',
    fromId: 9,
    toId: 10,
    label: '9→10 小學1999校刊',
    shortDesc: '小學寫的校刊，帶到潮汐電影院可以換一張隱藏場次票'
  },
  {
    key: 'cinema_clerk',
    fromId: 10,
    toId: 11,
    label: '10→11 售票員的約定',
    shortDesc: '電影院認識的售票員，在動物園23:00會出現並給你一個道具'
  }
];

function loadSideChain(){
  var base = { tram_stub: false, memory_shard: false, school_magazine: false, cinema_clerk: false };
  try{
    var raw = localStorage.getItem(LS_SIDE_CHAIN);
    if(raw){
      var parsed = JSON.parse(raw);
      for(var k in base){ if(parsed && parsed[k]) base[k] = true; }
    }
  }catch(e){}
  /* 若旅人已通關對應前置支線，亦自動視為已持有該連貫標記，確保 7→8→9→10→11 連續體驗不斷鏈 */
  try{
    if(typeof isCleared === 'function'){
      if(isCleared(7)) base.tram_stub = true;
      if(isCleared(8)) base.memory_shard = true;
      if(isCleared(9)) base.school_magazine = true;
      if(isCleared(10)) base.cinema_clerk = true;
    }
  }catch(e){}
  return base;
}

function saveSideChainFlag(key, val){
  var cur = loadSideChain();
  cur[key] = (val !== false);
  try{ localStorage.setItem(LS_SIDE_CHAIN, JSON.stringify(cur)); }catch(e){}
  return cur;
}

function hasSideRelic(key){
  var cur = loadSideChain();
  return !!cur[key];
}

window.V60.loadSideChain = loadSideChain;
window.V60.saveSideChainFlag = saveSideChainFlag;
window.V60.hasSideRelic = hasSideRelic;
window.V60.WHY_IT_EXISTS = WHY_IT_EXISTS;

/* ============================================================
 * 2. SVG 圖示工具（嚴格遵守 no-emoji-vector-ui 規範）
 * ============================================================ */
var SVG_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
var SVG_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px"><polyline points="20 6 9 17 4 12"/></svg>';
var SVG_MAIN_GATE = '<svg class="v60-node-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15"/><path d="M9 21v-8a3 3 0 0 1 6 0v8"/><line x1="2" y1="21" x2="22" y2="21"/><circle cx="12" cy="8" r="1.2"/></svg>';
var SVG_SIDE_TRAM = '<svg class="v60-node-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="14" rx="2"/><line x1="4" y1="11" x2="20" y2="11"/><line x1="12" y1="3" x2="12" y2="11"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/><path d="M7 21l2-4"/><path d="M17 21l-2-4"/></svg>';
var SVG_COMPASS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5"/></svg>';
var SVG_LINK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

function tr(s){
  return (window.I18N && typeof I18N.t === 'function') ? I18N.t(s) : s;
}

/* ============================================================
 * 3. P0 第 2 點：支線依序解鎖（6→7→8→9→10→11）
 * ============================================================ */
function enforceSequentialUnlock(){
  /* 更新 V5._dungeonDefs 中 7–11 的 unlock 函數：6通關解鎖7，7→8→9→10→11 */
  if(window.V5 && V5._dungeonDefs){
    [7, 8, 9, 10, 11].forEach(function(id){
      if(V5._dungeonDefs[id]){
        V5._dungeonDefs[id].unlock = function(){
          if(window._gmUnlocked) return true;
          if(typeof window.hasPact === 'function' && window.hasPact('pact_voyager')) return true;
          return typeof window.isCleared === 'function' ? window.isCleared(id - 1) : false;
        };
      }
    });
  }

  /* 統一包裝 window.isUnlocked，確保 1→2→3→4→5→6 與 6→7→8→9→10→11 嚴格依序解鎖 */
  if(typeof window.isUnlocked === 'function' && !window.isUnlocked.__v60){
    window.isUnlocked = function(id){
      var numId = parseInt(id, 10);
      if(window._gmUnlocked) return true;
      if(typeof window.hasPact === 'function' && window.hasPact('pact_voyager')) return true;
      if(numId === 1) return true;
      if(numId >= 2 && numId <= 11){
        return typeof window.isCleared === 'function' ? window.isCleared(numId - 1) : false;
      }
      if(numId === 12){
        return localStorage.getItem('wuxian-ng-plus') === 'true' && (typeof window.isCleared === 'function' ? window.isCleared(6) : localStorage.getItem('wuxian-sixth-cleared') === 'true');
      }
      if(numId === 13){
        return localStorage.getItem('wuxian-ng-plus') === 'true' && (typeof window.isCleared === 'function' ? window.isCleared(12) : localStorage.getItem('wuxian-twelfth-cleared') === 'true');
      }
      return false;
    };
    window.isUnlocked.__v60 = true;
  }

  /* 升級 gmUnlockAll：一併解鎖 1–11 全部門扉與支線連貫信物 */
  if(typeof window.gmUnlockAll === 'function' && !window.gmUnlockAll.__v60){
    var _origGmUnlock = window.gmUnlockAll;
    window.gmUnlockAll = function(){
      window._gmUnlocked = true;
      [
        'wuxian-first-cleared','wuxian-second-cleared','wuxian-third-cleared',
        'wuxian-fourth-cleared','wuxian-fifth-cleared','wuxian-sixth-cleared',
        'wuxian-seventh-cleared','wuxian-eighth-cleared','wuxian-ninth-cleared',
        'wuxian-tenth-cleared','wuxian-eleventh-cleared'
      ].forEach(function(k){
        try{ localStorage.setItem(k, 'true'); }catch(e){}
      });
      ['tram_stub','memory_shard','school_magazine','cinema_clerk'].forEach(function(k){
        saveSideChainFlag(k, true);
      });
      if(_origGmUnlock) _origGmUnlock.apply(this, arguments);
      if(typeof window.render === 'function') window.render();
    };
    window.gmUnlockAll.__v60 = true;
  }

  /* 包裝 V4.markDungeonCleared：通關支線 7/8/9/10 時自動記錄對應的支線連貫信物 */
  if(window.V4 && typeof V4.markDungeonCleared === 'function' && !V4.markDungeonCleared.__v60){
    var _origMark = V4.markDungeonCleared;
    V4.markDungeonCleared = function(id){
      var r = _origMark.apply(this, arguments);
      if(id === 7) saveSideChainFlag('tram_stub', true);
      if(id === 8) saveSideChainFlag('memory_shard', true);
      if(id === 9) saveSideChainFlag('school_magazine', true);
      if(id === 10) saveSideChainFlag('cinema_clerk', true);
      return r;
    };
    V4.markDungeonCleared.__v60 = true;
  }
}

/* ============================================================
 * 4. P0 第 1 & 5 點：主選單兩層結構與主線(金)/支線(藍)視覺
 * ============================================================ */
var hubLayer = 1;         /* 1 = 第一層（兩大節點總覽）, 2 = 第二層（展開個別長廊門扉轉盤） */
var activeCorridor = 'main'; /* 'main' (1-6) | 'side' (7-11) */

window.V60.getHubLayer = function(){ return hubLayer; };
window.V60.getActiveCorridor = function(){ return activeCorridor; };

window.V60.openCorridorLayer2 = function(corridor, targetDungeonId){
  activeCorridor = (corridor === 'side') ? 'side' : 'main';
  hubLayer = 2;
  var ids = activeCorridor === 'side' ? SIDE_IDS : MAIN_IDS.concat([12, 13]);
  /* 定位到指定門扉，或該分區第一個已解鎖未通關的門扉 */
  var pickId = targetDungeonId;
  if(!pickId || ids.indexOf(pickId) === -1){
    pickId = ids[0];
    for(var i = 0; i < ids.length; i++){
      if(isUnlocked(ids[i]) && !isCleared(ids[i])){
        pickId = ids[i];
        break;
      } else if(isUnlocked(ids[i])){
        pickId = ids[i];
      }
    }
  }
  for(var j = 0; j < dungeons.length; j++){
    if(dungeons[j].id === pickId){
      currentIndex = j;
      break;
    }
  }
  if(typeof window.render === 'function') window.render();
};

window.V60.backToCorridorLayer1 = function(){
  hubLayer = 1;
  if(typeof window.render === 'function') window.render();
};

function buildHubTwoLayerDOM(){
  var hub = document.getElementById('hub-screen');
  if(!hub || document.getElementById('v60-hub-layer1')) return;

  var header = hub.querySelector('.hub-header');
  var stage = hub.querySelector('.dungeon-stage');
  if(!header || !stage) return;

  /* 1. 建立第一層：兩個大節點（「主線長廊」與「支線迴廊」） */
  var l1 = document.createElement('div');
  l1.id = 'v60-hub-layer1';
  hub.insertBefore(l1, stage);

  /* 2. 建立第二層頂部導覽與分區心智圖條 */
  var nav = document.createElement('div');
  nav.id = 'v60-corridor-nav';
  hub.insertBefore(nav, stage);

  /* 3. 在 .dungeon-card 內加入「它為什麼存在」展示框 */
  var card = stage.querySelector('.dungeon-card');
  var divider = card ? card.querySelector('.dungeon-divider') : null;
  if(card && divider && !document.getElementById('v60-why-exists')){
    var whyBox = document.createElement('div');
    whyBox.id = 'v60-why-exists';
    whyBox.className = 'v60-why-exists-box';
    whyBox.style.display = 'none';
    card.insertBefore(whyBox, divider);
  }
}

function renderLayer1Overview(){
  var l1 = document.getElementById('v60-hub-layer1');
  if(!l1) return;

  var mainCleared = MAIN_IDS.filter(function(id){ return isCleared(id); }).length;
  var sideCleared = SIDE_IDS.filter(function(id){ return isCleared(id); }).length;
  var sideUnlocked = isUnlocked(7);

  var mainPills = MAIN_IDS.map(function(id){
    var d = dungeons.filter(function(x){ return x.id === id; })[0];
    if(!d) return '';
    var c = isCleared(id);
    var u = isUnlocked(id);
    var icon = c ? SVG_CHECK : (!u ? SVG_LOCK : '');
    var cls = 'v60-mini-pill' + (c ? ' cleared' : (!u ? ' locked' : ''));
    var titleAttr = c ? tr('已通關') : (!u ? tr('打完第 ' + (id - 1) + ' 扇門解鎖') : tr('已解鎖'));
    return '<span class="' + cls + '" title="' + titleAttr + '" onclick="event.stopPropagation();V60.openCorridorLayer2(\'main\',' + id + ')">' +
      icon + '<span>' + id + ' ' + tr(d.name) + '</span></span>';
  }).join('<span class="v60-mm-arrow">→</span>');

  var sidePills = SIDE_IDS.map(function(id){
    var d = dungeons.filter(function(x){ return x.id === id; })[0];
    if(!d) return '';
    var c = isCleared(id);
    var u = isUnlocked(id);
    var icon = c ? SVG_CHECK : (!u ? SVG_LOCK : '');
    var cls = 'v60-mini-pill' + (c ? ' cleared' : (!u ? ' locked' : ''));
    var titleAttr = c ? tr('已通關') : (!u ? tr('打完第 ' + (id - 1) + ' 扇門解鎖') : tr('已解鎖'));
    return '<span class="' + cls + '" title="' + titleAttr + '" onclick="event.stopPropagation();V60.openCorridorLayer2(\'side\',' + id + ')">' +
      icon + '<span>' + id + ' ' + tr(d.name) + '</span></span>';
  }).join('<span class="v60-mm-arrow">→</span>');

  var sideUnlockStatus = sideUnlocked
    ? (SVG_CHECK + ' <span>' + tr('第 6 扇門已走過 · 歸途支線已開啟') + '</span>')
    : (SVG_LOCK + ' <span>' + tr('走完第 6 扇門解鎖') + '</span>');

  l1.innerHTML =
    '<div class="v60-l1-header">' +
      '<div class="v60-l1-kicker">CORRIDOR TOPOLOGY · TWO-LAYER MIND-MAP</div>' +
      '<div class="v60-l1-title">' + tr('選擇迴廊分區') + '</div>' +
      '<div class="v60-l1-sub">' + tr('第一層：選擇「主線長廊」或「支線迴廊」 · 點擊展開第二層門扉列表') + '</div>' +
    '</div>' +
    '<div class="v60-l1-grid">' +
      /* 主線長廊大節點（金色/暖色系） */
      '<div class="v60-corridor-node main-corridor" id="v60-node-main" onclick="V60.openCorridorLayer2(\'main\')" role="button" tabindex="0">' +
        '<div>' +
          '<div class="v60-node-top">' +
            '<span class="v60-node-badge">' + tr('第一層節點 I · 金色暖調') + '</span>' +
            '<span class="v60-node-badge">' + SVG_CHECK + ' ' + tr('進度') + ' ' + mainCleared + ' / 6</span>' +
          '</div>' +
          '<div class="v60-node-title-row">' +
            SVG_MAIN_GATE +
            '<div class="v60-node-title">' + tr('主線長廊') + '</div>' +
          '</div>' +
          '<div class="v60-node-desc">' +
            tr('陸衍穿越 03:17 時間夾縫的六道核心門扉（1–6 強制順序解鎖）：從質數旅館、沉默圖書館、倒計時醫院，一路抵達終焉觀測站。') +
          '</div>' +
          '<div class="v60-mini-chain">' + mainPills + '</div>' +
        '</div>' +
        '<div class="v60-node-footer">' +
          '<span class="v60-node-unlock-hint">' + SVG_CHECK + ' <span>' + tr('1 → 2 → 3 → 4 → 5 → 6 順序推進') + '</span></span>' +
          '<button type="button" class="v60-node-enter-btn">' + tr('展開主線長廊 ›') + '</button>' +
        '</div>' +
      '</div>' +

      /* 支線迴廊大節點（藍色/冷色系） */
      '<div class="v60-corridor-node side-corridor" id="v60-node-side" onclick="V60.openCorridorLayer2(\'side\')" role="button" tabindex="0">' +
        '<div>' +
          '<div class="v60-node-top">' +
            '<span class="v60-node-badge">' + tr('第一層節點 II · 藍色冷調') + '</span>' +
            '<span class="v60-node-badge">' + SVG_CHECK + ' ' + tr('進度') + ' ' + sideCleared + ' / 5</span>' +
          '</div>' +
          '<div class="v60-node-title-row">' +
            SVG_SIDE_TRAM +
            '<div class="v60-node-title">' + tr('支線迴廊') + '</div>' +
          '</div>' +
          '<div class="v60-node-desc">' +
            tr('打完第 6 關之後，主角一路走回家的連續旅程（6→7→8→9→10→11 依序解鎖）：搭乘鏡像電車、走進自助餐、重返小學 1999、經過潮汐電影院、夜訪動物園 23:00。') +
          '</div>' +
          '<div class="v60-mini-chain">' + sidePills + '</div>' +
        '</div>' +
        '<div class="v60-node-footer">' +
          '<span class="v60-node-unlock-hint">' + sideUnlockStatus + '</span>' +
          '<button type="button" class="v60-node-enter-btn">' + tr('展開支線迴廊 ›') + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function renderLayer2Nav(currentDungeon){
  var nav = document.getElementById('v60-corridor-nav');
  if(!nav) return;

  var ids = activeCorridor === 'side' ? SIDE_IDS : MAIN_IDS.concat([12, 13]);
  var mmNodes = ids.map(function(id){
    var d = dungeons.filter(function(x){ return x.id === id; })[0];
    if(!d) return '';
    var c = isCleared(id);
    var u = isUnlocked(id);
    var isCur = (currentDungeon && currentDungeon.id === id);
    var icon = c ? SVG_CHECK : (!u ? SVG_LOCK : '');
    var lockTip = !u ? (' (' + tr('打完第 ' + (id - 1) + ' 扇門解鎖') + ')') : '';
    var cls = 'v60-mm-node' + (isCur ? ' active' : '') + (c ? ' cleared' : '') + (!u ? ' locked' : '');
    return '<button type="button" class="' + cls + '" title="' + tr(d.name) + lockTip + '" onclick="V60.openCorridorLayer2(\'' + activeCorridor + '\',' + id + ')">' +
      icon + '<span>' + id + ' ' + tr(d.name) + '</span></button>';
  }).join('<span class="v60-mm-arrow">→</span>');

  nav.innerHTML =
    '<div class="v60-nav-top-row">' +
      '<button type="button" class="v60-back-l1-btn" id="v60-back-l1-btn" onclick="V60.backToCorridorLayer1()">‹ ' + tr('返回兩層分區總覽') + '</button>' +
      '<div class="v60-corridor-tabs">' +
        '<button type="button" class="v60-corridor-tab tab-main' + (activeCorridor === 'main' ? ' active' : '') + '" onclick="V60.openCorridorLayer2(\'main\')">' +
          tr('主線長廊 (1–6)') +
        '</button>' +
        '<button type="button" class="v60-corridor-tab tab-side' + (activeCorridor === 'side' ? ' active' : '') + '" onclick="V60.openCorridorLayer2(\'side\')">' +
          tr('支線迴廊 (7–11)') +
        '</button>' +
      '</div>' +
    '</div>' +
    '<div class="v60-mindmap-strip" role="navigation" aria-label="Corridor Mind-Map">' +
      mmNodes +
    '</div>';
}

function upgradeHubRenderAndSwitcher(){
  buildHubTwoLayerDOM();

  /* 包裝 switchDungeon(dir)：只在同一分區（主線 1–6 或 支線 7–11）內切換 */
  window.switchDungeon = function(dir){
    var ids = activeCorridor === 'side' ? SIDE_IDS : MAIN_IDS.concat([12, 13]);
    var curD = dungeons[currentIndex];
    var pos = curD ? ids.indexOf(curD.id) : 0;
    if(pos === -1) pos = 0;
    var nextPos = pos + dir;
    if(nextPos < 0 || nextPos >= ids.length) return;
    var targetId = ids[nextPos];
    for(var i = 0; i < dungeons.length; i++){
      if(dungeons[i].id === targetId){
        currentIndex = i;
        break;
      }
    }
    window.render();
  };

  /* 包裝 renderDots()：只渲染當前分區的圓點（主線 6 顆 或 支線 5 顆） */
  window.renderDots = function(){
    var c = document.getElementById('switch-dots');
    if(!c) return;
    c.innerHTML = '';
    var ids = activeCorridor === 'side' ? SIDE_IDS : MAIN_IDS.concat([12, 13]);
    var curD = dungeons[currentIndex];
    ids.forEach(function(id){
      var dIdx = -1;
      for(var i = 0; i < dungeons.length; i++){
        if(dungeons[i].id === id){ dIdx = i; break; }
      }
      if(dIdx === -1) return;
      var dot = document.createElement('button');
      var u = isUnlocked(id);
      var cl = isCleared(id);
      dot.className = 'switch-dot' + (curD && curD.id === id ? ' active' : '') + (!u ? ' locked-dot' : '') + (cl ? ' cleared-dot' : '');
      dot.title = id + ' ' + tr(dungeons[dIdx].name) + (cl ? (' ✓ ' + tr('已通關')) : (!u ? (' (' + tr('打完第 ' + (id - 1) + ' 扇門解鎖') + ')') : ''));
      dot.onclick = function(){ currentIndex = dIdx; window.render(); };
      c.appendChild(dot);
    });
  };

  /* 包裝 render()：支援兩層結構、主支線配色、鎖頭+「打完第X門扉解鎖」、已通關打勾、支線關聯文案與連貫信物 */
  var _origRender = window.render;
  window.render = function(){
    buildHubTwoLayerDOM();
    var d = dungeons[currentIndex] || dungeons[0];
    if(d){
      activeCorridor = (d.id >= 7 && d.id <= 11) ? 'side' : 'main';
    }
    var hub = document.getElementById('hub-screen');
    if(hub){
      hub.classList.toggle('v60-layer-1', hubLayer === 1);
      hub.classList.toggle('v60-layer-2', hubLayer === 2);
      hub.classList.toggle('v60-theme-main', activeCorridor === 'main');
      hub.classList.toggle('v60-theme-side', activeCorridor === 'side');
    }

    if(_origRender) _origRender.apply(this, arguments);

    renderLayer1Overview();
    renderLayer2Nav(d);

    if(!d) return;
    var unlocked = isUnlocked(d.id);
    var cleared = isCleared(d.id);
    var prevId = d.id - 1;
    var lockRequirementText = tr('打完第 ' + prevId + ' 扇門解鎖');

    /* 更新門扉索引標籤（標明主線長廊 / 支線迴廊） */
    var idxEl = document.getElementById('dungeon-index');
    if(idxEl){
      var prefix = (d.id >= 7 && d.id <= 11) ? tr('支線迴廊') : tr('主線長廊');
      idxEl.textContent = prefix + ' · ' + tr(d.index);
    }

    /* 未解鎖顯示鎖頭 +「打完第X門扉解鎖」 */
    var lockBadge = document.getElementById('lock-badge');
    if(lockBadge){
      if(!unlocked){
        lockBadge.style.display = 'inline-flex';
        lockBadge.innerHTML = SVG_LOCK + ' <span>' + lockRequirementText + '</span>';
      } else {
        lockBadge.style.display = 'none';
      }
    }

    /* 已通關顯示打勾 ✓ / 未解鎖顯示打完第X門扉解鎖 */
    var dot = document.getElementById('status-dot');
    var txt = document.getElementById('status-text');
    if(dot && txt){
      if(cleared){
        dot.className = 'status-dot cleared';
        txt.className = 'status-text cleared';
        txt.innerHTML = SVG_CHECK + ' <span>✓ ' + tr('已 通 關') + '</span>';
      } else if(!unlocked){
        dot.className = 'status-dot locked';
        txt.className = 'status-text locked';
        txt.innerHTML = SVG_LOCK + ' <span>' + lockRequirementText + '</span>';
      } else {
        dot.className = 'status-dot available';
        txt.className = 'status-text available';
        txt.textContent = tr('未 通 關');
      }
    }

    /* 進入按鈕文字 */
    var btn = document.getElementById('enter-btn');
    if(btn){
      btn.disabled = !unlocked;
      if(unlocked){
        btn.innerHTML = (cleared ? (SVG_CHECK + ' ') : '') + tr('推 門 進 入');
      } else {
        btn.innerHTML = SVG_LOCK + ' ' + lockRequirementText;
      }
    }

    /* 切換箭頭邊界（限制在當前長廊範圍內） */
    var ids = activeCorridor === 'side' ? SIDE_IDS : MAIN_IDS.concat([12, 13]);
    var posInCorridor = ids.indexOf(d.id);
    var prevBtn = document.getElementById('prev-btn');
    var nextBtn = document.getElementById('next-btn');
    if(prevBtn) prevBtn.disabled = (posInCorridor <= 0);
    if(nextBtn) nextBtn.disabled = (posInCorridor === -1 || posInCorridor >= ids.length - 1);

    /* 支線與主線關聯文案（「它為什麼存在」） */
    var whyBox = document.getElementById('v60-why-exists');
    if(whyBox){
      if(WHY_IT_EXISTS[d.id]){
        whyBox.style.display = 'block';
        whyBox.innerHTML =
          '<div class="v60-why-exists-label">' + SVG_COMPASS + ' <span>' + tr('它為什麼存在 · 歸途與主線的連結') + '</span></div>' +
          '<div>' + tr(WHY_IT_EXISTS[d.id]) + '</div>';
      } else {
        whyBox.style.display = 'none';
      }
    }

    /* 若在支線迴廊，底部繼承列同時展示 7→8→9→10→11 支線連貫信物狀態 */
    var strip = document.getElementById('inherit-strip');
    if(strip && activeCorridor === 'side'){
      var chain = loadSideChain();
      var sideChips = SIDE_CHAIN_DEFS.map(function(def){
        var active = !!chain[def.key];
        return '<span class="inherit-chip v60-side-chip' + (active ? '' : ' locked-relic') + '" title="' + tr(def.shortDesc) + '">' +
          (active ? SVG_CHECK : SVG_LINK) + '<span>' + tr(def.label) + '</span></span>';
      });
      strip.innerHTML = sideChips.join('');
    }

    window.renderDots();
  };

  /* 升級 showPreview()：補齊第 7–11 支線門扉簡介與「它為什麼存在」及解鎖條件 */
  window.showPreview = function(){
    var d = dungeons[currentIndex] || dungeons[0];
    if(!d) return;
    $('preview-title').textContent = tr(d.name);
    var corLabel = d.id >= 7 ? tr('支線迴廊') : tr('主線長廊');
    $('preview-subtitle').textContent = corLabel + ' · ' + tr(d.index);
    var texts = {
      1:['「13號房。」','一座只有質數房間的旅館。每一扇門後面都是一個房間，每一個房間裡都有一個謎題。','你需要在黎明之前找到出口。旅館裡住著各懷鬼胎的房客，走廊盡頭的鏡子裡藏著另一個你。','算得出門牌是一回事，分得清誰在說謊，是另一回事。','你的選擇將影響後續門扉——誰生還，誰留下，誰成為你未來路上的籌碼。'],
      2:['「請保持安靜。」','一座沒有聲音的圖書館。書架上的每一本書，都記錄著一個人的一生。','規則只有一條：不能大聲說話。違者，被書架吞噬。','誰都不確定自己到底算不算出聲。管理員只給你三個問題，別問錯。','走完第 1 扇門解鎖。你的選擇將影響第二扇門的開局。'],
      3:['「時間正在流逝。」','一座廢棄的醫院。每個受困者都有一個倒計時，時間到了會重置——失去所有物品和記憶。','時間一點一滴在走。藥品能給你買幾分鐘，病歷裡埋著真相。','醫院的地下二樓有一個「活的」東西，在吃人的記憶。它在等它的爸爸。','走完第 2 扇門解鎖。你的選擇將影響最終結局。'],
      4:['「門後沒有規則。」','穿過旅館、圖書館與醫院之後，你第一次站到迴廊本身的「心臟」。','三扇舊門安靜地立在四周，大門前守門人提著一盞沒有火的燈。','這裡沒有倒計時，也沒有獵殺者。只有一個問題：走過這一切之後，你要如何面對那個凌晨三點十七分？','走完第 3 扇門解鎖。集齊九枚迴廊碎片可開啟真結局「無盡之門」。'],
      5:['「海會漲，也會退。」','穿過迴廊的心臟後，你沉入收容所有「未選擇的路」與遺忘時刻的幽暗之海。','潮汐在這裡一進一退：退潮露出半沉的海床與未推開的門，漲潮浮起通往燈塔的光筏。','消耗迴光粒可以倒帶上一個選擇，但倒帶也有盡頭。','走完第 4 扇門解鎖。'],
      6:['「03:17 之後的一分鐘。」','迴廊最頂層的觀測站——凌晨三點十七分與三點十八分之間的夾縫。','無數台監視器播放著每一扇門扉、每一次輪迴的截面，桌上的冷咖啡還維持著傾倒的瞬間。','調校頻率、解開質數曲線偏離的最後一頁，決定是永遠留在觀測席，還是推開通往 03:18 的破曉之門。','走完第 5 扇門解鎖。通關本關後將開啟「支線迴廊」回家之旅。'],
      7:['【它為什麼存在】觀測站調校到一半，時間裂縫打開，電車是裂縫裡溢出的記憶列車。車上坐的都是你在主線裡見過的人。','一輛不斷行駛的地下電車，左頁是你所在的「正軌車廂」，右頁是車窗對面的「鏡像車廂」，兩邊生命值互相連動。','【支線連貫 7→8】在電車上撿到的「鏡像電車票根」，帶到下一關「無盡自助餐」可以找老闆打折。','走完第 6 扇門解鎖。'],
      8:['【它為什麼存在】從電車下車後走進的一站。餐廳老闆認識你小時候。每道菜是某個主線NPC的記憶。','每品嚐一道料理將讀取 200 字微型人生並累積飽食度；出示電車票根可向老闆打折減輕飽食負擔。','【支線連貫 8→9】在自助餐吃出來的「主線NPC記憶碎片」，帶到下一關「小學1999」會解鎖額外對話。','走完第 7 扇門解鎖。'],
      9:['【它為什麼存在】吃飽後沿路走回小時候。你發現主線裡的選擇，其實在十二歲就埋下了。','重返 1999 年盛夏的六年三班教室、紅土操場、福利社與校刊編輯室，化解十二歲自己的「童年選擇偏誤」。','【支線連貫 9→10】在小學寫下的《1999校刊》，帶到下一關「潮汐電影院」可以向售票員換一張隱藏場次票。','走完第 8 扇門解鎖。'],
      10:['【它為什麼存在】放學路上經過的電影院。四個廳分別是你四條主線路線的如果當初。','A廳驚悚不能回頭、B廳愛情必須告白、C廳武俠必須拔刀、D廳科幻邏輯反射；持小學校刊可兌換「第零廳·隱藏場次票」。','【支線連貫 10→11】在電影院認識的售票員林默，散場後會在下一關「動物園23:00」出現並給你一個專屬道具。','走完第 9 扇門解鎖。'],
      11:['【它為什麼存在】電影散場後繞遠路回家。動物園關門了，但動物們還記得你。','晚上十一點閉園後的市立動物園，餵食動物可喚醒童年記憶碎片，電影院認識的售票員也會在此現身助你一臂之力。','在午夜 24:00 廣播響起前帶著清醒的人性與童年記憶回到正門，走完這趟漫長的回家之路。','走完第 10 扇門解鎖。']
    };
    var arr = texts[d.id] || texts[1];
    $('preview-text').innerHTML = arr.map(function(tLine, i){
      return i === arr.length - 1
        ? '<p style="color:var(--v60-accent,var(--accent));margin-top:1rem">' + tr(tLine) + '</p>'
        : '<p>' + tr(tLine) + '</p>';
    }).join('');
    $('preview-modal').classList.add('show');
  };
}

/* ============================================================
 * 5. P0 第 1 點：分支圖 / 心智圖彈窗 (#branch-dungeon-modal) 兩層結構
 * ============================================================ */
var bdLayer = 1;
var bdCategory = 'main';

window.V60.openBranchCategory = function(cat){
  bdLayer = 2;
  bdCategory = (cat === 'side') ? 'side' : 'main';
  renderBranchDungeonModalContent();
};

window.V60.backToBranchLayer1 = function(){
  bdLayer = 1;
  renderBranchDungeonModalContent();
};

function renderBranchDungeonModalContent(){
  var list = document.getElementById('branch-dungeon-list');
  if(!list) return;
  list.innerHTML = '';

  if(bdLayer === 1){
    var mainCleared = MAIN_IDS.filter(function(id){ return isCleared(id); }).length;
    var sideCleared = SIDE_IDS.filter(function(id){ return isCleared(id); }).length;
    var wrap = document.createElement('div');
    wrap.className = 'v60-bd-layer1';
    wrap.innerHTML =
      '<div style="font-size:.75rem;color:var(--text-dim);margin-bottom:.25rem;text-align:center">' +
        tr('第一層：選擇要檢視心智圖的迴廊分區') +
      '</div>' +
      '<button type="button" class="v60-bd-cat-btn main-cat" onclick="V60.openBranchCategory(\'main\')">' +
        '<div class="v60-bd-cat-title">' +
          '<span>' + tr('主線長廊 (1–6)') + '</span>' +
          '<span style="font-size:.75rem">' + SVG_CHECK + ' ' + mainCleared + ' / 6 ›</span>' +
        '</div>' +
        '<div class="v60-bd-cat-sub">' + tr('1 質數旅館 → 2 沉默圖書館 → 3 倒計時醫院 → 4 無盡之間 → 5 迴光之海 → 6 終焉觀測站') + '</div>' +
      '</button>' +
      '<button type="button" class="v60-bd-cat-btn side-cat" onclick="V60.openBranchCategory(\'side\')">' +
        '<div class="v60-bd-cat-title">' +
          '<span>' + tr('支線迴廊 (7–11)') + '</span>' +
          '<span style="font-size:.75rem">' + SVG_CHECK + ' ' + sideCleared + ' / 5 ›</span>' +
        '</div>' +
        '<div class="v60-bd-cat-sub">' + tr('7 鏡像電車 → 8 無盡自助餐 → 9 小學1999 → 10 潮汐電影院 → 11 動物園23:00') + '</div>' +
      '</button>';
    list.appendChild(wrap);
    return;
  }

  /* 第二層：展開所選分區的門扉列表 */
  var topBar = document.createElement('div');
  topBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:.45rem;gap:.5rem';
  topBar.innerHTML =
    '<button type="button" class="v60-back-l1-btn" onclick="V60.backToBranchLayer1()">‹ ' + tr('返回上層分區') + '</button>' +
    '<span style="font-size:.75rem;color:' + (bdCategory === 'side' ? '#38bdf8' : '#d4af37') + '">' +
      (bdCategory === 'side' ? tr('支線迴廊 (7–11)') : tr('主線長廊 (1–6)')) +
    '</span>';
  list.appendChild(topBar);

  var targetIds = bdCategory === 'side' ? SIDE_IDS : MAIN_IDS;
  var isGM = !!window._gmUnlocked;

  targetIds.forEach(function(id){
    var d = dungeons.filter(function(x){ return x.id === id; })[0];
    if(!d) return;
    var unlocked = isGM || isUnlocked(d.id);
    var cleared = isCleared(d.id);
    var btn = document.createElement('button');
    btn.className = 'branch-dungeon-btn' + (bdCategory === 'side' ? ' side-branch-btn' : '') + (unlocked ? '' : ' locked');
    var statusBadge = '';
    if(cleared){
      statusBadge = '<span class="bd-lock" style="color:' + (bdCategory === 'side' ? '#38bdf8' : '#d4af37') + '">' + SVG_CHECK + ' ✓ ' + tr('已通關') + '</span>';
    } else if(!unlocked){
      statusBadge = '<span class="bd-lock">' + SVG_LOCK + ' ' + tr('打完第 ' + (d.id - 1) + ' 扇門解鎖') + '</span>';
    } else {
      statusBadge = '<span class="bd-lock" style="color:var(--text)">' + tr('可進入') + '</span>';
    }
    btn.innerHTML =
      '<span class="bd-index">' + tr(d.index) + '</span>' +
      '<span class="bd-name">' + tr(d.name) + '</span>' +
      statusBadge;
    if(unlocked){
      btn.addEventListener('click', function(){
        closeModal('branch-dungeon-modal');
        openBranchTreeForDungeon(d.id, sceneRefs[d.id], stateRefs[d.id]);
      });
    }
    list.appendChild(btn);
  });
}

function upgradeBranchDungeonSelect(){
  window.openBranchDungeonSelect = function(){
    bdLayer = 1;
    renderBranchDungeonModalContent();
    var m = document.getElementById('branch-dungeon-modal');
    if(m) m.classList.add('show');
  };
}

/* ============================================================
 * 6. P0 第 3 & 4 點：支線關聯文案與 7→8→9→10→11 支線連貫劇情互動
 * ============================================================ */
function registerV60SideContinuityStories(){
  /* 為 7–11 序章頂部注入「它為什麼存在」歸途引言，並掛載連貫信物互動 */
  function prependWhyItExistsToScene(sc, dungeonId){
    if(!sc || sc.__v60WhyAdded) return;
    var whyText = WHY_IT_EXISTS[dungeonId];
    if(!whyText) return;
    var bannerHTML = '<p class="v60-prologue-why"><strong>【歸途紀事 · 它為什麼存在】</strong><br>' + whyText + '</p>';
    if(Array.isArray(sc.text)){
      sc.text.unshift(bannerHTML);
    }
    sc.__v60WhyAdded = true;
  }

  /* 第 7 扇門：鏡像電車 —— 撿取「鏡像電車票根」(7→8) */
  V5.registerStoryPack(7, {
    scenes: {
      d7_v60_ticket_pickup: {
        room: '票', roomName: '第一車廂 · 座位夾縫的票根', sceneId: '7-連貫票根', mood: 'safe',
        onEnter: function(){
          saveSideChainFlag('tram_stub', true);
          state.flags.v60_picked_tram_stub = true;
        },
        text: [
          '<p>你在靠窗座位底下拾起一張印著銀色齒孔的<strong>「鏡像電車票根」</strong>。</p>',
          '<p>車票正面印著「03:17 觀測站裂縫線 → 終點：回家路上」，背面則蓋著一枚帶著濃郁湯香的暗紅色印章：</p>',
          '<p class="inherit-note">【支線連貫信物 7→8：鏡像電車票根】<br>「憑本車票存根，下車後前往下一站《無盡自助餐》結帳可享歸途半價打折優惠，並可向餐廳老闆換取主線同伴的記憶結晶。」</p>'
        ],
        choices: [
          {
            text: '將「鏡像電車票根」妥善收進大衣口袋，返回第一車廂',
            action: function(){
              if(!hasItem('v60_tram_stub')){
                addItem('v60_tram_stub', '鏡像電車票根', '在鏡像電車撿到的車票存根，帶到第八扇門「無盡自助餐」可以打折（支線連貫 7→8）。');
              }
              goToScene('d7_hub');
            }
          }
        ]
      }
    },
    inject: [
      {
        into: 'd7_prologue',
        choice: {
          text: '【支線連貫 7→8】撿起腳邊從時間裂縫飄落的「鏡像電車票根」',
          condition: function(){ return !hasItem('v60_tram_stub'); },
          action: function(){
            saveSideChainFlag('tram_stub', true);
            addItem('v60_tram_stub', '鏡像電車票根', '在鏡像電車撿到的車票存根，帶到第八扇門「無盡自助餐」可以打折（支線連貫 7→8）。');
            appendNarrative('<p class="inherit-note">【獲得支線連貫信物：鏡像電車票根】車票背面寫著：「下車後前往《無盡自助餐》可憑票根向餐廳老闆打折。」</p>');
          }
        }
      },
      {
        into: 'd7_hub',
        choice: {
          text: '【支線連貫 7→8】查看座位下閃著微光的「鏡像電車票根」',
          condition: function(){ return !hasItem('v60_tram_stub'); },
          next: 'd7_v60_ticket_pickup'
        }
      }
    ]
  });

  /* 第 8 扇門：無盡自助餐 —— 電車票根打折 (7→8) & 凝結「自助餐記憶碎片」(8→9) */
  V5.registerStoryPack(8, {
    scenes: {
      d8_v60_ticket_discount: {
        room: '折', roomName: '無盡自助餐 · 老老闆的半價人情', sceneId: '8-票根打折', mood: 'safe',
        onEnter: function(){
          state.flags.v60_discount_used = true;
          saveSideChainFlag('memory_shard', true);
        },
        text: [
          '<p>你從大衣口袋裡掏出那張在<strong>「鏡像電車」</strong>上撿到的票根，放在結帳天平旁。</p>',
          '<p>餐廳老闆（主廚老陳）愣了一下，摘下老花眼鏡仔細端詳著票根上的齒孔，臉上露出恍然又慈祥的笑意：「原來你是搭那班裂縫電車下來的啊……小陸衍，你還記得嗎？你十二歲那年放學下大雨迷了路，也是跑進我這間店裡避雨，我給你煮了一碗熱湯麵。」</p>',
          '<p>老闆用紅筆在你的帳單上重重畫了一個「五折」的勾，並從保溫櫃最底層取出一枚散發著微光的琥珀色結晶遞給你：「既然有電車票根，今天這頓算你半價！這枚<strong>『自助餐記憶碎片』</strong>裡封存著蘇晚、老周他們在主線裡的記憶，你待會兒順著路走回 1999 年的小學時，拿給十二歲的自己看看吧。」</p>',
          '<p class="inherit-note">【支線連貫 7→8 生效：票根打折】<br>• 飽食度負擔立即減輕 15%，生命值回復 +20，且結帳離席所需的最低飽食度門檻打折降至 40%！<br>• 同時獲得下一關連貫信物【8→9 自助餐記憶碎片】！</p>'
        ],
        choices: [
          {
            text: '向餐廳老闆道謝，收下「自助餐記憶碎片」與打折帳單',
            action: function(){
              state.satiety = Math.max(0, (state.satiety || 0) - 15);
              if(state.flags) state.flags.satiety = state.satiety;
              state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + 20);
              updateHP();
              if(window.V58 && typeof V58.updateHUD === 'function') V58.updateHUD();
              if(!hasItem('v60_memory_shard')){
                addItem('v60_memory_shard', '自助餐記憶碎片', '在無盡自助餐吃出來的記憶結晶，帶到第九扇門「小學1999」會解鎖額外對話（支線連貫 8→9）。');
              }
              goToScene('d8_hub');
            }
          }
        ]
      }
    },
    inject: [
      {
        into: 'd8_hub',
        choice: {
          text: '【支線連貫 7→8】向餐廳老闆出示「鏡像電車票根」申請餐費打折（並凝結記憶碎片）',
          condition: function(){ return (hasSideRelic('tram_stub') || hasItem('v60_tram_stub') || isCleared(7)) && !(state.flags && state.flags.v60_discount_used); },
          next: 'd8_v60_ticket_discount'
        }
      },
      {
        into: 'd8_cashier',
        choice: {
          text: '【支線連貫 7→8 · 票根打折結帳】憑「鏡像電車票根」以半價門檻（飽食度 ≥ 40%）優惠結帳離席',
          condition: function(){ return (hasSideRelic('tram_stub') || (state.flags && state.flags.v60_discount_used)) && (state.satiety || 0) >= 40; },
          action: function(){
            saveSideChainFlag('memory_shard', true);
            goToScene('d8_end_normal');
          }
        }
      }
    ]
  });

  /* 第 9 扇門：小學 1999 —— 自助餐記憶碎片解鎖額外對話 (8→9) & 撰寫「小學1999校刊」(9→10) */
  V5.registerStoryPack(9, {
    scenes: {
      d9_v60_shard_dialogue: {
        room: '憶', roomName: '六年三班 · 記憶碎片的跨時空對話', sceneId: '9-記憶額外對話', mood: 'safe',
        onEnter: function(){
          state.flags.v60_shard_talked = true;
          state.flags.childBias = 0;
          saveSideChainFlag('school_magazine', true);
        },
        text: [
          '<p>你從口袋裡取出那枚在無盡自助餐凝結的<strong>「自助餐記憶碎片」</strong>，輕輕放在六年三班靠窗的木頭課桌上。</p>',
          '<p>十二歲的「小陸衍」與同桌林小滿好奇地湊過頭來。琥珀色的碎片在盛夏的陽光下折射出四幕清晰的倒影——那是你在質數旅館替蘇晚擋下虛空、在沉默圖書館與老周屏息同行、在倒計時醫院守護媛媛病歷、以及在終焉觀測站按下破曉頻率的瞬間。</p>',
          '<p>小陸衍怔怔地看著碎片裡長大後的自己，突然翻開抽屜裡的《1999 世紀末校刊》原稿，指著自己在作文欄寫下的一行铅筆字：</p>',
          '<p class="narration">「『如果將來遇到被困在黑夜裡的人，就算計算出逃跑比較安全，我也要留下來幫他們開門。』——六年三班 陸衍，1999年6月。」</p>',
          '<p>十二歲的你抬起頭對你露出燦爛的笑容：「原來你在主線裡做的每一個選擇，根本不是大人的算計，而是我們十二歲這年就埋下的約定！既然是你，我全部都相信你！」</p>',
          '<p class="inherit-note">【支線連貫 8→9 額外對話完成】<br>• 十二歲的你徹底放下戒心，「童年選擇偏誤」直接歸零（獲得「千禧紀念章」同等信任效果），生命值 +15！<br>• 小陸衍將親筆寫好的<strong>《1999年小學校刊》</strong>交給你，帶到下一關「潮汐電影院」可換取隱藏場次票（9→10）！</p>'
        ],
        choices: [
          {
            text: '收下十二歲自己遞來的《1999年小學校刊》，返回教室',
            action: function(){
              if(!hasItem('millennium_badge')){
                addItem('millennium_badge', '千禧紀念章', '傳說級童年信物，讓十二歲的你完全信任長大後的你。');
              }
              if(!hasItem('v60_school_magazine')){
                addItem('v60_school_magazine', '1999年小學校刊', '在小學1999親手印製的校刊，帶到第十扇門「潮汐電影院」可以換一張隱藏場次票（支線連貫 9→10）。');
              }
              state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + 15);
              updateHP();
              unlockAchievement('ach_d9_bias');
              goToScene('d9_classroom');
            }
          }
        ]
      }
    },
    inject: [
      {
        into: 'd9_classroom',
        choice: {
          text: '【支線連貫 8→9】拿出自助餐吃出的「記憶碎片」，與十二歲的自己展開額外對話（並領取小學校刊）',
          condition: function(){ return (hasSideRelic('memory_shard') || isCleared(8)) && !(state.flags && state.flags.v60_shard_talked); },
          next: 'd9_v60_shard_dialogue'
        }
      },
      {
        into: 'd9_magazine',
        choice: {
          text: '【支線連貫 9→10】將剛印好的《1999年小學校刊》裝進書包帶往放學路上的電影院',
          condition: function(){ return !hasItem('v60_school_magazine'); },
          action: function(){
            saveSideChainFlag('school_magazine', true);
            addItem('v60_school_magazine', '1999年小學校刊', '在小學1999親手印製的校刊，帶到第十扇門「潮汐電影院」可以換一張隱藏場次票（支線連貫 9→10）。');
            appendNarrative('<p class="inherit-note">【獲得支線連貫信物：1999年小學校刊】放學路上經過「潮汐電影院」時，可用這份校刊向售票員換取一張隱藏場次票。</p>');
          }
        }
      }
    ]
  });

  /* 第 10 扇門：潮汐電影院 —— 用小學校刊換「隱藏場次票」(9→10) & 結識售票員約定動物園相見 (10→11) */
  V5.registerStoryPack(10, {
    scenes: {
      d10_v60_hidden_hall: {
        room: '零廳', roomName: '第零廳 · 四條主線的「如果當初」', sceneId: '10-隱藏場次', mood: 'safe',
        onEnter: function(){
          state.flags.v60_hidden_screening_watched = true;
          saveSideChainFlag('cinema_clerk', true);
        },
        text: [
          '<p>你持著由《1999年小學校刊》換來的<strong>「隱藏場次票」</strong>，推開紅絨布走廊盡頭那扇沒有標號的暗門——<strong>「第零廳」</strong>。</p>',
          '<p>銀幕上同時分割出四格溫暖的畫面，放映著你四條主線路線的「如果當初」：如果沒有 03:17 的事故，你與蘇晚在巷口麵攤並肩吃著宵夜、老周在圖書館門口曬著太陽看報紙、陳教授在大學講台上笑著宣布下課。</p>',
          '<p><strong>售票員林默</strong>悄無聲息地走到你身旁坐下，帽簷下的銀幕雙眼映著柔和的光：「謝謝你把 1999 年的校刊帶來，讓我記起了自己還沒成為售票員之前的名字。等這場電影散場後，你繞遠路經過『市立動物園』回家時，我會在閉園的動物園裡等你，給你一件能平安到家的信物。」</p>',
          '<p class="inherit-note">【支線連貫 9→10 & 10→11 達成】<br>• 觀賞隱藏場次《如果當初》：影評人評分 +20（直接獲得滿分級肯定），並視同額外收集一枚萬用膠卷共鳴！<br>• 已與售票員林默立下【10→11 售票員的約定】：他將在第十一扇門「動物園 23:00」出現並贈予你專屬道具！</p>'
        ],
        choices: [
          {
            text: '與售票員林默約定在動物園相見，帶著溫暖的餘韻返回影院大廳',
            action: function(){
              state.criticScore = Math.min(100, (state.criticScore || 70) + 20);
              if(window.V58 && V58.updateHUD) V58.updateHUD();
              if(!hasItem('v60_hidden_ticket')){
                addItem('v60_hidden_ticket', '隱藏場次紀念票根', '用小學1999校刊向售票員林默換取的第零廳隱藏場次票（傳說）。');
              }
              goToScene('d10_hub');
            }
          }
        ]
      }
    },
    inject: [
      {
        into: 'd10_hub',
        choice: {
          text: '【支線連貫 9→10】拿出小學寫的《1999校刊》向售票員林默換取「隱藏場次票」並進入第零廳',
          condition: function(){ return (hasSideRelic('school_magazine') || isCleared(9)) && !(state.flags && state.flags.v60_hidden_screening_watched); },
          next: 'd10_v60_hidden_hall'
        }
      }
    ]
  });

  /* 第 11 扇門：動物園 23:00 —— 電影院售票員登場並給予專屬道具 (10→11) */
  V5.registerStoryPack(11, {
    scenes: {
      d11_v60_clerk_gift: {
        room: '約', roomName: '中央噴泉廣場 · 散場後的售票員', sceneId: '11-售票員贈禮', mood: 'safe',
        onEnter: function(){
          state.flags.v60_clerk_gift_received = true;
        },
        text: [
          '<p>乾涸的海豹噴泉旁，昏黃的路燈下站著一道穿著暗紅色戲院制服的熟悉身影——正是你在潮汐電影院認識的<strong>售票員林默</strong>。</p>',
          '<p>林默摘下售票員制帽，微笑著向你走來：「電影散場後，我看你一個人繞遠路往市立動物園走，就順路跟過來送你一程。23:00 的動物園雖然熱鬧，但動物們的記憶太深，聽久了容易忘記自己身為人類的名字。」</p>',
          '<p>他將一枚刻著『03:18 · 平安歸途』的黃銅懷錶與一包特製的暖心方糖塞進你手裡：「收下這個吧。它能幫你守住人性與時間——走過這座動物園，前面就是你家的街口了。」</p>',
          '<p class="inherit-note">【支線連貫 10→11 達成：獲得售票員的專屬道具】<br>• 獲得傳說道具<strong>「售票員的歸途懷錶」</strong>！<br>• 人性值立即提升 +20%，午夜閉園倒計時延長 +15 分鐘，並額外喚醒 1 枚童年記憶共鳴！</p>'
        ],
        choices: [
          {
            text: '收下「售票員的歸途懷錶」，向林默揮手道別後繼續探索園區',
            action: function(){
              if(!hasItem('v60_clerk_watch')){
                addItem('v60_clerk_watch', '售票員的歸途懷錶', '潮汐電影院售票員林默在動物園23:00贈予你的專屬道具，刻著「散場之後，平安到家」（支線連貫 10→11）。');
              }
              state.humanity = Math.min(100, (state.humanity != null ? state.humanity : 100) + 20);
              state.flags.childhoodFrags = Math.min(6, (state.flags.childhoodFrags || 0) + 1);
              if(typeof addTime === 'function') addTime(15);
              if(window.V58 && V58.updateHUD) V58.updateHUD();
              goToScene('d11_hub');
            }
          }
        ]
      }
    },
    inject: [
      {
        into: 'd11_hub',
        choice: {
          text: '【支線連貫 10→11】與路燈下等候你的「潮汐電影院售票員林默」交談，收下他的專屬道具',
          condition: function(){ return (hasSideRelic('cinema_clerk') || isCleared(10)) && !(state.flags && state.flags.v60_clerk_gift_received); },
          next: 'd11_v60_clerk_gift'
        }
      }
    ]
  });

  /* 每次 buildScenes7..11 執行後，自動把「它為什麼存在」加進序章頂部 */
  [7, 8, 9, 10, 11].forEach(function(id){
    var fnName = 'buildScenes' + id;
    var orig = window[fnName];
    if(typeof orig === 'function' && !orig.__v60WhyWrapped){
      window[fnName] = function(){
        var r = orig.apply(this, arguments);
        try{
          var pKey = 'd' + id + '_prologue';
          if(window.SCENES && SCENES[pKey]){
            prependWhyItExistsToScene(SCENES[pKey], id);
          }
        }catch(e){}
        return r;
      };
      window[fnName].__v60WhyWrapped = true;
    }
  });
}

/* ============================================================
 * 7. 四語本地化字典擴充（繁中 / 簡中 / English / 日本語）
 * ============================================================ */
function extendV60I18n(){
  if(!window.I18N) return;
  var enMap = {
    '選擇迴廊分區': 'Select Corridor Sector',
    '第一層：選擇「主線長廊」或「支線迴廊」 · 點擊展開第二層門扉列表': 'Layer 1: Choose Main Corridor or Side Corridor · Click to expand Layer 2 dungeon list',
    '第一層節點 I · 金色暖調': 'Layer 1 Node I · Warm Gold',
    '第一層節點 II · 藍色冷調': 'Layer 1 Node II · Cool Blue',
    '主線長廊': 'Main Corridor',
    '支線迴廊': 'Side Corridor',
    '主線長廊 (1–6)': 'Main Corridor (1–6)',
    '支線迴廊 (7–11)': 'Side Corridor (7–11)',
    '展開主線長廊 ›': 'Open Main Corridor ›',
    '展開支線迴廊 ›': 'Open Side Corridor ›',
    '返回兩層分區總覽': 'Back to Two-Layer Overview',
    '返回上層分區': 'Back to Corridor Sectors',
    '第一層：選擇要檢視心智圖的迴廊分區': 'Layer 1: Select a Corridor Sector to inspect its Mind-Map',
    '陸衍穿越 03:17 時間夾縫的六道核心門扉（1–6 強制順序解鎖）：從質數旅館、沉默圖書館、倒計時醫院，一路抵達終焉觀測站。': 'Lu Yan’s six core gates through the 03:17 rift (1–6 sequential unlock): from Prime Hotel, Silent Library, and Countdown Hospital to the Terminal Observatory.',
    '打完第 6 關之後，主角一路走回家的連續旅程（6→7→8→9→10→11 依序解鎖）：搭乘鏡像電車、走進自助餐、重返小學 1999、經過潮汐電影院、夜訪動物園 23:00。': 'After clearing Stage 6, the protagonist’s continuous journey walking home (6→7→8→9→10→11 sequential unlock): Mirror Tram, Endless Buffet, Elementary 1999, Tidal Cinema, and Zoo 23:00.',
    '1 → 2 → 3 → 4 → 5 → 6 順序推進': '1 → 2 → 3 → 4 → 5 → 6 Sequential Progression',
    '第 6 扇門已走過 · 歸途支線已開啟': 'Stage 6 Cleared · Homeward Side Corridor Unlocked',
    '它為什麼存在 · 歸途與主線的連結': 'Why It Exists · Connection to Main Story',
    '觀測站調校到一半，時間裂縫打開，電車是裂縫裡溢出的記憶列車。車上坐的都是你在主線裡見過的人。': 'Halfway through calibrating the Observatory, a time rift opened; this tram is a train of overflowing memories. Everyone aboard is someone you met in the main story.',
    '從電車下車後走進的一站。餐廳老闆認識你小時候。每道菜是某個主線NPC的記憶。': 'The stop you walk into after alighting from the tram. The restaurant owner knew you as a child. Every dish holds the memory of a main-story NPC.',
    '吃飽後沿路走回小時候。你發現主線裡的選擇，其實在十二歲就埋下了。': 'After eating your fill, you walk down the road back to childhood. You realize the choices you made in the main story were actually planted when you were twelve.',
    '放學路上經過的電影院。四個廳分別是你四條主線路線的如果當初。': 'The cinema you pass on your way home from school. Its four halls screen the "what-ifs" of your four main story routes.',
    '電影散場後繞遠路回家。動物園關門了，但動物們還記得你。': 'Taking the long way home after the movie lets out. The zoo is closed, but the animals still remember you.',
    '7→8 鏡像電車票根': '7→8 Mirror Tram Ticket Stub',
    '8→9 自助餐記憶碎片': '8→9 Buffet Memory Shard',
    '9→10 小學1999校刊': '9→10 Elementary 1999 Zine',
    '10→11 售票員的約定': '10→11 Ticket Clerk’s Promise'
  };
  var jaMap = {
    '選擇迴廊分區': '回廊エリア選択',
    '第一層：選擇「主線長廊」或「支線迴廊」 · 點擊展開第二層門扉列表': '第1層：「本編回廊」または「支線回廊」を選択 · クリックで第2層ダンジョン一覧を展開',
    '第一層節點 I · 金色暖調': '第1層ノード I · 黄金暖色',
    '第一層節點 II · 藍色冷調': '第1層ノード II · 蒼藍寒色',
    '主線長廊': '本編回廊',
    '支線迴廊': '支線回廊',
    '主線長廊 (1–6)': '本編回廊 (1–6)',
    '支線迴廊 (7–11)': '支線回廊 (7–11)',
    '展開主線長廊 ›': '本編回廊を開く ›',
    '展開支線迴廊 ›': '支線回廊を開く ›',
    '返回兩層分區總覽': '2層エリア一覧へ戻る',
    '返回上層分區': '上部エリアへ戻る',
    '它為什麼存在 · 歸途與主線的連結': 'なぜ存在するのか · 本編との繋がり',
    '觀測站調校到一半，時間裂縫打開，電車是裂縫裡溢出的記憶列車。車上坐的都是你在主線裡見過的人。': '観測所の調律の途中、時間の裂け目が開き、溢れ出した記憶の列車がこの電車だ。乗客は皆、本編で出会った人々である。',
    '從電車下車後走進的一站。餐廳老闆認識你小時候。每道菜是某個主線NPC的記憶。': '電車を降りて立ち寄った次の駅。店主は幼い頃のあなたを知っており、どの料理にも本編NPCの記憶が宿っている。',
    '吃飽後沿路走回小時候。你發現主線裡的選擇，其實在十二歲就埋下了。': 'お腹を満たした後、道なりに幼い頃へと歩いて戻る。本編での選択は、実は12歳の時にすでに蒔かれていたと気づく。',
    '放學路上經過的電影院。四個廳分別是你四條主線路線的如果當初。': '放課後の帰り道に通りかかる映画館。4つのスクリーンは、本編4ルートの「もしもあの時」を映し出している。',
    '電影散場後繞遠路回家。動物園關門了，但動物們還記得你。': '映画が終わった後、遠回りして帰る道。動物園は閉園しているが、動物たちは今もあなたを覚えている。',
    '7→8 鏡像電車票根': '7→8 鏡像電車の半券',
    '8→9 自助餐記憶碎片': '8→9 ビュッフェの記憶の欠片',
    '9→10 小學1999校刊': '9→10 小学校1999文集',
    '10→11 售票員的約定': '10→11 切符売りとの約束'
  };
  for(var i = 1; i <= 10; i++){
    enMap['打完第 ' + i + ' 扇門解鎖'] = 'Clear Stage ' + i + ' to Unlock';
    jaMap['打完第 ' + i + ' 扇門解鎖'] = '第' + i + 'ダンジョンクリアで解放';
  }
  if(I18N.DICT){
    if(I18N.DICT.en) Object.assign(I18N.DICT.en, enMap);
    if(I18N.DICT.ja) Object.assign(I18N.DICT.ja, jaMap);
  }
}

/* ============================================================
 * 8. 註冊與啟動 v6.0.0 模組
 * ============================================================ */
V5.registerSystem('v60-p0-restructure', function(){
  registerV60SideContinuityStories();
  extendV60I18n();
});

V5.onBoot(function(){
  try{
    enforceSequentialUnlock();
    upgradeHubRenderAndSwitcher();
    upgradeBranchDungeonSelect();

    /* 重新構建 7–11 場景以確保「它為什麼存在」與支線連貫選項全部載入 */
    [7, 8, 9, 10, 11].forEach(function(d){
      if(typeof window['buildScenes' + d] === 'function') window['buildScenes' + d]();
    });
    state = stateRefs[1];
    SCENES = sceneRefs[1];

    window.VERSION = '6.0.0';
    window.SAVE_VERSION = '3.0';
    if(window.CHANGELOG && !window.CHANGELOG.some(function(c){ return c.version === '6.0.0'; })){
      window.CHANGELOG.unshift({
        version: '6.0.0',
        type: 'major',
        changes: [
          '迴廊分區兩層結構（P0-1）：主選單與心智圖改為兩層結構——第一層為「主線長廊（1–6）」與「支線迴廊（7–11）」兩大節點，第二層點擊展開各自門扉列表，徹底解決 11 扇門擠在同一轉盤的混亂問題。',
          '支線依序解鎖（P0-2）：改為第 6 扇門走過解鎖第 7 扇門，之後 7→8→9→10→11 依序通關解鎖（仍支援漫遊之契與 GM 全開）。',
          '支線與主線關聯文案（P0-3）：為第 7–11 扇門加入「它為什麼存在」歸途敘事，將 7→8→9→10→11 串聯為「打完第 6 關之後，主角陸衍一路走回家」的連續旅程。',
          '支線連貫性與繼承互動（P0-4）：新增 7→8（電車票根在自助餐打折）、8→9（自助餐記憶碎片在小學1999解鎖額外對話）、9→10（小學1999校刊在潮汐電影院換隱藏場次票）、10→11（電影院售票員在動物園23:00登場並給予專屬道具）。',
          '主選單視覺分區（P0-5）：主線長廊採用金色/暖色系，支線迴廊採用藍色/冷色系；未解鎖門扉顯示鎖頭＋「走完第 X 扇門解鎖」，已通關門扉顯示「✓」打勾標記。'
        ]
      });
    }

    ['title-version', 'hub-title-version'].forEach(function(id){
      var verEl = document.getElementById(id);
      if(verEl){
        var vTxt = 'v 6.0.0';
        verEl.textContent = vTxt;
        if(verEl.firstChild) verEl.firstChild.__origText = vTxt;
      }
    });

    if(typeof window.render === 'function'){
      window.render();
    }
    window.V60.__booted = true;
  }catch(e){
    console.error('v6.0 boot error:', e);
  }
});

})();
