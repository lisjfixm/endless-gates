
(function(){
'use strict';
if(window.V63 && window.V63.__booted) return;
window.V63 = window.V63 || {};

var LS_TRANSITION_MODE = 'wuxian-v63-transition-mode';
var LS_RIPPLE_ENABLED = 'wuxian-v63-ripple';

var SVG_CORNER_ORNAMENT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 22V6a4 4 0 0 1 4-4h16"/><path d="M6 14V8a2 2 0 0 1 2-2h6"/><circle cx="6" cy="6" r="1.5" fill="currentColor"/></svg>';
var SVG_FILM_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>';

/* ============================================================
 * 1. 13 扇門專屬純 SVG 動態幾何圖騰庫（Gate Cinema Emblems）
 * ============================================================ */
var V63_GATE_EMBLEMS = {
  1: {
    subtitle: '質數螺旋鎖孔 · 唯 3、5、7、13 為生路',
    svg: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<circle cx="60" cy="60" r="50" stroke-dasharray="6 4" class="v63-svg-spin"/>' +
      '<polygon points="60,14 99,37 99,83 60,106 21,83 21,37" stroke-opacity="0.7" class="v63-svg-spin-rev"/>' +
      '<circle cx="60" cy="52" r="11" class="v63-svg-pulse"/>' +
      '<path d="M55 61L51 86h18l-4-25" class="v63-svg-dash"/>' +
      '<text x="60" y="56" font-size="11" text-anchor="middle" fill="currentColor" stroke="none" font-family="monospace">13</text>' +
    '</svg>'
  },
  2: {
    subtitle: '萬冊無聲書頁 · 禁語之館與地毯暗門',
    svg: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<circle cx="60" cy="60" r="48" stroke-opacity="0.35"/>' +
      '<path d="M24 36c16-6 28 0 36 8 8-8 20-14 36-8v52c-16-6-28 0-36 8-8-8-20-14-36-8z" class="v63-svg-pulse"/>' +
      '<line x1="60" y1="44" x2="60" y2="96"/>' +
      '<path d="M32 50h18M32 62h20M68 50h20M68 62h18" stroke-opacity="0.75" class="v63-svg-dash"/>' +
    '</svg>'
  },
  3: {
    subtitle: '60:00 逆時脈衝 · 記憶提取與向日葵溫室',
    svg: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<circle cx="60" cy="60" r="48" class="v63-svg-spin-rev" stroke-dasharray="10 5"/>' +
      '<circle cx="60" cy="60" r="40" stroke-opacity="0.4"/>' +
      '<polyline points="18,62 42,62 49,40 57,84 65,48 72,68 78,62 102,62" stroke="#f87171" stroke-width="2.2" class="v63-svg-dash"/>' +
      '<line x1="60" y1="60" x2="60" y2="28" class="v63-svg-spin"/>' +
    '</svg>'
  },
  4: {
    subtitle: '三扇舊門共鳴 · 迴廊心臟的無火提燈',
    svg: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<polygon points="60,14 104,92 16,92" stroke-opacity="0.65" class="v63-svg-pulse"/>' +
      '<rect x="48" y="44" width="24" height="38" rx="3"/>' +
      '<circle cx="60" cy="63" r="6" fill="currentColor" class="v63-svg-pulse"/>' +
      '<circle cx="60" cy="60" r="50" stroke-dasharray="3 6" class="v63-svg-spin"/>' +
    '</svg>'
  },
  5: {
    subtitle: '潮汐漲退之海 · 收容所有未選擇的路',
    svg: '<svg viewBox="0 0 120 120" fill="none" stroke="#7dd3fc" stroke-width="1.8">' +
      '<circle cx="60" cy="60" r="48" stroke-opacity="0.4"/>' +
      '<polygon points="56,68 64,68 62,30 58,30" stroke="#f5df98"/>' +
      '<circle cx="60" cy="24" r="5" fill="#f5df98" class="v63-svg-pulse"/>' +
      '<path d="M18 76c12-8 24 8 36 0s24-8 36 0 12 4 14 0" class="v63-svg-Bob"/>' +
      '<path d="M22 88c12-8 24 8 36 0s24-8 36 0" stroke-opacity="0.65" class="v63-svg-Bob"/>' +
    '</svg>'
  },
  6: {
    subtitle: '03:17 觀測夾縫 · 調諧通往 03:18 的破曉波段',
    svg: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<circle cx="60" cy="60" r="50" stroke-dasharray="4 4" class="v63-svg-spin"/>' +
      '<circle cx="60" cy="60" r="36" stroke-opacity="0.5" class="v63-svg-spin-rev"/>' +
      '<path d="M16 60 Q38 30 60 60 T104 60" stroke="#38bdf8" stroke-width="2" class="v63-svg-dash"/>' +
      '<path d="M16 60 Q38 90 60 60 T104 60" stroke="#f5df98" stroke-width="2" class="v63-svg-dash"/>' +
      '<circle cx="60" cy="60" r="4" fill="#f5df98"/>' +
    '</svg>'
  },
  7: {
    subtitle: '雙軌鏡像電車 · 車窗內外生命同步',
    svg: '<svg viewBox="0 0 120 120" fill="none" stroke="#7dd3fc" stroke-width="1.8">' +
      '<rect x="20" y="30" width="34" height="52" rx="4" stroke="#f5df98"/>' +
      '<rect x="66" y="30" width="34" height="52" rx="4" stroke-dasharray="4 2"/>' +
      '<line x1="60" y1="16" x2="60" y2="104" stroke="#f5df98" stroke-dasharray="3 3"/>' +
      '<path d="M16 94h88" class="v63-svg-dash"/>' +
    '</svg>'
  },
  8: {
    subtitle: '無盡午夜長桌 · 品嚐百味人生的記憶天平',
    svg: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<circle cx="60" cy="60" r="48" stroke-opacity="0.35"/>' +
      '<line x1="60" y1="26" x2="60" y2="92"/>' +
      '<line x1="28" y1="48" x2="92" y2="48" class="v63-svg-Bob"/>' +
      '<path d="M22 68a12 12 0 0 0 24 0zM74 68a12 12 0 0 0 24 0z" class="v63-svg-pulse"/>' +
    '</svg>'
  },
  9: {
    subtitle: '1999 盛夏蟬鳴 · 飛越千禧年夕陽的紙飛機',
    svg: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<circle cx="60" cy="60" r="48" stroke-dasharray="8 4" class="v63-svg-spin"/>' +
      '<polygon points="22,64 96,34 66,92 54,68" class="v63-svg-Bob" stroke="#f5df98" stroke-width="2"/>' +
      '<line x1="96" y1="34" x2="54" y2="68"/>' +
    '</svg>'
  },
  10: {
    subtitle: '午夜 24 格菲林 · 四廳規則交織的長鏡頭',
    svg: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<circle cx="60" cy="60" r="46" class="v63-svg-spin"/>' +
      '<circle cx="60" cy="34" r="7"/><circle cx="60" cy="86" r="7"/>' +
      '<circle cx="34" cy="60" r="7"/><circle cx="86" cy="60" r="7"/>' +
      '<circle cx="60" cy="60" r="6" fill="currentColor"/>' +
    '</svg>'
  },
  11: {
    subtitle: '閉園後的百獸夜語 · 24:00 前的歸家鐘聲',
    svg: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<circle cx="60" cy="60" r="48" stroke-opacity="0.45"/>' +
      '<path d="M68 30a26 26 0 1 0 0 52 22 22 0 1 1 0-52z" fill="currentColor" fill-opacity="0.2" class="v63-svg-pulse"/>' +
      '<path d="M28 92V52a32 32 0 0 1 64 0v40" class="v63-svg-dash"/>' +
    '</svg>'
  },
  12: {
    subtitle: '十二重平行時空 · 黃銅升降梯的命運回聲',
    svg: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<path d="M26 94V56a34 34 0 0 1 68 0v38" stroke-opacity="0.8"/>' +
      '<line x1="60" y1="56" x2="84" y2="34" stroke="#f5df98" stroke-width="2.4" class="v63-svg-pulse"/>' +
      '<rect x="36" y="58" width="22" height="36"/><rect x="62" y="58" width="22" height="36"/>' +
    '</svg>'
  },
  13: {
    subtitle: '七重水銀落地鏡 · 信任或擊碎平行世界的自己',
    svg: '<svg viewBox="0 0 120 120" fill="none" stroke="#bae6fd" stroke-width="1.8">' +
      '<polygon points="60,10 102,35 102,85 60,110 18,85 18,35" class="v63-svg-spin"/>' +
      '<polygon points="60,22 92,60 60,98 28,60" stroke="#f5df98" class="v63-svg-pulse"/>' +
      '<line x1="60" y1="10" x2="60" y2="110" stroke-dasharray="3 3"/>' +
    '</svg>'
  }
};

/* ============================================================
 * 2. 八大場景轉場特效定義與觸發器
 * ============================================================ */
var V63_SCENE_FX_LIST = [
  { id: 'lattice-eclipse', name: '星網日蝕', desc: '靛藍四角星菱格紋與中央深邃日蝕黑暈過場（招牌效果）' },
  { id: 'ink-wash',       name: '水墨暈染', desc: '濃淡墨韻筆觸自然擴散（探索與安全場景）' },
  { id: 'shutter-blinds', name: '長廊百葉', desc: '光影百葉折疊橫掃（走廊與房門移動）' },
  { id: 'mirror-prism',   name: '鏡面稜鏡', desc: '對稱水銀鏡光折射（鏡像、電車、鏡子迷宮）' },
  { id: 'chrono-sweep',   name: '時鐘掃掠', desc: '03:17 指針圓弧掃過（醫院、觀測站、時間場景）' },
  { id: 'film-frame',     name: '午夜菲林', desc: '35mm 膠卷黑邊快門收合（電影院與回憶場景）' },
  { id: 'tidal-wave',     name: '潮汐漫溢', desc: '深海幽藍波浪湧起退去（迴光之海與潮汐場景）' },
  { id: 'crimson-glitch', name: '緋紅斷層', desc: '危險訊號微錯位脈衝（高壓與驚悚危機場景）' },
  { id: 'page-curl',      name: '古籍翻頁', desc: '羊皮古籍書頁光影翻篇（圖書館、校刊與手札）' }
];

var LS_GATE_STYLE = 'ig_v63_gate_style';
function getGateTransitionStyle(){
  try{
    return localStorage.getItem(LS_GATE_STYLE) || 'lattice';
  }catch(e){ return 'lattice'; }
}
function setGateTransitionStyle(st){
  try{ localStorage.setItem(LS_GATE_STYLE, st || 'lattice'); }catch(e){}
  var dt = document.getElementById('dungeon-transition');
  if(dt){
    if(st === 'emblem') dt.classList.add('v63-emblem-mode');
    else dt.classList.remove('v63-emblem-mode');
  }
}

function getTransitionMode(){
  try{
    return localStorage.getItem(LS_TRANSITION_MODE) || 'auto';
  }catch(e){ return 'auto'; }
}

function setTransitionMode(mode){
  try{ localStorage.setItem(LS_TRANSITION_MODE, mode || 'auto'); }catch(e){}
  if(window.SETTINGS) SETTINGS.v63TransitionMode = mode || 'auto';
}

function ensureV63Layers(){
  if(!document.getElementById('v63-ambient-aurora')){
    var aur = document.createElement('div');
    aur.id = 'v63-ambient-aurora';
    document.body.insertBefore(aur, document.body.firstChild);
  }
  if(!document.getElementById('v63-mood-vignette')){
    var vig = document.createElement('div');
    vig.id = 'v63-mood-vignette';
    document.body.appendChild(vig);
  }
  if(!document.getElementById('v63-scene-transition-layer')){
    var stLayer = document.createElement('div');
    stLayer.id = 'v63-scene-transition-layer';
    document.body.appendChild(stLayer);
  }

  /* 升級 #dungeon-transition 內部結構：加入參考圖同款「星網日蝕載入過場 (.v63-lt-wrap)」與可選 3D 圖騰舞台 */
  var dt = document.getElementById('dungeon-transition');
  if(dt && !document.getElementById('v63-lt-wrap')){
    var ltWrap = document.createElement('div');
    ltWrap.id = 'v63-lt-wrap';
    ltWrap.className = 'v63-lt-wrap';
    ltWrap.innerHTML =
      '<div class="v63-lt-title">無盡之門</div>' +
      '<div class="v63-lt-sub">INFINITE GATES</div>' +
      '<div class="v63-lt-bar"><div class="v63-lt-bar-fill" id="v63-lt-bar-fill"></div></div>' +
      '<div class="v63-lt-tip" id="v63-lt-tip">載入第五扇門……</div>' +
      '<div class="v63-lt-gate-sub" id="v63-lt-gate-sub"></div>';
    dt.insertBefore(ltWrap, dt.firstChild);
  }
  if(dt && !document.getElementById('v63-dt-doors-wrap')){
    var doors = document.createElement('div');
    doors.id = 'v63-dt-doors-wrap';
    doors.innerHTML =
      '<div class="v63-gate-leaf left"><div class="v63-gate-ring"></div></div>' +
      '<div class="v63-gate-leaf right"><div class="v63-gate-ring"></div></div>';
    dt.insertBefore(doors, dt.firstChild);

    var stage = document.createElement('div');
    stage.id = 'v63-dt-emblem-stage';
    var idxEl = document.getElementById('dt-index');
    if(idxEl) dt.insertBefore(stage, idxEl);
    else dt.appendChild(stage);

    var subEl = document.createElement('div');
    subEl.id = 'v63-dt-subtitle';
    var divEl = dt.querySelector('.dt-divider');
    if(divEl && divEl.nextSibling) dt.insertBefore(subEl, divEl.nextSibling);
    else dt.appendChild(subEl);

    var progTrack = document.createElement('div');
    progTrack.id = 'v63-dt-progress-track';
    progTrack.innerHTML = '<div id="v63-dt-progress-bar"></div>';
    dt.appendChild(progTrack);
  }
}

var _sceneFxTimer = null;
function playSceneTransitionFX(fxType, forcePlay){
  ensureV63Layers();
  if(!forcePlay){
    if(window.SETTINGS && (SETTINGS.reducedMotion || SETTINGS.flashSafe || SETTINGS.transition === 'off')) return;
    if(getTransitionMode() === 'off') return;
  }
  var layer = document.getElementById('v63-scene-transition-layer');
  if(!layer) return;

  var chosen = fxType || 'ink-wash';
  var mode = getTransitionMode();
  if(!forcePlay && mode !== 'auto' && mode !== 'off'){
    chosen = mode;
  }

  if(_sceneFxTimer) clearTimeout(_sceneFxTimer);
  layer.className = '';
  void layer.offsetWidth;
  layer.classList.add('active', 'fx-' + chosen);
  _sceneFxTimer = setTimeout(function(){
    layer.className = '';
  }, 620);
}

function pickAutoSceneFX(sceneId, scObj){
  var did = parseInt(window.currentDungeonId || 1, 10);
  var mood = (scObj && scObj.mood) || '';
  var rName = String((scObj && scObj.roomName) || sceneId || '');

  if(mood === 'danger' || mood === 'terror') return 'crimson-glitch';
  if(/鏡|mirror|d13_|d7_/.test(rName + sceneId) || did === 7 || did === 13) return 'mirror-prism';
  if(/海|潮|浪|潛|d5_/.test(rName + sceneId) || did === 5) return 'tidal-wave';
  if(/書|館|頁|校刊|d2_/.test(rName + sceneId) || did === 2) return 'page-curl';
  if(/影|廳|幕|膠卷|d10_/.test(rName + sceneId) || did === 10) return 'film-frame';
  if(/鐘|03:17|03:18|醫|1999|d3_|d6_|d9_/.test(rName + sceneId) || did === 3 || did === 6 || did === 9) return 'chrono-sweep';
  if(/廊|門|房|梯|d1_|d12_/.test(rName + sceneId)) return 'shutter-blinds';
  return 'ink-wash';
}

function previewGateOpeningCinema(dungeonId){
  var numId = parseInt(dungeonId || 1, 10);
  ensureV63Layers();
  if(typeof window.playDungeonTransition === 'function'){
    window.playDungeonTransition(numId);
  }
}

/* ============================================================
 * 3. 注入四角古銅雕花與點擊水墨漣漪
 * ============================================================ */
function decorateCardsWithOrnaments(){
  var targets = document.querySelectorAll('.v60-corridor-node, #hub-screen .dungeon-card');
  targets.forEach(function(card){
    if(card.querySelector('.v63-corner-ornament')) return;
    ['tl', 'tr', 'bl', 'br'].forEach(function(pos){
      var sp = document.createElement('span');
      sp.className = 'v63-corner-ornament ' + pos;
      sp.innerHTML = SVG_CORNER_ORNAMENT;
      card.appendChild(sp);
    });
  });
}

function setupInkRippleClicks(){
  if(window.__v63RippleBound) return;
  document.addEventListener('pointerdown', function(e){
    if(!e || (window.SETTINGS && SETTINGS.reducedMotion)) return;
    if(localStorage.getItem(LS_RIPPLE_ENABLED) === 'false') return;
    var btn = e.target && e.target.closest ? e.target.closest('button, .v60-corridor-node, .v61-corridor-row, .gallery-cell') : null;
    if(!btn) return;
    var rip = document.createElement('div');
    rip.className = 'v63-ink-ripple';
    rip.style.left = e.clientX + 'px';
    rip.style.top = e.clientY + 'px';
    document.body.appendChild(rip);
    setTimeout(function(){
      if(rip && rip.parentNode) rip.parentNode.removeChild(rip);
    }, 650);
  }, { passive: true });
  window.__v63RippleBound = true;
}

/* ============================================================
 * 4. 「v6.3 過場與轉場動畫劇場」互動預覽與控制彈窗
 * ============================================================ */
function buildTheaterHTML(){
  var curMode = getTransitionMode();
  var modeBtns = [
    { k: 'auto', label: '智慧情境感知（預設）' },
    { k: 'ink-wash', label: '固定：水墨暈染' },
    { k: 'shutter-blinds', label: '固定：長廊百葉' },
    { k: 'mirror-prism', label: '固定：鏡面稜鏡' },
    { k: 'chrono-sweep', label: '固定：時鐘掃掠' },
    { k: 'film-frame', label: '固定：午夜菲林' },
    { k: 'tidal-wave', label: '固定：潮汐漫溢' },
    { k: 'page-curl', label: '固定：古籍翻頁' },
    { k: 'off', label: '關閉場景轉場' }
  ].map(function(m){
    var on = (curMode === m.k);
    return '<button type="button" class="v4-btn' + (on ? ' primary' : '') + '" data-v63-mode="' + m.k + '" style="font-size:.73rem;padding:.28rem .6rem">' +
      m.label + (on ? ' ✓' : '') +
    '</button>';
  }).join('');

  var fxCards = V63_SCENE_FX_LIST.map(function(fx){
    return '<button type="button" class="v63-theater-card" data-v63-fx="' + fx.id + '">' +
      '<div class="t-title">▸ ' + fx.name + '</div>' +
      '<div class="t-sub">' + fx.desc + '</div>' +
    '</button>';
  }).join('');

  var gateCards = (window.dungeons || []).map(function(d){
    var isHid = (window.V61 && typeof V61.getDungeonDisplayState === 'function' && V61.getDungeonDisplayState(d.id) === 'hidden' && !window._gmUnlocked);
    var label = isHid ? ('第 ' + d.id + ' 扇門 · ？？？') : ('第 ' + d.id + ' 扇門 · ' + d.name);
    var sub = isHid ? '未知門扉開門過場預覽' : (V63_GATE_EMBLEMS[d.id] ? V63_GATE_EMBLEMS[d.id].subtitle : '專屬推門過場動畫');
    return '<button type="button" class="v63-theater-card" data-v63-gate="' + d.id + '">' +
      '<div class="t-title">' + SVG_FILM_ICON + ' ' + label + '</div>' +
      '<div class="t-sub">' + sub + '</div>' +
    '</button>';
  }).join('');

  var curGateStyle = getGateTransitionStyle();
  var gateStyleBtns = [
    { k: 'lattice', label: '星網日蝕載入過場（預設 · 經典參考圖風格）' },
    { k: 'emblem',  label: '3D 雙門與幾何圖騰過場' }
  ].map(function(g){
    var on = (curGateStyle === g.k);
    return '<button type="button" class="v4-btn' + (on ? ' primary' : '') + '" data-v63-gate-style="' + g.k + '" style="font-size:.73rem;padding:.28rem .65rem">' +
      g.label + (on ? ' ✓' : '') +
    '</button>';
  }).join('');

  return '<div>' +
    '<div style="font-size:.8rem;color:#f5df98;font-weight:600;margin-bottom:.35rem">零、門扉開啟過場視覺風格</div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:.38rem;margin-bottom:.85rem">' + gateStyleBtns + '</div>' +
    '<div style="font-size:.8rem;color:#f5df98;font-weight:600;margin-bottom:.35rem">一、場景切換轉場模式設定</div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:.38rem;margin-bottom:.9rem">' + modeBtns + '</div>' +
    '<div style="font-size:.8rem;color:#f5df98;font-weight:600;margin-bottom:.25rem">二、8 大情境場景轉場特效（點擊立即全螢幕預覽）</div>' +
    '<div class="v63-theater-grid" style="margin-bottom:.95rem">' + fxCards + '</div>' +
    '<div style="font-size:.8rem;color:#f5df98;font-weight:600;margin-bottom:.25rem">三、13 扇門專屬 3D 推門與主題圖騰過場（點擊立即預覽）</div>' +
    '<div class="v63-theater-grid">' + gateCards + '</div>' +
  '</div>';
}

function bindTheaterEvents(container){
  if(!container) return;
  container.querySelectorAll('[data-v63-gate-style]').forEach(function(btn){
    btn.onclick = function(){
      var st = btn.getAttribute('data-v63-gate-style');
      setGateTransitionStyle(st);
      if(typeof showToast === 'function') showToast('已切換門扉過場風格');
      container.innerHTML = buildTheaterHTML();
      bindTheaterEvents(container);
    };
  });
  container.querySelectorAll('[data-v63-mode]').forEach(function(btn){
    btn.onclick = function(){
      var m = btn.getAttribute('data-v63-mode');
      setTransitionMode(m);
      if(typeof showToast === 'function') showToast('已切換轉場動畫模式');
      container.innerHTML = buildTheaterHTML();
      bindTheaterEvents(container);
    };
  });
  container.querySelectorAll('[data-v63-fx]').forEach(function(btn){
    btn.onclick = function(){
      var fx = btn.getAttribute('data-v63-fx');
      playSceneTransitionFX(fx, true);
    };
  });
  container.querySelectorAll('[data-v63-gate]').forEach(function(btn){
    btn.onclick = function(){
      var gid = parseInt(btn.getAttribute('data-v63-gate'), 10) || 1;
      var modal = document.getElementById('v63-theater-modal');
      if(modal) modal.classList.remove('show');
      if(typeof window.closeNotebook === 'function') window.closeNotebook();
      previewGateOpeningCinema(gid);
    };
  });
}

function openTransitionTheater(){
  var modal = document.getElementById('v63-theater-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'v63-theater-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  modal.innerHTML =
    '<div class="modal-card v4-card wide" style="border-color:#d4af37;max-width:740px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap">' +
        '<h3 style="margin:0;color:#f5df98;display:flex;align-items:center;gap:.45rem">' + SVG_FILM_ICON + ' <span>v6.3 萬門過場與轉場動畫劇場</span></h3>' +
        '<span class="v4-chip gold">13 推門過場 + 8 場景轉場</span>' +
      '</div>' +
      '<div class="v4-sub" style="margin-top:.25rem">隨時預覽全作 13 扇門專屬 3D 推門幾何過場與 8 大情境場景轉場特效，或自訂你的轉場偏好。</div>' +
      '<div id="v63-theater-body" style="margin-top:.65rem;max-height:62vh;overflow-y:auto;padding-right:.25rem">' +
        buildTheaterHTML() +
      '</div>' +
      '<div class="v4-actions end" style="margin-top:.8rem">' +
        '<button type="button" class="v4-btn primary" onclick="document.getElementById(\'v63-theater-modal\').classList.remove(\'show\')">關 閉</button>' +
      '</div>' +
    '</div>';
  bindTheaterEvents(document.getElementById('v63-theater-body'));
  modal.classList.add('show');
}

/* ============================================================
 * 5. 核心掛鉤：升級 playDungeonTransition、goToScene、switchDungeon、V60 分區切換與頂欄入口
 * ============================================================ */
function hookV63TransitionsAndUI(){
  ensureV63Layers();
  setupInkRippleClicks();

  /* 1) 升級 playDungeonTransition(id)：注入 13 扇門專屬 SVG 圖騰與 3D 雙門推開動畫 */
  if(typeof window.playDungeonTransition === 'function' && !window.playDungeonTransition.__v63){
    var _origPlayDT = window.playDungeonTransition;
    window.playDungeonTransition = function(id){
      ensureV63Layers();
      var numId = parseInt(id, 10) || 1;
      var r = _origPlayDT.apply(this, arguments);
      if(window.dtTimerIn){ clearTimeout(window.dtTimerIn); window.dtTimerIn = null; }
      try{
        var ovNow = document.getElementById('dungeon-transition');
        if(ovNow){
          if(getGateTransitionStyle() === 'emblem') ovNow.classList.add('v63-emblem-mode');
          else ovNow.classList.remove('v63-emblem-mode');
          ovNow.style.transition = '';
          ovNow.classList.add('show');
        }
        var ov = document.getElementById('dungeon-transition');
        var stage = document.getElementById('v63-dt-emblem-stage');
        var subEl = document.getElementById('v63-dt-subtitle');
        var isHid = (window.V61 && typeof V61.getDungeonDisplayState === 'function' && V61.getDungeonDisplayState(numId) === 'hidden' && !window._gmUnlocked);
        var emb = V63_GATE_EMBLEMS[numId] || V63_GATE_EMBLEMS[1];
        var ordMap = ['','一','二','三','四','五','六','七','八','九','十','十一','十二','十三'];
        var ordStr = ordMap[numId] || String(numId);
        var tipEl = document.getElementById('v63-lt-tip');
        var gateSubEl = document.getElementById('v63-lt-gate-sub');
        var barFill = document.getElementById('v63-lt-bar-fill');
        if(tipEl){
          tipEl.textContent = '載入第' + ordStr + '扇門……';
        }
        if(gateSubEl){
          var cfgObj = window.DUNGEON_CONFIG && DUNGEON_CONFIG[numId];
          gateSubEl.textContent = isHid ? '' : (cfgObj && cfgObj.dungeonName ? ('《' + cfgObj.dungeonName + '》') : '');
        }
        if(barFill){
          barFill.style.transition = 'none';
          barFill.style.width = '18%';
          void barFill.offsetWidth;
          barFill.style.transition = 'width 0.65s cubic-bezier(0.22, 1, 0.36, 1)';
          barFill.style.width = '44%';
          setTimeout(function(){
            if(barFill) barFill.style.width = '100%';
          }, 720);
        }
        if(stage) stage.innerHTML = emb.svg;
        if(subEl) subEl.textContent = isHid ? '未知的門扉正在開啟……' : emb.subtitle;
        if(isHid){
          var dtName = document.getElementById('dt-name');
          if(dtName) dtName.textContent = '？？？';
        }
        if(ov){
          ov.classList.remove('v63-doors-opening');
          void ov.offsetWidth;
          setTimeout(function(){
            ov.classList.add('v63-doors-opening');
          }, 60);
        }
      }catch(e){}
      return r;
    };
    window.playDungeonTransition.__v63 = true;
  }

  /* 2) 升級 playOpeningTransition()：開場進入迴廊時同樣展示萬門總圖騰與推門特效 */
  if(typeof window.playOpeningTransition === 'function' && !window.playOpeningTransition.__v63){
    var _origOpenDT = window.playOpeningTransition;
    window.playOpeningTransition = function(){
      ensureV63Layers();
      var r = _origOpenDT.apply(this, arguments);
      try{
        var ov = document.getElementById('dungeon-transition');
        var stage = document.getElementById('v63-dt-emblem-stage');
        var subEl = document.getElementById('v63-dt-subtitle');
        var tipEl = document.getElementById('v63-lt-tip');
        var gateSubEl = document.getElementById('v63-lt-gate-sub');
        var barFill = document.getElementById('v63-lt-bar-fill');
        if(tipEl) tipEl.textContent = '載入第五扇門……';
        if(gateSubEl) gateSubEl.textContent = '';
        if(barFill){
          barFill.style.transition = 'none';
          barFill.style.width = '42%';
          void barFill.offsetWidth;
          barFill.style.transition = 'width 1.1s cubic-bezier(0.22, 1, 0.36, 1)';
          setTimeout(function(){ if(barFill) barFill.style.width = '100%'; }, 120);
        }
        if(stage) stage.innerHTML = V63_GATE_EMBLEMS[4].svg;
        if(subEl) subEl.textContent = '凌晨 03:17 · 十三道門扉於時間夾縫中甦醒';
        if(ov){
          ov.classList.remove('v63-doors-opening');
          void ov.offsetWidth;
          setTimeout(function(){ ov.classList.add('v63-doors-opening'); }, 50);
        }
      }catch(e){}
      return r;
    };
    window.playOpeningTransition.__v63 = true;
  }

  /* 3) 升級 switchDungeon(dir)：第二層切換門扉卡片時播放 3D 左右滑移動畫 */
  if(typeof window.switchDungeon === 'function' && !window.switchDungeon.__v63){
    var _origSwitch = window.switchDungeon;
    window.switchDungeon = function(dir){
      var r = _origSwitch.apply(this, arguments);
      try{
        var card = document.querySelector('#hub-screen .dungeon-card');
        if(card && !(window.SETTINGS && SETTINGS.reducedMotion)){
          card.classList.remove('v63-card-slide-left', 'v63-card-slide-right');
          void card.offsetWidth;
          card.classList.add(dir >= 0 ? 'v63-card-slide-right' : 'v63-card-slide-left');
        }
      }catch(e){}
      return r;
    };
    window.switchDungeon.__v63 = true;
  }

  /* 4) 升級 V60 兩層迴廊切換：播放星軌穿梭轉場 (corridor-warp) */
  if(window.V60){
    if(typeof V60.openCorridorLayer2 === 'function' && !V60.openCorridorLayer2.__v63){
      var _origL2 = V60.openCorridorLayer2;
      V60.openCorridorLayer2 = function(corridor, targetDungeonId){
        playSceneTransitionFX('corridor-warp');
        return _origL2.apply(this, arguments);
      };
      V60.openCorridorLayer2.__v63 = true;
    }
    if(typeof V60.backToCorridorLayer1 === 'function' && !V60.backToCorridorLayer1.__v63){
      var _origL1 = V60.backToCorridorLayer1;
      V60.backToCorridorLayer1 = function(){
        playSceneTransitionFX('corridor-warp');
        return _origL1.apply(this, arguments);
      };
      V60.backToCorridorLayer1.__v63 = true;
    }
  }

  /* 5) 升級 goToScene(sceneId)：每次切換場景時自動觸發對應的 8 大情境轉場特效 */
  if(typeof window.goToScene === 'function' && !window.goToScene.__v63){
    var _origGo = window.goToScene;
    window.goToScene = function(sceneId){
      var prevScene = window.state && state.currentScene;
      var scObj = window.SCENES && SCENES[sceneId];
      var vig = document.getElementById('v63-mood-vignette');
      if(vig) vig.setAttribute('data-mood', (scObj && scObj.mood) ? scObj.mood : 'eerie');
      if(prevScene && prevScene !== sceneId && scObj){
        var fx = pickAutoSceneFX(sceneId, scObj);
        playSceneTransitionFX(fx, false);
      }
      return _origGo.apply(this, arguments);
    };
    window.goToScene.__v63 = true;
  }

  /* 6) 注入主選單「轉場劇場」按鈕、遊戲頂欄「影」按鈕與手札「轉 場」分頁 */
  var hubRight = document.querySelector('#hub-screen .hub-header-right');
  if(hubRight && !document.getElementById('v63-theater-hub-btn')){
    var tBtn = document.createElement('button');
    tBtn.type = 'button';
    tBtn.id = 'v63-theater-hub-btn';
    tBtn.innerHTML = SVG_FILM_ICON + ' <span>轉場劇場</span>';
    tBtn.onclick = function(e){
      e.stopPropagation();
      openTransitionTheater();
    };
    hubRight.insertBefore(tBtn, hubRight.firstChild);
  }

  var topRight = document.querySelector('#game-screen .top-bar-right');
  if(topRight && !document.getElementById('v63-top-theater-btn')){
    var topBtn = document.createElement('button');
    topBtn.type = 'button';
    topBtn.id = 'v63-top-theater-btn';
    topBtn.className = 'icon-btn';
    topBtn.title = '過場與轉場動畫劇場';
    topBtn.textContent = '影';
    topBtn.onclick = function(){ openTransitionTheater(); };
    topRight.insertBefore(topBtn, topRight.firstChild);
  }

  var nb = document.getElementById('v4-notebook');
  if(nb){
    var tabs = nb.querySelector('.v4-tabs');
    var body = nb.querySelector('#v4-nb-body');
    if(tabs && body && !tabs.querySelector('[data-t="v63-theater"]')){
      var tb = document.createElement('button');
      tb.className = 'v4-tab';
      tb.setAttribute('data-t', 'v63-theater');
      tb.textContent = '轉 場';
      tabs.appendChild(tb);
      tabs.addEventListener('click', function(e){
        var b = e.target && e.target.closest ? e.target.closest('.v4-tab') : null;
        if(!b || b.getAttribute('data-t') !== 'v63-theater') return;
        tabs.querySelectorAll('.v4-tab').forEach(function(x){ x.classList.remove('on'); });
        b.classList.add('on');
        body.innerHTML = buildTheaterHTML();
        bindTheaterEvents(body);
        if(typeof window.openNotebook === 'function'){
          var existingJump = body.querySelector('#v62-nb-quick-jump');
          if(!existingJump && window.V62){
            /* 保留頂部快速跳轉列 */
            var closeAndReinject = document.querySelector('#v4-notebook .v4-tab.on');
            if(closeAndReinject) void closeAndReinject;
          }
        }
      });
    }
  }

  /* 7) 每次 render() 後為新生成的卡片補齊四角古銅雕花裝飾 */
  if(typeof window.render === 'function' && !window.render.__v63){
    var _origRender = window.render;
    window.render = function(){
      var r = _origRender.apply(this, arguments);
      decorateCardsWithOrnaments();
      return r;
    };
    window.render.__v63 = true;
  }
  decorateCardsWithOrnaments();
}

window.V63.openTransitionTheater = openTransitionTheater;
window.V63.playSceneTransitionFX = playSceneTransitionFX;
window.V63.previewGateOpeningCinema = previewGateOpeningCinema;
window.V63.getTransitionMode = getTransitionMode;
window.V63.setTransitionMode = setTransitionMode;
window.V63.GATE_EMBLEMS = V63_GATE_EMBLEMS;
window.V63.SCENE_FX_LIST = V63_SCENE_FX_LIST;

V5.onBoot(function(){
  try{
    hookV63TransitionsAndUI();

    window.VERSION = '6.3.0';
    window.SAVE_VERSION = '3.2';
    if(window.CHANGELOG && !window.CHANGELOG.some(function(c){ return c.version === '6.3.0'; })){
      window.CHANGELOG.unshift({
        version: '6.3.0',
        type: 'minor',
        changes: [
          '超級 UI 視覺重構：升級主選單黑曜石毛玻璃頂欄、兩層迴廊與門扉卡片四角古銅雕花紋飾、懸浮流光掃掠特效（Card Shimmer）、雙層黑金光柵選項按鈕、水墨暈染段落進場與生命值動態流光條。',
          '13 扇門專屬 3D 推門與主題圖騰過場動畫：踏入第 1–13 扇門時呈現雙扇古銅水墨巨門向兩側 3D 推開動畫，並配搭 13 座門扉量身打造的動態 SVG 幾何異象圖騰与底部流光進度軌。',
          '8 大情境感知場景轉場特效：於門扉內切換場景時自動依情境與情緒觸發「水墨暈染」「長廊百葉」「鏡面稜鏡」「時鐘掃掠」「午夜菲林」「潮汐漫溢」「緋紅斷層」「古籍翻頁」8 種全螢幕轉場動畫。',
          '迴廊穿梭與互動微動效：新增主選單分區切換「星軌穿梭轉場」、門扉卡片左右 3D 滑移動畫、全畫面場景情緒呼吸暗角（Mood Vignette）與點擊水墨金色漣漪。',
          '新增「v6.3 萬門過場與轉場動畫劇場」：可從主選單頂欄、遊戲內頂欄「影」按鈕或手札「轉 場」分頁隨時一鍵預覽全部 13 扇門開門過場與 8 大場景轉場特效，並自由切換轉場偏好。'
        ]
      });
    }

    ['title-version', 'hub-title-version'].forEach(function(id){
      var verEl = document.getElementById(id);
      if(verEl){
        var vTxt = 'v 6.3.0';
        verEl.textContent = vTxt;
        if(verEl.firstChild) verEl.firstChild.__origText = vTxt;
      }
    });

    if(typeof window.render === 'function'){
      window.render();
    }
    window.V63.__booted = true;
  }catch(e){
    console.error('v6.3 boot error:', e);
  }
});

})();
