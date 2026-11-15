
/* ============================================================
 * 無盡之門 · v5.5.0 章節劇情互動小遊戲系統
 * 1. 六大門扉專屬劇情小遊戲（嵌入章節關鍵場景，完成可獲專屬道具、狀態增益與成就）
 * 2. 迴廊手札新增「機關」分頁（隨時重溫或挑戰六大章節小遊戲）
 * ============================================================ */
(function(){
'use strict';
if(!window.V5 || window.V5.__v55Loaded) return;
window.V5.__v55Loaded = true;

var LS_MG = 'wuxian-v55-minigames';
function lsGet(k){ try{return localStorage.getItem(k);}catch(e){return null;} }
function lsSet(k,v){ try{localStorage.setItem(k,v);}catch(e){} }
function lsJSON(k,def){ try{var v=JSON.parse(lsGet(k)); return v==null?def:v;}catch(e){return def;} }
function t(s){ return (window.I18N && typeof I18N.t === 'function') ? I18N.t(s) : s; }

function getMgRecords(){ return lsJSON(LS_MG, {}); }
function markMgCleared(id){
  var recs = getMgRecords();
  recs[id] = {cleared: true, count: ((recs[id] && recs[id].count) || 0) + 1, updatedAt: Date.now()};
  lsSet(LS_MG, JSON.stringify(recs));
  var allIds = ['mg_d1','mg_d2','mg_d3','mg_d4','mg_d5','mg_d6'];
  if(allIds.every(function(k){ return recs[k] && recs[k].cleared; })){
    if(typeof unlockAchievement === 'function') unlockAchievement('ach_mg_all');
  }
}

/* ============================================================
 * 1. 新增成就與多語詞條註冊
 * ============================================================ */
V5.addAchievements(1, [{id:'ach_mg_d1', name:'質數行者',   desc:'在第一扇門通過「質數尋路 · 走廊迷陣」小遊戲'}]);
V5.addAchievements(2, [{id:'ach_mg_d2', name:'無聲歸檔人', desc:'在第二扇門通過「無聲歸檔 · 禁書封印」小遊戲'}]);
V5.addAchievements(3, [{id:'ach_mg_d3', name:'穩脈仁心',   desc:'在第三扇門通過「心電穩壓 · 記憶脈衝」小遊戲'}]);
V5.addAchievements(4, [{id:'ach_mg_d4', name:'拾憶守門人', desc:'在第四扇門通過「舊門殘響 · 記憶配對」小遊戲'}]);
V5.addAchievements(5, [{id:'ach_mg_d5', name:'引潮人',     desc:'在第五扇門通過「潮汐導流 · 迴光水脈」小遊戲'}]);
V5.addAchievements(6, [
  {id:'ach_mg_d6',  name:'破曉調諧師', desc:'在第六扇門通過「破曉調諧 · 03:18 雙波共振」小遊戲'},
  {id:'ach_mg_all', name:'萬門機關師', desc:'通關全部六個章節的劇情互動小遊戲'}
]);

function extendV55I18N(){
  if(!window.I18N) return;
  var enMap = {
    '機 關':'GAMES','機關':'Mini-Game','章節機關':'Chapter Mini-Games',
    '質數尋路 · 走廊迷陣':'Prime Path · Corridor Labyrinth',
    '無聲歸檔 · 禁書封印':'Silent Filing · Forbidden Seal',
    '心電穩壓 · 記憶脈衝':'ECG Stabilizer · Memory Pulse',
    '舊門殘響 · 記憶配對':'Old Gate Echoes · Memory Match',
    '潮汐導流 · 迴光水脈':'Tide Conduit · Echo Channels',
    '破曉調諧 · 03:18 雙波共振':'Dawn Tuning · 03:18 Resonance',
    '邏輯推演':'Logic Assist','重 置':'RESET','離 開':'LEAVE','立即遊玩':'PLAY',
    '俯看大廳地磚上的「質數尋路迷陣」（小遊戲）':'Inspect the "Prime Path Labyrinth" on the lobby floor (Mini-Game)',
    '踏過走廊地毯上的「質數尋路迷陣」（小遊戲）':'Cross the "Prime Path Labyrinth" on the corridor rug (Mini-Game)',
    '安撫借書台旁躁動的「無聲歸檔書架」（小遊戲）':'Silence the rustling "Forbidden Book Matrix" by the desk (Mini-Game)',
    '整理閱覽區快要翻動出聲的「無聲歸檔書架」（小遊戲）':'Align the "Silent Filing Bookshelf" in the Reading Room (Mini-Game)',
    '調校接待台旁閃爍的「心電穩壓儀」（小遊戲）':'Calibrate the flickering "ECG Pulse Stabilizer" (Mini-Game)',
    '穩住記憶提取機的「心電脈衝波」（小遊戲）':'Stabilize the MK-II "Memory Pulse Oscilloscope" (Mini-Game)',
    '拼合散落在心臟地面的「舊門殘響星陣」（小遊戲）':'Match the "Old Gate Echo Array" on the Heart floor (Mini-Game)',
    '替守門人收攏飄散的「六門記憶殘片」（小遊戲）':'Gather the "Six-Gate Memory Pairs" for the Gatekeeper (Mini-Game)',
    '疏通汐岸沙下的「迴光水脈石槽」（小遊戲）':'Align the "Tide Conduit Channels" beneath the shore (Mini-Game)',
    '轉動潮井內壁的「潮汐導流盤」（小遊戲）':'Rotate the "Tide Conduit Dial" inside the Tide Well (Mini-Game)',
    '操作中央主控台的「03:18 雙波諧振儀」（小遊戲）':'Tune the "03:18 Dual-Wave Synthesizer" at the console (Mini-Game)',
    '調諧監視牆的「破曉載波濾波器」（小遊戲）':'Harmonize the "Dawn Carrier Filter" on the monitor wall (Mini-Game)'
  };
  var jaMap = {
    '機 關':'機 関','機關':'ミニゲーム','章節機關':'章節ミニゲーム',
    '質數尋路 · 走廊迷陣':'素数経路・回廊迷陣',
    '無聲歸檔 · 禁書封印':'無声帰档・禁書封印',
    '心電穩壓 · 記憶脈衝':'心電安定・記憶パルス',
    '舊門殘響 · 記憶配對':'旧扉残響・記憶神経衰弱',
    '潮汐導流 · 迴光水脈':'潮汐導流・回光水脈',
    '破曉調諧 · 03:18 雙波共振':'夜明調諧・03:18 双波共鳴',
    '邏輯推演':'論理補助','重 置':'リセット','離 開':'閉じる','立即遊玩':'遊ぶ',
    '俯看大廳地磚上的「質數尋路迷陣」（小遊戲）':'ロビーの床にある「素数経路迷陣」に挑む（ミニゲーム）',
    '踏過走廊地毯上的「質數尋路迷陣」（小遊戲）':'廊下の絨毯にある「素数経路迷陣」を渡る（ミニゲーム）',
    '安撫借書台旁躁動的「無聲歸檔書架」（小遊戲）':'カウンター横のざわめく「無声本棚」を鎮める（ミニゲーム）',
    '整理閱覽區快要翻動出聲的「無聲歸檔書架」（小遊戲）':'閲覧室の「無声帰档本棚」を揃える（ミニゲーム）',
    '調校接待台旁閃爍的「心電穩壓儀」（小遊戲）':'受付横の「心電パルス安定器」を調整する（ミニゲーム）',
    '穩住記憶提取機的「心電脈衝波」（小遊戲）':'記憶抽出機の「心電パルス波」を安定させる（ミニゲーム）',
    '拼合散落在心臟地面的「舊門殘響星陣」（小遊戲）':'心臓の床に散らばる「旧扉残響陣」を合わせる（ミニゲーム）',
    '替守門人收攏飄散的「六門記憶殘片」（小遊戲）':'門番のために「六門の記憶片」を揃える（ミニゲーム）',
    '疏通汐岸沙下的「迴光水脈石槽」（小遊戲）':'汐岸の砂の下にある「回光水脈」を繋ぐ（ミニゲーム）',
    '轉動潮井內壁的「潮汐導流盤」（小遊戲）':'潮井の壁にある「潮汐導流盤」を回す（ミニゲーム）',
    '操作中央主控台的「03:18 雙波諧振儀」（小遊戲）':'中央コンソールの「03:18 双波共鳴器」を合わせる（ミニゲーム）',
    '調諧監視牆的「破曉載波濾波器」（小遊戲）':'モニター壁の「夜明けキャリア波形」を同調させる（ミニゲーム）'
  };
  var origT = I18N.t;
  I18N.t = function(str, langOverride){
    var lg = langOverride || I18N.lang || 'zh-Hant';
    if(str && typeof str === 'string'){
      var tr = str.trim();
      if(lg === 'en' && enMap[tr]) return enMap[tr];
      if(lg === 'ja' && jaMap[tr]) return jaMap[tr];
    }
    return origT.apply(this, arguments);
  };
}

/* ============================================================
 * 2. 六款章節劇情小遊戲定義與實作
 * ============================================================ */
var _curMgId = null;
var _curMgFromStory = false;
var _curMgCleanup = null;
var _curMgState = null;

var MINIGAME_DEFS = {
  mg_d1: {
    id: 'mg_d1',
    dungeon: 1,
    title: '質數尋路 · 走廊迷陣',
    sub: '第 一 扇 門 · 質 數 旅 館',
    desc: '從左上角【起點 2】出發，每次點擊上下左右相鄰的銅牌格，一路走到右下角【終點 13】。注意：只能踩在「質數」格上，誤觸合數格將觸發虛空排斥！',
    rewardNote: '獲得「質數懷錶羅盤」（生命上限與生命 +15）'
  },
  mg_d2: {
    id: 'mg_d2',
    dungeon: 2,
    title: '無聲歸檔 · 禁書封印',
    sub: '第 二 扇 門 · 沉 默 圖 書 館',
    desc: '書架上有幾本命書正在躁動翻頁。點擊任意一本書，會同時切換它與上下左右相鄰書冊的狀態。請將全部 9 本書都安撫為「靜」（靜寂狀態）。',
    rewardNote: '獲得「無聲玉書籤」（冷靜 +10、謹慎 +10，生命 +15）'
  },
  mg_d3: {
    id: 'mg_d3',
    dungeon: 3,
    title: '心電穩壓 · 記憶脈衝',
    sub: '第 三 扇 門 · 倒 計 時 醫 院',
    desc: '記憶提取機的脈衝游標正在高速擺動。當白色游標經過中央金色的「諧振區間」時，點擊下方【鎖定波峰】按鈕。累計成功鎖定 3 次即可穩住記憶波形！',
    rewardNote: '倒計時延長 +15 分鐘、生命恢復 +20，獲得「脈衝穩壓晶片」'
  },
  mg_d4: {
    id: 'mg_d4',
    dungeon: 4,
    title: '舊門殘響 · 記憶配對',
    sub: '第 四 扇 門 · 無 盡 之 間',
    desc: '迴廊心臟浮現出 12 枚覆蓋的門扉星牌。每次翻開兩枚，將 6 對代表前塵記憶的符號（13、靜、60、鏡、貓、∞）全部配對收攏。',
    rewardNote: '獲得「心臟火種」（三維性格 +8，生命恢復 +20）'
  },
  mg_d5: {
    id: 'mg_d5',
    dungeon: 5,
    title: '潮汐導流 · 迴光水脈',
    sub: '第 五 扇 門 · 迴 光 之 海',
    desc: '點擊石槽方塊將其順時針旋轉 90 度，讓左上角【源】湧出的金色潮水順著連通的水脈一路流向右下角的【海】。',
    rewardNote: '獲得 +2 粒迴光粒，並拾得「迴光潮珠」'
  },
  mg_d6: {
    id: 'mg_d6',
    dungeon: 6,
    title: '破曉調諧 · 03:18 雙波共振',
    sub: '第 六 扇 門 · 終 焉 觀 測 站',
    desc: '調整下方「頻率、振幅、相位」三組旋鈕，使實線繪出的金色觀測波與虛線標示的「03:18 破曉目標波」完全重合（共振度達 100%）。',
    rewardNote: '獲得「破曉諧振晶體」（生命回滿，協助開啟分界門共鳴）'
  }
};

function setMgMsg(txt, isErr){
  var el = document.getElementById('v55-mg-msg');
  if(!el) return;
  el.textContent = t(txt);
  el.classList.toggle('err', !!isErr);
}
function setMgStatus(html){
  var el = document.getElementById('v55-mg-status');
  if(el) el.innerHTML = html;
}

/* 通關統一結算 */
function completeMiniGame(mgId){
  if(_curMgCleanup){ _curMgCleanup(); _curMgCleanup = null; }
  markMgCleared(mgId);
  var achMap = {
    mg_d1:'ach_mg_d1', mg_d2:'ach_mg_d2', mg_d3:'ach_mg_d3',
    mg_d4:'ach_mg_d4', mg_d5:'ach_mg_d5', mg_d6:'ach_mg_d6'
  };
  if(achMap[mgId] && typeof unlockAchievement === 'function'){
    unlockAchievement(achMap[mgId]);
  }
  if(window.V5Audio && typeof V5Audio.sfx === 'function') V5Audio.sfx('relic');

  /* 若在劇情中觸發，發放章節專屬劇情獎勵與敘事反饋 */
  if(_curMgFromStory && window.state){
    state.flags = state.flags || {};
    var firstTimeInRun = !state.flags[mgId + '_cleared'];
    state.flags[mgId + '_cleared'] = true;

    if(mgId === 'mg_d1' && firstTimeInRun){
      state.maxHp = (state.maxHp || 100) + 15;
      state.hp = Math.min(state.maxHp, (state.hp || 100) + 15);
      if(typeof updateHP === 'function') updateHP();
      addItem('prime_compass','質數懷錶羅盤','通過走廊質數迷陣取得的銅羅盤，刻度只標註質數。','生命上限 +15');
      addNote('note_mg_d1','質數迷陣的暗格','沿著 2→3→5→11→17→23→13 的質數銅磚走過，第 13 塊磚下彈出了一枚質數懷錶羅盤。');
      appendNarrative('<p class="inherit-note">【機關解開】你精準踩過每一塊質數銅磚，抵達 13 號終點。地板發出一聲輕響，彈出一枚「質數懷錶羅盤」（生命上限與生命 +15）。</p>');
    }else if(mgId === 'mg_d2' && firstTimeInRun){
      if(state.personality){
        state.personality.calm = Math.min(100, (state.personality.calm || 50) + 10);
        state.personality.cautious = Math.min(100, (state.personality.cautious || 50) + 10);
      }
      state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + 15);
      if(typeof updateHP === 'function') updateHP();
      addItem('bookmark_jade','無聲玉書籤','九宮命書歸於寂靜後滑出的冷玉書籤。','冷靜+10，謹慎+10');
      addNote('note_mg_d2','無聲玉書籤','將躁動的九宮書冊全數撫平後，書架夾縫裡滑出了一枚溫潤的玉書籤。');
      appendNarrative('<p class="inherit-note">【機關解開】九本躁動的命書同時合攏，書架間歸於死寂。一枚「無聲玉書籤」從書脊間滑落到你掌心（冷靜 +10、謹慎 +10、生命 +15）。</p>');
    }else if(mgId === 'mg_d3' && firstTimeInRun){
      if(state.countdown != null && typeof addTime === 'function') addTime(15);
      state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + 20);
      if(typeof updateHP === 'function') updateHP();
      addItem('pulse_stabilizer','脈衝穩壓晶片','從穩定的心電監護儀中取出的諧振晶片。','倒計時 +15 分鐘，生命 +20');
      addNote('note_mg_d3','穩定的心電波','三次精準鎖定諧振波峰後，監護儀吐出了一枚脈衝穩壓晶片，手環上的倒計時也隨之延長了 15 分鐘。');
      appendNarrative('<p class="inherit-note">【機關解開】三次波峰精準鎖定！監護儀發出平穩的長鳴，你的手環倒計時增加了 15 分鐘，並獲得「脈衝穩壓晶片」（生命 +20）。</p>');
    }else if(mgId === 'mg_d4' && firstTimeInRun){
      if(state.personality){
        state.personality.calm = Math.min(100, (state.personality.calm || 50) + 8);
        state.personality.altruism = Math.min(100, (state.personality.altruism || 50) + 8);
        state.personality.cautious = Math.min(100, (state.personality.cautious || 50) + 8);
      }
      state.hp = Math.min(state.maxHp || 100, (state.hp || 100) + 20);
      if(typeof updateHP === 'function') updateHP();
      addItem('astral_ember','心臟火種','六對舊門殘響配對合一後凝成的溫暖火種。','三維性格 +8，生命 +20');
      appendNarrative('<p class="inherit-note">【機關解開】六對舊門殘響星牌一一共鳴，化作一簇溫暖的「心臟火種」落入你掌心（三維性格 +8、生命 +20）。</p>');
    }else if(mgId === 'mg_d5' && firstTimeInRun){
      state.echo = Math.min(8, (state.echo || 0) + 2);
      if(typeof updateD5HUD === 'function') updateD5HUD();
      addItem('tide_pearl','迴光潮珠','水脈貫通後在石槽終點凝結的發光水珠。','迴光粒 +2');
      appendNarrative('<p class="inherit-note">【機關解開】金色潮水順著石槽奔流至海心，凝結成兩粒溫暖的迴光粒（迴光 +2）與一枚「迴光潮珠」。</p>');
    }else if(mgId === 'mg_d6' && firstTimeInRun){
      state.hp = state.maxHp || 100;
      if(typeof updateHP === 'function') updateHP();
      state.flags.d6_freq_solved = true;
      addItem('dawn_crystal','破曉諧振晶體','03:18 雙波完全重合時凝成的金色晶體。','生命回滿，同步解鎖 03:18 破曉波段');
      appendNarrative('<p class="inherit-note">【機關解開】03:18 的雙波在螢幕上完美重合！整座觀測站的雜訊一掃而空，你獲得了「破曉諧振晶體」（生命回滿，並同步完成 03:18 波段調諧）。</p>');
    }
    /* 更新選項列表 */
    if(typeof renderChoices === 'function' && window.currentSceneChoices){
      renderChoices(currentSceneChoices);
    }
  }

  setMgMsg('機關已成功解開！', false);
  setTimeout(function(){
    closeMiniGame();
    /* 若手札正開著且在機關分頁，刷新列表 */
    var nb = document.getElementById('v4-notebook');
    if(nb && nb.classList.contains('show')){
      var act = nb.querySelector('.v4-tab.on');
      if(act && act.getAttribute('data-t') === 'v55-minigames'){
        renderMiniGamesTab(nb.querySelector('#v4-nb-body'));
      }
    }
  }, 650);
}

/* ------------------------------------------------------------
 * 小遊戲 1：質數尋路 · 走廊迷陣 (4x4 Prime Path)
 * ------------------------------------------------------------ */
function isPrimeNum(n){
  if(n < 2) return false;
  for(var i=2;i*i<=n;i++) if(n % i === 0) return false;
  return true;
}
/* 固定可解且有多個干擾合數的 4x4 棋盤，正解路徑：(0,0)2 -> (0,1)3 -> (1,1)5 -> (1,2)11 -> (2,2)17 -> (2,3)23 -> (3,3)13 */
var PRIME_BOARD = [
  [ 2,  3,  4,  9],
  [ 6,  5, 11,  8],
  [10, 12, 17, 23],
  [14, 15, 21, 13]
];
var PRIME_SOLUTION = [[0,0],[0,1],[1,1],[1,2],[2,2],[2,3],[3,3]];

function initMgD1(stage){
  _curMgState = {
    r: 0, c: 0,
    visited: {'0,0': true},
    steps: 0,
    hintIdx: 1
  };
  renderMgD1(stage);
  setMgMsg('請點擊與當前位置上下左右相鄰的「質數」銅磚前進。', false);
}
function renderMgD1(stage){
  var st = _curMgState;
  setMgStatus('<span>' + t('當前位置') + ': <b>(' + (st.r+1) + ',' + (st.c+1) + ')</b></span><span>' + t('步數') + ': <b>' + st.steps + '</b></span>');
  var html = '<div class="v55-prime-grid">';
  for(var r=0;r<4;r++){
    for(var c=0;c<4;c++){
      var val = PRIME_BOARD[r][c];
      var key = r + ',' + c;
      var isCur = (r === st.r && c === st.c);
      var isVis = !!st.visited[key];
      var isAdj = (Math.abs(r - st.r) + Math.abs(c - st.c) === 1);
      var isHint = (st.hintCell && st.hintCell[0] === r && st.hintCell[1] === c);
      var cls = 'v55-prime-cell' + (isVis ? ' visited' : '') + (isCur ? ' current' : '') + (isAdj ? ' adj' : '') + (isHint ? ' hint-glow' : '');
      var tag = (r===0 && c===0) ? t('起點') : ((r===3 && c===3) ? t('終點') : '');
      html += '<button type="button" class="' + cls + '" data-r="' + r + '" data-c="' + c + '">' +
        '<span>' + val + '</span>' +
        (tag ? '<span class="pc-tag">' + tag + '</span>' : '') +
      '</button>';
    }
  }
  html += '</div>';
  stage.innerHTML = html;

  stage.querySelectorAll('.v55-prime-cell').forEach(function(btn){
    btn.onclick = function(){
      var r = parseInt(btn.getAttribute('data-r'), 10);
      var c = parseInt(btn.getAttribute('data-c'), 10);
      var dist = Math.abs(r - st.r) + Math.abs(c - st.c);
      if(dist !== 1){
        setMgMsg('只能踏向與當前位置上下左右直接相連的相鄰格！', true);
        return;
      }
      var val = PRIME_BOARD[r][c];
      if(!isPrimeNum(val)){
        btn.classList.add('trap-flash');
        setMgMsg(val + ' 是合數（可被整除），觸發虛空排斥！已退回起點。', true);
        setTimeout(function(){ initMgD1(stage); }, 550);
        return;
      }
      st.r = r; st.c = c;
      st.visited[r + ',' + c] = true;
      st.steps++;
      st.hintCell = null;
      renderMgD1(stage);
      if(r === 3 && c === 3){
        completeMiniGame('mg_d1');
      }else{
        setMgMsg('安全踏上質數 ' + val + ' 號磚。繼續前往右下角 13 號終點。', false);
      }
    };
  });
}
function hintMgD1(stage){
  var st = _curMgState;
  /* 找到當前在 PRIME_SOLUTION 的哪一步，直接自動踏出下一步 */
  var curIdx = -1;
  for(var i=0;i<PRIME_SOLUTION.length;i++){
    if(PRIME_SOLUTION[i][0] === st.r && PRIME_SOLUTION[i][1] === st.c){
      curIdx = i; break;
    }
  }
  if(curIdx === -1 || curIdx + 1 >= PRIME_SOLUTION.length){
    initMgD1(stage);
    curIdx = 0;
  }
  var nextPt = PRIME_SOLUTION[curIdx + 1];
  st.r = nextPt[0]; st.c = nextPt[1];
  st.visited[st.r + ',' + st.c] = true;
  st.steps++;
  st.hintCell = nextPt;
  renderMgD1(stage);
  if(st.r === 3 && st.c === 3){
    completeMiniGame('mg_d1');
  }else{
    setMgMsg('【絕對邏輯】已為你推演並踏上下一塊安全質數磚（' + PRIME_BOARD[st.r][st.c] + '）。', false);
  }
}

/* ------------------------------------------------------------
 * 小遊戲 2：無聲歸檔 · 禁書封印 (3x3 Silent Books Lights-Out)
 * ------------------------------------------------------------ */
/* 預設一個只需按 3 下（中心 (1,1)、左上 (0,0)、右下 (2,2)）即可全靜的謎面 */
function makeBookBoard(){
  var b = [
    [false, false, false],
    [false, false, false],
    [false, false, false]
  ];
  function toggle(r, c){
    [[r,c],[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(function(p){
      if(p[0]>=0 && p[0]<3 && p[1]>=0 && p[1]<3){
        b[p[0]][p[1]] = !b[p[0]][p[1]];
      }
    });
  }
  /* 預先打亂 3 步：旅人只需再按 (0,0), (1,1), (2,2) 即可還原為全 false (靜) */
  toggle(0, 0);
  toggle(1, 1);
  toggle(2, 2);
  return b;
}

function initMgD2(stage){
  _curMgState = {
    board: makeBookBoard(),
    moves: 0,
    pressed: {}
  };
  renderMgD2(stage);
  setMgMsg('點擊書冊可同時安撫它與四鄰。將 9 本書全部轉為「靜」即可通關。', false);
}
function renderMgD2(stage){
  var st = _curMgState;
  var noisyCount = 0;
  for(var r=0;r<3;r++) for(var c=0;c<3;c++) if(st.board[r][c]) noisyCount++;
  setMgStatus('<span>' + t('躁動書冊') + ': <b>' + noisyCount + ' / 9</b></span><span>' + t('操作次數') + ': <b>' + st.moves + '</b></span>');

  var labels = ['A-1','B-2','C-3','D-4','E-5','F-6','G-7','H-8','J-9'];
  var html = '<div class="v55-book-grid">';
  for(var r=0;r<3;r++){
    for(var c=0;c<3;c++){
      var isNoisy = st.board[r][c];
      var idx = r * 3 + c;
      var cls = 'v55-book-cell ' + (isNoisy ? 'noisy' : 'silent');
      html += '<button type="button" class="' + cls + '" data-r="' + r + '" data-c="' + c + '">' +
        '<span class="bk-glyph">' + (isNoisy ? '嘩' : '靜') + '</span>' +
        '<span class="bk-state">' + labels[idx] + ' · ' + (isNoisy ? t('躁動') : t('歸檔')) + '</span>' +
      '</button>';
    }
  }
  html += '</div>';
  stage.innerHTML = html;

  stage.querySelectorAll('.v55-book-cell').forEach(function(btn){
    btn.onclick = function(){
      var r = parseInt(btn.getAttribute('data-r'), 10);
      var c = parseInt(btn.getAttribute('data-c'), 10);
      pressBookCell(stage, r, c);
    };
  });
}
function pressBookCell(stage, r, c){
  var st = _curMgState;
  [[r,c],[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(function(p){
    if(p[0]>=0 && p[0]<3 && p[1]>=0 && p[1]<3){
      st.board[p[0]][p[1]] = !st.board[p[0]][p[1]];
    }
  });
  st.moves++;
  renderMgD2(stage);
  var allSilent = true;
  for(var i=0;i<3;i++) for(var j=0;j<3;j++) if(st.board[i][j]) allSilent = false;
  if(allSilent){
    completeMiniGame('mg_d2');
  }
}
function hintMgD2(stage){
  var st = _curMgState;
  /* 使用 GF(2) 暴搜 2^9 = 512 種按法找出最少步數解並自動執行第一步 */
  var bestMove = null, bestCnt = 99;
  for(var mask=0;mask<512;mask++){
    var tmp = st.board.map(function(row){ return row.slice(); });
    var cnt = 0, first = null;
    for(var idx=0;idx<9;idx++){
      if((mask >> idx) & 1){
        cnt++;
        var rr = Math.floor(idx / 3), cc = idx % 3;
        if(!first) first = [rr, cc];
        [[rr,cc],[rr-1,cc],[rr+1,cc],[rr,cc-1],[rr,cc+1]].forEach(function(p){
          if(p[0]>=0 && p[0]<3 && p[1]>=0 && p[1]<3) tmp[p[0]][p[1]] = !tmp[p[0]][p[1]];
        });
      }
    }
    var ok = true;
    for(var r=0;r<3;r++) for(var c=0;c<3;c++) if(tmp[r][c]) ok = false;
    if(ok && cnt < bestCnt){
      bestCnt = cnt;
      bestMove = first;
    }
  }
  if(bestMove){
    pressBookCell(stage, bestMove[0], bestMove[1]);
    if(_curMgId === 'mg_d2' && bestCnt > 1){
      setMgMsg('【邏輯推演】已替你壓下關鍵書冊（剩餘 ' + (bestCnt - 1) + ' 步即可全數歸檔）。', false);
    }
  }
}

/* ------------------------------------------------------------
 * 小遊戲 3：心電穩壓 · 記憶脈衝 (ECG Memory Pulse Sync)
 * ------------------------------------------------------------ */
function initMgD3(stage){
  if(_curMgCleanup){ _curMgCleanup(); _curMgCleanup = null; }
  _curMgState = {
    pos: 10,
    dir: 1,
    speed: 1.15,
    zoneMin: 36,
    zoneMax: 64,
    hits: 0,
    targetHits: 3,
    raf: null
  };
  var st = _curMgState;
  setMgStatus('<span>' + t('同步進度') + ': <b id="v55-ecg-hit-txt">0 / 3</b></span><span>' + t('目標區間') + ': <b>36% – 64%</b></span>');
  stage.innerHTML =
    '<div class="v55-ecg-wrap">'+
      '<div class="v55-ecg-nodes" id="v55-ecg-dots">'+
        '<span class="v55-ecg-dot"></span><span class="v55-ecg-dot"></span><span class="v55-ecg-dot"></span>'+
      '</div>'+
      '<div class="v55-ecg-track" id="v55-ecg-track">'+
        '<div class="v55-ecg-zone" id="v55-ecg-zone" style="left:36%;width:28%"></div>'+
        '<div class="v55-ecg-cursor" id="v55-ecg-cursor" style="left:10%"></div>'+
      '</div>'+
      '<button type="button" class="v4-btn primary" id="v55-ecg-lock-btn" style="width:100%;max-width:220px;padding:.6rem 1rem">' + t('鎖定波峰 (LOCK)') + '</button>'+
    '</div>';

  var cursorEl = document.getElementById('v55-ecg-cursor');
  var zoneEl = document.getElementById('v55-ecg-zone');
  function tick(){
    if(!_curMgState || _curMgId !== 'mg_d3') return;
    st.pos += st.dir * st.speed;
    if(st.pos >= 96){ st.pos = 96; st.dir = -1; }
    else if(st.pos <= 4){ st.pos = 4; st.dir = 1; }
    if(cursorEl) cursorEl.style.left = st.pos + '%';
    st.raf = requestAnimationFrame(tick);
  }
  st.raf = requestAnimationFrame(tick);
  _curMgCleanup = function(){
    if(st.raf){ cancelAnimationFrame(st.raf); st.raf = null; }
  };

  function updateDots(){
    var hitTxt = document.getElementById('v55-ecg-hit-txt');
    if(hitTxt) hitTxt.textContent = st.hits + ' / ' + st.targetHits;
    var dots = stage.querySelectorAll('.v55-ecg-dot');
    dots.forEach(function(d, idx){ d.classList.toggle('on', idx < st.hits); });
  }

  var lockBtn = document.getElementById('v55-ecg-lock-btn');
  if(lockBtn){
    lockBtn.onclick = function(){
      if(st.pos >= st.zoneMin && st.pos <= st.zoneMax){
        st.hits++;
        /* 每次成功後微調區間位置，增加趣味性 */
        var nextLeft = 24 + (st.hits * 13) % 42;
        st.zoneMin = nextLeft;
        st.zoneMax = nextLeft + 28;
        if(zoneEl){
          zoneEl.style.left = st.zoneMin + '%';
          zoneEl.style.width = (st.zoneMax - st.zoneMin) + '%';
        }
        updateDots();
        if(st.hits >= st.targetHits){
          completeMiniGame('mg_d3');
        }else{
          setMgMsg('波峰鎖定成功（' + st.hits + '/3）！繼續鎖定下一道諧振波峰。', false);
        }
      }else{
        setMgMsg('偏離諧振區間！請在白色游標進入金色區域時按下鎖定。', true);
      }
    };
  }
  setMgMsg('當游標滑入中央金色區間時，點擊「鎖定波峰」。', false);
}
function hintMgD3(stage){
  var st = _curMgState;
  if(!st) return;
  st.speed = 0.65;
  st.hits++;
  var hitTxt = document.getElementById('v55-ecg-hit-txt');
  if(hitTxt) hitTxt.textContent = st.hits + ' / ' + st.targetHits;
  var dots = stage.querySelectorAll('.v55-ecg-dot');
  dots.forEach(function(d, idx){ d.classList.toggle('on', idx < st.hits); });
  if(st.hits >= st.targetHits){
    completeMiniGame('mg_d3');
  }else{
    setMgMsg('【醫學直覺】已放緩心電游標速度，並自動完成 1 次波峰鎖定（' + st.hits + '/3）。', false);
  }
}

/* ------------------------------------------------------------
 * 小遊戲 4：舊門殘響 · 記憶配對 (3x4 Memory Match)
 * ------------------------------------------------------------ */
var MEM_PAIRS = [
  {code:'13', sym:'13', lbl:'質數之門'},
  {code:'quiet', sym:'靜', lbl:'萬書之門'},
  {code:'60', sym:'60', lbl:'倒數之門'},
  {code:'mirror', sym:'鏡', lbl:'雙面之影'},
  {code:'cat', sym:'貓', lbl:'折紙之約'},
  {code:'inf', sym:'∞', lbl:'無盡之心'}
];

function initMgD4(stage){
  var deck = [];
  MEM_PAIRS.forEach(function(p){
    deck.push({code:p.code, sym:p.sym, lbl:p.lbl, flipped:false, matched:false});
    deck.push({code:p.code, sym:p.sym, lbl:p.lbl, flipped:false, matched:false});
  });
  /* 確定性洗牌 + 微隨機，保證牌局錯落有致 */
  for(var i=deck.length-1;i>0;i--){
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
  }
  _curMgState = {
    deck: deck,
    openIdxs: [],
    matchedPairs: 0,
    moves: 0,
    busy: false
  };
  renderMgD4(stage);
  setMgMsg('翻開兩枚星牌，配對全部 6 組來自舊門的記憶符號。', false);
}
function renderMgD4(stage){
  var st = _curMgState;
  setMgStatus('<span>' + t('已配對') + ': <b>' + st.matchedPairs + ' / 6</b></span><span>' + t('翻牌次數') + ': <b>' + st.moves + '</b></span>');
  var html = '<div class="v55-mem-grid">';
  st.deck.forEach(function(card, idx){
    var show = card.flipped || card.matched;
    var cls = 'v55-mem-card ' + (show ? 'flipped' : 'face-down') + (card.matched ? ' matched' : '');
    html += '<button type="button" class="' + cls + '" data-idx="' + idx + '">' +
      '<span class="mc-sym">' + card.sym + '</span>' +
      '<span class="mc-lbl">' + t(card.lbl) + '</span>' +
    '</button>';
  });
  html += '</div>';
  stage.innerHTML = html;

  stage.querySelectorAll('.v55-mem-card').forEach(function(btn){
    btn.onclick = function(){
      if(st.busy) return;
      var idx = parseInt(btn.getAttribute('data-idx'), 10);
      var card = st.deck[idx];
      if(!card || card.flipped || card.matched) return;
      card.flipped = true;
      st.openIdxs.push(idx);
      renderMgD4(stage);

      if(st.openIdxs.length === 2){
        st.moves++;
        var i1 = st.openIdxs[0], i2 = st.openIdxs[1];
        var c1 = st.deck[i1], c2 = st.deck[i2];
        if(c1.code === c2.code){
          c1.matched = true; c2.matched = true;
          st.openIdxs = [];
          st.matchedPairs++;
          renderMgD4(stage);
          if(st.matchedPairs >= 6){
            completeMiniGame('mg_d4');
          }else{
            setMgMsg('共鳴成功！已收攏「' + t(c1.lbl) + '」的記憶。', false);
          }
        }else{
          st.busy = true;
          setMgMsg('兩道殘響尚未共鳴，請記住它們的位置。', false);
          setTimeout(function(){
            c1.flipped = false; c2.flipped = false;
            st.openIdxs = [];
            st.busy = false;
            if(_curMgId === 'mg_d4') renderMgD4(stage);
          }, 550);
        }
      }
    };
  });
}
function hintMgD4(stage){
  var st = _curMgState;
  if(!st || st.busy) return;
  /* 自動翻開並配對一組尚未配對的星牌 */
  st.openIdxs.forEach(function(idx){ st.deck[idx].flipped = false; });
  st.openIdxs = [];
  var targetCode = null;
  for(var i=0;i<st.deck.length;i++){
    if(!st.deck[i].matched){ targetCode = st.deck[i].code; break; }
  }
  if(targetCode){
    st.deck.forEach(function(c){
      if(c.code === targetCode){ c.flipped = true; c.matched = true; }
    });
    st.matchedPairs++;
    renderMgD4(stage);
    if(st.matchedPairs >= 6){
      completeMiniGame('mg_d4');
    }else{
      setMgMsg('【迴廊共感】已自動為你共鳴配對一組舊門星牌（' + st.matchedPairs + '/6）。', false);
    }
  }
}

/* ------------------------------------------------------------
 * 小遊戲 5：潮汐導流 · 迴光水脈 (3x3 Tide Conduit Rotation)
 * 方向定義：0=上(N), 1=右(E), 2=下(S), 3=左(W)
 * ------------------------------------------------------------ */
/* 3x3 管線設計：
 * 正解路徑：(0,0)[L: W->E/S, 取 [1,3] 直管] -> (0,1)[轉角 [2,3] S+W] -> (1,1)[直管 [0,2] N+S] -> (2,1)[轉角 [0,1] N+E] -> (2,2)[直管 [1,3] E+W]
 * 支援左入(0,0 的 W=3) 與右出(2,2 的 E=1)
 */
var PIPE_TEMPLATE = [
  /* r=0 */ [ {base:[1,3], solRot:0}, {base:[2,3], solRot:0}, {base:[1,2], solRot:1} ],
  /* r=1 */ [ {base:[0,2], solRot:1}, {base:[0,2], solRot:0}, {base:[0,3], solRot:2} ],
  /* r=2 */ [ {base:[0,1], solRot:1}, {base:[0,1], solRot:0}, {base:[1,3], solRot:0} ]
];
function getPipeDirs(cell){
  return cell.base.map(function(d){ return (d + cell.rot) % 4; });
}
function pipeSVG(dirs){
  /* 中心 (50,50)，0=(50,8), 1=(92,50), 2=(50,92), 3=(8,50) */
  var pts = {0:[50,8], 1:[92,50], 2:[50,92], 3:[8,50]};
  var lines = '';
  dirs.forEach(function(d){
    var p = pts[d];
    lines += '<line x1="50" y1="50" x2="' + p[0] + '" y2="' + p[1] + '"/>';
  });
  lines += '<circle cx="50" cy="50" r="5" fill="currentColor" stroke="none"/>';
  return '<svg viewBox="0 0 100 100">' + lines + '</svg>';
}

function initMgD5(stage){
  /* 初始化時將正解路徑上的方塊旋轉打亂 */
  var grid = [];
  var initRots = [
    [1, 1, 0],
    [0, 1, 2],
    [2, 3, 1]
  ];
  for(var r=0;r<3;r++){
    var row = [];
    for(var c=0;c<3;c++){
      row.push({
        base: PIPE_TEMPLATE[r][c].base.slice(),
        solRot: PIPE_TEMPLATE[r][c].solRot,
        rot: initRots[r][c],
        filled: false
      });
    }
    grid.push(row);
  }
  _curMgState = { grid: grid, moves: 0 };
  evalPipeFlow();
  renderMgD5(stage);
  setMgMsg('點擊任意石槽旋轉 90°，讓左上【源】的潮水連通至右下【海】。', false);
}
function evalPipeFlow(){
  var grid = _curMgState.grid;
  for(var r=0;r<3;r++) for(var c=0;c<3;c++) grid[r][c].filled = false;
  /* 起點 (0,0) 必須開口朝左(3)或上(0)接納水源；我們設定水源從 (0,0) 的左(3)注入 */
  var d00 = getPipeDirs(grid[0][0]);
  if(d00.indexOf(3) === -1) return false;
  grid[0][0].filled = true;
  var q = [[0,0]];
  var dr = [-1, 0, 1, 0];
  var dc = [0, 1, 0, -1];
  var opp = [2, 3, 0, 1];
  while(q.length > 0){
    var cur = q.shift();
    var r = cur[0], c = cur[1];
    var dirs = getPipeDirs(grid[r][c]);
    dirs.forEach(function(d){
      var nr = r + dr[d], nc = c + dc[d];
      if(nr>=0 && nr<3 && nc>=0 && nc<3 && !grid[nr][nc].filled){
        var ndirs = getPipeDirs(grid[nr][nc]);
        if(ndirs.indexOf(opp[d]) !== -1){
          grid[nr][nc].filled = true;
          q.push([nr, nc]);
        }
      }
    });
  }
  /* 終點 (2,2) 已注水且開口朝右(1)流向大海 */
  var d22 = getPipeDirs(grid[2][2]);
  return grid[2][2].filled && d22.indexOf(1) !== -1;
}
function renderMgD5(stage){
  var st = _curMgState;
  var filledCnt = 0;
  for(var r=0;r<3;r++) for(var c=0;c<3;c++) if(st.grid[r][c].filled) filledCnt++;
  setMgStatus('<span>' + t('水脈連通') + ': <b>' + filledCnt + ' / 9</b></span><span>' + t('旋轉次數') + ': <b>' + st.moves + '</b></span>');

  var html = '<div class="v55-pipe-grid">';
  for(var r=0;r<3;r++){
    for(var c=0;c<3;c++){
      var cell = st.grid[r][c];
      var dirs = getPipeDirs(cell);
      var tag = (r===0 && c===0) ? t('源→') : ((r===2 && c===2) ? t('→海') : '');
      var cls = 'v55-pipe-cell' + (cell.filled ? ' filled' : '');
      html += '<button type="button" class="' + cls + '" data-r="' + r + '" data-c="' + c + '">' +
        (tag ? '<span class="pp-tag">' + tag + '</span>' : '') +
        pipeSVG(dirs) +
      '</button>';
    }
  }
  html += '</div>';
  stage.innerHTML = html;

  stage.querySelectorAll('.v55-pipe-cell').forEach(function(btn){
    btn.onclick = function(){
      var r = parseInt(btn.getAttribute('data-r'), 10);
      var c = parseInt(btn.getAttribute('data-c'), 10);
      st.grid[r][c].rot = (st.grid[r][c].rot + 1) % 4;
      st.moves++;
      var won = evalPipeFlow();
      renderMgD5(stage);
      if(won){
        completeMiniGame('mg_d5');
      }
    };
  });
}
function hintMgD5(stage){
  var st = _curMgState;
  /* 沿正解路徑 [[0,0],[0,1],[1,1],[2,1],[2,2]] 找到第一個方向不對的石槽並直接轉正 */
  var path = [[0,0],[0,1],[1,1],[2,1],[2,2]];
  for(var i=0;i<path.length;i++){
    var r = path[i][0], c = path[i][1];
    var cell = st.grid[r][c];
    var dirs = getPipeDirs(cell);
    var solDirs = cell.base.map(function(d){ return (d + cell.solRot) % 4; });
    var same = (dirs.length === solDirs.length) && dirs.every(function(d){ return solDirs.indexOf(d) !== -1; });
    if(!same){
      cell.rot = cell.solRot;
      st.moves++;
      var won = evalPipeFlow();
      renderMgD5(stage);
      if(won){
        completeMiniGame('mg_d5');
      }else{
        setMgMsg('【順流指引】已為你校準第 (' + (r+1) + ',' + (c+1) + ') 處的石槽水脈。', false);
      }
      return;
    }
  }
}

/* ------------------------------------------------------------
 * 小遊戲 6：破曉調諧 · 03:18 雙波共振 (03:18 Waveform Synthesizer)
 * ------------------------------------------------------------ */
function initMgD6(stage){
  _curMgState = {
    freq: 1, amp: 2, phase: 3,
    targetFreq: 3, targetAmp: 4, targetPhase: 1
  };
  renderMgD6(stage);
  setMgMsg('點擊「- / +」調整頻率、振幅與相位，使金色實線與破曉虛線完全重合。', false);
}
function buildWavePath(freq, amp, phase){
  var d = '';
  var W = 320, H = 96, mid = 48;
  var radius = amp * 8.5;
  for(var x=0;x<=W;x+=4){
    var rad = (x / W) * Math.PI * 2 * freq + (phase * Math.PI / 2);
    var y = mid - Math.sin(rad) * radius;
    d += (x === 0 ? 'M' : 'L') + x + ',' + y.toFixed(1) + ' ';
  }
  return d;
}
function calcSyncPct(st){
  var df = Math.abs(st.freq - st.targetFreq);
  var da = Math.abs(st.amp - st.targetAmp);
  var dp = Math.abs((st.phase % 4) - (st.targetPhase % 4));
  var score = Math.max(0, 100 - (df * 25 + da * 20 + dp * 25));
  return score;
}
function renderMgD6(stage){
  var st = _curMgState;
  var pct = calcSyncPct(st);
  setMgStatus('<span>' + t('目標波段') + ': <b>03:18 Hz</b></span><span>' + t('共振同步率') + ': <b id="v55-wave-pct">' + pct + '%</b></span>');

  var targetD = buildWavePath(st.targetFreq, st.targetAmp, st.targetPhase);
  var userD = buildWavePath(st.freq, st.amp, st.phase);

  stage.innerHTML =
    '<div class="v55-wave-wrap">'+
      '<svg class="v55-wave-svg" viewBox="0 0 320 96" preserveAspectRatio="none">'+
        '<line x1="0" y1="48" x2="320" y2="48" stroke="var(--border)" stroke-width="1"/>'+
        '<path d="' + targetD + '" fill="none" stroke="var(--text-dim)" stroke-width="2" stroke-dasharray="4 4"/>'+
        '<path d="' + userD + '" fill="none" stroke="var(--accent)" stroke-width="2.4"/>'+
      '</svg>'+
      '<div class="v55-wave-ctrl">'+
        '<span>' + t('頻率 (Freq)') + ': <b>' + st.freq + '</b></span>'+
        '<div class="v55-wave-btns">'+
          '<button type="button" class="v55-wave-step" data-k="freq" data-d="-1">-</button>'+
          '<button type="button" class="v55-wave-step" data-k="freq" data-d="1">+</button>'+
        '</div>'+
      '</div>'+
      '<div class="v55-wave-ctrl">'+
        '<span>' + t('振幅 (Amp)') + ': <b>' + st.amp + '</b></span>'+
        '<div class="v55-wave-btns">'+
          '<button type="button" class="v55-wave-step" data-k="amp" data-d="-1">-</button>'+
          '<button type="button" class="v55-wave-step" data-k="amp" data-d="1">+</button>'+
        '</div>'+
      '</div>'+
      '<div class="v55-wave-ctrl">'+
        '<span>' + t('相位 (Phase)') + ': <b>' + st.phase + '</b></span>'+
        '<div class="v55-wave-btns">'+
          '<button type="button" class="v55-wave-step" data-k="phase" data-d="-1">-</button>'+
          '<button type="button" class="v55-wave-step" data-k="phase" data-d="1">+</button>'+
        '</div>'+
      '</div>'+
    '</div>';

  stage.querySelectorAll('.v55-wave-step').forEach(function(btn){
    btn.onclick = function(){
      var k = btn.getAttribute('data-k');
      var d = parseInt(btn.getAttribute('data-d'), 10);
      if(k === 'freq') st.freq = Math.max(1, Math.min(5, st.freq + d));
      else if(k === 'amp') st.amp = Math.max(1, Math.min(5, st.amp + d));
      else if(k === 'phase') st.phase = (st.phase + d + 4) % 4;
      renderMgD6(stage);
      if(calcSyncPct(st) === 100){
        completeMiniGame('mg_d6');
      }
    };
  });
}
function hintMgD6(stage){
  var st = _curMgState;
  if(st.freq !== st.targetFreq) st.freq = st.targetFreq;
  else if(st.amp !== st.targetAmp) st.amp = st.targetAmp;
  else st.phase = st.targetPhase;
  renderMgD6(stage);
  if(calcSyncPct(st) === 100){
    completeMiniGame('mg_d6');
  }else{
    setMgMsg('【導師校準】已為你鎖定其中一項破曉波形參數（共振率 ' + calcSyncPct(st) + '%）。', false);
  }
}

/* ============================================================
 * 3. 全局開啟 / 重置 / 提示 / 關閉介面
 * ============================================================ */
window.openMiniGame = function(mgId, fromStory){
  var def = MINIGAME_DEFS[mgId];
  if(!def) return;
  if(_curMgCleanup){ _curMgCleanup(); _curMgCleanup = null; }
  _curMgId = mgId;
  _curMgFromStory = !!fromStory;

  document.getElementById('v55-mg-title').textContent = t(def.title);
  document.getElementById('v55-mg-sub').textContent = t(def.sub);
  document.getElementById('v55-mg-desc').textContent = t(def.desc);

  var stage = document.getElementById('v55-mg-stage');
  if(mgId === 'mg_d1') initMgD1(stage);
  else if(mgId === 'mg_d2') initMgD2(stage);
  else if(mgId === 'mg_d3') initMgD3(stage);
  else if(mgId === 'mg_d4') initMgD4(stage);
  else if(mgId === 'mg_d5') initMgD5(stage);
  else if(mgId === 'mg_d6') initMgD6(stage);

  document.getElementById('v55-minigame-modal').classList.add('show');
};

window.resetCurrentMiniGame = function(){
  if(!_curMgId) return;
  openMiniGame(_curMgId, _curMgFromStory);
};

window.hintCurrentMiniGame = function(){
  var stage = document.getElementById('v55-mg-stage');
  if(!_curMgId || !stage) return;
  if(_curMgId === 'mg_d1') hintMgD1(stage);
  else if(_curMgId === 'mg_d2') hintMgD2(stage);
  else if(_curMgId === 'mg_d3') hintMgD3(stage);
  else if(_curMgId === 'mg_d4') hintMgD4(stage);
  else if(_curMgId === 'mg_d5') hintMgD5(stage);
  else if(_curMgId === 'mg_d6') hintMgD6(stage);
};

window.closeMiniGame = function(){
  if(_curMgCleanup){ _curMgCleanup(); _curMgCleanup = null; }
  _curMgId = null;
  var m = document.getElementById('v55-minigame-modal');
  if(m) m.classList.remove('show');
};

/* ============================================================
 * 4. 將 6 款小遊戲自然注入全 6 扇門的章節關鍵場景
 * ============================================================ */
V5.registerStoryPack(1, {
  inject:[
    {into:'lobby', choice:{
      text:'俯看大廳地磚上的「質數尋路迷陣」（小遊戲）',
      condition:function(){ return !(state.flags && state.flags.mg_d1_cleared); },
      action:function(){ openMiniGame('mg_d1', true); }
    }},
    {into:'corridor', choice:{
      text:'踏過走廊地毯上的「質數尋路迷陣」（小遊戲）',
      condition:function(){ return !(state.flags && state.flags.mg_d1_cleared); },
      action:function(){ openMiniGame('mg_d1', true); }
    }}
  ]
});

V5.registerStoryPack(2, {
  inject:[
    {into:'lobby', choice:{
      text:'安撫借書台旁躁動的「無聲歸檔書架」（小遊戲）',
      condition:function(){ return !(state.flags && state.flags.mg_d2_cleared); },
      action:function(){ openMiniGame('mg_d2', true); }
    }},
    {into:'reading_room', choice:{
      text:'整理閱覽區快要翻動出聲的「無聲歸檔書架」（小遊戲）',
      condition:function(){ return !(state.flags && state.flags.mg_d2_cleared); },
      action:function(){ openMiniGame('mg_d2', true); }
    }}
  ]
});

V5.registerStoryPack(3, {
  inject:[
    {into:'entrance', choice:{
      text:'調校接待台旁閃爍的「心電穩壓儀」（小遊戲）',
      condition:function(){ return !(state.flags && state.flags.mg_d3_cleared); },
      action:function(){ openMiniGame('mg_d3', true); }
    }},
    {into:'operating_room', choice:{
      text:'穩住記憶提取機的「心電脈衝波」（小遊戲）',
      condition:function(){ return !(state.flags && state.flags.mg_d3_cleared); },
      action:function(){ openMiniGame('mg_d3', true); }
    }}
  ]
});

V5.registerStoryPack(4, {
  inject:[
    {into:'heart', choice:{
      text:'拼合散落在心臟地面的「舊門殘響星陣」（小遊戲）',
      condition:function(){ return !(state.flags && state.flags.mg_d4_cleared); },
      action:function(){ openMiniGame('mg_d4', true); }
    }},
    {into:'gate', choice:{
      text:'替守門人收攏飄散的「六門記憶殘片」（小遊戲）',
      condition:function(){ return !(state.flags && state.flags.mg_d4_cleared); },
      action:function(){ openMiniGame('mg_d4', true); }
    }}
  ]
});

V5.registerStoryPack(5, {
  inject:[
    {into:'d5_shore', choice:{
      text:'疏通汐岸沙下的「迴光水脈石槽」（小遊戲）',
      condition:function(){ return !(state.flags && state.flags.mg_d5_cleared); },
      action:function(){ openMiniGame('mg_d5', true); }
    }},
    {into:'d5_well', choice:{
      text:'轉動潮井內壁的「潮汐導流盤」（小遊戲）',
      condition:function(){ return !(state.flags && state.flags.mg_d5_cleared); },
      action:function(){ openMiniGame('mg_d5', true); }
    }}
  ]
});

V5.registerStoryPack(6, {
  inject:[
    {into:'d6_hub', choice:{
      text:'操作中央主控台的「03:18 雙波諧振儀」（小遊戲）',
      condition:function(){ return !(state.flags && state.flags.mg_d6_cleared); },
      action:function(){ openMiniGame('mg_d6', true); }
    }},
    {into:'d6_monitors', choice:{
      text:'調諧監視牆的「破曉載波濾波器」（小遊戲）',
      condition:function(){ return !(state.flags && state.flags.mg_d6_cleared); },
      action:function(){ openMiniGame('mg_d6', true); }
    }}
  ]
});

/* ============================================================
 * 5. 迴廊手札新增「機關」分頁（隨時重溫全部 6 款章節小遊戲）
 * ============================================================ */
function renderMiniGamesTab(body){
  var recs = getMgRecords();
  var keys = ['mg_d1','mg_d2','mg_d3','mg_d4','mg_d5','mg_d6'];
  var clearedCnt = keys.filter(function(k){ return recs[k] && recs[k].cleared; }).length;

  var html = '<div class="v4-sub">' + t('在各章節劇情中遭遇的互動機關，亦可在此隨時重溫演練（已通關 ') + clearedCnt + ' / 6）</div>';
  html += '<div class="v4-list">';
  keys.forEach(function(k){
    var def = MINIGAME_DEFS[k];
    var rec = recs[k];
    var isCleared = !!(rec && rec.cleared);
    html += '<div class="v54-trial-card' + (isCleared ? ' cleared' : '') + '">'+
      '<div style="flex:1;min-width:0">'+
        '<div class="v4-row-t">' + t(def.title) + (isCleared ? ' <span class="v4-chip gold" style="margin-left:.4rem">' + t('已通關') + '</span>' : '') + '</div>'+
        '<div class="v4-row-d">' + t(def.sub) + ' — ' + t(def.rewardNote) + '</div>'+
      '</div>'+
      '<button type="button" class="v4-btn primary" data-mg-play="' + k + '">' + t('立即遊玩') + '</button>'+
    '</div>';
  });
  html += '</div>';
  body.innerHTML = html;

  body.querySelectorAll('[data-mg-play]').forEach(function(b){
    b.onclick = function(){
      var id = b.getAttribute('data-mg-play');
      openMiniGame(id, false);
    };
  });
}

function injectMiniGamesTab(){
  var tryAdd = function(){
    var nb = document.getElementById('v4-notebook');
    if(!nb){ setTimeout(tryAdd, 180); return; }
    var tabs = nb.querySelector('.v4-tabs');
    var body = nb.querySelector('#v4-nb-body');
    if(!tabs || !body || tabs.querySelector('[data-t="v55-minigames"]')) return;

    var b = document.createElement('button');
    b.className = 'v4-tab';
    b.setAttribute('data-t', 'v55-minigames');
    b.textContent = '機 關';
    tabs.appendChild(b);

    tabs.addEventListener('click', function(e){
      var btn = e.target.closest('.v4-tab');
      if(!btn || btn.getAttribute('data-t') !== 'v55-minigames') return;
      tabs.querySelectorAll('.v4-tab').forEach(function(x){ x.classList.remove('on'); });
      btn.classList.add('on');
      renderMiniGamesTab(body);
    });
  };
  tryAdd();
}

V5.registerSystem('v55-chapter-minigames', function(){
  extendV55I18N();
  injectMiniGamesTab();
});

V5.onBoot(function(){
  try{
    window.VERSION = '5.5.0';
    /* 重新建構全部 6 個門扉場景，確保新注入的小遊戲選項立即生效 */
    for(var d=1;d<=6;d++){
      if(typeof window['buildScenes'+d] === 'function') window['buildScenes'+d]();
    }
    /* 恢復預設指向第 1 扇門 */
    state = stateRefs[1];
    SCENES = sceneRefs[1];
    if(window.CHANGELOG && !window.CHANGELOG.some(function(c){ return c.version === '5.5.0'; })){
      window.CHANGELOG.unshift({
        version:'5.5.0',
        type:'minor',
        changes:[
          '新增 6 款「章節劇情互動小遊戲」：深度融合於全 6 扇門的關鍵章節場景，完成後直接給予劇情敘事反饋、專屬道具、生命／時間／迴光粒增益與 7 項機關成就。',
          '第一扇門「質數尋路 · 走廊迷陣」：在 4×4 銅磚陣中沿質數安全格（2→3→5→11→17→23→13）穿行，避開合數虛空陷阱，取得「質數懷錶羅盤」。',
          '第二扇門「無聲歸檔 · 禁書封印」：3×3 聯動九宮書架封印，將全部躁動翻頁的命書撫平為「靜」，取得「無聲玉書籤」。',
          '第三扇門「心電穩壓 · 記憶脈衝」：即時動態心電示波器，看準諧振區間鎖定 3 次波峰，延長倒計時 15 分鐘並取得「脈衝穩壓晶片」。',
          '第四扇門「舊門殘響 · 記憶配對」：3×4 門扉星陣翻牌配對，收攏 6 對前塵記憶符號，凝成「心臟火種」。',
          '第五扇門「潮汐導流 · 迴光水脈」：旋轉 3×3 石槽水脈使金色潮水從「源」連通至「海」，獲得 +2 迴光粒與「迴光潮珠」。',
          '第六扇門「破曉調諧 · 03:18 雙波共振」：在雙波 SVG 示波器上調諧頻率、振幅與相位至 100% 共振，獲得「破曉諧振晶體」。',
          '迴廊手札新增「機關」分頁：可隨時重溫或練習全部 6 款章節小遊戲，並內建「邏輯推演」智慧輔助確保絕不卡關。'
        ]
      });
    }
    var verEl = document.getElementById('title-version');
    if(verEl && typeof getVersionDisplay === 'function'){
      verEl.textContent = 'v ' + getVersionDisplay();
    }
  }catch(e){ console.error('v5.5 boot error:', e); }
});

})();
