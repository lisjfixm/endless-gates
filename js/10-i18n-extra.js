
/* ============================================================
 * 無盡之門 · v5.4.0 超級迭代模組
 * 1. 底部工具列整合（消除 FAB、自動播放、隨機、提示與選項區的重疊）
 * 2. 迴廊試煉系統（6 大挑戰試煉、即時秒錶、最佳紀錄、專屬稱號與成就）
 * 3. 門扉共鳴系統（物品欄「共鳴」一鍵觸發已收集遺物的跨門扉共鳴支援）
 * 4. 第六扇門「記憶回聲合成機」與第 7 隱藏結局「六門共鳴」
 * ============================================================ */
(function(){
'use strict';
if(!window.V5 || window.V5.__v54Loaded) return;
window.V5.__v54Loaded = true;

var LS_TRIALS = 'wuxian-v54-trials';
var LS_TRIAL_ACT = 'wuxian-v54-trial-active';

function lsGet(k){ try{return localStorage.getItem(k);}catch(e){return null;} }
function lsSet(k,v){ try{localStorage.setItem(k,v);}catch(e){} }
function lsJSON(k,def){ try{var v=JSON.parse(lsGet(k)); return v==null?def:v;}catch(e){return def;} }
function t(s){ return (window.I18N && typeof I18N.t === 'function') ? I18N.t(s) : s; }

/* ============================================================
 * 1. 擴充四語詞典（涵蓋 v5.4.0 所有新增文本）
 * ============================================================ */
function extendI18NDicts(){
  if(!window.I18N) return;
  /* 注入補充詞條 */
  var addEN = {
    '手 札':'NOTEBOOK','試 煉':'TRIALS','共鳴':'Resonate','門扉共鳴':'Relic Resonance',
    '迴廊試煉':'Corridor Trials','啟動試煉':'ACTIVATE','取消試煉':'ACTIVE','立即挑戰':'START',
    '極速試煉·質數迷宮':'Speed Trial · Prime Labyrinth',
    '無聲試煉·絕對靜默':'Silence Trial · Absolute Hush',
    '急診試煉·清醒手術':'ER Trial · Lucid Surgery',
    '心臟試煉·三門歸一':'Heart Trial · Three Gates One',
    '潮汐試煉·順流而行':'Tide Trial · No Rewind',
    '破曉試煉·零號觀測':'Dawn Trial · Flawless Observation',
    '第 1 扇門：在 180 秒內達成任意生還、普通或隱藏結局':'Dungeon I: Reach any survive, normal, or hidden ending within 180s',
    '第 2 扇門：在不觸發任何噪音扣血的情況下逃出沉默圖書館':'Dungeon II: Escape the Silent Library without taking any noise penalty damage',
    '第 3 扇門：全程不服用止痛藥、安定片與鎮定劑達成好結局':'Dungeon III: Reach a good ending without taking painkillers, valium, or sedatives',
    '第 4 扇門：單局內重訪鏡、書架、病房三扇舊門並解開門數謎題後通關':'Dungeon IV: Revisit all three old doors and solve the door-count riddle before clearing',
    '第 5 扇門：全程不使用「迴溯」達成迴光之海任意好結局':'Dungeon V: Clear Sea of Echoing Light without using Rewind',
    '第 6 扇門：在未受任何主機或頻率電擊傷害下達成「03:18 的破曉」或「六門共鳴」':'Dungeon VI: Reach "Dawn of 03:18" or "Six-Gate Symphony" without taking shock damage',
    '記憶回聲合成機':'Memory Echo Synthesizer',
    '啟動「記憶回聲合成機」（五門座標共鳴）':'Activate the Memory Echo Synthesizer (Five-Gate Coordinates)',
    '將「六門共鳴磁帶」接入分界門擴音器（隱藏結局·六門共鳴）':'Load the Six-Gate Symphony Tape into the Threshold Gate',
    '六門共鳴':'Six-Gate Symphony'
  };
  var addJA = {
    '手 札':'手 帳','試 煉':'試 練','共鳴':'共鳴','門扉共鳴':'遺物共鳴',
    '迴廊試煉':'回廊の試練','啟動試煉':'選択','取消試煉':'選択中','立即挑戰':'挑戦開始',
    '極速試煉·質數迷宮':'疾風試練・素数迷宮',
    '無聲試煉·絕對靜默':'無声試練・絶対静寂',
    '急診試煉·清醒手術':'救急試練・覚醒手術',
    '心臟試煉·三門歸一':'心臓試練・三門帰一',
    '潮汐試煉·順流而行':'潮汐試練・順流航行',
    '破曉試煉·零號觀測':'夜明試練・零号観測',
    '第 1 扇門：在 180 秒內達成任意生還、普通或隱藏結局':'第一章：180秒以内に任意の生還・通常・隠しエンディングに到達する',
    '第 2 扇門：在不觸發任何噪音扣血的情況下逃出沉默圖書館':'第二章：物音によるダメージを一度も受けずに図書館を脱出する',
    '第 3 扇門：全程不服用止痛藥、安定片與鎮定劑達成好結局':'第三章：鎮痛剤・ジアゼパム・鎮静剤を一切使わずにグッドエンドへ到達する',
    '第 4 扇門：單局內重訪鏡、書架、病房三扇舊門並解開門數謎題後通關':'第四章：三つの旧き扉をすべて巡り、扉の数の謎を解いてクリアする',
    '第 5 扇門：全程不使用「迴溯」達成迴光之海任意好結局':'第五章：「逆行」を一度も使わずに回光の海のグッドエンドへ到達する',
    '第 6 扇門：在未受任何主機或頻率電擊傷害下達成「03:18 的破曉」或「六門共鳴」':'第六章：電撃ダメージを一度も受けずに「03:18の夜明け」または「六門共鳴」へ到達する',
    '記憶回聲合成機':'記憶反響シンセサイザー',
    '啟動「記憶回聲合成機」（五門座標共鳴）':'「記憶反響シンセサイザー」を起動する（五門座標の共鳴）',
    '將「六門共鳴磁帶」接入分界門擴音器（隱藏結局·六門共鳴）':'「六門共鳴テープ」を境界の扉へ装填する（隠しエンド・六門共鳴）',
    '六門共鳴':'六門共鳴'
  };
  var origT = I18N.t;
  I18N.t = function(str, langOverride){
    var lg = langOverride || I18N.lang || 'zh-Hant';
    if(str && typeof str === 'string'){
      var tr = str.trim();
      if(lg === 'en' && addEN[tr]) return addEN[tr];
      if(lg === 'ja' && addJA[tr]) return addJA[tr];
    }
    return origT.apply(this, arguments);
  };
}

/* ============================================================
 * 2. 遊戲畫面底部工具列重構（徹底消除重疊）
 * ============================================================ */
function setupBottomBarAndLayout(){
  var gs = document.getElementById('game-screen');
  var choicesEl = document.getElementById('choices');
  var topWrap = document.getElementById('top-wrap');
  if(!gs || !choicesEl) return;

  /* 1) 將 .v53-more-drawer 移入 #top-wrap 內部（位於 .top-bar 之後、.status-bar 之前） */
  var drawer = document.querySelector('.v53-more-drawer');
  var statusBar = topWrap ? topWrap.querySelector('.status-bar') : null;
  if(drawer && topWrap && statusBar && drawer.parentElement !== topWrap){
    topWrap.insertBefore(drawer, statusBar);
  }

  /* 2) 建立 #game-bottom-bar 並將 #wheel-fab 與 #autoplay-indicator 移入其中 */
  if(!document.getElementById('game-bottom-bar')){
    var bar = document.createElement('div');
    bar.id = 'game-bottom-bar';
    bar.innerHTML =
      '<div id="game-bottom-left"></div>'+
      '<div id="game-bottom-center"><span id="v54-trial-badge" class="v54-trial-badge"></span></div>'+
      '<div id="game-bottom-right"></div>';
    gs.appendChild(bar);

    var fab = document.getElementById('wheel-fab');
    if(fab) document.getElementById('game-bottom-left').appendChild(fab);

    var apInd = document.getElementById('autoplay-indicator');
    if(apInd) document.getElementById('game-bottom-right').appendChild(apInd);
  }

  /* 3) 讓 renderChoices 把 #random-choice-btn 與 .v4-hint-entry 放進 #game-bottom-center，保持 #choices 純淨不擁擠 */
  if(typeof window.renderChoices === 'function' && !window.renderChoices.__v54Dock){
    var _rc = window.renderChoices;
    window.renderChoices = function(choices){
      var r = _rc.apply(this, arguments);
      try{
        var center = document.getElementById('game-bottom-center');
        var c = document.getElementById('choices');
        if(center && c){
          /* 移除舊的駐留按鈕 */
          var oldRnd = center.querySelector('#random-choice-btn');
          if(oldRnd) oldRnd.remove();
          var oldHint = center.querySelector('.v4-hint-entry');
          if(oldHint) oldHint.remove();

          var rnd = c.querySelector('#random-choice-btn');
          if(rnd) center.appendChild(rnd);
          var hint = c.querySelector('.v4-hint-entry');
          if(hint) center.appendChild(hint);
        }
      }catch(e){}
      return r;
    };
    window.renderChoices.__v54Dock = true;
  }

  /* 4) 讓 renderPersonality 將 #personality-desc 放進 .personality-body 旁，保持結局畫面單屏緊湊 */
  if(typeof window.renderPersonality === 'function' && !window.renderPersonality.__v54Compact){
    var _rp = window.renderPersonality;
    window.renderPersonality = function(){
      var r = _rp.apply(this, arguments);
      try{
        var body = document.querySelector('#personality-panel .personality-body');
        var desc = document.getElementById('personality-desc');
        if(body && desc && desc.parentElement !== body){
          body.appendChild(desc);
        }
      }catch(e){}
      return r;
    };
    window.renderPersonality.__v54Compact = true;
  }
}

/* ============================================================
 * 3. 門扉共鳴系統（Relic Resonance — 物品欄一鍵跨門扉信物共鳴）
 * ============================================================ */
function setupRelicResonance(){
  var footer = document.querySelector('#inventory-panel .panel-footer');
  if(footer && !footer.querySelector('#v54-resonate-btn')){
    var btn = document.createElement('button');
    btn.id = 'v54-resonate-btn';
    btn.type = 'button';
    btn.textContent = '共鳴';
    btn.title = '喚起已收集迴光遺物的跨門扉共鳴（每局一次）';
    btn.onclick = function(){ triggerRelicResonance(); };
    footer.appendChild(btn);
  }
}

window.triggerRelicResonance = function(){
  if(!window.state || !document.getElementById('game-screen').classList.contains('active')){
    showToast('請先踏入門扉再發動共鳴');
    return;
  }
  var found = [];
  try{ found = JSON.parse(localStorage.getItem('wuxian-v5-relics') || '[]'); }catch(e){}
  if(found.length === 0){
    showToast('尚未收集任何迴光遺物，無法發動共鳴');
    return;
  }
  if(state.flags && state.flags.v54_resonated){
    showToast('本局已發動過門扉共鳴');
    return;
  }
  state.flags.v54_resonated = true;
  unlockAchievement('v54_resonance');

  /* 計算共鳴增益：依已收集遺物數量給予生命恢復、時間或迴光粒，並提示當前門扉未收集的碎片 */
  var heal = Math.min(30, 10 + found.length * 2);
  var maxH = state.maxHp || 100;
  state.hp = Math.min(maxH, (state.hp || 100) + heal);
  if(typeof updateHP === 'function') updateHP();

  var bonusMsg = '生命恢復 +' + heal;
  if(state.countdown != null && typeof addTime === 'function'){
    addTime(10);
    bonusMsg += ' · 倒計時 +10 分鐘';
  }
  if(state.echo != null){
    state.echo = Math.min(8, (state.echo || 0) + 1);
    if(typeof updateD5HUD === 'function') updateD5HUD();
    bonusMsg += ' · 迴光粒 +1';
  }

  /* 檢查當前門扉是否還有未尋獲的迴廊碎片 */
  var fragHint = '';
  if(window.V4 && typeof V4.fragmentsInDungeon === 'function'){
    var allF = V4.fragmentsInDungeon(currentDungeonId);
    var remF = allF.filter(function(fid){ return !V4.hasFragment(fid); });
    if(remF.length > 0 && V4.FRAGMENTS[remF[0]]){
      fragHint = '（遺物指向一處未尋獲的碎片線索：「' + V4.FRAGMENTS[remF[0]].hint + '」）';
    }
  }

  if($('inventory-panel') && $('inventory-panel').classList.contains('open')){
    toggleInventory();
  }
  appendNarrative('<p class="inherit-note">【門扉共鳴】你手裡收集過的 ' + found.length + ' 件迴光遺物同時泛起微光（' + bonusMsg + '）。' + fragHint + '</p>');
  showToast('門扉共鳴發動：' + bonusMsg);
};

/* ============================================================
 * 4. 迴廊試煉系統（Corridor Trials — 6 項挑戰試煉與速通計時）
 * ============================================================ */
var TRIALS = [
  {id:'trial_d1_speed',  dungeon:1, name:'極速試煉·質數迷宮',
   desc:'第 1 扇門：在 180 秒內達成任意生還、普通或隱藏結局',
   check:function(type, elapsedSec){ return currentDungeonId===1 && /^(survive|normal|hidden)/.test(type) && elapsedSec<=180; }},
  {id:'trial_d2_silent', dungeon:2, name:'無聲試煉·絕對靜默',
   desc:'第 2 扇門：在不觸發任何噪音扣血的情況下逃出沉默圖書館',
   check:function(type){ return currentDungeonId===2 && /^(survive|normal|hidden)/.test(type) && !state.flags.v54_took_damage; }},
  {id:'trial_d3_pure',   dungeon:3, name:'急診試煉·清醒手術',
   desc:'第 3 扇門：全程不服用止痛藥、安定片與鎮定劑達成好結局',
   check:function(type){ return currentDungeonId===3 && /^(survive|normal|hidden)/.test(type) && !state.flags.v54_used_sedative; }},
  {id:'trial_d4_whole',  dungeon:4, name:'心臟試煉·三門歸一',
   desc:'第 4 扇門：單局內重訪鏡、書架、病房三扇舊門並解開門數謎題後通關',
   check:function(type){ return currentDungeonId===4 && /^(survive|normal|hidden)/.test(type) && state.flags.old_mirror_done && state.flags.old_library_done && state.flags.old_hospital_done && state.flags.puzzle_doors_done; }},
  {id:'trial_d5_noecho', dungeon:5, name:'潮汐試煉·順流而行',
   desc:'第 5 扇門：全程不使用「迴溯」達成迴光之海任意好結局',
   check:function(type){ return currentDungeonId===5 && /^(survive|normal|hidden)/.test(type) && !state.flags.v54_used_rewind; }},
  {id:'trial_d6_master', dungeon:6, name:'破曉試煉·零號觀測',
   desc:'第 6 扇門：在未受任何主機或頻率電擊傷害下達成「03:18 的破曉」或「六門共鳴」',
   check:function(type){ return currentDungeonId===6 && /^hidden_d6_/.test(type) && !state.flags.v54_took_damage; }}
];

function getTrialRecords(){ return lsJSON(LS_TRIALS, {}); }
function getActiveTrialId(){ return lsGet(LS_TRIAL_ACT) || ''; }
function setActiveTrialId(id){
  lsSet(LS_TRIAL_ACT, id || '');
  updateTrialBadge();
}
function trialById(id){
  for(var i=0;i<TRIALS.length;i++) if(TRIALS[i].id === id) return TRIALS[i];
  return null;
}

var _trialTickTimer = null;
function updateTrialBadge(){
  var badge = document.getElementById('v54-trial-badge');
  if(!badge) return;
  var tid = getActiveTrialId();
  var tr = trialById(tid);
  var inGame = document.getElementById('game-screen') && document.getElementById('game-screen').classList.contains('active');
  if(!tr || !inGame || tr.dungeon !== currentDungeonId){
    badge.classList.remove('show');
    if(_trialTickTimer){ clearInterval(_trialTickTimer); _trialTickTimer = null; }
    return;
  }
  badge.classList.add('show');
  function refreshText(){
    var sec = Math.max(0, Math.floor((Date.now() - gameStartTime) / 1000));
    var m = Math.floor(sec / 60), s = sec % 60;
    badge.textContent = t('試煉') + ' ' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }
  refreshText();
  if(!_trialTickTimer){
    _trialTickTimer = setInterval(refreshText, 1000);
  }
}

function renderTrialsTab(body){
  var recs = getTrialRecords();
  var actId = getActiveTrialId();
  var clearedCount = Object.keys(recs).length;

  var html = '<div class="v4-sub">' + t('完成指定條件的迴廊試煉，記錄最佳通關時間並解鎖試煉成就（已達成 ') + clearedCount + ' / ' + TRIALS.length + '）</div>';
  html += '<div class="v4-list">';
  TRIALS.forEach(function(tr){
    var rec = recs[tr.id];
    var isAct = (actId === tr.id);
    var bestStr = rec ? (t('最佳紀錄：') + rec.bestSec + 's') : t('尚未達成');
    html += '<div class="v54-trial-card'+(isAct?' active':'')+(rec?' cleared':'')+'">'+
      '<div style="flex:1;min-width:0">'+
        '<div class="v4-row-t">'+t(tr.name)+(rec?' <span class="v4-chip gold" style="margin-left:.4rem">'+t('已達成')+'</span>':'')+'</div>'+
        '<div class="v4-row-d">'+t(tr.desc)+'</div>'+
        '<div class="v54-trial-meta">'+bestStr+'</div>'+
      '</div>'+
      '<div style="display:flex;gap:.4rem;flex-shrink:0">'+
        '<button type="button" class="v4-btn'+(isAct?' primary':'')+'" data-trial-toggle="'+tr.id+'">'+(isAct?t('取消試煉'):t('啟動試煉'))+'</button>'+
        '<button type="button" class="v4-btn primary" data-trial-go="'+tr.id+'">'+t('立即挑戰')+'</button>'+
      '</div>'+
    '</div>';
  });
  html += '</div>';
  body.innerHTML = html;

  body.querySelectorAll('[data-trial-toggle]').forEach(function(b){
    b.onclick = function(){
      var id = b.getAttribute('data-trial-toggle');
      setActiveTrialId(getActiveTrialId() === id ? '' : id);
      renderTrialsTab(body);
    };
  });
  body.querySelectorAll('[data-trial-go]').forEach(function(b){
    b.onclick = function(){
      var id = b.getAttribute('data-trial-go');
      var tr = trialById(id);
      if(!tr) return;
      setActiveTrialId(id);
      var nb = document.getElementById('v4-notebook');
      if(nb) nb.classList.remove('show');
      if(typeof isUnlocked === 'function' && !isUnlocked(tr.dungeon)){
        showToast('請先解鎖該門扉，或在「契約」中締結「漫遊之契」');
        return;
      }
      enterDungeon(tr.dungeon, true);
    };
  });
}

function hookTrialTrackers(){
  /* 追蹤傷害、用藥、迴溯與結局結算 */
  if(typeof window.damage === 'function' && !window.damage.__v54Trial){
    var _dmg = window.damage;
    window.damage = function(amount){
      if(window.state && state.flags && amount > 0) state.flags.v54_took_damage = true;
      return _dmg.apply(this, arguments);
    };
    window.damage.__v54Trial = true;
  }
  if(typeof window.addTime === 'function' && !window.addTime.__v54Trial){
    var _at = window.addTime;
    window.addTime = function(min){
      if(window.state && state.flags && currentDungeonId === 3) state.flags.v54_used_sedative = true;
      return _at.apply(this, arguments);
    };
    window.addTime.__v54Trial = true;
  }
  if(typeof window.d5Rewind === 'function' && !window.d5Rewind.__v54Trial){
    var _rw = window.d5Rewind;
    window.d5Rewind = function(){
      if(window.state && state.flags) state.flags.v54_used_rewind = true;
      return _rw.apply(this, arguments);
    };
    window.d5Rewind.__v54Trial = true;
  }
  if(typeof window.startGame === 'function' && !window.startGame.__v54Trial){
    var _sg = window.startGame;
    window.startGame = function(){
      var r = _sg.apply(this, arguments);
      setTimeout(updateTrialBadge, 100);
      return r;
    };
    window.startGame.__v54Trial = true;
  }
  if(typeof window.triggerEnding === 'function' && !window.triggerEnding.__v54Trial){
    var _te = window.triggerEnding;
    window.triggerEnding = function(type, title, desc, reward){
      try{
        var elapsedSec = Math.max(1, Math.round((Date.now() - gameStartTime) / 1000));
        var recs = getTrialRecords();
        var newlyCleared = [];
        TRIALS.forEach(function(tr){
          if(tr.check(type, elapsedSec)){
            if(!recs[tr.id] || elapsedSec < recs[tr.id].bestSec){
              recs[tr.id] = {bestSec: elapsedSec, clearedAt: Date.now()};
            }
            newlyCleared.push(tr.name);
          }
        });
        if(newlyCleared.length > 0){
          lsSet(LS_TRIALS, JSON.stringify(recs));
          var totalCleared = Object.keys(recs).length;
          if(totalCleared >= 1) unlockAchievement('v54_trial_first');
          if(totalCleared >= TRIALS.length) unlockAchievement('v54_trial_master');
          setTimeout(function(){
            showToast('試煉達成：' + newlyCleared[0] + '（' + elapsedSec + 's）');
          }, 1600);
        }
      }catch(e){}
      return _te.apply(this, arguments);
    };
    window.triggerEnding.__v54Trial = true;
  }
}

/* ============================================================
 * 5. 第六扇門擴充：「記憶回聲合成機」與第 7 隱藏結局「六門共鳴」
 * ============================================================ */
V5.addAchievements(6, [
  {id:'ach_d6_symphony', name:'六門共鳴',   desc:'在終焉觀測站合成五門記憶回聲，抵達隱藏結局「六門共鳴」'},
  {id:'v54_resonance',   name:'迴光共鳴',   desc:'在門扉中發動一次「門扉共鳴」'},
  {id:'v54_trial_first', name:'初試鋒芒',   desc:'完成任意一項「迴廊試煉」'},
  {id:'v54_trial_master',name:'六門試煉官', desc:'完成全部六項「迴廊試煉」'}
]);

V5.registerStoryPack(6, {
  endingsAdded: 1,
  scenes: {
    d6_echo_console: {
      room:'03:17', roomName:'記憶回聲合成機', sceneId:'6-回聲機', mood:'mystery',
      text:[
        '<p>第零號檔案櫃深處，立著一台銅管與真空管交錯的「記憶回聲合成機」。</p>',
        '<p>面板上刻著五道門扉的題銘：「第一扇門的初始門牌（兩位數）＋第三扇門牆板下的無名者人數（兩位數）」。</p>',
        '<p>只要輸入這組四位數共鳴碼，就能將前五扇門扉殘留的回聲合成為一卷完整的磁帶。</p>'
      ],
      choices:[
        {text:'輸入四位數五門共鳴碼', action:function(){
          if(state.flags.d6_symphony_ready){
            appendNarrative('<p class="action">六門共鳴磁帶已經合成完畢。</p>');
            return;
          }
          openPuzzle('謎題 · 五門共鳴碼',
            '請輸入四位數共鳴碼：\n前兩位＝第一扇門最初浮現的門牌號碼（13）\n後兩位＝第三扇門 404 牆板下與太平間記錄的無名者人數（14）',
            '1314',
            function(ok){
              if(ok){
                state.flags.d6_symphony_ready = true;
                addItem('d6_symphony_tape','六門共鳴磁帶','合成了旅館、圖書館、醫院、心臟與迴光之海全部回聲的磁帶。');
                addNote('d6_symphony_note','六門共鳴磁帶','13 號門與 14 個名字在真空管中合鳴，化作通往分界門的共鳴磁帶。');
                appendNarrative('<p class="inherit-note">真空管亮起溫暖的琥珀光！算盤聲、翻書聲、風鈴聲、守門人的提燈與海浪聲交織在一起。獲得：六門共鳴磁帶。</p>');
              }else{
                appendNarrative('<p class="action">真空管發出一聲低鳴，共鳴碼不對。</p>');
              }
            },
            '第一扇門的初始門牌是 13；第三扇門太平間與 404 牆板上記錄的人數是 14。合起來即 1314。');
        }},
        {text:'退回第零號檔案櫃', next:'d6_archive'}
      ]
    },
    d6_end_symphony: {
      room:'03:18', roomName:'六門共鳴', sceneId:'6-隱藏結局', mood:'safe',
      onEnter:function(){
        V4.markDungeonCleared(6);
        unlockAchievement('ach_d6_symphony');
        setTimeout(function(){
          triggerEnding('hidden_d6_symphony','六門共鳴',
            '你將六門共鳴磁帶接入分界門。當秒針跳向 03:18，蘇晚、老趙、陳姐、老周、林醫生、周敏與抱著紙貓的媛媛在同一道晨光中向你揮手道別。沒有任何一段記憶被遺落。',
            '隱藏結局 · 六門共鳴');
        }, 1100);
      },
      text:[
        '<p>你把「六門共鳴磁帶」推入分界門側邊的擴音槽。</p>',
        '<p>[glow]磁輪轉動。整座觀測站的百面螢幕同時退去了雪花，化作六道清澈的金色光束，匯聚在 03:18 的門扉上。</p>',
        '<p>你聽見老趙爽朗地笑了一聲，聽見陳姐合上課本，聽見林建國輕聲叫出女兒的名字，聽見媛媛的紙飛機掠過海面。</p>',
        '<p>所有走過門的人，都在這一刻抵達了屬於他們的清晨。</p>'
      ],
      choices:[]
    }
  },
  inject:[
    {into:'d6_archive', choice:{
      text:'啟動「記憶回聲合成機」（五門座標共鳴）',
      next:'d6_echo_console'
    }},
    {into:'d6_threshold', choice:{
      text:'將「六門共鳴磁帶」接入分界門擴音器（隱藏結局·六門共鳴）',
      condition:function(){ return state.flags.d6_symphony_ready; },
      next:'d6_end_symphony',
      personality:{altruism:+15, calm:+15}
    }}
  ]
});

/* 注入「試煉」分頁至迴廊手札 */
function injectTrialsTab(){
  var tryAdd = function(){
    var nb = document.getElementById('v4-notebook');
    if(!nb){ setTimeout(tryAdd, 180); return; }
    var tabs = nb.querySelector('.v4-tabs');
    var body = nb.querySelector('#v4-nb-body');
    if(!tabs || !body || tabs.querySelector('[data-t="v54-trials"]')) return;

    var b = document.createElement('button');
    b.className = 'v4-tab';
    b.setAttribute('data-t', 'v54-trials');
    b.textContent = '試 煉';
    tabs.appendChild(b);

    tabs.addEventListener('click', function(e){
      var btn = e.target.closest('.v4-tab');
      if(!btn || btn.getAttribute('data-t') !== 'v54-trials') return;
      tabs.querySelectorAll('.v4-tab').forEach(function(x){ x.classList.remove('on'); });
      btn.classList.add('on');
      renderTrialsTab(body);
    });
  };
  tryAdd();
}

V5.registerSystem('v54-super-iteration', function(){
  extendI18NDicts();

  /* 自動監聽動態彈窗與面板內容變化，在非繁體模式下即時套用多語翻譯 */
  var _i18nBusy = false;
  var _i18nObs = new MutationObserver(function(muts){
    if(_i18nBusy || !window.I18N || I18N.lang === 'zh-Hant') return;
    _i18nBusy = true;
    try{
      muts.forEach(function(m){
        if(m.target && m.target.nodeType === 1 && !m.target.closest('#narrative')){
          I18N.setLang(I18N.lang);
        }
      });
    }catch(e){}
    setTimeout(function(){ _i18nBusy = false; }, 60);
  });
  _i18nObs.observe(document.body, {childList: true, subtree: true});

  setupBottomBarAndLayout();
  setupRelicResonance();
  hookTrialTrackers();
  injectTrialsTab();
});

V5.onBoot(function(){
  try{
    window.VERSION = '5.4.0';
    if(typeof window.buildScenes6 === 'function') window.buildScenes6();
    if(window.CHANGELOG && !window.CHANGELOG.some(function(c){ return c.version === '5.4.0'; })){
      window.CHANGELOG.unshift({
        version:'5.4.0',
        type:'minor',
        changes:[
          '新增「迴廊試煉」系統：於迴廊手札提供 6 大跨門扉挑戰與速通試煉，支援即時秒錶、最佳紀錄保存與試煉成就。',
          '新增「門扉共鳴」機制：於物品欄底部可一鍵喚起已收集迴光遺物的跨門扉共鳴（恢復生命、延長時間／增加迴光粒，並感應未尋獲的碎片線索），並補齊第五扇門 2 件可拾取遺物（共 12 件）。',
          '第六扇門「終焉觀測站」擴充：於第零號檔案櫃新增「記憶回聲合成機」謎題與第 7 隱藏結局「六門共鳴」。',
          '全面重構零重疊 UI/UX：將遊戲底部操控區整合為專屬流式工具列（#game-bottom-bar），將典藏抽屜改為頂欄內嵌流式展開，將迴廊與結局畫面改為自適應安全滾動佈局，徹底消除桌面端與手機端的所有重疊與裁切。',
          '徹底修復 14 項底層與細微 Bug：修復 #gm-panel 未閉合標籤、版本號覆蓋、跳過過場動畫黑屏、返回標題畫面不可見、已讀自動跳過時序競態、手札分頁高亮不同步等問題。'
        ]
      });
    }
    var verEl = document.getElementById('title-version');
    if(verEl && typeof getVersionDisplay === 'function'){
      verEl.textContent = 'v ' + getVersionDisplay();
    }
  }catch(e){ console.error('v5.4 boot error:', e); }
});

})();
